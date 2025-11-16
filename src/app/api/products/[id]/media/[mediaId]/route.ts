import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { mediaId: mediaIdStr } = await params;
    const mediaId = parseInt(mediaIdStr, 10);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('product_media')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting product media:', error);
      return NextResponse.json(
        { error: 'Failed to delete product media' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in product media DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { mediaId: mediaIdStr } = await params;
    const mediaId = parseInt(mediaIdStr, 10);

    if (isNaN(mediaId)) {
      return NextResponse.json(
        { error: 'Invalid media ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    if (body.order !== undefined) updates.order = body.order;
    if (body.name !== undefined) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.video_url !== undefined) updates.video_url = body.video_url;
    if (body.thumbnail_url !== undefined) updates.thumbnail_url = body.thumbnail_url;
    
    // Handle attrs updates (merge with existing attrs if needed)
    if (body.unsplash_attribution !== undefined) {
      // For now, just set the unsplash_attribution in attrs
      // In future, you might want to fetch existing attrs and merge
      updates.attrs = { unsplash_attribution: body.unsplash_attribution };
    }

    const { data, error } = await supabase
      .from('product_media')
      .update(updates)
      .eq('id', mediaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product media:', error);
      return NextResponse.json(
        { error: 'Failed to update product media' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in product media PATCH:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
