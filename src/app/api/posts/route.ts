/**
 * API Route: GET /api/posts & POST /api/posts
 *
 * GET: Returns mock posts queue
 * POST: Create a new post (mock)
 * Uses the IpcResult<T> pattern for consistent response format.
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface MockPost {
  id: string;
  clipId: string;
  accountId: string;
  platform: "tiktok" | "youtube" | "instagram";
  clipTitle: string;
  accountDisplayName: string;
  description: string;
  tags: string;
  status: "draft" | "scheduled" | "uploading" | "published" | "failed";
  scheduledAt: string | null;
  publishedAt: string | null;
  platformPostId: string | null;
  errorMessage: string | null;
  uploadProgress: number;
  createdAt: string;
  updatedAt: string;
}

const mockPosts: MockPost[] = [
  {
    id: "post_001",
    clipId: "clip_001",
    accountId: "acc_001",
    platform: "tiktok",
    clipTitle: "Interview Highlight — Key Quote",
    accountDisplayName: "@CreativeStudio",
    description: "The most inspiring moment from our latest interview! 🔥",
    tags: "#interview,#motivation,#viral",
    status: "published",
    scheduledAt: "2026-05-20T12:00:00Z",
    publishedAt: "2026-05-20T12:00:15Z",
    platformPostId: "tiktok_post_72819",
    errorMessage: null,
    uploadProgress: 100,
    createdAt: "2026-05-20T10:30:00Z",
    updatedAt: "2026-05-20T12:00:15Z",
  },
  {
    id: "post_002",
    clipId: "clip_001",
    accountId: "acc_002",
    platform: "youtube",
    clipTitle: "Interview Highlight — Key Quote",
    accountDisplayName: "Tech Reviews HD",
    description: "Full interview highlight — watch the key moment!",
    tags: "#interview,#highlights,#shorts",
    status: "published",
    scheduledAt: "2026-05-20T12:00:00Z",
    publishedAt: "2026-05-20T12:00:45Z",
    platformPostId: "yt_short_xyz789",
    errorMessage: null,
    uploadProgress: 100,
    createdAt: "2026-05-20T10:31:00Z",
    updatedAt: "2026-05-20T12:00:45Z",
  },
  {
    id: "post_003",
    clipId: "clip_002",
    accountId: "acc_003",
    platform: "instagram",
    clipTitle: "Funny Reaction Moment",
    accountDisplayName: "@TravelVibes.official",
    description: "You won't believe this reaction 😂",
    tags: "#funny,#reaction,#reels",
    status: "failed",
    scheduledAt: "2026-05-20T14:00:00Z",
    publishedAt: null,
    platformPostId: null,
    errorMessage: "Token expired — account needs re-authorization",
    uploadProgress: 0,
    createdAt: "2026-05-20T11:00:00Z",
    updatedAt: "2026-05-20T14:00:30Z",
  },
  {
    id: "post_004",
    clipId: "clip_005",
    accountId: "acc_001",
    platform: "tiktok",
    clipTitle: "Tutorial Step 1 — Setup",
    accountDisplayName: "@CreativeStudio",
    description: "Quick setup guide — get started in 60 seconds!",
    tags: "#tutorial,#setup,#howto",
    status: "scheduled",
    scheduledAt: "2026-05-21T10:00:00Z",
    publishedAt: null,
    platformPostId: null,
    errorMessage: null,
    uploadProgress: 0,
    createdAt: "2026-05-20T15:00:00Z",
    updatedAt: "2026-05-20T15:00:00Z",
  },
  {
    id: "post_005",
    clipId: "clip_005",
    accountId: "acc_002",
    platform: "youtube",
    clipTitle: "Tutorial Step 1 — Setup",
    accountDisplayName: "Tech Reviews HD",
    description: "Step-by-step setup tutorial for beginners",
    tags: "#tutorial,#beginners,#tech",
    status: "scheduled",
    scheduledAt: "2026-05-21T10:30:00Z",
    publishedAt: null,
    platformPostId: null,
    errorMessage: null,
    uploadProgress: 0,
    createdAt: "2026-05-20T15:01:00Z",
    updatedAt: "2026-05-20T15:01:00Z",
  },
  {
    id: "post_006",
    clipId: "clip_007",
    accountId: "acc_001",
    platform: "tiktok",
    clipTitle: "Travel Vlog — Sunset Scene",
    accountDisplayName: "@CreativeStudio",
    description: "Golden hour vibes 🌅",
    tags: "#travel,#sunset,#vlog",
    status: "scheduled",
    scheduledAt: "2026-05-22T18:00:00Z",
    publishedAt: null,
    platformPostId: null,
    errorMessage: null,
    uploadProgress: 0,
    createdAt: "2026-05-20T16:00:00Z",
    updatedAt: "2026-05-20T16:00:00Z",
  },
  {
    id: "post_007",
    clipId: "clip_008",
    accountId: "acc_002",
    platform: "youtube",
    clipTitle: "Street Food Review — Best Tacos",
    accountDisplayName: "Tech Reviews HD",
    description: "The BEST tacos in town! 🌮",
    tags: "#streetfood,#tacos,#foodreview",
    status: "draft",
    scheduledAt: null,
    publishedAt: null,
    platformPostId: null,
    errorMessage: null,
    uploadProgress: 0,
    createdAt: "2026-05-20T16:30:00Z",
    updatedAt: "2026-05-20T16:30:00Z",
  },
];

export async function GET() {
  const result = {
    ok: true as const,
    data: mockPosts,
  };

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clipId, accountId, description, tags, scheduledAt } = body as {
      clipId?: string;
      accountId?: string;
      description?: string;
      tags?: string;
      scheduledAt?: string | null;
    };

    if (!clipId || !accountId) {
      return NextResponse.json(
        {
          ok: false as const,
          error: {
            code: "VALIDATION_ERROR",
            message: "Missing required fields: clipId, accountId",
            retryable: false,
          },
        },
        { status: 400 },
      );
    }

    const newPost: MockPost = {
      id: `post_${Date.now()}`,
      clipId,
      accountId,
      platform: "tiktok",
      clipTitle: "New Clip",
      accountDisplayName: "Mock Account",
      description: description || "",
      tags: tags || "",
      status: "draft",
      scheduledAt: scheduledAt || null,
      publishedAt: null,
      platformPostId: null,
      errorMessage: null,
      uploadProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const result = {
      ok: true as const,
      data: newPost,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        ok: false as const,
        error: {
          code: "UNKNOWN_ERROR",
          message: "Failed to create post",
          retryable: true,
        },
      },
      { status: 500 },
    );
  }
}
