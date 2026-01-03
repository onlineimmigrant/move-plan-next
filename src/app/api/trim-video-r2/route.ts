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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

type OutputFormat = 'mp4' | 'webm';

const require = createRequire(import.meta.url);

function sanitizeBaseName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 80);
}

async function runFfmpeg(args: string[]) {
  const envPath = process.env.FFMPEG_PATH;
  const ffmpegStaticPath = (() => {
    try {
      // Resolve at runtime so the path is correct in the deployed filesystem.
      return require('ffmpeg-static') as string | null;
    } catch {
      return null;
    }
  })();

  const standaloneFfmpeg = path.join(
    process.cwd(),
    '.next',
    'standalone',
    'node_modules',
    'ffmpeg-static',
    'ffmpeg'
  );

  const standaloneFfmpegExe = path.join(
    process.cwd(),
    '.next',
    'standalone',
    'node_modules',
    'ffmpeg-static',
    'ffmpeg.exe'
  );

  const candidates = [
    envPath,
    ffmpegStaticPath,
    // Common runtime roots for standalone/serverless deployments
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
      const details = {
        bin,
        resolved,
        cwd: process.cwd(),
        candidates: candidates.map((p) => ({ path: p, exists: existsSync(p) })),
      };
      reject(new Error(`Failed to spawn ffmpeg. ${err instanceof Error ? err.message : String(err)}. ${JSON.stringify(details)}`));
    });
    child.on('close', (code) => {
      if (code === 0) return resolve();
      reject(new Error(`ffmpeg exited with code ${code}. ${stderr.slice(-4000)}`));
    });
  });
}

export async function POST(request: NextRequest) {
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  let exportJobId: string | undefined;
  let orgIdForJob: string | undefined;
  let userIdForJob: string | undefined;

  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    const organizationId = profile?.organization_id;
    orgIdForJob = organizationId;
    userIdForJob = user.id;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'owner')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const sourceUrl: string | undefined = body?.sourceUrl;
    const start: number | undefined = body?.start;
    const end: number | undefined = body?.end;
    const format: OutputFormat | undefined = body?.format;
    const folder: string = body?.folder || 'Videos';
    const baseName: string = body?.baseName || 'video';
    const projectId: string | undefined = typeof body?.projectId === 'string' ? body.projectId : undefined;

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return NextResponse.json({ error: 'Missing sourceUrl' }, { status: 400 });
    }

    if (typeof start !== 'number' || typeof end !== 'number' || !Number.isFinite(start) || !Number.isFinite(end)) {
      return NextResponse.json({ error: 'Invalid start/end' }, { status: 400 });
    }

    if (!format || (format !== 'mp4' && format !== 'webm')) {
      return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: 'end must be > start' }, { status: 400 });
    }

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
          start_seconds: start,
          end_seconds: end,
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (!jobError) {
        exportJobId = job?.id;
      }
    }

    const duration = end - start;

    // Download source video to temp file (streaming)
    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({ progress: 15, updated_at: new Date().toISOString() })
        .eq('id', exportJobId)
        .eq('organization_id', organizationId);
    }
    const sourceResponse = await fetch(sourceUrl);
    if (!sourceResponse.ok || !sourceResponse.body) {
      const text = await sourceResponse.text().catch(() => '');
      return NextResponse.json(
        { error: `Failed to fetch sourceUrl (${sourceResponse.status}) ${text}` },
        { status: 400 }
      );
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'video-studio-'));
    inputPath = path.join(tmpDir, 'input');
    outputPath = path.join(tmpDir, `output.${format}`);

    // Pipe web stream to file
    await pipeline(Readable.fromWeb(sourceResponse.body as any), createWriteStream(inputPath));

    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({ progress: 35, updated_at: new Date().toISOString() })
        .eq('id', exportJobId)
        .eq('organization_id', organizationId);
    }

    // Build ffmpeg args
    // Use optional audio mapping so silent videos don't fail.
    const common = [
      '-hide_banner',
      '-y',
      '-ss',
      String(start),
      '-i',
      inputPath,
      '-t',
      String(duration),
      '-map',
      '0:v:0',
      '-map',
      '0:a?',
    ];

    const outMime = format === 'mp4' ? 'video/mp4' : 'video/webm';

    const formatArgs =
      format === 'mp4'
        ? [
            // MP4 (H.264/AAC)
            '-c:v',
            'libx264',
            '-preset',
            'veryfast',
            '-crf',
            '23',
            '-c:a',
            'aac',
            '-b:a',
            '128k',
            '-movflags',
            '+faststart',
          ]
        : [
            // WebM (VP9/Opus)
            '-c:v',
            'libvpx-vp9',
            '-crf',
            '32',
            '-b:v',
            '0',
            '-c:a',
            'libopus',
            '-b:a',
            '96k',
          ];

    await runFfmpeg([...common, ...formatArgs, outputPath]);

    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({ progress: 75, updated_at: new Date().toISOString() })
        .eq('id', exportJobId)
        .eq('organization_id', organizationId);
    }

    const stats = await fs.stat(outputPath);

    const uniqueId = nanoid(10);
    const sanitizedName = sanitizeBaseName(baseName);
    const fileName = `${sanitizedName}_trimmed_${uniqueId}.${format}`;

    const folderPath = `videos/${folder}`;
    const objectKey = `${organizationId}/${folderPath}/${fileName}`;

    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(
      objectKey
    )}`;

    const uploadInit: any = {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': outMime,
        'Content-Length': String(stats.size),
      },
      // undici fetch accepts web ReadableStream
      body: Readable.toWeb(createReadStream(outputPath)) as any,
      // Node/undici requires this when sending a streaming request body.
      duplex: 'half',
    };

    const uploadResponse = await fetch(uploadUrl, uploadInit);

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[trim-video-r2] Upload failed:', errorText);
      return NextResponse.json({ error: 'Failed to upload video to R2' }, { status: 500 });
    }

    const videoUrl = `${R2_PUBLIC_URL}/${objectKey}`;

    if (exportJobId) {
      await supabase
        .from('video_studio_export_jobs')
        .update({
          status: 'done',
          progress: 100,
          output_url: videoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', exportJobId)
        .eq('organization_id', organizationId);
    }

    return NextResponse.json({
      videoUrl,
      fileName,
      folder,
      size: stats.size,
      format,
      exportJobId,
    });
  } catch (error) {
    console.error('[trim-video-r2] Error:', error);
    const message = error instanceof Error ? error.message : 'Trim failed';

    if (exportJobId && orgIdForJob) {
      try {
        await supabase
          .from('video_studio_export_jobs')
          .update({ status: 'error', error: message, updated_at: new Date().toISOString() })
          .eq('id', exportJobId)
          .eq('organization_id', orgIdForJob);
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    // Best-effort cleanup
    try {
      if (inputPath) await fs.unlink(inputPath);
    } catch {}
    try {
      if (outputPath) await fs.unlink(outputPath);
    } catch {}
    try {
      if (inputPath) {
        const dir = path.dirname(inputPath);
        await fs.rmdir(dir).catch(() => undefined);
      }
    } catch {}
  }
}
