/**
 * Zod validation schemas for Shorts Studio IPC payloads.
 *
 * These schemas validate data at the IPC boundary — both on
 * the Main handler side (before processing) and on the
 * Renderer side (before invoking).
 *
 * Every IpcPayloadMap entry should have a corresponding schema here.
 */

import { z } from "zod";

// ─── Primitives ──────────────────────────────────────────────────────────────

const positiveNumber = z.number().positive();
const nonEmptyString = z.string().min(1);
const optionalString = z.string().optional();
const cuid = z.string().cuid();

// ─── Video Schemas ───────────────────────────────────────────────────────────

export const importVideoSchema = z.object({
  filePath: nonEmptyString,
  displayName: z.string().optional(),
});

export const videoGetSchema = z.object({
  videoId: cuid,
});

export const videoListSchema = z.object({
  filter: z.object({ search: z.string().optional() }).optional(),
});

export const videoDeleteSchema = z.object({
  videoId: cuid,
  deleteFiles: z.boolean().optional(),
});

export const videoAnalyzeSchema = z.object({
  filePath: nonEmptyString,
});

// ─── Clip Schemas ────────────────────────────────────────────────────────────

export const cropModeSchema = z.enum(["center", "blur"]);

export const createClipSchema = z.object({
  sourceVideoId: cuid,
  title: nonEmptyString,
  startTime: z.number().min(0),
  endTime: z.number().min(0),
  cropMode: cropModeSchema,
  blurStrength: z.number().min(0).max(40).optional(),
  outputWidth: z.number().int().min(360).max(4096).optional(),
  outputHeight: z.number().int().min(640).max(4096).optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: "endTime must be greater than startTime",
  path: ["endTime"],
});

export const updateClipSchema = z.object({
  clipId: cuid,
  title: z.string().optional(),
  startTime: z.number().min(0).optional(),
  endTime: z.number().min(0).optional(),
  cropMode: cropModeSchema.optional(),
  blurStrength: z.number().min(0).max(40).optional(),
}).refine(
  (data) => {
    if (data.startTime !== undefined && data.endTime !== undefined) {
      return data.endTime > data.startTime;
    }
    return true;
  },
  { message: "endTime must be greater than startTime", path: ["endTime"] }
);

export const processClipSchema = z.object({
  clipId: cuid,
  force: z.boolean().optional(),
});

export const cancelClipSchema = z.object({
  clipId: cuid,
});

// ─── Account Schemas ─────────────────────────────────────────────────────────

export const platformSchema = z.enum(["tiktok", "youtube", "instagram"]);

export const connectAccountSchema = z.object({
  platform: platformSchema,
});

export const disconnectAccountSchema = z.object({
  accountId: cuid,
  revokeToken: z.boolean().optional(),
});

export const refreshTokenSchema = z.object({
  accountId: cuid,
});

export const validateTokenSchema = z.object({
  accountId: cuid,
});

export const oauthCallbackSchema = z.object({
  platform: platformSchema,
  code: nonEmptyString,
  state: nonEmptyString,
});

// ─── Post Schemas ────────────────────────────────────────────────────────────

export const postStatusSchema = z.enum([
  "draft", "scheduled", "uploading", "published", "failed",
]);

export const createPostSchema = z.object({
  clipId: cuid,
  accountId: cuid,
  description: z.string().max(2200).optional(),
  tags: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const updatePostSchema = z.object({
  postId: cuid,
  description: z.string().max(2200).optional(),
  tags: z.string().optional(),
  coverImageUrl: z.string().url().optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional().nullable(),
});

export const publishPostSchema = z.object({
  postId: cuid,
});

export const cancelPostSchema = z.object({
  postId: cuid,
});

export const retryPostSchema = z.object({
  postId: cuid,
});

// ─── Scheduler Schemas ───────────────────────────────────────────────────────

export const schedulerControlSchema = z.object({
  action: z.enum(["pause", "resume", "stop"]),
});

// ─── System Schemas ──────────────────────────────────────────────────────────

export const openExternalSchema = z.object({
  url: z.string().url(),
});

export const selectFileSchema = z.object({
  filters: z.array(z.object({
    name: z.string(),
    extensions: z.array(z.string()),
  })).optional(),
});
