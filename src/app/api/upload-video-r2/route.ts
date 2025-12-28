import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request: NextRequest) {
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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'superadmin' && profile.role !== 'owner')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'Videos';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate video type (allow common formats + webm for screen recordings)
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime', // .mov
      'video/x-matroska', // .mkv (some browsers)
      'video/ogg',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only MP4, WebM, MOV, OGG are allowed.' },
        { status: 400 }
      );
    }

    // Check file size (max 500MB to match UI)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 500MB.' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const uniqueId = nanoid(10);
    const sanitizedName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${sanitizedName}_${uniqueId}.${ext}`;

    // Build R2 key: {organizationId}/videos/{folder}/{fileName}
    const folderPath = `videos/${folder}`;
    const objectKey = `${organizationId}/${folderPath}/${fileName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(objectKey)}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': file.type,
        'Content-Length': buffer.length.toString(),
      },
      body: buffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[upload-video-r2] Upload failed:', errorText);
      return NextResponse.json({ error: 'Failed to upload video to R2' }, { status: 500 });
    }

    const videoUrl = `${R2_PUBLIC_URL}/${objectKey}`;

    return NextResponse.json({
      videoUrl,
      fileName,
      folder,
      size: file.size,
    });
  } catch (error) {
    console.error('[upload-video-r2] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
