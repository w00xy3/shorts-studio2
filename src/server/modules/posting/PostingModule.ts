/**
 * PostingModule — Platform video upload handler for Shorts Studio.
 *
 * Architecture:
 *   - Manages chunked video uploads to TikTok, YouTube Shorts, and Instagram Reels.
 *   - Implements a mock chunked upload flow for browser preview environments.
 *   - Emits upload:progress events during each chunk transfer.
 *   - Supports cancellation via AbortController signal.
 *   - Returns IpcResult<string> with the platform post ID on success.
 *
 * Production flow (TikTok example):
 *   1. POST /v2/post/publish/video/init/  — initialize upload session
 *   2. PUT chunk via /v2/post/publish/video/upload/  — send each chunk
 *   3. POST /v2/post/publish/video/complete/  — finalize upload
 *
 * Mock flow (browser preview):
 *   1. Simulate 4-5 chunks being uploaded sequentially
 *   2. Each chunk takes ~600-1200ms (randomized)
 *   3. Emit progress events after each chunk completes
 *   4. On success: resolve with a fake platformPostId
 *   5. ~15% chance of simulated failure for testing error states
 *
 * Error strategy:
 *   All methods throw subclassed PostingError instances that carry
 *   an IpcErrorCode, so IPC handlers can map them directly to IpcError.
 */

import type { Platform } from "@/shared/types/account";
import type { IpcResult } from "@/shared/types/ipc";
import type { UploadProgressEvent } from "@/shared/types/post";

import {
  PostingError,
  UploadFailedError,
  PlatformApiError,
  InvalidPostStateError,
  VideoFileNotFoundError,
} from "./errors";

// ─── Progress callback type ──────────────────────────────────────────────────

/**
 * Callback invoked during chunked upload with progress data.
 * In an Electron app this would stream via IPC event:
 *   BrowserWindow.webContents.send('post:upload-progress', payload)
 */
export type UploadProgressCallback = (progress: UploadProgressEvent) => void;

// ─── Upload result ───────────────────────────────────────────────────────────

/** Result of a successful upload operation */
export interface UploadVideoResult {
  /** Platform-assigned post ID (e.g. "tiktok_post_72819") */
  platformPostId: string;
  /** Platform the video was uploaded to */
  platform: Platform;
  /** Timestamp when upload completed */
  publishedAt: string;
  /** Total upload duration in seconds */
  uploadDuration: number;
}

// ─── Upload metadata ─────────────────────────────────────────────────────────

/** Metadata passed alongside the video upload */
export interface UploadMetadata {
  /** Post description / caption */
  description?: string;
  /** Comma-separated hashtags */
  tags?: string;
  /** Cover image URL (if the platform supports it) */
  coverImageUrl?: string;
  /** Platform-specific privacy setting */
  privacyLevel?: "public" | "friends" | "private";
  /** Whether to allow comments */
  allowComments?: boolean;
  /** Whether to allow duets/stitches (TikTok-specific) */
  allowDuet?: boolean;
  /** Title for YouTube Shorts */
  title?: string;
}

// ─── Active upload tracking ──────────────────────────────────────────────────

interface ActiveUpload {
  postId: string;
  platform: Platform;
  videoPath: string;
  status: "uploading" | "done" | "error";
  progress: number;
  currentChunk: number;
  totalChunks: number;
  startedAt: number;
  abortController: AbortController;
}

// ─── PostingModule class ─────────────────────────────────────────────────────

export class PostingModule {
  /** Currently active uploads, keyed by postId */
  private activeUploads = new Map<string, ActiveUpload>();

  /** Simulated chunk size in bytes (5 MB per chunk) */
  private readonly MOCK_CHUNK_SIZE = 5 * 1024 * 1024;

  /** Number of chunks to simulate (4-5 depending on "file size") */
  private readonly MOCK_TOTAL_CHUNKS = 5;

  /**
   * Uploads a video to the specified platform using a chunked upload flow.
   *
   * In production, this would:
   *   1. Retrieve OAuth tokens from TokenManager (via tokenKeyRef)
   *   2. Call the platform's upload initialization API
   *   3. Send chunks via the platform's chunked upload endpoint
   *   4. Finalize the upload
   *
   * In mock mode (browser preview), this simulates the entire flow.
   *
   * @param postId     - Internal post ID for tracking
   * @param videoPath  - Path to the rendered video file
   * @param platform   - Target platform (tiktok, youtube, instagram)
   * @param metadata   - Upload metadata (description, tags, etc.)
   * @param onProgress - Callback for upload progress events
   * @param abortSignal - Optional AbortSignal for cancellation
   * @returns IpcResult with UploadVideoResult on success
   */
  async uploadVideo(
    postId: string,
    videoPath: string,
    platform: Platform,
    metadata?: UploadMetadata,
    onProgress?: UploadProgressCallback,
    abortSignal?: AbortSignal,
  ): Promise<IpcResult<UploadVideoResult>> {
    try {
      // Check if already uploading
      if (this.activeUploads.has(postId)) {
        const err = new InvalidPostStateError(postId, "uploading", "upload");
        return {
          ok: false,
          error: { code: err.code, message: err.message, details: err.details, retryable: err.retryable },
        };
      }

      // Check cancellation before starting
      if (abortSignal?.aborted) {
        return {
          ok: false,
          error: { code: "CLIP_PROCESSING_CANCELLED", message: "Upload was cancelled before starting", retryable: false },
        };
      }

      // Create abort controller for this upload
      const abortController = new AbortController();
      if (abortSignal) {
        abortSignal.addEventListener("abort", () => abortController.abort(), { once: true });
      }

      // Register active upload
      const activeUpload: ActiveUpload = {
        postId,
        platform,
        videoPath,
        status: "uploading",
        progress: 0,
        currentChunk: 0,
        totalChunks: this.MOCK_TOTAL_CHUNKS,
        startedAt: Date.now(),
        abortController,
      };
      this.activeUploads.set(postId, activeUpload);

      // Simulate chunked upload
      const result = await this.simulateChunkedUpload(
        activeUpload,
        metadata,
        onProgress,
        abortController.signal,
      );

      // Clean up
      this.activeUploads.delete(postId);

      return result;
    } catch (error: unknown) {
      // Clean up on error
      this.activeUploads.delete(postId);

      if (error instanceof PostingError) {
        return {
          ok: false,
          error: { code: error.code, message: error.message, details: error.details, retryable: error.retryable },
        };
      }

      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        error: { code: "UNKNOWN_ERROR", message: `Upload failed: ${message}`, retryable: true },
      };
    }
  }

  /**
   * Cancels an active upload by postId.
   */
  cancelUpload(postId: string): boolean {
    const upload = this.activeUploads.get(postId);
    if (!upload) return false;

    upload.abortController.abort();
    this.activeUploads.delete(postId);
    return true;
  }

  /**
   * Returns the list of currently active upload post IDs.
   */
  getActiveUploads(): string[] {
    return Array.from(this.activeUploads.keys());
  }

  /**
   * Returns upload progress for a specific post.
   */
  getUploadProgress(postId: string): UploadProgressEvent | null {
    const upload = this.activeUploads.get(postId);
    if (!upload) return null;

    const elapsed = (Date.now() - upload.startedAt) / 1000;
    const bytesPerChunk = this.MOCK_CHUNK_SIZE;
    const bytesUploaded = upload.currentChunk * bytesPerChunk;
    const bytesTotal = upload.totalChunks * bytesPerChunk;

    return {
      postId: upload.postId,
      percent: upload.progress,
      bytesUploaded,
      bytesTotal,
      chunkIndex: upload.currentChunk,
      totalChunks: upload.totalChunks,
      speed: bytesUploaded > 0 ? Math.round(bytesUploaded / elapsed) : 0,
      eta: upload.progress > 0 ? Math.round((100 - upload.progress) / (upload.progress / elapsed)) : 0,
    };
  }

  // ─── Mock chunked upload simulation ─────────────────────────────────────

  /**
   * Simulates a chunked upload by processing chunks sequentially.
   * Each chunk takes 600-1200ms to "upload".
   * After each chunk, a progress event is emitted.
   * ~15% chance of failure on any given chunk (for error state testing).
   */
  private async simulateChunkedUpload(
    upload: ActiveUpload,
    metadata?: UploadMetadata,
    onProgress?: UploadProgressCallback,
    abortSignal?: AbortSignal,
  ): Promise<IpcResult<UploadVideoResult>> {
    const totalChunks = upload.totalChunks;
    const bytesPerChunk = this.MOCK_CHUNK_SIZE;
    const bytesTotal = totalChunks * bytesPerChunk;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      // Check for cancellation
      if (abortSignal?.aborted) {
        return {
          ok: false,
          error: { code: "CLIP_PROCESSING_CANCELLED", message: `Upload cancelled at chunk ${chunkIndex + 1}/${totalChunks}`, retryable: false },
        };
      }

      // Simulate chunk upload time (600-1200ms per chunk)
      const chunkDuration = 600 + Math.random() * 600;
      await this.delay(chunkDuration);

      // Check again after delay
      if (abortSignal?.aborted) {
        return {
          ok: false,
          error: { code: "CLIP_PROCESSING_CANCELLED", message: `Upload cancelled at chunk ${chunkIndex + 1}/${totalChunks}`, retryable: false },
        };
      }

      // ~10% chance of retryable chunk error (auto-retry once)
      if (Math.random() < 0.10) {
        // Simulate retry delay
        await this.delay(300);
        // Chunk succeeds on retry
      }

      // ~5% chance of permanent failure (for testing error states)
      if (Math.random() < 0.05) {
        const err = new UploadFailedError(upload.platform, `Simulated chunk ${chunkIndex + 1} failure`);
        return {
          ok: false,
          error: { code: err.code, message: err.message, details: err.details, retryable: err.retryable },
        };
      }

      // Update upload state
      upload.currentChunk = chunkIndex + 1;
      upload.progress = Math.round(((chunkIndex + 1) / totalChunks) * 100);

      // Emit progress event
      if (onProgress) {
        const elapsed = (Date.now() - upload.startedAt) / 1000;
        const bytesUploaded = (chunkIndex + 1) * bytesPerChunk;

        onProgress({
          postId: upload.postId,
          percent: upload.progress,
          bytesUploaded,
          bytesTotal,
          chunkIndex: chunkIndex,
          totalChunks,
          speed: bytesUploaded > 0 ? Math.round(bytesUploaded / elapsed) : 0,
          eta: upload.progress > 0 ? Math.round((100 - upload.progress) / (upload.progress / elapsed)) : 0,
        });
      }
    }

    // Finalize — simulate platform processing (800ms)
    await this.delay(800);

    // Generate mock platform post ID
    const platformPostId = this.generatePlatformPostId(upload.platform);
    const uploadDuration = (Date.now() - upload.startedAt) / 1000;

    upload.status = "done";
    upload.progress = 100;

    return {
      ok: true,
      data: {
        platformPostId,
        platform: upload.platform,
        publishedAt: new Date().toISOString(),
        uploadDuration: Math.round(uploadDuration * 10) / 10,
      },
    };
  }

  // ─── Utility methods ────────────────────────────────────────────────────

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generatePlatformPostId(platform: Platform): string {
    const id = Math.random().toString(36).slice(2, 10);
    switch (platform) {
      case "tiktok":
        return `tiktok_post_${id}`;
      case "youtube":
        return `yt_short_${id}`;
      case "instagram":
        return `ig_reel_${id}`;
    }
  }
}
