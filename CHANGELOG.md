# Changelog

One entry per release, newest first. Plain lists of what changed for the
person using the app; internal refactors appear only when they change
behaviour.

## Unreleased

- Transitions and fades work on titles. Text clips were locked out of both:
  the guards rejected them, and the export's rasterised-title path silently
  dropped any that were set. Titles now take every transition (dissolves,
  wipes, push, zoom, fades to colour) and Fade in / Fade out, end to end -
  live preview draws the arriving title during its window, and the export
  passes the cut transition and the fades onto the rasterised PNG, which
  lowers through the same overlap machinery as any visual. "Apply to
  all / to selected" sweeps cuts on titles along with the rest.
- Word-by-word auto captions. Settings → Transcriber gains an auto-caption
  style: Phrase (the previous behaviour) or Word by word, which times each
  caption to the moment its word is spoken - whisper's token-level
  timestamps, surfaced through the transcription pipeline. A binary too old
  to provide them quietly falls back to phrases.
- Lyrics on beats: paste the words into the new Beats-tab sheet, pick how
  many words ride each beat (1 for strict karaoke, 2-3 for the singable
  read) and the beat step for slow songs, and they land as text clips on a
  "Lyrics" lane - one clip per beat gap, styled like captions, one undo
  step. The sheet shows the exact plan ("42 words → 21 clips") before
  anything lands.
- Fade in / Fade out now fade the picture too. The Adjust panel's fades were
  sound-only, and a still had no fades at all; one fade now ramps the clip's
  opacity and its level together - in the export, the paused monitor, and
  live playback - and stills get the same fades. A dissolve no longer
  shortens a deliberate fade: the longer of the two windows wins.
- Wipe Left, Wipe Right, Push and Zoom actually transition now. The four
  catalogue entries existed but clicked to nothing; they are lowered in the
  engine like the dissolve always was - the incoming clip pre-rolls over the
  outgoing one on its own lane and a per-kind animated ramp says how it
  arrives: wipes slide in from their edge, push slides in while the outgoing
  picture is shown off screen, zoom punches down through a dissolve. The
  same geometry drives the export, the paused monitor's true frame, and the
  live playback preview.
- Apply to all / to selected: each transition tile in the bin carries an
  "All" chip that puts that transition on every cut of the timeline, and a
  "Sel" chip that covers only the cuts among the selected clips. Both land
  as one undoable step, and a toast reports how many cuts took it.
- Every bake now asks first. Placing code symbols or the visualizer on beats
  opens a bake sheet: what will bake, the span, a smoothness choice (12/24/30
  fps), a live frame count and time estimate, and whether to replace the
  previous bake. Nothing encodes until Bake is pressed; while it runs the
  sheet shows frame progress with a time-left estimate and a Cancel that
  aborts cleanly and returns to the config. Exporting with the live overlay
  on opens the same sheet — the one shortcut is an identical re-bake
  (settings + beats unchanged since the last one, remembered across
  relaunches), where export continues without asking again.
- Re-baking replaces instead of stacks: with the toggle on (default), the
  previous overlay clip, its track and its media are removed first, so
  experimenting with presets no longer litters the timeline and bin.
- Beat overlay bakes as one animated clip. Placing code symbols or the music
  visualizer on beats (and the automatic bake before export) used to freeze
  one JPEG per beat — a 2 fps slideshow where the preview had shown 20 fps
  motion, plus one file, bin item and clip per beat. The overlay is now
  re-rendered at full frame rate over the beat span and encoded host-side
  into a single MP4 that lands on the timeline as one clip, moving exactly
  as the live preview did. ASCII-on-video samples the source through a
  hidden player instead of one ffmpeg seek per beat.
- Text to speech: File → Text to speech turns typed narration into an audio
  clip at the playhead, spoken by one of 36 Kokoro voices (American and
  British English, Chinese) at a chosen pace. Generation runs entirely on
  this machine; the voice model downloads once (about 130 MB) from the sheet
  itself or Settings → Speech.
- The entire interface is translatable: the app follows the system language
  when a translation exists, with an override in Settings → General.
  Translations are plain JSON files contributors can add — see TRANSLATING.md.
- Simplified Chinese ships as the first translation (machine-drafted,
  pending native review).

## v0.2.0-alpha.6 — 2026-08-29

- Effect tiles preview the real render: each thumbnail comes from the
  effect's actual FFmpeg chain, not an approximation.
- Editor icons come from Lucide.

## v0.2.0-alpha.5 — 2026-08-29

- Timeline tabs reorder by dragging, following the pointer live.
- Toasts rise in, hold long enough to be read, and sink out.
- Tab drops land where the preview caret shows.
- Transcriber settings select models by card; the internal engine row is gone.
- Color fixes: panel resizers, the idle play button and dark sunken surfaces
  now sit correctly in the palette.

## v0.2.0-alpha.4 — 2026-08-29

- Nix flake for Linux.
- Portrait phone video imports as portrait: probing reports displayed
  dimensions.
- A project closed before its first edit reopens empty instead of corrupt.
- Edits dispatched before the session opens wait for it.
- Packagers that guarantee PATH tools can skip the bundle guard.

## v0.2.0-alpha.3 — 2026-08-29

- Preview quality picker replaces the footer fps readout.
- Fixed same-tick edits reaching the engine empty.

## v0.2.0-alpha.2 — 2026-08-29

- Clock-paced playback stream with engine decode-ahead.
- Waveform peaks decode in the engine.

## v0.2.0-alpha.1 — 2026-08-29

- The engine owns the whole render path: export and preview render the
  engine's session, and the FFmpeg chains are built engine-side.
- Stacked glow/mirror effects no longer break the export.
- A lost GPU device degrades to the CPU compositor instead of failing.
- Playback no longer re-renders the whole interface at 60fps.
- Timecode, trim and autosave fixes in the timeline.
- File access starts empty and grows only by user intent.
- Every green main build publishes the next alpha automatically.

## v0.1.0-alpha.1 — 2026-08-27

- First public alpha: timeline editing, media bin, effects and filters,
  text and captions, export via FFmpeg, on-device transcription.
