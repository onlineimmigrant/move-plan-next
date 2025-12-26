import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simplified endpoint for ChangeThumbnailModal compatibility
// Accepts mediaId directly without needing slug
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ mediaId: string }> }
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
    console.error('Error in PATCH /api/features/media/[mediaId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
