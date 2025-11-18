import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/getSettings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN!;
const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL!;

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization from base_url
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get request body
    const { oldKey, newFileName } = await request.json();
    
    if (!oldKey || !newFileName) {
      return NextResponse.json({ error: 'Missing oldKey or newFileName' }, { status: 400 });
    }

    // Verify the video belongs to this organization
    if (!oldKey.startsWith(organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Extract folder from old key: orgId/videos/folder/file.mp4
    const keyParts = oldKey.split('/');
    const folder = keyParts.length >= 4 ? keyParts[2] : 'uncategorized';
    
    // Sanitize new filename
    const sanitizedFileName = newFileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const newKey = `${organizationId}/videos/${folder}/${sanitizedFileName}`;

    console.log('[rename-r2-video] Renaming:', { oldKey, newKey });

    // R2 doesn't have native rename - need to copy then delete
    // Step 1: Get the original object
    const getUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(oldKey)}`;
    
    const getResponse = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!getResponse.ok) {
      const errorText = await getResponse.text();
      console.error('[rename-r2-video] Failed to fetch original:', getResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to fetch original video' }, { status: 500 });
    }

    const videoBuffer = await getResponse.arrayBuffer();
    const contentType = getResponse.headers.get('content-type') || 'video/mp4';

    // Step 2: Upload with new key
    const putUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(newKey)}`;
    
    const putResponse = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': contentType,
      },
      body: videoBuffer,
    });

    if (!putResponse.ok) {
      const errorText = await putResponse.text();
      console.error('[rename-r2-video] Failed to upload renamed:', putResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to create renamed video' }, { status: 500 });
    }

    // Step 3: Delete old object
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(oldKey)}`;
    
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!deleteResponse.ok) {
      console.warn('[rename-r2-video] Failed to delete old file:', await deleteResponse.text());
      // Continue anyway - new file exists
    }

    const newUrl = `${R2_PUBLIC_URL}/${newKey}`;

    // Update product_media records if they exist
    const oldUrl = `${R2_PUBLIC_URL}/${oldKey}`;
    const { error: updateError } = await supabase
      .from('product_media')
      .update({ video_url: newUrl })
      .eq('video_url', oldUrl)
      .eq('organization_id', organizationId);

    if (updateError) {
      console.warn('[rename-r2-video] Failed to update product_media:', updateError);
    }

    return NextResponse.json({
      success: true,
      oldUrl,
      newUrl,
      newKey,
    });
  } catch (error) {
    console.error('[rename-r2-video] Error:', error);
    return NextResponse.json(
      { error: 'Failed to rename video', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
