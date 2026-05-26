/**
 * API Route: GET /api/clips
 *
 * Returns a mock list of clips with various statuses.
 * Uses the IpcResult<T> pattern for consistent response format.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface MockClip {
  id: string;
  sourceVideoId: string;
  title: string;
  startTime: number;
  endTime: number;
  outputWidth: number;
  outputHeight: number;
  cropMode: "center" | "blur";
  blurStrength: number;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
  outputFilePath: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  postedTo: Array<"tiktok" | "youtube" | "instagram">;
}

const mockClips: MockClip[] = [
  {
    id: "clip_001",
    sourceVideoId: "vid_001",
    title: "Interview Highlight — Key Quote",
    startTime: 120,
    endTime: 180,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "center",
    blurStrength: 0,
    status: "done",
    progress: 100,
    outputFilePath: "/output/clips/interview_highlight_001.mp4",
    errorMessage: null,
    createdAt: "2026-05-20T10:00:00Z",
    updatedAt: "2026-05-20T10:02:15Z",
    postedTo: ["tiktok", "youtube"],
  },
  {
    id: "clip_002",
    sourceVideoId: "vid_001",
    title: "Funny Reaction Moment",
    startTime: 450,
    endTime: 520,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "blur",
    blurStrength: 25,
    status: "done",
    progress: 100,
    outputFilePath: "/output/clips/funny_reaction_002.mp4",
    errorMessage: null,
    createdAt: "2026-05-20T10:05:00Z",
    updatedAt: "2026-05-20T10:08:30Z",
    postedTo: ["instagram"],
  },
  {
    id: "clip_003",
    sourceVideoId: "vid_001",
    title: "Product Demo — Feature Showcase",
    startTime: 780,
    endTime: 860,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "center",
    blurStrength: 0,
    status: "processing",
    progress: 64,
    outputFilePath: null,
    errorMessage: null,
    createdAt: "2026-05-20T10:10:00Z",
    updatedAt: "2026-05-20T10:11:00Z",
    postedTo: [],
  },
  {
    id: "clip_004",
    sourceVideoId: "vid_001",
    title: "Behind the Scenes Bloopers",
    startTime: 1200,
    endTime: 1280,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "blur",
    blurStrength: 20,
    status: "pending",
    progress: 0,
    outputFilePath: null,
    errorMessage: null,
    createdAt: "2026-05-20T10:15:00Z",
    updatedAt: "2026-05-20T10:15:00Z",
    postedTo: [],
  },
  {
    id: "clip_005",
    sourceVideoId: "vid_002",
    title: "Tutorial Step 1 — Setup",
    startTime: 30,
    endTime: 90,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "center",
    blurStrength: 0,
    status: "done",
    progress: 100,
    outputFilePath: "/output/clips/tutorial_step1_005.mp4",
    errorMessage: null,
    createdAt: "2026-05-19T14:00:00Z",
    updatedAt: "2026-05-19T14:02:10Z",
    postedTo: ["tiktok", "youtube", "instagram"],
  },
  {
    id: "clip_006",
    sourceVideoId: "vid_002",
    title: "Tutorial Step 2 — Configuration",
    startTime: 95,
    endTime: 155,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "blur",
    blurStrength: 15,
    status: "error",
    progress: 42,
    outputFilePath: null,
    errorMessage: "FFmpeg exited with code 1: Invalid filter graph",
    createdAt: "2026-05-19T14:05:00Z",
    updatedAt: "2026-05-19T14:06:20Z",
    postedTo: [],
  },
  {
    id: "clip_007",
    sourceVideoId: "vid_003",
    title: "Travel Vlog — Sunset Scene",
    startTime: 2000,
    endTime: 2070,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "blur",
    blurStrength: 30,
    status: "done",
    progress: 100,
    outputFilePath: "/output/clips/sunset_scene_007.mp4",
    errorMessage: null,
    createdAt: "2026-05-18T09:30:00Z",
    updatedAt: "2026-05-18T09:33:00Z",
    postedTo: ["instagram", "tiktok"],
  },
  {
    id: "clip_008",
    sourceVideoId: "vid_003",
    title: "Street Food Review — Best Tacos",
    startTime: 2500,
    endTime: 2580,
    outputWidth: 1080,
    outputHeight: 1920,
    cropMode: "center",
    blurStrength: 0,
    status: "done",
    progress: 100,
    outputFilePath: "/output/clips/street_food_008.mp4",
    errorMessage: null,
    createdAt: "2026-05-18T09:35:00Z",
    updatedAt: "2026-05-18T09:37:45Z",
    postedTo: ["youtube"],
  },
];

export async function GET() {
  const result = {
    ok: true as const,
    data: mockClips,
  };

  return NextResponse.json(result);
}
