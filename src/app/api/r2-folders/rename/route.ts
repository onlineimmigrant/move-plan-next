import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json({ error: 'R2 storage not configured' }, { status: 500 });
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
      return NextResponse.json({ error: 'User organization not found' }, { status: 403 });
    }

    const { oldFolder, newFolder, mediaType } = await request.json();
    
    if (!oldFolder || !newFolder || !mediaType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['images', 'videos'].includes(mediaType)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    const organizationId = profile.organization_id;
    const oldPrefix = `${organizationId}/${mediaType}/${oldFolder}/`;
    const newPrefix = `${organizationId}/${mediaType}/${newFolder}/`;

    // List all files in the old folder
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(oldPrefix)}`;
    
    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
    });

    if (!listResponse.ok) {
      const errorText = await listResponse.text();
      console.error('[r2-folders/rename] List failed:', errorText);
      return NextResponse.json({ error: 'Failed to list folder contents' }, { status: 500 });
    }

    const listData = await listResponse.json();
    const objects = Array.isArray(listData.result) ? listData.result : (listData.result?.objects || []);

    if (objects.length === 0) {
      return NextResponse.json({ error: 'Folder is empty or does not exist' }, { status: 404 });
    }

    // Move each file to the new folder
    const movePromises = objects.map(async (obj: any) => {
      const oldKey = obj.key;
      const fileName = oldKey.split('/').pop();
      const newKey = `${newPrefix}${fileName}`;

      // Copy to new location
      const copyUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(newKey)}`;
      
      const copyResponse = await fetch(copyUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'X-Copy-From': `/${R2_BUCKET_NAME}/${oldKey}`,
        },
      });

      if (!copyResponse.ok) {
        throw new Error(`Failed to copy ${fileName}`);
      }

      // Delete old file
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(oldKey)}`;
      
      const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
      });

      if (!deleteResponse.ok) {
        console.error(`[r2-folders/rename] Failed to delete old file: ${oldKey}`);
      }
    });

    await Promise.all(movePromises);

    return NextResponse.json({ success: true, movedCount: objects.length });
  } catch (error) {
    console.error('[r2-folders/rename] Error:', error);
    return NextResponse.json(
      { error: 'Failed to rename folder', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
