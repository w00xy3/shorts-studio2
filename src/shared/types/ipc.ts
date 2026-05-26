/**
 * IPC Channel Definitions & Contracts for Shorts Studio.
 *
 * This file defines EVERY command the Renderer can send to the Main process
 * and EVERY response the Main process returns. This is the single source of
 * truth for inter-process communication — both sides import from here.
 *
 * Pattern: ipcMain.handle(channel, handler)  →  ipcRenderer.invoke(channel, payload)
 * Every channel has:
 *   - A string channel name (const)
 *   - A typed request payload
 *   - A typed response (success | error)
 */

import type {
  SourceVideo,
  ImportVideoPayload,
  Clip,
  CreateClipPayload,
  UpdateClipPayload,
  ProcessClipPayload,
  CancelClipPayload,
  FFmpegOptions,
  VideoMetadata,
} from "./video";

import type {
  Account,
  ConnectAccountPayload,
  DisconnectAccountPayload,
  RefreshTokenPayload,
  TokenRefreshResult,
  AccountListFilter,
  OAuthState,
  Platform,
} from "./account";

import type {
  Post,
  CreatePostPayload,
  UpdatePostPayload,
  PublishPostPayload,
  CancelPostPayload,
  RetryPostPayload,
  SchedulerState,
  SchedulerControlPayload,
  PostQueueItem,
  PostListFilter,
  PostListSort,
} from "./post";

// ─── Result Wrapper ──────────────────────────────────────────────────────────

/**
 * Standardized result type for all IPC commands.
 * Every handler returns either a success value or a structured error.
 * This eliminates unhandled promise rejections on the Renderer side.
 */
export type IpcResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: IpcError };

/** Structured error returned by all IPC handlers */
export interface IpcError {
  /** Machine-readable error code */
  code: IpcErrorCode;
  /** Human-readable message */
  message: string;
  /** Additional context (e.g. FFmpeg stderr output) */
  details?: string;
  /** Whether the operation can be retried */
  retryable: boolean;
}

/** Machine-readable error codes across all modules */
export type IpcErrorCode =
  // General
  | "UNKNOWN_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "TIMEOUT"
  // Video processing
  | "FFMPEG_NOT_FOUND"
  | "FFMPEG_FAILED"
  | "INVALID_VIDEO_FORMAT"
  | "CLIP_PROCESSING_CANCELLED"
  | "CLIP_ALREADY_PROCESSING"
  // Account / Auth
  | "OAUTH_FAILED"
  | "TOKEN_EXPIRED"
  | "TOKEN_REFRESH_FAILED"
  | "TOKEN_REVOKED"
  | "ACCOUNT_NOT_CONNECTED"
  // Posting
  | "UPLOAD_FAILED"
  | "UPLOAD_CHUNK_FAILED"
  | "PLATFORM_API_ERROR"
  | "PLATFORM_RATE_LIMITED"
  | "INVALID_POST_STATE"
  // Scheduler
  | "SCHEDULER_NOT_RUNNING"
  | "SCHEDULER_ALREADY_RUNNING";

// ─── Channel Registry ────────────────────────────────────────────────────────

/**
 * All IPC channel names — the Renderer invokes these, the Main handles them.
 *
 * Naming convention: `<domain>:<action>`
 * Domain order: video → clip → account → post → scheduler → system
 */
export const IpcChannels = {
  // ── Video ───────────────────────────────────────────────────────
  VIDEO_IMPORT: "video:import",
  VIDEO_GET: "video:get",
  VIDEO_LIST: "video:list",
  VIDEO_DELETE: "video:delete",
  VIDEO_ANALYZE: "video:analyze",

  // ── Clip ────────────────────────────────────────────────────────
  CLIP_CREATE: "clip:create",
  CLIP_GET: "clip:get",
  CLIP_LIST: "clip:list",
  CLIP_UPDATE: "clip:update",
  CLIP_DELETE: "clip:delete",
  CLIP_PROCESS: "clip:process",
  CLIP_CANCEL: "clip:cancel",
  CLIP_GET_FFMPEG_OPTIONS: "clip:get-ffmpeg-options",

  // ── Account ─────────────────────────────────────────────────────
  ACCOUNT_CONNECT: "account:connect",
  ACCOUNT_DISCONNECT: "account:disconnect",
  ACCOUNT_LIST: "account:list",
  ACCOUNT_GET: "account:get",
  ACCOUNT_REFRESH_TOKEN: "account:refresh-token",
  ACCOUNT_VALIDATE_TOKEN: "account:validate-token",
  ACCOUNT_OAUTH_CALLBACK: "account:oauth-callback",

  // ── Post ────────────────────────────────────────────────────────
  POST_CREATE: "post:create",
  POST_GET: "post:get",
  POST_LIST: "post:list",
  POST_UPDATE: "post:update",
  POST_DELETE: "post:delete",
  POST_PUBLISH: "post:publish",
  POST_CANCEL: "post:cancel",
  POST_RETRY: "post:retry",
  POST_QUEUE: "post:queue",

  // ── Scheduler ───────────────────────────────────────────────────
  SCHEDULER_GET_STATE: "scheduler:get-state",
  SCHEDULER_CONTROL: "scheduler:control",
  SCHEDULER_GET_MISSED: "scheduler:get-missed",

  // ── System ──────────────────────────────────────────────────────
  SYSTEM_GET_CONFIG: "system:get-config",
  SYSTEM_GET_FFMPEG_PATH: "system:get-ffmpeg-path",
  SYSTEM_OPEN_EXTERNAL: "system:open-external",
  SYSTEM_SELECT_FILE: "system:select-file",
  SYSTEM_GET_PLATFORM_INFO: "system:get-platform-info",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];

// ─── Command → Payload & Response Maps ───────────────────────────────────────

/**
 * Maps every IPC channel to its request payload type.
 * `void` means the command takes no parameters.
 */
export interface IpcPayloadMap {
  // Video
  [IpcChannels.VIDEO_IMPORT]: ImportVideoPayload;
  [IpcChannels.VIDEO_GET]: { videoId: string };
  [IpcChannels.VIDEO_LIST]: { filter?: { search?: string } };
  [IpcChannels.VIDEO_DELETE]: { videoId: string; deleteFiles?: boolean };
  [IpcChannels.VIDEO_ANALYZE]: { filePath: string };

  // Clip
  [IpcChannels.CLIP_CREATE]: CreateClipPayload;
  [IpcChannels.CLIP_GET]: { clipId: string };
  [IpcChannels.CLIP_LIST]: { sourceVideoId?: string; status?: string };
  [IpcChannels.CLIP_UPDATE]: UpdateClipPayload;
  [IpcChannels.CLIP_DELETE]: { clipId: string; deleteFile?: boolean };
  [IpcChannels.CLIP_PROCESS]: ProcessClipPayload;
  [IpcChannels.CLIP_CANCEL]: CancelClipPayload;
  [IpcChannels.CLIP_GET_FFMPEG_OPTIONS]: { clipId: string };

  // Account
  [IpcChannels.ACCOUNT_CONNECT]: ConnectAccountPayload;
  [IpcChannels.ACCOUNT_DISCONNECT]: DisconnectAccountPayload;
  [IpcChannels.ACCOUNT_LIST]: { filter?: AccountListFilter };
  [IpcChannels.ACCOUNT_GET]: { accountId: string };
  [IpcChannels.ACCOUNT_REFRESH_TOKEN]: RefreshTokenPayload;
  [IpcChannels.ACCOUNT_VALIDATE_TOKEN]: { accountId: string };
  [IpcChannels.ACCOUNT_OAUTH_CALLBACK]: { platform: Platform; code: string; state: string };

  // Post
  [IpcChannels.POST_CREATE]: CreatePostPayload;
  [IpcChannels.POST_GET]: { postId: string };
  [IpcChannels.POST_LIST]: { filter?: PostListFilter; sort?: PostListSort };
  [IpcChannels.POST_UPDATE]: UpdatePostPayload;
  [IpcChannels.POST_DELETE]: { postId: string };
  [IpcChannels.POST_PUBLISH]: PublishPostPayload;
  [IpcChannels.POST_CANCEL]: CancelPostPayload;
  [IpcChannels.POST_RETRY]: RetryPostPayload;
  [IpcChannels.POST_QUEUE]: { limit?: number };

  // Scheduler
  [IpcChannels.SCHEDULER_GET_STATE]: void;
  [IpcChannels.SCHEDULER_CONTROL]: SchedulerControlPayload;
  [IpcChannels.SCHEDULER_GET_MISSED]: void;

  // System
  [IpcChannels.SYSTEM_GET_CONFIG]: void;
  [IpcChannels.SYSTEM_GET_FFMPEG_PATH]: void;
  [IpcChannels.SYSTEM_OPEN_EXTERNAL]: { url: string };
  [IpcChannels.SYSTEM_SELECT_FILE]: { filters?: Array<{ name: string; extensions: string[] }> };
  [IpcChannels.SYSTEM_GET_PLATFORM_INFO]: void;
}

/**
 * Maps every IPC channel to its success response type.
 * All responses are wrapped in IpcResult<T>, so the actual
 * Renderer receives IpcResult<ResponseData>.
 */
export interface IpcResponseMap {
  // Video
  [IpcChannels.VIDEO_IMPORT]: SourceVideo;
  [IpcChannels.VIDEO_GET]: SourceVideo;
  [IpcChannels.VIDEO_LIST]: SourceVideo[];
  [IpcChannels.VIDEO_DELETE]: { deleted: boolean };
  [IpcChannels.VIDEO_ANALYZE]: VideoMetadata;

  // Clip
  [IpcChannels.CLIP_CREATE]: Clip;
  [IpcChannels.CLIP_GET]: Clip;
  [IpcChannels.CLIP_LIST]: Clip[];
  [IpcChannels.CLIP_UPDATE]: Clip;
  [IpcChannels.CLIP_DELETE]: { deleted: boolean };
  [IpcChannels.CLIP_PROCESS]: { started: boolean; clipId: string };
  [IpcChannels.CLIP_CANCEL]: { cancelled: boolean };
  [IpcChannels.CLIP_GET_FFMPEG_OPTIONS]: FFmpegOptions;

  // Account
  [IpcChannels.ACCOUNT_CONNECT]: { oauthUrl: string; state: OAuthState };
  [IpcChannels.ACCOUNT_DISCONNECT]: { disconnected: boolean };
  [IpcChannels.ACCOUNT_LIST]: Account[];
  [IpcChannels.ACCOUNT_GET]: Account;
  [IpcChannels.ACCOUNT_REFRESH_TOKEN]: TokenRefreshResult;
  [IpcChannels.ACCOUNT_VALIDATE_TOKEN]: { isValid: boolean; needsRefresh: boolean; expiresIn: number };
  [IpcChannels.ACCOUNT_OAUTH_CALLBACK]: Account;

  // Post
  [IpcChannels.POST_CREATE]: Post;
  [IpcChannels.POST_GET]: Post;
  [IpcChannels.POST_LIST]: Post[];
  [IpcChannels.POST_UPDATE]: Post;
  [IpcChannels.POST_DELETE]: { deleted: boolean };
  [IpcChannels.POST_PUBLISH]: { started: boolean; postId: string };
  [IpcChannels.POST_CANCEL]: { cancelled: boolean };
  [IpcChannels.POST_RETRY]: { started: boolean; postId: string };
  [IpcChannels.POST_QUEUE]: PostQueueItem[];

  // Scheduler
  [IpcChannels.SCHEDULER_GET_STATE]: SchedulerState;
  [IpcChannels.SCHEDULER_CONTROL]: { success: boolean };
  [IpcChannels.SCHEDULER_GET_MISSED]: PostQueueItem[];

  // System
  [IpcChannels.SYSTEM_GET_CONFIG]: AppConfig;
  [IpcChannels.SYSTEM_GET_FFMPEG_PATH]: { path: string | null };
  [IpcChannels.SYSTEM_OPEN_EXTERNAL]: { opened: boolean };
  [IpcChannels.SYSTEM_SELECT_FILE]: { filePaths: string[] };
  [IpcChannels.SYSTEM_GET_PLATFORM_INFO]: PlatformInfo;
}

// ─── System Types ────────────────────────────────────────────────────────────

/** Application configuration */
export interface AppConfig {
  /** Path to FFmpeg binary (auto-detected or user-specified) */
  ffmpegPath: string;
  /** Path to FFprobe binary */
  ffprobePath: string;
  /** Default output directory for rendered clips */
  outputDir: string;
  /** Default crop mode for new clips */
  defaultCropMode: "center" | "blur";
  /** Default blur strength (0–40) */
  defaultBlurStrength: number;
  /** Default CRF quality value */
  defaultCrf: number;
  /** Default encoding preset */
  defaultPreset: string;
  /** Scheduler check interval in seconds */
  schedulerInterval: number;
  /** Whether to show system tray notifications */
  notificationsEnabled: boolean;
  /** Whether to minimize to tray on close */
  minimizeToTray: boolean;
  /** Maximum concurrent processing jobs */
  maxConcurrentJobs: number;
}

/** Platform / environment information */
export interface PlatformInfo {
  os: "windows" | "macos" | "linux";
  arch: "x64" | "arm64";
  electronVersion: string;
  chromeVersion: string;
  nodeVersion: string;
}

// ─── Type-safe IPC Invoke ────────────────────────────────────────────────────

/**
 * Type-safe IPC invoke function signature.
 *
 * Usage in Renderer:
 *   const result = await ipcInvoke('clip:process', { clipId: 'abc', force: false });
 *   // result is IpcResult<{ started: boolean; clipId: string }>
 *
 * If result.ok === true, result.data is typed.
 * If result.ok === false, result.error is IpcError.
 */
export type IpcInvoke = <T extends IpcChannel>(
  channel: T,
  payload: IpcPayloadMap[T]
) => Promise<IpcResult<IpcResponseMap[T]>>;

// ─── Type-safe Event Subscribe ───────────────────────────────────────────────

/**
 * Type-safe event subscription function signature.
 *
 * Usage in Renderer:
 *   const unsubscribe = ipcOn('clip:progress', (payload) => {
 *     // payload is automatically typed as ClipProgressEvent
 *     console.log(payload.percent);
 *   });
 */
export type IpcOn = <T extends import("./events").EventChannel>(
  channel: T,
  listener: import("./events").EventListener<T>
) => () => void; // returns unsubscribe function
