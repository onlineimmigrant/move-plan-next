import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // First, get the feature ID from slug
    const { data: feature, error: featureError } = await supabase
      .from('feature')
      .select('id')
      .eq('slug', slug)
      .single();

    if (featureError || !feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('feature_media')
      .select('*')
      .eq('feature_id', feature.id)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching feature media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in GET /api/features/[slug]/media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;
    const body = await request.json();

    const { data: feature, error: featureError } = await supabase
      .from('feature')
      .select('id, organization_id')
      .eq('slug', slug)
      .single();

    if (featureError || !feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 });
    }

    // Get the current max display_order
    const { data: existingMedia } = await supabase
      .from('feature_media')
      .select('display_order')
      .eq('feature_id', feature.id)
      .order('display_order', { ascending: false })
      .limit(1);

    const nextOrder = existingMedia && existingMedia.length > 0 
      ? existingMedia[0].display_order + 1 
      : 0;

    const mediaData = {
      feature_id: feature.id,
      media_type: body.media_type || 'image',
      media_url: body.media_url,
      thumbnail_url: body.thumbnail_url || null,
      alt_text: body.alt_text || null,
      storage_provider: body.storage_provider || 'r2',
      metadata: body.metadata || {},
      display_order: nextOrder,
      organization_id: feature.organization_id,
    };

    const { data, error } = await supabase
      .from('feature_media')
      .insert(mediaData)
      .select()
      .single();

    if (error) {
      console.error('Error creating feature media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/features/[slug]/media:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
