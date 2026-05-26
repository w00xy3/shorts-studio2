/**
 * Video-related type definitions for Shorts Studio.
 *
 * Covers source videos (16:9 imports) and clips (9:16 vertical outputs).
 * All types are shared between Main (server) and Renderer (UI) processes.
 */

// ─── Source Video ────────────────────────────────────────────────────────────

/** Video codec identifiers returned by FFprobe */
export type VideoCodec = "h264" | "h265" | "hevc" | "vp9" | "av1" | "prores" | string;

/** Audio codec identifiers */
export type AudioCodec = "aac" | "mp3" | "opus" | "vorbis" | "pcm_s16le" | string;

/** Metadata extracted from a source video file via FFprobe */
export interface VideoMetadata {
  /** Duration in seconds */
  duration: number;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
  /** Frames per second */
  fps: number;
  /** Video codec name */
  videoCodec: VideoCodec;
  /** Audio codec name */
  audioCodec: AudioCodec;
  /** Total bitrate in kbps */
  bitrate: number;
  /** Number of audio channels */
  audioChannels: number;
  /** Audio sample rate in Hz */
  sampleRate: number;
  /** Whether the video has an audio track */
  hasAudio: boolean;
}

/** A source video imported by the user (16:9 horizontal) */
export interface SourceVideo {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  metadata: VideoMetadata;
  thumbnailPath: string | null;
  importedAt: Date;
  updatedAt: Date;
}

/** Payload for importing a new source video */
export interface ImportVideoPayload {
  filePath: string;
  /** Optional custom name override; defaults to file name */
  displayName?: string;
}

// ─── Clip ────────────────────────────────────────────────────────────────────

/**
 * Crop mode determines how 16:9 footage is adapted to 9:16.
 *
 * - "center" — crop to center of the frame (fastest, stream-copy possible)
 * - "blur"  — scale the original, blur it as background, overlay centered original
 */
export type CropMode = "center" | "blur";

/** Processing status of a clip */
export type ClipStatus = "pending" | "processing" | "done" | "error";

/** A single clip cut from a source video, rendered in 9:16 vertical format */
export interface Clip {
  id: string;
  sourceVideoId: string;
  title: string;
  /** Start time offset in seconds */
  startTime: number;
  /** End time offset in seconds */
  endTime: number;
  outputWidth: number;
  outputHeight: number;
  cropMode: CropMode;
  /** Blur strength 0–40, only applicable when cropMode = "blur" */
  blurStrength: number;
  status: ClipStatus;
  /** Processing progress 0–100 */
  progress: number;
  outputFilePath: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Payload for creating a new clip */
export interface CreateClipPayload {
  sourceVideoId: string;
  title: string;
  startTime: number;
  endTime: number;
  cropMode: CropMode;
  blurStrength?: number;
  outputWidth?: number;
  outputHeight?: number;
}

/** Payload for updating clip parameters before processing */
export interface UpdateClipPayload {
  clipId: string;
  title?: string;
  startTime?: number;
  endTime?: number;
  cropMode?: CropMode;
  blurStrength?: number;
}

/** Payload for starting clip processing */
export interface ProcessClipPayload {
  clipId: string;
  /** Force re-process even if clip is already "done" */
  force?: boolean;
}

/** Payload for cancelling in-progress clip processing */
export interface CancelClipPayload {
  clipId: string;
}

// ─── FFmpeg-specific ─────────────────────────────────────────────────────────

/** FFmpeg processing options for a clip */
export interface FFmpegOptions {
  /** Target width (default 1080) */
  width: number;
  /** Target height (default 1920) */
  height: number;
  /** Crop mode */
  cropMode: CropMode;
  /** Blur sigma strength (default 20) */
  blurStrength: number;
  /** Video bitrate for re-encoding (kpbs), e.g. 5000 */
  videoBitrate?: number;
  /** Audio bitrate (kbps), e.g. 128 */
  audioBitrate?: number;
  /** CRF quality value (0–51, lower = better). Default 23 */
  crf?: number;
  /** Preset: ultrafast → veryslow. Default "medium" */
  preset?: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow";
  /** Whether to attempt stream-copy (no re-encode) when possible */
  tryStreamCopy: boolean;
}

/** Progress event emitted by FFmpeg during processing */
export interface FFmpegProgressEvent {
  /** Clip ID being processed */
  clipId: string;
  /** Percentage complete 0–100 */
  percent: number;
  /** Current processing time position in seconds */
  currentTime: number;
  /** Processing speed multiplier (e.g. 1.5x means faster than real-time) */
  speed: number;
  /** Estimated remaining time in seconds */
  eta: number;
  /** Current bitrate of output */
  bitrate: number;
}
