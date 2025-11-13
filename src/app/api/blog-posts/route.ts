import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  const sortBy = searchParams.get('sort_by') || 'order'; // order, subsection, created_on, last_modified

  if (!organizationId) {
    return NextResponse.json(
      { error: 'Organization ID is required' },
      { status: 400 }
    );
  }

  try {
    let query = supabase
      .from('blog_post')
      .select('id, title, slug, description, organization_config, media_config, organization_id, created_on, last_modified')
      .eq('organization_id', organizationId);

    // Apply sorting based on sortBy parameter
    switch (sortBy) {
      case 'subsection':
        query = query.order('organization_config->subsection', { ascending: true, nullsFirst: false });
        break;
      case 'created_on':
        query = query.order('created_on', { ascending: false });
        break;
      case 'last_modified':
        query = query.order('last_modified', { ascending: false, nullsFirst: false });
        break;
      case 'order':
      default:
        query = query.order('organization_config->order', { ascending: true, nullsFirst: false });
        break;
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blog posts' },
        { status: 500 }
      );
    }

    // Transform the data to include order at top level
    const transformedPosts = (posts || []).map((post: any, index: number) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      description: post.description,
      order: post.organization_config?.order ?? index,
      subsection: post.organization_config?.subsection ?? null,
      main_photo: post.media_config?.main_photo ?? null,
      organization_id: post.organization_id,
      created_on: post.created_on,
      last_modified: post.last_modified,
    }));

    return NextResponse.json({ posts: transformedPosts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { posts } = body;

    if (!Array.isArray(posts)) {
      return NextResponse.json(
        { error: 'Posts array is required' },
        { status: 400 }
      );
    }

    // Update each post's organization_config.order while preserving other fields
    const updates = posts.map(async (post: { id: string; order: number }) => {
      // First, fetch the current post to get existing organization_config
      const { data: currentPost, error: fetchError } = await supabase
        .from('blog_post')
        .select('organization_config')
        .eq('id', post.id)
        .single();

      if (fetchError) throw fetchError;

      // Merge the new order with existing organization_config
      const updatedConfig = {
        ...(currentPost?.organization_config || {}),
        order: post.order
      };

      // Update with merged config
      const { error: updateError } = await supabase
        .from('blog_post')
        .update({
          organization_config: updatedConfig
        })
        .eq('id', post.id);

      if (updateError) throw updateError;
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating blog post order:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post order' },
      { status: 500 }
    );
  }
}
