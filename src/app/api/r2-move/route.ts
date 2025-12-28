import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

// POST: Move a file from one folder to another
export async function POST(request: NextRequest) {
  try {
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json({ error: 'R2 not configured' }, { status: 500 });
    }

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
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }

    const body = await request.json();
    const { sourceKey, destinationFolder, mediaType } = body;

    if (!sourceKey || destinationFolder === undefined || !mediaType) {
      return NextResponse.json({ 
        error: 'Missing sourceKey, destinationFolder, or mediaType' 
      }, { status: 400 });
    }

    // Extract filename from source key
    const fileName = sourceKey.split('/').pop();
    if (!fileName) {
      return NextResponse.json({ error: 'Invalid source key' }, { status: 400 });
    }

    // Build destination key
    const destFolder = destinationFolder.trim() || 'uncategorized';
    const destinationKey = `${profile.organization_id}/${mediaType}/${destFolder}/${fileName}`;

    // 1. Copy file to new location
    const copyUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(destinationKey)}`;

    // First, download the source file
    const downloadUrl = `${R2_PUBLIC_URL}/${sourceKey}`;
    const downloadResponse = await fetch(downloadUrl);
    
    if (!downloadResponse.ok) {
      return NextResponse.json({ error: 'Failed to download source file' }, { status: 500 });
    }

    const fileBuffer = await downloadResponse.arrayBuffer();

    // Upload to destination
    const uploadResponse = await fetch(copyUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': downloadResponse.headers.get('content-type') || 'application/octet-stream',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[r2-move] Upload failed:', errorText);
      return NextResponse.json({ error: 'Failed to upload to destination' }, { status: 500 });
    }

    // 2. Delete original file
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(sourceKey)}`;

    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
    });

    if (!deleteResponse.ok) {
      console.warn('[r2-move] Delete of source failed (file copied but not removed)');
      // Don't fail the request - file was copied successfully
    }

    return NextResponse.json({ 
      success: true, 
      newUrl: `${R2_PUBLIC_URL}/${destinationKey}`,
      newKey: destinationKey 
    });

  } catch (error) {
    console.error('[r2-move] Error:', error);
    return NextResponse.json({ error: 'Failed to move file' }, { status: 500 });
  }
}
