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

export async function DELETE(request: NextRequest) {
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

    // Get video URL from request body
    const { videoUrl } = await request.json();
    if (!videoUrl || !videoUrl.startsWith(R2_PUBLIC_URL)) {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 400 });
    }

    // Extract the R2 object key from the URL
    const objectKey = videoUrl.replace(`${R2_PUBLIC_URL}/`, '');
    
    // Verify the video belongs to this organization
    if (!objectKey.startsWith(organizationId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('[delete-r2-video] Deleting:', objectKey);

    // Delete from R2 storage
    const deleteUrl = `https://api.cloudflare.com/client/v4/accounts/${R2_ACCOUNT_ID}/r2/buckets/${R2_BUCKET_NAME}/objects/${encodeURIComponent(objectKey)}`;
    
    const deleteResponse = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text();
      console.error('[delete-r2-video] R2 delete failed:', deleteResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to delete from R2 storage' }, { status: 500 });
    }

    console.log('[delete-r2-video] Deleted from R2 successfully');

    // Also delete from product_media if it exists
    const { error: dbError } = await supabase
      .from('product_media')
      .delete()
      .eq('video_url', videoUrl)
      .eq('organization_id', organizationId);

    if (dbError) {
      console.error('[delete-r2-video] DB delete error (non-fatal):', dbError);
      // Don't fail the request if DB delete fails - the file is already deleted from R2
    }

    return NextResponse.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('[delete-r2-video] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete video', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
