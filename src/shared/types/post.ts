/**
 * Post & scheduling type definitions for Shorts Studio.
 *
 * Covers post creation, scheduling, publishing status,
 * and chunked upload progress tracking.
 */

import type { Platform } from "./account";

// ─── Post Status ─────────────────────────────────────────────────────────────

/** Lifecycle states of a post */
export type PostStatus =
  | "draft"      // Created but not scheduled
  | "scheduled"  // Scheduled for future publishing
  | "uploading"  // Currently uploading to platform
  | "published"  // Successfully published
  | "failed";    // Publishing failed

// ─── Post ────────────────────────────────────────────────────────────────────

/** A post entity — links a clip to an account with metadata */
export interface Post {
  id: string;
  clipId: string;
  accountId: string;
  description: string;
  /** Comma-separated hashtags */
  tags: string;
  coverImageUrl: string | null;
  status: PostStatus;
  /** When to publish (null = immediate) */
  scheduledAt: Date | null;
  /** When the post was actually published */
  publishedAt: Date | null;
  /** Platform-assigned post ID after successful publish */
  platformPostId: string | null;
  errorMessage: string | null;
  /** Upload progress 0–100 during chunked upload */
  uploadProgress: number;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Post Payloads ───────────────────────────────────────────────────────────

/** Payload for creating a new post */
export interface CreatePostPayload {
  clipId: string;
  accountId: string;
  description?: string;
  tags?: string;
  coverImageUrl?: string;
  /** ISO datetime string for scheduled publishing, null for draft */
  scheduledAt?: string | null;
}

/** Payload for updating post metadata */
export interface UpdatePostPayload {
  postId: string;
  description?: string;
  tags?: string;
  coverImageUrl?: string;
  scheduledAt?: string | null;
}

/** Payload for immediately publishing a post */
export interface PublishPostPayload {
  postId: string;
}

/** Payload for cancelling a scheduled post */
export interface CancelPostPayload {
  postId: string;
}

/** Payload for retrying a failed post */
export interface RetryPostPayload {
  postId: string;
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

/** Scheduler worker status */
export type SchedulerStatus = "running" | "paused" | "stopped";

/** A summary of the current scheduler state */
export interface SchedulerState {
  status: SchedulerStatus;
  /** Number of posts currently in the queue */
  queueLength: number;
  /** Timestamp of the next scheduled post (null if queue empty) */
  nextScheduledAt: Date | null;
  /** Timestamp of the last scheduler tick */
  lastTickAt: Date | null;
  /** Number of posts published in this session */
  publishedCount: number;
  /** Number of posts that failed in this session */
  failedCount: number;
}

/** Payload for controlling the scheduler */
export interface SchedulerControlPayload {
  action: "pause" | "resume" | "stop";
}

// ─── Chunked Upload ──────────────────────────────────────────────────────────

/** Upload progress event for a post */
export interface UploadProgressEvent {
  postId: string;
  /** Percentage of file uploaded 0–100 */
  percent: number;
  /** Bytes uploaded so far */
  bytesUploaded: number;
  /** Total bytes to upload */
  bytesTotal: number;
  /** Current chunk number */
  chunkIndex: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Upload speed in bytes/second */
  speed: number;
  /** Estimated remaining time in seconds */
  eta: number;
}

/** Chunk upload result from a platform API */
export interface ChunkUploadResult {
  platform: Platform;
  postId: string;
  success: boolean;
  /** Platform-assigned video ID or upload session ID */
  platformVideoId?: string;
  error?: string;
}

// ─── Post Queue ──────────────────────────────────────────────────────────────

/** A post as it appears in the scheduling queue, with resolved relations */
export interface PostQueueItem {
  post: Post;
  platform: Platform;
  clipTitle: string;
  accountDisplayName: string;
}

/** Filter parameters for listing posts */
export interface PostListFilter {
  status?: PostStatus;
  platform?: Platform;
  accountId?: string;
  scheduledAfter?: string;
  scheduledBefore?: string;
}

/** Sort parameters for listing posts */
export interface PostListSort {
  field: "scheduledAt" | "createdAt" | "updatedAt";
  direction: "asc" | "desc";
}
