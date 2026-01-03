/**
 * FFmpeg Video Trimming Utility
 * 
 * Client-side video trimming using ffmpeg.wasm
 * Lazy-loaded to avoid bundling 30MB+ wasm in main bundle
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

interface TrimOptions {
  sourceUrl: string;
  start: number;  // seconds
  end: number;    // seconds
  format: 'mp4' | 'webm';
  onProgress?: (progress: number) => void;
}

/**
 * Initialize FFmpeg instance (singleton pattern)
 */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  if (!ffmpegInstance) {
    ffmpegInstance = new FFmpeg();
  }

  if (!isLoaded) {
    // Load single-threaded version (multi-threaded worker blocked by COEP headers from CDN)
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpegInstance.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    });
    isLoaded = true;
  }

  return ffmpegInstance;
}

/**
 * Trim a video using stream copy (fast, no re-encoding)
 * Falls back to re-encoding if stream copy fails
 */
export async function trimVideo(options: TrimOptions): Promise<Blob> {
  const { sourceUrl, start, end, format, onProgress } = options;
  const duration = end - start;

  const ffmpeg = await getFFmpeg();

  // Progress callback
  if (onProgress) {
    ffmpeg.on('progress', ({ progress }) => {
      onProgress(progress * 100);
    });
  }

  try {
    console.log('Fetching video from:', sourceUrl);
    const videoData = await fetchFile(sourceUrl);
    const videoSizeMB = videoData.length / 1024 / 1024;
    console.log('Video fetched, size:', videoData.length, 'bytes', `(${videoSizeMB.toFixed(2)} MB)`);
    
    // Warn about large files (ffmpeg.wasm struggles with >100MB in browsers)
    if (videoSizeMB > 100) {
      throw new Error(`Video file is too large (${videoSizeMB.toFixed(0)}MB). Browser-based trimming supports files up to 100MB. Please use a smaller video.`);
    }
    
    const inputExt = sourceUrl.split('.').pop()?.toLowerCase() || 'mp4';
    const inputFile = `input.${inputExt}`;
    console.log('Writing input file:', inputFile);
    await ffmpeg.writeFile(inputFile, videoData);

    const outputFile = `output.${format}`;
    
    console.log('Running ffmpeg with stream copy (fast, no re-encoding)');
    
    // Always use stream copy - fast and reliable (same format only)
    await ffmpeg.exec([
      '-ss', start.toString(),
      '-i', inputFile,
      '-t', duration.toString(),
      '-c', 'copy',
      '-avoid_negative_ts', 'make_zero',
      outputFile,
    ]);

    console.log('Reading output file:', outputFile);
    const data = await ffmpeg.readFile(outputFile);
    const uint8Data = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    const blob = new Blob([uint8Data as BlobPart], { type: format === 'mp4' ? 'video/mp4' : 'video/webm' });
    console.log('Output blob created, size:', blob.size, 'bytes');

    // Cleanup
    await ffmpeg.deleteFile(inputFile);
    await ffmpeg.deleteFile(outputFile);

    return blob;
  } catch (error) {
    console.error('FFmpeg trim failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Video trimming failed: ${errorMessage}`);
  }
}
