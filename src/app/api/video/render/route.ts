import { NextRequest, NextResponse } from 'next/server';
import { VideoProcessingModule } from '@/server/modules/video/VideoProcessingModule';
import path from 'path';
import fs from 'fs';

// Железный синглтон для хранения задач, который не стирается при Fast Refresh в Next.js
const globalForJobs = globalThis as unknown as { renderJobs: Map<string, any> };
export const renderJobs = globalForJobs.renderJobs || new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  globalForJobs.renderJobs = renderJobs;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('--- ПОЛУЧЕННЫЙ ЗАПРОС НА ТЕСТ ---', body);

    const jobId = body.clipId || `clip_${Date.now()}`;

    // Шаг 1: Инициализируем задачу в глобальной карте
    renderJobs.set(jobId, { progress: 0, status: 'processing' });

    // Абсолютный путь к тестовому файлу
    const absoluteVideoPath = path.normalize('C:\\Users\\Тамик\\Videos\\interview.mp4');

    if (!fs.existsSync(absoluteVideoPath)) {
      renderJobs.set(jobId, { status: 'error', error: 'Файл источника не найден' });
      return NextResponse.json({ 
        ok: false, 
        error: { message: `Положите видео по пути: ${absoluteVideoPath}` } 
      }, { status: 400 });
    }

    const startTime = body.startTime !== undefined ? Number(body.startTime) : 0;
    const endTime = body.endTime !== undefined ? Number(body.endTime) : 10;
    const duration = endTime - startTime > 0 ? endTime - startTime : 10;

    const processor = new VideoProcessingModule();

    console.log('[Сервер] Запускаем FFmpeg и... транслируем прогресс...');

    const result = await processor.processClip({
      sourcePath: absoluteVideoPath,
      startTime: startTime.toString(),
      duration: duration,
      outputName: 'tiktok_clip',
      cropToShorts: true
    }, (progress) => {
      console.log(`Прогресс рендеринга: ${progress}%`);
      
      // Шаг 2: Записываем актуальный процент в карту памяти
      renderJobs.set(jobId, { 
        progress: progress, 
        status: 'processing' 
      });
    });

    if (result.success) {
      const fileName = path.basename(result.outputPath);
      const webUrl = `/clips/${fileName}`;

      console.log(`\x1b[32m[УСПЕХ] Ролик полностью готов. Отдаем структуру под фронтенд.\x1b[0m`);
      
      // Шаг 3: Выставляем финальный статус успеха
      renderJobs.set(jobId, { 
        progress: 100, 
        status: 'COMPLETED', 
        videoUrl: webUrl, 
        outputPath: webUrl 
      });

      // Возвращаем структуру, которую пошагово ожидает фронтенд
      return NextResponse.json({ 
        ok: true,
        data: {
          jobId: jobId,
          status: 'COMPLETED',
          videoUrl: webUrl,
          outputPath: webUrl
        }
      });
    } else {
      renderJobs.set(jobId, { status: 'error', error: result.error });
      return NextResponse.json({ 
        ok: false, 
        error: { message: result.error || 'Ошибка при обработке FFmpeg' } 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Критическая ошибка роута:', error);
    return NextResponse.json({ 
      ok: false, 
      error: { message: error.message } 
    }, { status: 500 });
  }
}