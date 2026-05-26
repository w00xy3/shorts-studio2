/**
 * Shared type barrel export.
 *
 * Both Main (server) and Renderer (client) import from this single location.
 * No runtime code here — only TypeScript types, interfaces, and const enums.
 */

// Domain types
export type { SourceVideo, VideoMetadata, VideoCodec, AudioCodec } from "./video";
export type { Clip, ClipStatus, CropMode } from "./video";
export type {
  ImportVideoPayload,
  CreateClipPayload,
  UpdateClipPayload,
  ProcessClipPayload,
  CancelClipPayload,
  FFmpegOptions,
  FFmpegProgressEvent,
} from "./video";

export type { Account, AccountStatus, Platform } from "./account";
export type {
  OAuthState,
  OAuthTokenResponse,
  SecureTokenData,
  TokenValidation,
  TokenRefreshResult,
  ConnectAccountPayload,
  DisconnectAccountPayload,
  RefreshTokenPayload,
  AccountListFilter,
  PlatformInfo as PlatformInfoType,
} from "./account";
export { PLATFORM_SCOPES } from "./account";

export type { Post, PostStatus, SchedulerStatus } from "./post";
export type {
  CreatePostPayload,
  UpdatePostPayload,
  PublishPostPayload,
  CancelPostPayload,
  RetryPostPayload,
  SchedulerState,
  SchedulerControlPayload,
  UploadProgressEvent,
  ChunkUploadResult,
  PostQueueItem,
  PostListFilter,
  PostListSort,
} from "./post";

// IPC contracts
export type {
  IpcResult,
  IpcError,
  IpcErrorCode,
  IpcChannel,
  IpcPayloadMap,
  IpcResponseMap,
  IpcInvoke,
  IpcOn,
  AppConfig,
  PlatformInfo,
} from "./ipc";
export { IpcChannels } from "./ipc";

// Events
export type {
  EventChannel,
  EventListener,
  IpcEvent,
  MainProcessEventMap,
  VideoImportedEvent,
  VideoImportErrorEvent,
  VideoMetadataReadyEvent,
  ClipProgressEvent,
  ClipCompletedEvent,
  ClipErrorEvent,
  ClipCancelledEvent,
  AccountConnectedEvent,
  AccountDisconnectedEvent,
  AccountTokenRefreshedEvent,
  AccountTokenExpiredEvent,
  AccountStatusChangedEvent,
  PostUploadProgressEvent,
  PostPublishedEvent,
  PostFailedEvent,
  PostStatusChangedEvent,
  SchedulerTickEvent,
  SchedulerStatusChangedEvent,
  SchedulerPostDueEvent,
  SchedulerMissedPostsEvent,
  SystemNotificationEvent,
  SystemErrorEvent,
} from "./events";
export { EventChannels } from "./events";
