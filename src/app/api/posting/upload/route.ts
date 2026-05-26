/**
 * API Route: GET /api/posting/progress
 *
 * Polls the progress of an active upload job.
 *
 * Query params:
 * uploadId — upload job ID (returned from POST /api/posting/upload)
 * postId   — alternatively, find by post ID
 *
 * Response:
 * IpcResult<UploadProgressData>
 */

import { NextRequest, NextResponse } from "next/server";
import type { IpcResult, IpcError } from "@/shared/types/ipc";

// ИСПРАВЛЕНО: Теперь берем uploadJobs из нашего отдельного файла
import { uploadJobs } from "@/lib/jobStore";

export const dynamic = "force-dynamic";

interface UploadProgressData {
  uploadId: string;
  postId: string;
  platform: string;
  status: "uploading" | "done" | "error" | "cancelled";
  progress: number;
  currentChunk: number;
  totalChunks: number;
  bytesUploaded: number;
  bytesTotal: number;
  speed: number;
  eta: number;
  platformPostId: string | null;
  errorMessage: string | null;
  elapsed: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const uploadId = searchParams.get("uploadId");
  const postId = searchParams.get("postId");

  let job = null;

  if (uploadId) {
    job = uploadJobs.get(uploadId);
  } else if (postId) {
    // Find by postId — get the most recent upload for this post
    const jobs = Array.from(uploadJobs.values())
      .filter((j) => j.postId === postId)
      .sort((a, b) => b.startedAt - a.startedAt);
    job = jobs[0] ?? null;
  }

  if (!job) {
    const error: IpcError = {
      code: "NOT_FOUND",
      message: uploadId
        ? `Upload job not found: ${uploadId}`
        : `No upload found for post: ${postId}`,
      retryable: false,
    };
    return NextResponse.json({ ok: false, error } satisfies IpcResult<never>, { status: 404 });
  }

  const elapsed = job.completedAt
    ? (job.completedAt - job.startedAt) / 1000
    : (Date.now() - job.startedAt) / 1000;

  const data: UploadProgressData = {
    uploadId: job.uploadId,
    postId: job.postId,
    platform: job.platform,
    status: job.status,
    progress: job.progress,
    currentChunk: job.currentChunk,
    totalChunks: job.totalChunks,
    bytesUploaded: job.bytesUploaded,
    bytesTotal: job.bytesTotal,
    speed: job.speed,
    eta: job.eta,
    platformPostId: job.platformPostId,
    errorMessage: job.errorMessage,
    elapsed: Math.round(elapsed * 10) / 10,
  };

  const result: IpcResult<UploadProgressData> = {
    ok: true,
    data,
  };

  return NextResponse.json(result);
}