/**
 * Event type definitions for Shorts Studio.
 *
 * These define the "IPC event stream" contracts — events that the
 * Main process streams to the Renderer in real time via WebSocket.
 *
 * Each event has:
 * - A unique channel name (string)
 * - A strictly typed payload
 * - A direction: Main → Renderer (pushed)
 */

import type { ClipStatus, FFmpegProgressEvent, CropMode } from "./video";
import type { AccountStatus, Platform, TokenRefreshResult } from "./account";
import type { PostStatus, UploadProgressEvent, SchedulerStatus } from "./post";

// ─── Event Channel Names ─────────────────────────────────────────────────────

/**
 * All event channels that the Main process can push to the Renderer.
 *
 * Naming convention: `<domain>:<action>` — matches IPC command pattern
 * but represents one-way push events (not request-response).
 */
export const EventChannels = {
  // Video domain
  VIDEO_IMPORTED: "video:imported",
  VIDEO_IMPORT_ERROR: "video:import-error",
  VIDEO_METADATA_READY: "video:metadata-ready",

  // Clip domain
  CLIP_PROGRESS: "clip:progress",
  CLIP_COMPLETED: "clip:completed",
  CLIP_ERROR: "clip:error",
  CLIP_CANCELLED: "clip:cancelled",

  // Account domain
  ACCOUNT_CONNECTED: "account:connected",
  ACCOUNT_DISCONNECTED: "account:disconnected",
  ACCOUNT_TOKEN_REFRESHED: "account:token-refreshed",
  ACCOUNT_TOKEN_EXPIRED: "account:token-expired",
  ACCOUNT_STATUS_CHANGED: "account:status-changed",

  // Post domain
  POST_UPLOAD_PROGRESS: "post:upload-progress",
  POST_PUBLISHED: "post:published",
  POST_FAILED: "post:failed",
  POST_STATUS_CHANGED: "post:status-changed",

  // Scheduler domain
  SCHEDULER_TICK: "scheduler:tick",
  SCHEDULER_STATUS_CHANGED: "scheduler:status-changed",
  SCHEDULER_POST_DUE: "scheduler:post-due",
  SCHEDULER_MISSED_POSTS: "scheduler:missed-posts",

  // System domain
  SYSTEM_NOTIFICATION: "system:notification",
  SYSTEM_ERROR: "system:error",
} as const;

export type EventChannel = (typeof EventChannels)[keyof typeof EventChannels];

// ─── Event Payloads ──────────────────────────────────────────────────────────

/** Video successfully imported */
export interface VideoImportedEvent {
  sourceVideoId: string;
  fileName: string;
  duration: number;
}

/** Video import failed */
export interface VideoImportErrorEvent {
  filePath: string;
  error: string;
}

/** Video metadata extracted via FFprobe */
export interface VideoMetadataReadyEvent {
  sourceVideoId: string;
  width: number;
  height: number;
  duration: number;
  fps: number;
  codec: string;
}

/** Clip processing progress (streamed continuously from FFmpeg) */
export interface ClipProgressEvent {
  clipId: string;
  percent: number;
  currentTime: number;
  speed: number;
  eta: number;
  bitrate: number;
}

/** Clip processing completed successfully */
export interface ClipCompletedEvent {
  clipId: string;
  outputFilePath: string;
  cropMode: CropMode;
  outputWidth: number;
  outputHeight: number;
}

/** Clip processing failed */
export interface ClipErrorEvent {
  clipId: string;
  error: string;
  /** Whether the error is retryable */
  retryable: boolean;
}

/** Clip processing was cancelled by user */
export interface ClipCancelledEvent {
  clipId: string;
}

/** Account connected via OAuth */
export interface AccountConnectedEvent {
  accountId: string;
  platform: Platform;
  displayName: string;
}

/** Account disconnected */
export interface AccountDisconnectedEvent {
  accountId: string;
  platform: Platform;
}

/** Account token was auto-refreshed */
export interface AccountTokenRefreshedEvent {
  accountId: string;
  platform: Platform;
  newExpiresAt: Date;
}

/** Account token expired and could not be refreshed */
export interface AccountTokenExpiredEvent {
  accountId: string;
  platform: Platform;
  /** Reason for expiration */
  reason: "refresh_failed" | "no_refresh_token" | "revoked";
}

/** Account status changed */
export interface AccountStatusChangedEvent {
  accountId: string;
  platform: Platform;
  previousStatus: AccountStatus;
  newStatus: AccountStatus;
}

/** Post upload progress (chunked upload) */
export interface PostUploadProgressEvent {
  postId: string;
  percent: number;
  bytesUploaded: number;
  bytesTotal: number;
  chunkIndex: number;
  totalChunks: number;
  speed: number;
  eta: number;
}

/** Post published successfully */
export interface PostPublishedEvent {
  postId: string;
  platform: Platform;
  platformPostId: string;
  publishedAt: Date;
}

/** Post publishing failed */
export interface PostFailedEvent {
  postId: string;
  platform: Platform;
  error: string;
  /** Whether the error is retryable */
  retryable: boolean;
}

/** Post status changed */
export interface PostStatusChangedEvent {
  postId: string;
  previousStatus: PostStatus;
  newStatus: PostStatus;
}

/** Scheduler performed a tick (checked for due posts) */
export interface SchedulerTickEvent {
  timestamp: Date;
  postsChecked: number;
  postsDue: number;
  status: SchedulerStatus;
}

/** Scheduler status changed */
export interface SchedulerStatusChangedEvent {
  previousStatus: SchedulerStatus;
  newStatus: SchedulerStatus;
}

/** Scheduler found a post that is due for publishing */
export interface SchedulerPostDueEvent {
  postId: string;
  platform: Platform;
  scheduledAt: Date;
}

/** Scheduler found posts that were missed while the app was closed */
export interface SchedulerMissedPostsEvent {
  posts: Array<{
    postId: string;
    platform: Platform;
    originalScheduledAt: Date;
  }>;
}

/** System notification for OS-level alerts */
export interface SystemNotificationEvent {
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  /** Optional action the user can take */
  action?: {
    label: string;
    /** IPC command to invoke if user clicks the action */
    command: string;
    payload?: unknown;
  };
}

/** System-level error (uncaught exceptions in Main process) */
export interface SystemErrorEvent {
  error: string;
  stack?: string;
  /** Module that threw the error */
  source?: string;
}

// ─── Event Map ───────────────────────────────────────────────────────────────

/**
 * Master event map — maps every event channel to its typed payload.
 *
 * This is the single source of truth for all Main → Renderer events.
 * The Renderer subscribes using the channel name and receives the
 * correctly typed payload.
 */
export interface MainProcessEventMap {
  [EventChannels.VIDEO_IMPORTED]: VideoImportedEvent;
  [EventChannels.VIDEO_IMPORT_ERROR]: VideoImportErrorEvent;
  [EventChannels.VIDEO_METADATA_READY]: VideoMetadataReadyEvent;

  [EventChannels.CLIP_PROGRESS]: ClipProgressEvent;
  [EventChannels.CLIP_COMPLETED]: ClipCompletedEvent;
  [EventChannels.CLIP_ERROR]: ClipErrorEvent;
  [EventChannels.CLIP_CANCELLED]: ClipCancelledEvent;

  [EventChannels.ACCOUNT_CONNECTED]: AccountConnectedEvent;
  [EventChannels.ACCOUNT_DISCONNECTED]: AccountDisconnectedEvent;
  [EventChannels.ACCOUNT_TOKEN_REFRESHED]: AccountTokenRefreshedEvent;
  [EventChannels.ACCOUNT_TOKEN_EXPIRED]: AccountTokenExpiredEvent;
  [EventChannels.ACCOUNT_STATUS_CHANGED]: AccountStatusChangedEvent;

  [EventChannels.POST_UPLOAD_PROGRESS]: PostUploadProgressEvent;
  [EventChannels.POST_PUBLISHED]: PostPublishedEvent;
  [EventChannels.POST_FAILED]: PostFailedEvent;
  [EventChannels.POST_STATUS_CHANGED]: PostStatusChangedEvent;

  [EventChannels.SCHEDULER_TICK]: SchedulerTickEvent;
  [EventChannels.SCHEDULER_STATUS_CHANGED]: SchedulerStatusChangedEvent;
  [EventChannels.SCHEDULER_POST_DUE]: SchedulerPostDueEvent;
  [EventChannels.SCHEDULER_MISSED_POSTS]: SchedulerMissedPostsEvent;

  [EventChannels.SYSTEM_NOTIFICATION]: SystemNotificationEvent;
  [EventChannels.SYSTEM_ERROR]: SystemErrorEvent;
}

// ─── Event Listener Type ─────────────────────────────────────────────────────

/**
 * Type-safe event listener function.
 * Given a channel name, the payload parameter is automatically typed
 * to the corresponding event payload from MainProcessEventMap.
 */
export type EventListener<T extends EventChannel> = (
  payload: MainProcessEventMap[T]
) => void;

// ─── Generic Event Wrapper ───────────────────────────────────────────────────

/** Wire format for events sent over WebSocket */
export interface IpcEvent<T extends EventChannel = EventChannel> {
  channel: T;
  payload: MainProcessEventMap[T];
  timestamp: number;
}
