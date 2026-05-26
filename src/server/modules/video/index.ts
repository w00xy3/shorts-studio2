/**
 * Video processing module barrel export.
 */

export { VideoProcessingModule } from "./VideoProcessingModule";
export type { ProgressCallback, ProcessClipResult } from "./VideoProcessingModule";

export {
  VideoProcessingError,
  FFmpegNotFoundError,
  FFmpegFailedError,
  InvalidVideoFormatError,
  ClipProcessingCancelledError,
  ClipAlreadyProcessingError,
  SourceVideoNotFoundError,
} from "./errors";
