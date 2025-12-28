import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

// POST: Create a new folder (by creating a marker file)
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
    const { folderName, mediaType } = body; // mediaType: 'images' or 'videos'

    if (!folderName || !mediaType) {
      return NextResponse.json({ error: 'Missing folderName or mediaType' }, { status: 400 });
    }

    // Validate folder name
    const sanitizedFolderName = folderName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    if (!sanitizedFolderName) {
      return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 });
    }

    // Create a marker file: orgId/images/folderName/.folder or orgId/videos/folderName/.folder
    const markerKey = `${profile.organization_id}/${mediaType}/${sanitizedFolderName}/.folder`;

    // Upload empty marker file
    const uploadUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(markerKey)}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      body: '',
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('[r2-folders] Create failed:', errorText);
      return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      folderName: sanitizedFolderName,
      markerKey 
    });

  } catch (error) {
    console.error('[r2-folders] POST error:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}

// DELETE: Remove a folder (only if empty except for marker)
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const folderName = searchParams.get('folder');
    const mediaType = searchParams.get('mediaType'); // 'images' or 'videos'

    if (!folderName || !mediaType) {
      return NextResponse.json({ error: 'Missing folder or mediaType' }, { status: 400 });
    }

    const prefix = `${profile.organization_id}/${mediaType}/${folderName}/`;

    // List all objects in the folder
    const listUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects?prefix=${encodeURIComponent(prefix)}`;

    const listResponse = await fetch(listUrl, {
      headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
    });

    if (!listResponse.ok) {
      return NextResponse.json({ error: 'Failed to list folder contents' }, { status: 500 });
    }

    const data = await listResponse.json();
    const objects = Array.isArray(data.result) ? data.result : (data.result?.objects || []);

    // Check if folder has files other than .folder marker
    const nonMarkerFiles = objects.filter((obj: any) => !obj.key.endsWith('/.folder'));

    if (nonMarkerFiles.length > 0) {
      return NextResponse.json({ 
        error: 'Folder is not empty', 
        fileCount: nonMarkerFiles.length 
      }, { status: 400 });
    }

    // Delete all objects in the folder (including marker)
    const deletePromises = objects.map((obj: any) => {
      const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(obj.key)}`;
      return fetch(deleteUrl, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}` },
      });
    });

    await Promise.all(deletePromises);

    return NextResponse.json({ success: true, deletedCount: objects.length });

  } catch (error) {
    console.error('[r2-folders] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}
