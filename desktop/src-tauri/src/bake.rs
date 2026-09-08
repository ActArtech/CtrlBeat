//! The overlay bake encoder: one streaming FFmpeg child turns webview-rendered
//! JPEG frames into a single MP4.
//!
//! The bake used to write one JPEG per beat, probe it, and place each as its
//! own clip - a slideshow where the live overlay had shown continuous motion,
//! and a per-beat pile of files, spawns and media items. Now the webview
//! renders the overlay at full frame rate, `bake_frame` streams each JPEG down
//! the pipe, and `bake_finish` returns one video file that lands on the
//! timeline as one clip.
//!
//! One bake runs at a time, held in managed state. A `bake_begin` while
//! another session is live kills it: the old output is garbage by definition,
//! and leaking a live encoder behind a confused UI is the worse failure.

use std::io::{Read, Write};
use std::process::{Child, Command, Stdio};
use std::sync::mpsc::{Receiver, SyncSender, sync_channel};
use std::sync::{Arc, Mutex};

use tauri::ipc::{InvokeBody, Request};

/// How much of FFmpeg's stderr to keep for error messages.
const STDERR_KEEP: usize = 8 * 1024;
/// Frames buffered between the webview and the writer thread. Small on
/// purpose: when FFmpeg falls behind, `bake_frame` blocks and the webview
/// naturally stops rendering ahead.
const FRAME_QUEUE: usize = 8;

/// Managed holder for the one live bake session.
pub struct BakeState(pub Mutex<Option<BakeSession>>);

pub struct BakeSession {
    output: String,
    sender: SyncSender<Vec<u8>>,
    writer: Option<std::thread::JoinHandle<()>>,
    child: Child,
    /// FFmpeg's stderr tail, filled by the drain thread as it reads.
    stderr: Arc<Mutex<Vec<u8>>>,
    /// The first write failure the writer thread saw, if any.
    failure: Arc<Mutex<Option<String>>>,
    /// Set by `finish`, so `Drop` knows not to kill a reaped child.
    finished: bool,
}

/// Starts one bake: spawns FFmpeg reading JPEGs from `pipe:0`.
///
/// The output lands in the project cache under `key` (a flat `.mp4` filename),
/// so it travels with the project and vanishes with it. Frames arrive later,
/// one `bake_frame` each.
#[tauri::command]
pub async fn bake_begin(
    state: tauri::State<'_, BakeState>,
    project: String,
    key: String,
    fps: u32,
) -> Result<(), String> {
    let file = crate::artwork_file(&project, &key)?;
    let output = file.to_string_lossy().into_owned();
    let fps = fps.clamp(1, 120);

    let session = tauri::async_runtime::spawn_blocking(move || start(file, output, fps))
        .await
        .map_err(|error| format!("bake start task failed: {error}"))??;

    // Replacing a live session kills it (see `Drop`); there is nothing useful
    // to say to a caller who started a second bake over a running one.
    *state.0.lock().map_err(poisoned)? = Some(session);
    Ok(())
}

/// Streams one JPEG frame into the running bake.
///
/// Synchronous on purpose: commands without `async` run on the blocking pool,
/// so when FFmpeg is slower than the webview this parks a pool thread instead
/// of an async worker, and the await in the webview is the backpressure.
#[tauri::command]
pub fn bake_frame(state: tauri::State<'_, BakeState>, request: Request) -> Result<(), String> {
    let bytes = match request.body() {
        InvokeBody::Raw(bytes) => bytes.clone(),
        other => return Err(format!("bake_frame wants raw frame bytes, got {}", kind(other))),
    };
    if !looks_like_jpeg(&bytes) {
        return Err(format!("bake_frame got {} non-JPEG bytes", bytes.len()));
    }

    let session = state.0.lock().map_err(poisoned)?;
    let session = session.as_ref().ok_or("no bake is running")?;
    session
        .sender
        .send(bytes)
        .map_err(|_| format!("bake encoder stopped: {}", stopped_reason(session)))
}

/// Closes the stream, lets FFmpeg write the trailer, and returns the MP4 path.
#[tauri::command]
pub async fn bake_finish(state: tauri::State<'_, BakeState>) -> Result<String, String> {
    let session = state
        .0
        .lock()
        .map_err(poisoned)?
        .take()
        .ok_or("no bake is running")?;

    let output = session.output.clone();
    // Reaping the child blocks until the encode flushes, which belongs on the
    // blocking pool like every other wait in this host.
    tauri::async_runtime::spawn_blocking(move || finish(session))
        .await
        .map_err(|error| format!("bake finish task failed: {error}"))?
        .map_err(|error| format!("bake could not encode {output}: {error}"))?;
    Ok(output)
}

/// Kills the running bake and discards its output.
#[tauri::command]
pub fn bake_abort(state: tauri::State<'_, BakeState>) -> Result<(), String> {
    drop(state.0.lock().map_err(poisoned)?.take());
    Ok(())
}

fn start(
    file: std::path::PathBuf,
    output: String,
    fps: u32,
) -> Result<BakeSession, String> {
    if let Some(parent) = file.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| format!("could not create {}: {error}", parent.display()))?;
    }

    let mut command: Command = wolfcut_media::command(wolfcut_media::ffmpeg());
    command
        .args(["-hide_banner", "-loglevel", "error", "-y"])
        // Concatenated JPEGs down the pipe, timed by -framerate.
        .args(["-f", "image2pipe", "-c:v", "mjpeg", "-framerate", &fps.to_string()])
        .args(["-i", "pipe:0"])
        // The odd-dimension guard: a canvas that arrived at an odd size should
        // not cost a full re-bake at finish time.
        .args(["-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2"])
        .args(["-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "20"])
        .args(["-pix_fmt", "yuv420p", "-movflags", "+faststart"])
        .arg(&file)
        .stdin(Stdio::piped())
        .stdout(Stdio::null())
        .stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|error| format!("could not run ffmpeg: {error}"))?;
    let stdin = child
        .stdin
        .take()
        .expect("stdin was piped");
    let stderr = child
        .stderr
        .take()
        .expect("stderr was piped");

    let tail = Arc::new(Mutex::new(Vec::new()));
    let failure: Arc<Mutex<Option<String>>> = Arc::new(Mutex::new(None));

    // Drain stderr on its own thread: an undrained pipe fills and stalls the
    // child, and a packaged app has no terminal for it anyway.
    let drain_tail = Arc::clone(&tail);
    std::thread::spawn(move || drain_stderr(stderr, drain_tail));

    let (sender, receiver) = sync_channel::<Vec<u8>>(FRAME_QUEUE);
    let writer_failure = Arc::clone(&failure);
    let writer = std::thread::spawn(move || write_frames(stdin, receiver, &writer_failure));

    Ok(BakeSession {
        output,
        sender,
        writer: Some(writer),
        child,
        stderr: tail,
        failure,
        finished: false,
    })
}

fn finish(mut session: BakeSession) -> Result<(), String> {
    // Closing stdin is the signal to flush and write the trailer.
    drop(std::mem::replace(&mut session.sender, or_disconnected()));
    let writer = session.writer.take();
    if let Err(error) = writer.map(|handle| handle.join()).unwrap_or(Ok(())) {
        // A panic in the writer is a bug; the child still needs reaping.
        let _ = session.child.kill();
        let _ = session.child.wait();
        return Err(format!("bake writer failed: {error:?}"));
    }

    session.finished = true;
    if let Some(failure) = session.failure.lock().map_err(poisoned)?.take() {
        let _ = session.child.kill();
        let _ = session.child.wait();
        return Err(failure);
    }

    let status = session
        .child
        .wait()
        .map_err(|error| format!("ffmpeg did not report a status: {error}"))?;
    if status.success() {
        Ok(())
    } else {
        Err(format!(
            "ffmpeg exited with {status}{}",
            stderr_summary(&session.stderr)
        ))
    }
}

fn write_frames(
    mut stdin: std::process::ChildStdin,
    receiver: Receiver<Vec<u8>>,
    failure: &Mutex<Option<String>>,
) {
    while let Ok(frame) = receiver.recv() {
        if let Err(error) = stdin.write_all(&frame) {
            let message = format!("ffmpeg stopped accepting frames: {error}");
            if let Ok(mut slot) = failure.lock() {
                slot.get_or_insert(message);
            }
            return;
        }
    }
}

fn drain_stderr(mut stderr: std::process::ChildStderr, tail: Arc<Mutex<Vec<u8>>>) {
    let mut buffer = [0u8; 2048];
    loop {
        match stderr.read(&mut buffer) {
            Ok(0) | Err(_) => return,
            Ok(read) => {
                if let Ok(mut tail) = tail.lock() {
                    tail.extend_from_slice(&buffer[..read]);
                    let excess = tail.len().saturating_sub(STDERR_KEEP);
                    if excess > 0 {
                        tail.drain(..excess);
                    }
                }
            }
        }
    }
}

/// The tail of what FFmpeg said, for error messages. Empty on a clean run.
fn stderr_summary(tail: &Mutex<Vec<u8>>) -> String {
    let tail = match tail.lock() {
        Ok(tail) => tail,
        Err(_) => return String::new(),
    };
    let text = String::from_utf8_lossy(&tail);
    let text = text.trim_end();
    if text.is_empty() {
        String::new()
    } else {
        format!(": {text}")
    }
}

/// The writer's failure if there was one, else a generic disconnect note.
fn stopped_reason(session: &BakeSession) -> String {
    session
        .failure
        .lock()
        .ok()
        .and_then(|slot| slot.clone())
        .unwrap_or_else(|| "encoder exited early".to_owned())
        + &stderr_summary(&session.stderr)
}

fn looks_like_jpeg(bytes: &[u8]) -> bool {
    bytes.len() > 4 && bytes[0] == 0xff && bytes[1] == 0xd8
}

fn kind(body: &InvokeBody) -> &'static str {
    match body {
        InvokeBody::Json(_) => "json",
        InvokeBody::Raw(_) => "raw",
    }
}

fn poisoned<T>(_: T) -> String {
    "bake state lock poisoned".to_owned()
}

impl Drop for BakeSession {
    fn drop(&mut self) {
        if self.finished {
            return;
        }
        // finish() was never called, so the output is garbage anyway. Kill
        // rather than let FFmpeg flush a half-fed stream to disk.
        drop(std::mem::replace(&mut self.sender, or_disconnected()));
        let _ = self.child.kill();
        let _ = self.child.wait();
    }
}

/// A sender whose receiver is already gone, so `Drop` has something to drop.
fn or_disconnected() -> SyncSender<Vec<u8>> {
    let (sender, _) = sync_channel(1);
    sender
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn jpeg_frames_pass_other_bodies_do_not() {
        assert!(looks_like_jpeg(&[0xff, 0xd8, 0xff, 0xe0, 0x00]));
        assert!(!looks_like_jpeg(&[0x89, 0x50, 0x4e, 0x47]));
        assert!(!looks_like_jpeg(&[0xff, 0xd8]));
        assert!(!looks_like_jpeg(&[]));
    }
}
