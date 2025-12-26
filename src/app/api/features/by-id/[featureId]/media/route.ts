import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ featureId: string }> }
) {
  try {
    const { featureId } = await context.params;

    if (!featureId) {
      return NextResponse.json({ error: 'Missing featureId' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('feature_media')
      .select('*')
      .eq('feature_id', featureId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching feature media by id:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('Error in GET /api/features/by-id/[featureId]/media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
