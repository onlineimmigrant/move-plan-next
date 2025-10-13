import { NextRequest, NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

// Helper function to flatten JSONB fields for backward compatibility
function flattenBlogPost(post: any) {
  if (!post) return post;
  
  return {
    ...post,
    // Flatten display_config
    display_this_post: post.display_config?.display_this_post ?? post.display_this_post,
    display_as_blog_post: post.display_config?.display_as_blog_post ?? post.display_as_blog_post,
    is_help_center: post.display_config?.is_help_center ?? post.is_help_center,
    help_center_order: post.display_config?.help_center_order ?? post.help_center_order,
    // Flatten organization_config
    subsection: post.organization_config?.subsection ?? post.subsection,
    // Flatten media_config
    main_photo: post.media_config?.main_photo ?? post.main_photo,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');
  const helpCenterOnly = searchParams.get('helpCenterOnly') === 'true';

  try {
    let effectiveOrgId = organizationId;
    
    // If no organizationId provided, try to get it from the request
    if (!effectiveOrgId) {
      const baseUrl = getBaseUrl(true);
      effectiveOrgId = await getOrganizationId(baseUrl);
    }

    if (!effectiveOrgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('blog_post')
      .select('id, slug, title, description, content, author_name, created_on, display_config, organization_config, media_config', { count: 'exact' })
      .eq('display_config->>display_this_post', 'true')
      .or(`organization_id.eq.${effectiveOrgId},organization_id.is.null`);

    // Filter by Help Center if requested
    if (helpCenterOnly) {
      query = query.eq('display_config->>is_help_center', 'true');
    }

    // Order: prioritize help_center_order if filtering by Help Center
    if (helpCenterOnly) {
      query = query.order('display_config->help_center_order', { ascending: true, nullsFirst: false });
    }
    
    // Always add created_on as secondary sort
    query = query.order('created_on', { ascending: false });

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching articles:', error.message);
      return NextResponse.json(
        { error: 'Failed to load articles' },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    // Get category counts for all articles (not just the current page)
    let categoryCounts: Record<string, number> = {};
    if (offset === 0) { // Only fetch on first load to avoid redundant queries
      const { data: allArticles } = await supabase
        .from('blog_post')
        .select('organization_config')
        .eq('display_config->>display_this_post', 'true')
        .or(`organization_id.eq.${effectiveOrgId},organization_id.is.null`);
      
      if (allArticles) {
        categoryCounts = allArticles.reduce((acc: Record<string, number>, article: any) => {
          const category = article.organization_config?.subsection || 'General';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {});
      }
    }

    // Calculate reading time based on word count (average 200 words per minute)
    const articlesWithReadTime = (data || []).map(article => {
      const flattened = flattenBlogPost(article);
      return {
        ...flattened,
        readTime: Math.max(1, Math.ceil((flattened.content || '').split(/\s+/).length / 200))
      };
    });

    return NextResponse.json({
      data: articlesWithReadTime,
      hasMore,
      total: totalCount,
      categoryCounts: offset === 0 ? categoryCounts : undefined
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
