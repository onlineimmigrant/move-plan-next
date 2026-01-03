import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import os from 'os';
import path from 'path';
import { createWriteStream, createReadStream, existsSync } from 'fs';
import { promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { createRequire } from 'module';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

const require = createRequire(import.meta.url);

interface TimelineSegment {
  id: string;
  start: number;
  end: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
}

interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
}

function sanitizeBaseName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
}

function getVideoDimensions(resolution: string, aspectRatio?: string): { width: number; height: number } {
  // Default to 16:9 if not specified
  const ratio = aspectRatio || '16:9';

  // Map resolution to base dimension (typically height for landscape, width for portrait)
  const resolutionMap: Record<string, number> = {
    '4k': 2160,
    '1080p': 1080,
    '720p': 720,
    '480p': 480,
  };

  const baseSize = resolutionMap[resolution] || 1080;

  // Calculate dimensions based on aspect ratio
  switch (ratio) {
    case '16:9':
      // Landscape: 1920×1080 for 1080p
      return { width: Math.round(baseSize * 16 / 9), height: baseSize };
    case '9:16':
      // Portrait: 1080×1920 for 1080p (width is baseSize, height is larger)
      return { width: baseSize, height: Math.round(baseSize * 16 / 9) };
    case '1:1':
      // Square: 1080×1080 for 1080p
      return { width: baseSize, height: baseSize };
    case '4:5':
      // Portrait: 1080×1350 for 1080p
      return { width: baseSize, height: Math.round(baseSize * 5 / 4) };
    case '3:4':
      // Portrait: 1080×1440 for 1080p
      return { width: baseSize, height: Math.round(baseSize * 4 / 3) };
    case '4:3':
      // Landscape: 1440×1080 for 1080p
      return { width: Math.round(baseSize * 4 / 3), height: baseSize };
    default:
      return { width: Math.round(baseSize * 16 / 9), height: baseSize };
  }
}

async function runFfmpeg(args: string[]) {
  const envPath = process.env.FFMPEG_PATH;
  const ffmpegStaticPath = (() => {
    try {
      return require('ffmpeg-static') as string | null;
    } catch {
      return null;
    }
  })();

  const standaloneFfmpeg = path.join(process.cwd(), '.next', 'standalone', 'node_modules', 'ffmpeg-static', 'ffmpeg');
  const standaloneFfmpegExe = path.join(process.cwd(), '.next', 'standalone', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

  const candidates = [
    envPath,
    ffmpegStaticPath,
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg'),
    path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe'),
    standaloneFfmpeg,
    standaloneFfmpegExe,
    '/var/task/node_modules/ffmpeg-static/ffmpeg',
    '/root/node_modules/ffmpeg-static/ffmpeg',
  ].filter(Boolean) as string[];

  const resolved = candidates.find((p) => existsSync(p));
  const bin = resolved || 'ffmpeg';

  await new Promise<void>((resolve, reject) => {
    const child = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn ffmpeg: ${err instanceof Error ? err.message : String(err)}`));
    });
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}. ${stderr.slice(-4000)}`));
    });
  });
}

export async function POST(request: NextRequest) {
  let tmpDir: string | null = null;

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }

    if (!profile || !['admin', 'superadmin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { projectId, sourceUrl, sourceName, timeline, format = 'mp4', folder = 'Videos', preset, captions } = body;

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return NextResponse.json({ error: 'Missing sourceUrl' }, { status: 400 });
    }

    if (!Array.isArray(timeline) || timeline.length === 0) {
      return NextResponse.json({ error: 'Timeline must be a non-empty array' }, { status: 400 });
    }

    if (format !== 'mp4' && format !== 'webm') {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    // Extract preset settings
    const resolution = preset?.resolution || '1080p';
    const quality = preset?.quality || 'high';
    const aspectRatio = preset?.aspectRatio;

    console.log('[video-studio/export] Processing with preset:', { resolution, quality, aspectRatio });

    // Create export job
    let exportJobId: string | null = null;
    if (projectId) {
      const { data: job, error: jobError } = await supabase
        .from('video_studio_export_jobs')
        .insert({
          organization_id: organizationId,
          project_id: projectId,
          created_by: user.id,
          status: 'processing',
          progress: 5,
          format,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!jobError && job) {
        exportJobId = job.id;
      }
    }

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-studio-'));
    const inputPath = path.join(tmpDir, 'input');

    // Download source video
    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({ progress: 15, updated_at: new Date().toISOString() })
        .eq('id', exportJobId);
    }

    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok || !sourceResponse.body) {
      throw new Error(`Failed to fetch source video: ${sourceResponse.status}`);
    }

    await pipeline(Readable.fromWeb(sourceResponse.body as any), createWriteStream(inputPath));

    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({ progress: 30, updated_at: new Date().toISOString() })
        .eq('id', exportJobId);
    }

    // Create SRT subtitle file if captions provided
    let subtitlesPath: string | null = null;
    if (captions && Array.isArray(captions) && captions.length > 0) {
      subtitlesPath = path.join(tmpDir, 'subtitles.srt');
      const srtContent = (captions as Caption[])
        .sort((a, b) => a.start - b.start)
        .map((caption, index) => {
          const formatSrtTime = (seconds: number) => {
            const hours = Math.floor(seconds / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = Math.floor(seconds % 60);
            const ms = Math.floor((seconds % 1) * 1000);
            return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
          };
          return `${index + 1}\n${formatSrtTime(caption.start)} --> ${formatSrtTime(caption.end)}\n${caption.text}\n`;
        })
        .join('\n');
      await fs.writeFile(subtitlesPath, srtContent, 'utf-8');
      console.log('[video-studio/export] Created subtitles file with', captions.length, 'captions');
    }

    // Extract each segment
    const segmentPaths: string[] = [];
    const { width, height } = getVideoDimensions(resolution, aspectRatio);
    
    console.log('[video-studio/export] Video dimensions:', { width, height });

    for (let i = 0; i < timeline.length; i++) {
      const segment = timeline[i] as TimelineSegment;
      const segmentPath = path.join(tmpDir, `segment-${i}.${format}`);
      segmentPaths.push(segmentPath);

      const duration = segment.end - segment.start;
      const common = [
        '-hide_banner',
        '-y',
        '-ss', String(segment.start),
        '-i', inputPath,
        '-t', String(duration),
        '-map', '0:v:0',
        '-map', '0:a?',
      ];

      // Scale video to target resolution with aspect ratio
      // For portrait/square formats, we need to ensure the output matches exactly
      // Use 'force_original_aspect_ratio=increase' to fill the frame, then crop to exact size
      const scaleFilter = aspectRatio && (aspectRatio === '9:16' || aspectRatio === '1:1' || aspectRatio === '4:5' || aspectRatio === '3:4')
        ? `scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height}`
        : `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black`;

      // Add subtitles if provided (burn into video)
      const videoFilter = subtitlesPath 
        ? `${scaleFilter},subtitles=${subtitlesPath.replace(/\\/g, '/').replace(/:/g, '\\:')}:force_style='FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=3,Outline=2,Shadow=1,MarginV=20'`
        : scaleFilter;

      console.log('[video-studio/export] Using filter:', videoFilter);

      // Quality settings based on preset
      const crfMap: Record<string, string> = {
        'high': '18',
        'medium': '23',
        'low': '28',
      };
      const crf = crfMap[quality] || '23';

      const formatArgs = format === 'mp4'
        ? [
            '-vf', videoFilter,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', crf,
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart'
          ]
        : [
            '-vf', videoFilter,
            '-c:v', 'libvpx-vp9',
            '-b:v', quality === 'high' ? '3M' : quality === 'medium' ? '2M' : '1M',
            '-c:a', 'libopus',
            '-b:a', '128k'
          ];

      await runFfmpeg([...common, ...formatArgs, segmentPath]);

      const progress = 30 + Math.floor((i + 1) / timeline.length * 40);
      if (exportJobId) {
        await supabase
          .from('video_studio_export_jobs')
          .update({ progress, updated_at: new Date().toISOString() })
          .eq('id', exportJobId);
      }
    }

    // Concatenate segments if multiple
    let finalOutputPath: string;
    if (segmentPaths.length === 1) {
      finalOutputPath = segmentPaths[0];
    } else {
      finalOutputPath = path.join(tmpDir, `final.${format}`);
      
      // Create concat file
      const concatListPath = path.join(tmpDir, 'concat.txt');
      const concatContent = segmentPaths.map(p => `file '${p}'`).join('\n');
      await fs.writeFile(concatListPath, concatContent);

      // Concatenate with re-encoding to avoid format issues
      const concatArgs = [
        '-hide_banner',
        '-y',
        '-f', 'concat',
        '-safe', '0',
        '-i', concatListPath,
        '-c', 'copy',
        finalOutputPath,
      ];

      await runFfmpeg(concatArgs);
    }

    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({ progress: 75, updated_at: new Date().toISOString() })
        .eq('id', exportJobId);
    }

    // Upload to R2
    const baseName = sanitizeBaseName(sourceName || 'clip');
    const ext = format;
    const uniqueId = nanoid(8);
    const fileName = `${baseName}_${uniqueId}.${ext}`;
    const r2Key = `${organizationId}/videos/${folder}/${fileName}`;

    const fileStream = createReadStream(finalOutputPath);
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${r2Key}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': format === 'mp4' ? 'video/mp4' : 'video/webm',
      },
      body: fileStream as any,
      duplex: 'half',
    } as any);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`R2 upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const finalUrl = `${R2_PUBLIC_URL}/${r2Key}`;

    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({
          status: 'done',
          progress: 100,
          output_url: finalUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exportJobId);
    }

    // Cleanup
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }

    return NextResponse.json({
      url: finalUrl,
      outputUrl: finalUrl,
      fileName,
      format,
      segmentCount: timeline.length,
      exportJobId,
      preset: {
        resolution,
        aspectRatio,
        quality,
        dimensions: { width, height },
      },
    });

  } catch (error) {
    console.error('[video-studio/export] Error:', error);

    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
