/**
 * API Route: GET /api/analytics
 *
 * Returns mock analytics data for the Shorts Studio dashboard.
 * Uses the IpcResult<T> pattern for consistent response format.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ClipsCreatedByDay {
  date: string;
  count: number;
}

interface PostsByPlatform {
  platform: string;
  count: number;
  color: string;
}

interface ProcessingTime {
  clipName: string;
  duration: number;
  cropMode: string;
}

interface SuccessRate {
  total: number;
  success: number;
  failed: number;
  rate: number;
}

interface PlatformStat {
  platform: string;
  postsPublished: number;
  postsScheduled: number;
  postsFailed: number;
  avgViews: number;
  avgLikes: number;
  followers: number;
}

interface WeeklyActivity {
  day: string;
  clips: number;
  posts: number;
}

interface RecentError {
  timestamp: string;
  error: string;
  platform: string;
  clipTitle: string;
}

interface AnalyticsData {
  clipsCreatedByDay: ClipsCreatedByDay[];
  postsByPlatform: PostsByPlatform[];
  processingTimes: ProcessingTime[];
  successRate: SuccessRate;
  platformStats: PlatformStat[];
  weeklyActivity: WeeklyActivity[];
  recentErrors: RecentError[];
}

// ─── Helper: generate last N dates as ISO date strings ──────────────────────

function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const last7Days = getLastNDays(7);

const clipsCreatedByDay: ClipsCreatedByDay[] = [
  { date: last7Days[0], count: 3 },
  { date: last7Days[1], count: 5 },
  { date: last7Days[2], count: 2 },
  { date: last7Days[3], count: 7 },
  { date: last7Days[4], count: 4 },
  { date: last7Days[5], count: 8 },
  { date: last7Days[6], count: 6 },
];

const postsByPlatform: PostsByPlatform[] = [
  { platform: "tiktok", count: 12, color: "bg-rose-500" },
  { platform: "youtube", count: 8, color: "bg-red-500" },
  { platform: "instagram", count: 6, color: "bg-orange-500" },
];

const processingTimes: ProcessingTime[] = [
  { clipName: "Interview Highlight — Key Quote", duration: 18, cropMode: "center" },
  { clipName: "Funny Reaction Moment", duration: 42, cropMode: "blur" },
  { clipName: "Product Demo — Feature Showcase", duration: 95, cropMode: "center" },
  { clipName: "Behind the Scenes Bloopers", duration: 67, cropMode: "blur" },
  { clipName: "Tutorial Step 1 — Setup", duration: 28, cropMode: "center" },
  { clipName: "Travel Vlog — Sunset Scene", duration: 115, cropMode: "blur" },
];

const successRate: SuccessRate = {
  total: 26,
  success: 23,
  failed: 3,
  rate: Math.round((23 / 26) * 1000) / 10, // 88.5
};

const platformStats: PlatformStat[] = [
  {
    platform: "tiktok",
    postsPublished: 12,
    postsScheduled: 3,
    postsFailed: 1,
    avgViews: 8420,
    avgLikes: 634,
    followers: 24800,
  },
  {
    platform: "youtube",
    postsPublished: 8,
    postsScheduled: 2,
    postsFailed: 1,
    avgViews: 5120,
    avgLikes: 412,
    followers: 15600,
  },
  {
    platform: "instagram",
    postsPublished: 6,
    postsScheduled: 1,
    postsFailed: 1,
    avgViews: 3680,
    avgLikes: 287,
    followers: 9400,
  },
];

const weeklyActivity: WeeklyActivity[] = [
  { day: "Mon", clips: 3, posts: 2 },
  { day: "Tue", clips: 5, posts: 4 },
  { day: "Wed", clips: 2, posts: 1 },
  { day: "Thu", clips: 7, posts: 5 },
  { day: "Fri", clips: 4, posts: 3 },
  { day: "Sat", clips: 8, posts: 6 },
  { day: "Sun", clips: 6, posts: 4 },
];

const recentErrors: RecentError[] = [
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 23).toISOString(),
    error: "Upload timed out after 120s — video exceeded size limit",
    platform: "tiktok",
    clipTitle: "Product Demo — Feature Showcase",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 67).toISOString(),
    error: "OAuth token expired — re-authentication required",
    platform: "youtube",
    clipTitle: "Behind the Scenes Bloopers",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 142).toISOString(),
    error: "Platform API returned 429 — rate limit exceeded",
    platform: "instagram",
    clipTitle: "Travel Vlog — Sunset Scene",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    error: "FFmpeg exited with code 1 — invalid filter graph configuration",
    platform: "youtube",
    clipTitle: "Tutorial Step 2 — Configuration",
  },
];

// ─── Route Handler ──────────────────────────────────────────────────────────

export async function GET() {
  const analyticsData: AnalyticsData = {
    clipsCreatedByDay,
    postsByPlatform,
    processingTimes,
    successRate,
    platformStats,
    weeklyActivity,
    recentErrors,
  };

  const result = {
    ok: true as const,
    data: analyticsData,
  };

  return NextResponse.json(result);
}
