import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mediaId = parseInt(id, 10);
    
    if (isNaN(mediaId)) {
      return NextResponse.json({ error: 'Invalid media ID' }, { status: 400 });
    }

    const body = await request.json();
    const { thumbnail_url } = body;

    if (!thumbnail_url) {
      return NextResponse.json({ error: 'thumbnail_url is required' }, { status: 400 });
    }

    // Update the product_media record
    const { data, error } = await supabase
      .from('product_media')
      .update({ thumbnail_url })
      .eq('id', mediaId)
      .select();

    if (error) {
      console.error('[Update Media Thumbnail] Error:', error);
      return NextResponse.json({ error: 'Failed to update thumbnail', details: error }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('[Update Media Thumbnail] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
