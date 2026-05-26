/**
 * PostingModule barrel export.
 */

export { PostingModule } from "./PostingModule";
export type {
  UploadProgressCallback,
  UploadVideoResult,
  UploadMetadata,
} from "./PostingModule";

export {
  PostingError,
  UploadFailedError,
  UploadChunkFailedError,
  PlatformApiError,
  PlatformRateLimitedError,
  InvalidPostStateError,
  VideoFileNotFoundError,
} from "./errors";
