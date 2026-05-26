/**
 * Platform configuration constants for Shorts Studio.
 *
 * Defines per-platform limits, OAuth endpoints, and display metadata.
 */

import type { Platform, PlatformInfo } from "../types/account";

/** Per-platform display & technical metadata */
export const PLATFORMS: Record<Platform, PlatformInfo> = {
  tiktok: {
    id: "tiktok",
    label: "TikTok",
    color: "#000000",
    icon: "tiktok",
    scopes: ["video.publish", "video.list"],
    maxDuration: 180,       // 3 minutes
    maxFileSize: 4 * 1024 * 1024 * 1024, // 4 GB
    supportedMimeTypes: ["video/mp4", "video/quicktime", "video/webm"],
  },
  youtube: {
    id: "youtube",
    label: "YouTube Shorts",
    color: "#FF0000",
    icon: "youtube",
    scopes: [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube.readonly",
    ],
    maxDuration: 60,        // 60 seconds for Shorts
    maxFileSize: 256 * 1024 * 1024 * 1024, // 256 GB
    supportedMimeTypes: ["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"],
  },
  instagram: {
    id: "instagram",
    label: "Instagram Reels",
    color: "#E4405F",
    icon: "instagram",
    scopes: [
      "instagram_basic",
      "instagram_content_publish",
      "pages_read_engagement",
    ],
    maxDuration: 90,        // 90 seconds for Reels
    maxFileSize: 4 * 1024 * 1024 * 1024, // 4 GB
    supportedMimeTypes: ["video/mp4"],
  },
};

/** Default output resolution for short-form vertical video */
export const DEFAULT_OUTPUT_WIDTH = 1080;
export const DEFAULT_OUTPUT_HEIGHT = 1920;

/** Default FFmpeg settings */
export const DEFAULT_CRF = 23;
export const DEFAULT_PRESET = "medium";
export const DEFAULT_BLUR_STRENGTH = 20;
export const DEFAULT_CROP_MODE: "center" | "blur" = "blur";

/** Scheduler check interval in seconds */
export const SCHEDULER_INTERVAL_SEC = 60;

/** Maximum concurrent processing jobs */
export const MAX_CONCURRENT_JOBS = 2;

/** OAuth redirect port (local server for callback) */
export const OAUTH_REDIRECT_PORT = 9876;
export const OAUTH_REDIRECT_HOST = "http://localhost";

/** Application identifier for keytar service name */
export const KEYTAR_SERVICE_NAME = "ShortsStudio";

/** Supported input aspect ratios (width/height) */
export const INPUT_ASPECT_RATIOS = {
  "16:9": 16 / 9,
  "16:10": 16 / 10,
  "4:3": 4 / 3,
  "21:9": 21 / 9,
} as const;

/** Target aspect ratio for output */
export const OUTPUT_ASPECT_RATIO = 9 / 16;
