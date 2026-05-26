/**
 * PostingModule custom error classes.
 *
 * Each error maps directly to an IpcErrorCode from the shared type system,
 * so IPC handlers / API routes can catch and propagate structured errors
 * without ad-hoc string matching.
 */

import type { IpcErrorCode } from "@/shared/types/ipc";

// ─── Base class ──────────────────────────────────────────────────────────────

/**
 * Base error for all PostingModule operations.
 * Carries the IpcErrorCode for direct mapping in IPC handlers.
 */
export class PostingError extends Error {
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
    this.name = "PostingError";
    this.code = params.code;
    this.details = params.details;
    this.retryable = params.retryable ?? false;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// ─── Specific errors ─────────────────────────────────────────────────────────

/** Thrown when the upload to a platform fails entirely */
export class UploadFailedError extends PostingError {
  constructor(platform: string, reason: string) {
    super({
      code: "UPLOAD_FAILED",
      message: `Upload to ${platform} failed: ${reason}`,
      details: `Platform: ${platform}. Reason: ${reason}`,
      retryable: true,
    });
    this.name = "UploadFailedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a single chunk upload fails (can be retried) */
export class UploadChunkFailedError extends PostingError {
  public readonly chunkIndex: number;
  public readonly totalChunks: number;

  constructor(platform: string, chunkIndex: number, totalChunks: number, reason: string) {
    super({
      code: "UPLOAD_CHUNK_FAILED",
      message: `Chunk ${chunkIndex + 1}/${totalChunks} failed on ${platform}: ${reason}`,
      details: `Platform: ${platform}, Chunk: ${chunkIndex + 1}/${totalChunks}. Reason: ${reason}`,
      retryable: true,
    });
    this.name = "UploadChunkFailedError";
    this.chunkIndex = chunkIndex;
    this.totalChunks = totalChunks;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the platform API returns an unexpected error */
export class PlatformApiError extends PostingError {
  public readonly platform: string;
  public readonly statusCode?: number;

  constructor(platform: string, message: string, statusCode?: number) {
    super({
      code: "PLATFORM_API_ERROR",
      message: `${platform} API error: ${message}`,
      details: `Platform: ${platform}, Status: ${statusCode ?? "unknown"}`,
      retryable: statusCode === undefined || statusCode >= 500,
    });
    this.name = "PlatformApiError";
    this.platform = platform;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the platform rate-limits our requests */
export class PlatformRateLimitedError extends PostingError {
  public readonly platform: string;
  public readonly retryAfterSeconds: number;

  constructor(platform: string, retryAfterSeconds: number) {
    super({
      code: "PLATFORM_RATE_LIMITED",
      message: `${platform} rate limit exceeded. Retry after ${retryAfterSeconds}s.`,
      details: `Platform: ${platform}, Retry-After: ${retryAfterSeconds}s`,
      retryable: true,
    });
    this.name = "PlatformRateLimitedError";
    this.platform = platform;
    this.retryAfterSeconds = retryAfterSeconds;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when a post is in an invalid state for the requested operation */
export class InvalidPostStateError extends PostingError {
  constructor(postId: string, currentStatus: string, requestedAction: string) {
    super({
      code: "INVALID_POST_STATE",
      message: `Cannot ${requestedAction} post ${postId}: current status is "${currentStatus}"`,
      details: `PostId: ${postId}, Status: ${currentStatus}, Action: ${requestedAction}`,
      retryable: false,
    });
    this.name = "InvalidPostStateError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Thrown when the video file to upload is not found */
export class VideoFileNotFoundError extends PostingError {
  constructor(filePath: string) {
    super({
      code: "NOT_FOUND",
      message: `Video file not found: ${filePath}`,
      details: "The video file may have been moved, deleted, or not yet rendered.",
      retryable: false,
    });
    this.name = "VideoFileNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
