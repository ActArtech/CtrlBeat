/**
 * Auto-captions: transcribe one clip's audio and lay the result out as text
 * clips on a "Captions" track (created on first use, reused after).
 *
 * The captions land as one batch - one round trip, one undo step - which is
 * why each addTextClip carries its own duration and placement.
 */
import { useCallback, useState } from "react";

import {
  activeTimeline,
  type Clip,
  type EditorCommand,
  type EditorProject,
  type MediaItem,
} from "../lib/editor";
import { transcribeClip, type TranscribedWord } from "../lib/engine";
import { getCaptionGranularity, getTranscriberLanguage, getTranscriberModel } from "../lib/settings";
import { defaultTextStyle } from "../lib/text";

export function useCaptions({
  dispatch,
  getProject,
  onToast,
}: {
  dispatch: (command: EditorCommand) => Promise<string | undefined>;
  getProject: () => EditorProject;
  onToast: (message: string, failed: boolean) => void;
}) {
  const [transcribing, setTranscribing] = useState(false);

  const autoCaption = useCallback(
    async (clip: Clip, media: MediaItem) => {
      setTranscribing(true);
      onToast("Transcribing...", false);
      try {
        const segments = await transcribeClip({
          path: media.path,
          sourceStart: clip.sourceStart,
          window: clip.duration * clip.speed,
          language: getTranscriberLanguage(),
          modelId: getTranscriberModel(),
          // Always ask: the phrase style ignores the words, but asking costs
          // nothing extra on this run and the choice can change later.
          wordTimestamps: true,
        });
        if (segments.length === 0) {
          onToast("No speech found", false);
          return;
        }

        // Word-by-word: one clip per timed word, the karaoke style. Empty
        // when the preference is phrases, or the run came back without
        // token timing (an old binary) - then phrases catch the fall.
        const words: TranscribedWord[] =
          getCaptionGranularity() === "word"
            ? segments.flatMap((segment) => segment.words ?? [])
            : [];
        const captionClips =
          words.length > 0
            ? words.map((word) => ({
                start: clip.start + word.start / clip.speed,
                duration: Math.max(0.3, (word.end - word.start) / clip.speed),
                content: word.text,
              }))
            : segments.map((segment) => ({
                start: clip.start + segment.start / clip.speed,
                duration: Math.max(0.4, (segment.end - segment.start) / clip.speed),
                content: segment.text,
              }));

        let trackId = activeTimeline(getProject()).tracks.find(
          (track) => track.name === "Captions",
        )?.id;
        if (!trackId) {
          trackId = await dispatch({ op: "addTrack" });
          if (!trackId) return;
          await dispatch({ op: "renameTrack", trackId, name: "Captions" });
        }

        await dispatch({
          op: "batch",
          commands: captionClips.map((caption) => ({
            op: "addTextClip",
            trackId,
            start: caption.start,
            duration: caption.duration,
            offsetY: 0.38,
            // Caption-sized and lower-third, not title-sized and centred.
            style: { ...defaultTextStyle(), content: caption.content, fontSize: 0.045 },
          })),
        });
        const count = captionClips.length;
        onToast(
          words.length > 0
            ? `Added ${count} word captions`
            : `Added ${count} caption${count === 1 ? "" : "s"}`,
          false,
        );
      } catch (cause) {
        onToast(String(cause), true);
      } finally {
        setTranscribing(false);
      }
    },
    [dispatch, getProject, onToast],
  );

  return { autoCaption, transcribing };
}
