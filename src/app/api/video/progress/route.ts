import { NextRequest, NextResponse } from 'next/server';
import { renderJobs } from '../render/route';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ ok: false, error: 'Missing jobId' }, { status: 400 });
    }

    const job = renderJobs.get(jobId);

    console.log(`[Поллинг] Запрос статуса: ${jobId} -> В памяти:`, job);

    // Если задача ещё не создалась в памяти, притворимся, что она только началась
    if (!job) {
      return NextResponse.json({
        type: 'progress',
        percent: 0,
        speed: 0,
        eta: 0,
        bitrate: 0
      }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' }
      });
    }

    // Проверяем, готова ли задача
    const isDone = job.status === 'COMPLETED' || job.progress === 100;

    if (isDone) {
      // Формат, который завершит бесконечный цикл на фронтенде
      return NextResponse.json({
        type: 'complete',
        outputFilePath: job.outputPath || job.videoUrl || '',
        cropMode: 'center' // или любое дефолтное значение
      }, {
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
      });
    }

    // Если ещё рендерится
    return NextResponse.json({
      type: 'progress',
      percent: job.progress || 0,
      speed: 1.2,  // моковые данные для интерфейса, если реальных нет
      eta: 30,
      bitrate: 5000
    }, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' }
    });

  } catch (error: any) {
    console.error('Ошибка в роуте progress:', error);
    return NextResponse.json({
      type: 'error',
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
}