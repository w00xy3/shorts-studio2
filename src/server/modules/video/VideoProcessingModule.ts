import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

export interface RenderOptions {
  sourcePath: string;
  startTime: string;
  duration: number;
  outputName: string;
  cropToShorts?: boolean;
}

export class VideoProcessingModule {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'public', 'clips');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  public processClip(
    options: RenderOptions,
    onProgress: (progress: number) => void
  ): Promise<{ success: boolean; outputPath: string; error?: string }> {
    return new Promise((resolve) => {
      
      // ИСПРАВЛЕНИЕ ПУТИ ДЛЯ WINDOWS:
      let absoluteSourcePath = options.sourcePath;
      
      if (options.sourcePath.startsWith('/')) {
        // Если путь начинается со слэша, принудительно берем его из папки public проекта
        absoluteSourcePath = path.join(process.cwd(), 'public', options.sourcePath);
      } else if (!options.sourcePath.includes(':')) {
        // Если в пути нет двоеточия (диска C:), значит путь относительный корня проекта
        absoluteSourcePath = path.join(process.cwd(), options.sourcePath);
      }
      
      // Нормализуем слэши под операционную систему Windows (\ вместо /)
      absoluteSourcePath = path.normalize(absoluteSourcePath);

      console.log(`[FFmpeg] Проверка файла по пути: ${absoluteSourcePath}`);

      const outputFileName = `${options.outputName}_${Date.now()}.mp4`;
      const absoluteOutputPath = path.join(this.outputDir, outputFileName);
      const webOutputPath = `/clips/${outputFileName}`;

      if (!fs.existsSync(absoluteSourcePath)) {
        return resolve({
          success: false,
          outputPath: '',
          error: `Исходный файл физически не найден на диске по адресу: ${absoluteSourcePath}`,
        });
      }

      let command = ffmpeg(absoluteSourcePath)
        .seekInput(options.startTime)
        .duration(options.duration);

      if (options.cropToShorts) {
        command = command.videoFilters([
          'crop=ih*9/16:ih:(iw-ow)/2:0',
          'scale=1080:1920'
        ]);
      }

      command
        .output(absoluteOutputPath)
        .outputOptions([
          '-c:v libx264',
          '-profile:v main',
          '-level:v 4.0',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart'
        ])
        .on('start', (commandLine) => {
          console.log('FFmpeg успешно запущен. Команда: ' + commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            onProgress(Math.round(progress.percent));
          }
        })
        .on('end', () => {
          console.log(`Рендеринг завершен! Файл: ${webOutputPath}`);
          resolve({ success: true, outputPath: webOutputPath });
        })
        .on('error', (err) => {
          console.error('Ошибка внутри FFmpeg:', err);
          resolve({ success: false, outputPath: '', error: err.message });
        })
        .run();
    });
  }
}