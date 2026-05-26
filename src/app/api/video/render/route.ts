import { NextRequest, NextResponse } from 'next/server';
import { renderJobs } from '@/lib/jobStore';
// Импорты модулей, которые могут вызывать ошибки на Vercel, лучше вынести внутрь функции 
// или использовать динамический импорт, если нужно.

export async function POST(req: NextRequest) {
  // ПРОВЕРКА: Если мы на сервере Vercel (Production)
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ 
      ok: true,
      data: {
        jobId: 'test_job',
        status: 'COMPLETED',
        videoUrl: '/test-video.mp4',
        outputPath: '/test-video.mp4'
      }
    });
  }

  // ЕСЛИ МЫ НЕ НА VERCEL (локально), выполняем полную логику:
  // (Здесь нужен динамический импорт, чтобы Vercel не пытался грузить fs/path при билде)
  const path = require('path');
  const fs = require('fs');
  const { VideoProcessingModule } = require('@/server/modules/video/VideoProcessingModule');

  try {
    const body = await req.json();
    const jobId = body.clipId || `clip_${Date.now()}`;
    renderJobs.set(jobId, { progress: 0, status: 'processing' });

    const absoluteVideoPath = path.normalize('C:\\Users\\Тамик\\Videos\\interview.mp4');

    if (!fs.existsSync(absoluteVideoPath)) {
      return NextResponse.json({ ok: false, error: { message: 'Файл не найден' } }, { status: 400 });
    }

    const processor = new VideoProcessingModule();
    const result = await processor.processClip({
      sourcePath: absoluteVideoPath,
      startTime: (body.startTime || 0).toString(),
      duration: (body.endTime - body.startTime) || 10,
      outputName: 'tiktok_clip',
      cropToShorts: true
    }, (progress: number) => {
      renderJobs.set(jobId, { progress, status: 'processing' });
    });

    return NextResponse.json({ ok: true, data: { jobId, status: 'COMPLETED', videoUrl: result.outputPath } });

  } catch (error: any) {
    return NextResponse.json({ ok: false, error: { message: error.message } }, { status: 500 });
  }
}