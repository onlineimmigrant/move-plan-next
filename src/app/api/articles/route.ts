import { NextRequest, NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const offset = parseInt(searchParams.get('offset') || '0');
  const limit = parseInt(searchParams.get('limit') || '20');

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

    const { data, error, count } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, content, subsection, author_name, created_on, display_this_post, main_photo', { count: 'exact' })
      .eq('display_this_post', true)
      .or(`organization_id.eq.${effectiveOrgId},organization_id.is.null`)
      .order('created_on', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching articles:', error.message);
      return NextResponse.json(
        { error: 'Failed to load articles' },
        { status: 500 }
      );
    }

    const totalCount = count || 0;
    const hasMore = offset + limit < totalCount;

    // Calculate reading time based on word count (average 200 words per minute)
    const articlesWithReadTime = (data || []).map(article => ({
      ...article,
      readTime: Math.max(1, Math.ceil((article.content || '').split(/\s+/).length / 200))
    }));

    return NextResponse.json({
      data: articlesWithReadTime,
      hasMore,
      total: totalCount
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
