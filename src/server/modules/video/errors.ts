/**
 * VideoProcessingModule custom error classes.
 *
 * Each error maps directly to an IpcErrorCode from the shared type system,
 * so IPC handlers / API routes can catch and propagate structured errors
 * without ad-hoc string matching.
 *
 * Usage in handler:
 *   try {
 *     const outputPath = await videoProcessor.processClip(options);
 *   } catch (err) {
 *     if (err instanceof FFmpegNotFoundError) {
 *       return { ok: false, error: { code: "FFMPEG_NOT_FOUND", ... } };
 *     }
 *   }
 */

import type { IpcErrorCode } from "@/shared/types/ipc";

// ─── Base class ──────────────────────────────────────────────────────────────

/**
 * Base error for all VideoProcessingModule operations.
 * Carries the IpcErrorCode for direct mapping in IPC handlers.
 */
export class VideoProcessingError extends Error {
  public readonly code: IpcErrorCode;
  public readonly details?: string;
  public readonly retryable: boolean;

  constructor(params: {
    code: IpcErrorCode;
    message: string;
    details?: string;
    retryable?: boolean;
  }) {
    super(params.message);
    this.name = "VideoProcessingError";
    this.code = params.code;
    this.details = params.details;
    this.retryable = params.retryable ?? false;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Specific errors ─────────────────────────────────────────────────────────

/** Thrown when the FFmpeg binary is not found on the system PATH */
export class FFmpegNotFoundError extends VideoProcessingError {
  constructor(searchedPath?: string) {
    super({
      code: "FFMPEG_NOT_FOUND",
      message: "FFmpeg binary not found",
      details: searchedPath
        ? `Searched at: ${searchedPath}. Install FFmpeg or set the FFMPEG_PATH env variable.`
        : "FFmpeg was not found on the system PATH. Install FFmpeg or set the FFMPEG_PATH env variable.",
      retryable: false,
    });
    this.name = "FFmpegNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when FFmpeg exits with a non-zero code during processing */
export class FFmpegFailedError extends VideoProcessingError {
  constructor(
    public readonly exitCode: number | null,
    stderr: string,
  ) {
    super({
      code: "FFMPEG_FAILED",
      message: `FFmpeg exited with code ${exitCode ?? "null"}`,
      details: stderr.slice(0, 2000),
      retryable: false,
    });
    this.name = "FFmpegFailedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the input video format is not supported or cannot be parsed */
export class InvalidVideoFormatError extends VideoProcessingError {
  constructor(reason: string) {
    super({
      code: "INVALID_VIDEO_FORMAT",
      message: `Invalid or unsupported video format: ${reason}`,
      retryable: false,
    });
    this.name = "InvalidVideoFormatError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a clip processing job is cancelled by the user */
export class ClipProcessingCancelledError extends VideoProcessingError {
  constructor(clipId: string) {
    super({
      code: "CLIP_PROCESSING_CANCELLED",
      message: `Clip processing was cancelled: ${clipId}`,
      retryable: false,
    });
    this.name = "ClipProcessingCancelledError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when trying to process a clip that is already being processed */
export class ClipAlreadyProcessingError extends VideoProcessingError {
  constructor(clipId: string) {
    super({
      code: "CLIP_ALREADY_PROCESSING",
      message: `Clip is already being processed: ${clipId}`,
      retryable: false,
    });
    this.name = "ClipAlreadyProcessingError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the source video file cannot be read (missing / permissions) */
export class SourceVideoNotFoundError extends VideoProcessingError {
  constructor(filePath: string) {
    super({
      code: "NOT_FOUND",
      message: `Source video file not found: ${filePath}`,
      details: "The file may have been moved, deleted, or the path is incorrect.",
      retryable: false,
    });
    this.name = "SourceVideoNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
