import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ featureId: string; mediaId: string }> }
) {
  try {
    const { featureId, mediaId } = await context.params;

    if (!featureId || !mediaId) {
      return NextResponse.json({ error: 'Missing featureId or mediaId' }, { status: 400 });
    }

    // Verify the media belongs to the feature before deleting
    const { data: media, error: fetchError } = await supabase
      .from('feature_media')
      .select('id')
      .eq('id', mediaId)
      .eq('feature_id', featureId)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete the media
    const { error: deleteError } = await supabase
      .from('feature_media')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      console.error('Error deleting feature media:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Media deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/features/by-id/[featureId]/media/[mediaId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ featureId: string; mediaId: string }> }
) {
  try {
    const { featureId, mediaId } = await context.params;
    const body = await request.json();

    if (!featureId || !mediaId) {
      return NextResponse.json({ error: 'Missing featureId or mediaId' }, { status: 400 });
    }

    // Verify the media belongs to the feature before updating
    const { data: media, error: fetchError } = await supabase
      .from('feature_media')
      .select('id')
      .eq('id', mediaId)
      .eq('feature_id', featureId)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Update the thumbnail
    const { data, error: updateError } = await supabase
      .from('feature_media')
      .update({ thumbnail_url: body.thumbnail_url })
      .eq('id', mediaId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating feature media thumbnail:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/features/by-id/[featureId]/media/[mediaId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
