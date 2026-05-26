/**
 * API Route: GET /api/scheduler & POST /api/scheduler
 *
 * Simple CRUD API for scheduler state and post queue.
 * All timing/simulation is driven by the client (UI polls every 1s).
 * No server-side timers are used to avoid Next.js hot reload crashes.
 */

import { NextRequest, NextResponse } from "next/server";
import type { IpcResult, IpcError } from "@/shared/types/ipc";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SchedulerStateResponse {
  status: "running" | "paused" | "stopped";
  queueLength: number;
  nextScheduledAt: string | null;
  lastTickAt: string | null;
  publishedCount: number;
  failedCount: number;
  intervalSeconds: number;
  activeUploads: number;
}

interface TickLogEntry {
  id: string;
  timestamp: string;
  postsChecked: number;
  postsDue: number;
  status: string;
  processedPostIds: string[];
}

interface TransitionLogEntry {
  id: string;
  postId: string;
  platform: string;
  previousStatus: string;
  newStatus: string;
  timestamp: string;
  error?: string;
}

interface PostInQueue {
  id: string;
  clipTitle: string;
  platform: "tiktok" | "youtube" | "instagram";
  accountDisplayName: string;
  status: "draft" | "scheduled" | "uploading" | "published" | "failed";
  scheduledAt: string | null;
  uploadProgress: number;
  errorMessage: string | null;
  platformPostId: string | null;
}

// ─── Global scheduler state ──────────────────────────────────────────────────

const globalForScheduler = globalThis as unknown as {
  __shortsStudioScheduler: {
    state: SchedulerStateResponse;
    tickLog: TickLogEntry[];
    transitionLog: TransitionLogEntry[];
    postQueue: PostInQueue[];
  } | undefined;
};

const scheduler = globalForScheduler.__shortsStudioScheduler ?? {
  state: {
    status: "running",
    queueLength: 3,
    nextScheduledAt: "2026-05-21T10:00:00Z",
    lastTickAt: new Date().toISOString(),
    publishedCount: 2,
    failedCount: 1,
    intervalSeconds: 60,
    activeUploads: 0,
  } satisfies SchedulerStateResponse,
  tickLog: [] as TickLogEntry[],
  transitionLog: [] as TransitionLogEntry[],
  postQueue: [
    { id: "post_001", clipTitle: "Interview Highlight — Key Quote", platform: "tiktok" as const, accountDisplayName: "@CreativeStudio", status: "published" as const, scheduledAt: "2026-05-20T12:00:00Z", uploadProgress: 100, errorMessage: null, platformPostId: "tiktok_post_72819" },
    { id: "post_002", clipTitle: "Interview Highlight — Key Quote", platform: "youtube" as const, accountDisplayName: "Tech Reviews HD", status: "published" as const, scheduledAt: "2026-05-20T12:00:00Z", uploadProgress: 100, errorMessage: null, platformPostId: "yt_short_xyz789" },
    { id: "post_003", clipTitle: "Funny Reaction Moment", platform: "instagram" as const, accountDisplayName: "@TravelVibes.official", status: "failed" as const, scheduledAt: "2026-05-20T14:00:00Z", uploadProgress: 0, errorMessage: "Token expired — account needs re-authorization", platformPostId: null },
    { id: "post_004", clipTitle: "Tutorial Step 1 — Setup", platform: "tiktok" as const, accountDisplayName: "@CreativeStudio", status: "scheduled" as const, scheduledAt: "2026-05-21T10:00:00Z", uploadProgress: 0, errorMessage: null, platformPostId: null },
    { id: "post_005", clipTitle: "Tutorial Step 1 — Setup", platform: "youtube" as const, accountDisplayName: "Tech Reviews HD", status: "scheduled" as const, scheduledAt: "2026-05-21T10:30:00Z", uploadProgress: 0, errorMessage: null, platformPostId: null },
    { id: "post_006", clipTitle: "Travel Vlog — Sunset Scene", platform: "tiktok" as const, accountDisplayName: "@CreativeStudio", status: "scheduled" as const, scheduledAt: "2026-05-22T18:00:00Z", uploadProgress: 0, errorMessage: null, platformPostId: null },
    { id: "post_007", clipTitle: "Street Food Review — Best Tacos", platform: "youtube" as const, accountDisplayName: "Tech Reviews HD", status: "draft" as const, scheduledAt: null, uploadProgress: 0, errorMessage: null, platformPostId: null },
  ] as PostInQueue[],
};

if (!globalForScheduler.__shortsStudioScheduler) {
  globalForScheduler.__shortsStudioScheduler = scheduler;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function logTransition(
  postId: string,
  platform: string,
  previousStatus: string,
  newStatus: string,
  error?: string,
) {
  const transition: TransitionLogEntry = {
    id: `trans_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    postId,
    platform,
    previousStatus,
    newStatus,
    timestamp: new Date().toISOString(),
    error,
  };

  scheduler.transitionLog.unshift(transition);
  if (scheduler.transitionLog.length > 100) scheduler.transitionLog = scheduler.transitionLog.slice(0, 100);
}

function generatePlatformPostId(platform: string): string {
  const id = Math.random().toString(36).slice(2, 10);
  switch (platform) {
    case "tiktok": return `tiktok_post_${id}`;
    case "youtube": return `yt_short_${id}`;
    case "instagram": return `ig_reel_${id}`;
    default: return `post_${id}`;
  }
}

// ─── GET handler ─────────────────────────────────────────────────────────────

export async function GET() {
  // Update counts
  scheduler.state.queueLength = scheduler.postQueue.filter((p) => p.status === "scheduled").length;
  scheduler.state.activeUploads = scheduler.postQueue.filter((p) => p.status === "uploading").length;

  const nextScheduled = scheduler.postQueue
    .filter((p) => p.status === "scheduled" && p.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())[0];
  scheduler.state.nextScheduledAt = nextScheduled?.scheduledAt ?? null;
  scheduler.state.lastTickAt = new Date().toISOString();

  const result = {
    ok: true as const,
    data: {
      state: scheduler.state,
      tickLog: scheduler.tickLog.slice(0, 10),
      transitionLog: scheduler.transitionLog.slice(0, 20),
      postQueue: scheduler.postQueue,
    },
  };

  return NextResponse.json(result);
}

// ─── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle publish now — mark post as uploading
    if (body.publishNow && body.postId) {
      const post = scheduler.postQueue.find((p) => p.id === body.postId);
      if (!post) {
        const error: IpcError = { code: "NOT_FOUND", message: `Post not found: ${body.postId}`, retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 404 });
      }
      if (post.status === "uploading") {
        const error: IpcError = { code: "INVALID_POST_STATE", message: `Post ${body.postId} is already uploading`, retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 409 });
      }
      if (post.status === "published") {
        const error: IpcError = { code: "INVALID_POST_STATE", message: `Post ${body.postId} is already published`, retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 409 });
      }

      const prevStatus = post.status;
      post.status = "uploading";
      post.uploadProgress = 0;
      post.errorMessage = null;
      logTransition(post.id, post.platform, prevStatus, "uploading");

      return NextResponse.json({ ok: true as const, data: { success: true, action: "publishNow", postId: body.postId } });
    }

    // Handle retry — mark failed post as uploading
    if (body.retry && body.postId) {
      const post = scheduler.postQueue.find((p) => p.id === body.postId);
      if (!post) {
        const error: IpcError = { code: "NOT_FOUND", message: `Post not found: ${body.postId}`, retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 404 });
      }
      if (post.status !== "failed") {
        const error: IpcError = { code: "INVALID_POST_STATE", message: `Can only retry failed posts. Current status: ${post.status}`, retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 400 });
      }

      post.status = "uploading";
      post.uploadProgress = 0;
      post.errorMessage = null;
      logTransition(post.id, post.platform, "failed", "uploading");

      return NextResponse.json({ ok: true as const, data: { success: true, action: "retry", postId: body.postId } });
    }

    // Handle upload progress update (client drives the simulation)
    if (body.updateUpload && body.postId) {
      const post = scheduler.postQueue.find((p) => p.id === body.postId);
      if (!post) {
        return NextResponse.json({ ok: false, error: { code: "NOT_FOUND", message: `Post not found`, retryable: false } } satisfies IpcResult<never>, { status: 404 });
      }

      if (body.uploadProgress !== undefined) {
        post.uploadProgress = body.uploadProgress;
      }

      // Check for completion
      if (body.uploadStatus === "published") {
        post.status = "published";
        post.uploadProgress = 100;
        post.platformPostId = body.platformPostId || generatePlatformPostId(post.platform);
        post.errorMessage = null;
        scheduler.state.publishedCount++;
        logTransition(post.id, post.platform, "uploading", "published");
      } else if (body.uploadStatus === "failed") {
        post.status = "failed";
        post.errorMessage = body.errorMessage || "Upload failed";
        scheduler.state.failedCount++;
        logTransition(post.id, post.platform, "uploading", "failed", post.errorMessage ?? undefined);
      }

      return NextResponse.json({ ok: true as const, data: { success: true, action: "updateUpload", postId: body.postId } });
    }

    // Handle scheduler control
    const { action, intervalSeconds } = body as {
      action?: "start" | "pause" | "resume" | "stop";
      intervalSeconds?: number;
    };

    if (action) {
      if (!["start", "pause", "resume", "stop"].includes(action)) {
        const error: IpcError = { code: "VALIDATION_ERROR", message: "Invalid action", retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 400 });
      }

      if (action === "start" || action === "resume") {
        scheduler.state.status = "running";
      } else if (action === "pause") {
        scheduler.state.status = "paused";
      } else if (action === "stop") {
        scheduler.state.status = "stopped";
      }
    }

    if (intervalSeconds !== undefined) {
      if (intervalSeconds < 10 || intervalSeconds > 3600) {
        const error: IpcError = { code: "VALIDATION_ERROR", message: "Interval must be between 10 and 3600 seconds", retryable: false };
        return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 400 });
      }
      scheduler.state.intervalSeconds = intervalSeconds;
    }

    return NextResponse.json({ ok: true as const, data: { success: true, state: scheduler.state } });
  } catch {
    const errorResult: IpcResult<never> = {
      ok: false,
      error: { code: "UNKNOWN_ERROR", message: "Failed to control scheduler", retryable: true },
    };
    return NextResponse.json(errorResult, { status: 500 });
  }
}
