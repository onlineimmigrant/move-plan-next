import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('product_media')
      .select('*')
      .eq('product_id', productId)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching product media:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product media' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in product media GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      image_url,
      video_url,
      video_player = 'vimeo',
      thumbnail_url,
      name,
      description,
      is_video = false,
      attrs, // New: accepts complete attrs object with unsplash_attribution or pexels_attribution
    } = body;

    // Get organization_id from the product
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('organization_id')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Get the highest order number for this product
    const { data: existingMedia } = await supabase
      .from('product_media')
      .select('order')
      .eq('product_id', productId)
      .order('order', { ascending: false })
      .limit(1);

    const nextOrder = existingMedia && existingMedia.length > 0 
      ? (existingMedia[0].order || 0) + 1 
      : 1;

    const mediaData: any = {
      product_id: productId,
      organization_id: product.organization_id,
      order: nextOrder,
      is_video,
      video_player,
    };

    if (name) mediaData.name = name;
    if (description) mediaData.description = description;
    if (image_url) mediaData.image_url = image_url;
    if (video_url) mediaData.video_url = video_url;
    if (thumbnail_url) mediaData.thumbnail_url = thumbnail_url;
    
    // Store attrs (can contain unsplash_attribution, pexels_attribution, or other metadata)
    if (attrs && Object.keys(attrs).length > 0) {
      mediaData.attrs = attrs;
    }

    const { data, error } = await supabase
      .from('product_media')
      .insert(mediaData)
      .select()
      .single();

    if (error) {
      console.error('Error creating product media:', error);
      return NextResponse.json(
        { error: 'Failed to create product media' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in product media POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
