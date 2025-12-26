import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; mediaId: string }> }
) {
  try {
    const { mediaId } = await context.params;

    const { error } = await supabase
      .from('feature_media')
      .delete()
      .eq('id', mediaId);

    if (error) {
      console.error('Error deleting feature media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/features/[slug]/media/[mediaId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string; mediaId: string }> }
) {
  try {
    const { mediaId } = await context.params;
    const body = await request.json();

    const { data, error } = await supabase
      .from('feature_media')
      .update(body)
      .eq('id', mediaId)
      .select()
      .single();

    if (error) {
      console.error('Error updating feature media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in PATCH /api/features/[slug]/media/[mediaId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
