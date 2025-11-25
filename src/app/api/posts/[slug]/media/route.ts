// app/api/posts/[id]/media/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// GET - Fetch all media items for a post
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const params = await context.params;
    const organizationId = await getOrganizationId();
    
    // First, get the post ID from the slug
    const { data: post, error: postError } = await supabase
      .from('blog_post')
      .select('id')
      .eq('slug', params.slug)
      .eq('organization_id', organizationId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data, error } = await supabase
      .from('post_media')
      .select('*')
      .eq('post_id', post.id)
      .order('order', { ascending: true });

    if (error) {
      console.error('Error fetching post media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create a new media item
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const params = await context.params;
    const organizationId = await getOrganizationId();
    
    // First, get the post_id from slug
    const { data: post, error: postError } = await supabase
      .from('blog_post')
      .select('id')
      .eq('slug', params.slug)
      .eq('organization_id', organizationId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const body = await request.json();

    const { data, error } = await supabase
      .from('post_media')
      .insert({
        post_id: post.id,
        organization_id: organizationId,
        ...body,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating post media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
