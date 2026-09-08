//! TTS stubs when the `tts` feature (sherpa-onnx) is off.
//!
//! Used to ship freeze / duplicate / beat builds on MSVC toolchains that
//! cannot link the prebuilt sherpa static libs. Commands keep the same
//! wire shape so the UI does not crash; they return a clear error instead.

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::jobs::SingleFlight;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ModelStatus {
    id: String,
    label: String,
    blurb: String,
    size_bytes: u64,
    downloaded: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct VoiceInfo {
    id: i32,
    name: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TtsStatus {
    models_dir: String,
    models: Vec<ModelStatus>,
    voices: Vec<VoiceInfo>,
}

pub struct TtsDownloadState(pub Arc<SingleFlight>);

pub struct TtsState {
    gate: Arc<SingleFlight>,
}

impl TtsState {
    pub fn new() -> Self {
        Self {
            gate: Arc::new(SingleFlight::new()),
        }
    }
}

fn disabled() -> String {
    "Text-to-speech is disabled in this build (sherpa-onnx not linked). Freeze, duplicate, and beat tools still work.".to_owned()
}

#[tauri::command]
pub fn tts_status(app: tauri::AppHandle) -> Result<TtsStatus, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map(|p| p.join("tts-models").to_string_lossy().into_owned())
        .unwrap_or_else(|_| String::new());
    Ok(TtsStatus {
        models_dir: dir,
        models: Vec::new(),
        voices: Vec::new(),
    })
}

#[tauri::command]
pub async fn download_tts_model(
    _app: tauri::AppHandle,
    _state: tauri::State<'_, TtsDownloadState>,
    _id: String,
) -> Result<(), String> {
    Err(disabled())
}

#[tauri::command]
pub fn cancel_tts_model_download(_state: tauri::State<'_, TtsDownloadState>) {}

#[tauri::command]
pub fn delete_tts_model(
    _app: tauri::AppHandle,
    _state: tauri::State<'_, TtsState>,
    _id: String,
) -> Result<(), String> {
    Err(disabled())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeakRequest {
    pub model_id: String,
    pub voice: i32,
    pub text: String,
    pub speed: f32,
    pub project: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpeakResult {
    path: String,
    duration: f64,
}

#[tauri::command]
pub async fn speak_text(
    _app: tauri::AppHandle,
    _state: tauri::State<'_, TtsState>,
    _request: SpeakRequest,
) -> Result<SpeakResult, String> {
    Err(disabled())
}

#[tauri::command]
pub fn cancel_speak(_state: tauri::State<'_, TtsState>) {}
