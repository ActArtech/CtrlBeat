/**
 * The bake sheet: set the overlay bake up, agree to it, watch it happen.
 *
 * Nothing bakes until Bake is pressed - the config on screen is the config
 * that runs, with the frame count and time estimate computed from it. While
 * it runs, Cancel aborts between frames and returns here with the config
 * preserved, so a wrong smoothness choice costs seconds, not minutes.
 *
 * Structured after ExportDialog (the other long-running sheet): same phase
 * machine, same progress bar, same backdrop-that-never-closes-a-running-job.
 */

import { useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  BAKE_FPS_CHOICES,
  type BakeConfig,
} from "../lib/codevice/bakeOverlay";
import { useLocale } from "../lib/i18n";
import { shortDuration } from "../lib/time";
import type { BakeOutcome, BakeRequest, BakeSurfaceKind } from "../hooks/useBakeOverlay";
import { ErrorNotice } from "./ErrorNotice";
import { Icon } from "./Icon";

type Phase =
  | { kind: "idle" }
  | { kind: "running"; frame: number; total: number; startedAt: number }
  | { kind: "failed"; message: string };

export function BakeDialog({
  request,
  planNumbers,
  run,
  cancel,
  onClose,
  onPlaced,
}: {
  request: BakeRequest;
  /** Frame count + time estimate for one fps choice, from the open plan. */
  planNumbers: (fpsChoice: number) => { frames: number; seconds: number } | null;
  run: (config: BakeConfig, onProgress: (frame: number, total: number) => void) => Promise<BakeOutcome>;
  cancel: () => void;
  onClose: () => void;
  /** Fires on success, before the sheet closes, so Export can continue. */
  onPlaced: (kind: BakeSurfaceKind, forExport: boolean) => void;
}) {
  const { t } = useLocale();
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [fps, setFps] = useState<number>(BAKE_FPS_CHOICES.at(-1)!);
  const [replace, setReplace] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  // The promise's catch sees click-time state, not the Cancel click that came
  // later - the flag travels through a ref so a cancelled bake never renders
  // as a failure.
  const cancellingRef = useRef(false);

  const running = phase.kind === "running";
  // ASCII-on-video samples the source once per frame, so its ceiling is its
  // only rate; the selector would be one button pretending to be a choice.
  const cappedFps = request.bakeKind === "asciiVideo" ? 12 : fps;
  const choices = BAKE_FPS_CHOICES.filter((choice) => choice <= (request.bakeKind === "asciiVideo" ? 12 : 30));
  const estimate = planNumbers(cappedFps);

  const start = async () => {
    if (running) return;
    setCancelling(false);
    cancellingRef.current = false;
    const total = estimate?.frames ?? 1;
    setPhase({ kind: "running", frame: 0, total, startedAt: performance.now() });
    try {
      const outcome = await run({ fps: cappedFps, replace }, (frame, total) =>
        setPhase((current) =>
          current.kind === "running" ? { ...current, frame, total } : current,
        ),
      );
      if (outcome === "placed") {
        onPlaced(request.kind, request.forExport);
        onClose();
      } else if (outcome === "cancelled") {
        setPhase({ kind: "idle" });
      } else {
        setPhase({ kind: "failed", message: t("toast.bakeEmpty") });
      }
    } catch (cause) {
      if (cancellingRef.current) {
        setPhase({ kind: "idle" });
      } else {
        setPhase({ kind: "failed", message: String(cause) });
      }
    } finally {
      cancellingRef.current = false;
      setCancelling(false);
    }
  };

  const percent =
    phase.kind === "running" && phase.total > 0
      ? Math.min(100, Math.round((phase.frame / phase.total) * 100))
      : null;

  // Time left from the frames so far, held back until a second has passed -
  // the first frames carry setup cost and would only produce a number that
  // shrinks embarrassingly fast.
  let remaining: string | null = null;
  if (phase.kind === "running" && phase.frame > 2 && phase.total > phase.frame) {
    const elapsed = (performance.now() - phase.startedAt) / 1000;
    if (elapsed > 1) {
      remaining = t("export.timeLeft", {
        duration: shortDuration((elapsed / phase.frame) * (phase.total - phase.frame)),
      });
    }
  }

  const modeKey =
    request.bakeKind === "visualizer"
      ? "bakeDialog.modeVisualizer"
      : request.bakeKind === "asciiVideo"
        ? "bakeDialog.modeAsciiVideo"
        : "bakeDialog.modeSymbols";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-8
                 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !running) onClose();
      }}
    >
      <div className="surface w-full max-w-md rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-2">
          <Icon name={request.kind === "visualizer" ? "music" : "type"} size={17} className="text-accent" />
          <h2 className="flex-1 text-sm font-semibold text-primary">
            {t(request.kind === "visualizer" ? "bakeDialog.titleVisualizer" : "bakeDialog.titleAscii")}
          </h2>
          {!running && (
            <button
              type="button"
              aria-label={t("common.close")}
              onClick={onClose}
              className="cursor-pointer rounded p-1 text-secondary hover:bg-hover hover:text-primary"
            >
              <Icon name="close" size={14} />
            </button>
          )}
        </div>

        {phase.kind !== "running" ? (
          <>
            <dl className="mb-5 space-y-1 rounded-lg bg-sunken px-3 py-2.5">
              <Row
                label={t("bakeDialog.what")}
                value={
                  request.bakeKind === "asciiVideo"
                    ? t(modeKey, { source: request.videoSource?.media.path.split(/[\\/]/).at(-1) ?? "" })
                    : t(modeKey)
                }
              />
              <Row
                label={t("bakeDialog.span")}
                value={
                  request.span
                    ? `${shortDuration(request.span.end - request.span.start)} · ${t(
                        "bakeDialog.spanRange",
                        {
                          from: request.span.start.toFixed(1),
                          to: request.span.end.toFixed(1),
                        },
                      )}`
                    : t("beatsPanel.noBeats")
                }
              />
              {estimate && (
                <Row
                  label={t("bakeDialog.estimate")}
                  value={`${estimate.frames.toLocaleString()} · ${shortDuration(estimate.seconds)}`}
                />
              )}
            </dl>

            {choices.length > 1 && (
              <>
                <Label>{t("bakeDialog.smoothness")}</Label>
                <div className="mb-4 grid grid-cols-3 gap-1.5">
                  {choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      aria-pressed={cappedFps === choice}
                      onClick={() => setFps(choice)}
                      className={`cursor-pointer rounded-lg px-2 py-2 text-xs transition-colors ${
                        cappedFps === choice
                          ? "bg-accent text-on-accent"
                          : "bg-hover text-secondary hover:bg-active"
                      }`}
                    >
                      {t("bakeDialog.fps", { count: String(choice) })}
                    </button>
                  ))}
                </div>
              </>
            )}
            {request.bakeKind === "asciiVideo" && (
              <p className="mb-4 text-[11px] leading-relaxed text-tertiary">
                {t("bakeDialog.fpsCap")}
              </p>
            )}

            <label className="mb-2 flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-[12px] text-primary hover:bg-hover">
              <span>{t("bakeDialog.replace")}</span>
              <input
                type="checkbox"
                checked={replace && request.hasPreviousBake}
                disabled={!request.hasPreviousBake}
                onChange={(event) => setReplace(event.target.checked)}
                className="accent-[var(--accent)]"
              />
            </label>
            <p className="mb-4 text-[11px] leading-relaxed text-tertiary">
              {request.hasPreviousBake ? t("bakeDialog.replaceHint") : t("bakeDialog.replaceNone")}
            </p>

            {request.alreadyBaked && (
              <p className="mb-4 text-[11px] leading-relaxed text-secondary">
                {t("bakeDialog.alreadyBaked")}
              </p>
            )}
            {request.forExport && (
              <p className="mb-4 text-[11px] leading-relaxed text-secondary">
                {t("bakeDialog.forExport")}
              </p>
            )}

            {phase.kind === "failed" && <ErrorNotice message={phase.message} className="mb-4" />}

            <button
              type="button"
              onClick={() => void start()}
              disabled={request.span === null}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg
                         bg-accent px-4 py-2.5 text-sm font-medium text-on-accent transition-colors
                         hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="export" size={15} />
              {phase.kind === "failed"
                ? t("bakeDialog.retry")
                : request.alreadyBaked
                  ? t("bakeDialog.bakeAgain")
                  : t("bakeDialog.bake")}
            </button>
          </>
        ) : (
          <div className="py-2">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-xs text-primary">
                {t("bakeDialog.baking")}
              </span>
              <span className="shrink-0 font-technical text-sm tabular-nums text-primary">
                {percent === null ? "" : `${percent}%`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-active">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-200"
                style={{ width: `${percent ?? 3}%` }}
              />
            </div>
            <div className="mt-2 flex items-baseline justify-between gap-3">
              <p className="font-technical text-[10px] text-tertiary">
                {t("bakeDialog.progress", { frame: String(phase.frame), total: String(phase.total) })}
              </p>
              {remaining && (
                <p className="font-technical text-[10px] tabular-nums text-tertiary">{remaining}</p>
              )}
            </div>
            <button
              type="button"
              disabled={cancelling}
              onClick={() => {
                cancellingRef.current = true;
                setCancelling(true);
                cancel();
              }}
              className="mt-4 w-full cursor-pointer rounded-lg bg-hover px-4 py-2 text-xs
                         text-secondary transition-colors hover:bg-active hover:text-primary
                         disabled:cursor-not-allowed disabled:opacity-40"
            >
              {cancelling ? t("bakeDialog.cancelling") : t("common.cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-secondary">
      {children}
    </span>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] text-secondary">{label}</dt>
      <dd className="truncate font-technical text-[11px] text-primary" title={value}>
        {value}
      </dd>
    </div>
  );
}
