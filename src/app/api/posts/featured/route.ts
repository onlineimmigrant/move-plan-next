import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const envErrorResponse = () =>
  NextResponse.json(
    { error: 'Missing environment variables' },
    { status: 500 }
  );

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

// Helper function to flatten JSONB fields for backward compatibility
function flattenBlogPost(post: any) {
  if (!post) return post;
  
  return {
    ...post,
    // Flatten display_config
    display_this_post: post.display_config?.display_this_post ?? post.display_this_post,
    display_as_blog_post: post.display_config?.display_as_blog_post ?? post.display_as_blog_post,
    is_displayed_first_page: post.display_config?.is_displayed_first_page ?? post.is_displayed_first_page,
    is_help_center: post.display_config?.is_help_center ?? post.is_help_center,
    help_center_order: post.display_config?.help_center_order ?? post.help_center_order,
    type: post.display_config?.type ?? 'default',
    // Flatten organization_config
    section_id: post.organization_config?.section_id ?? post.section_id,
    subsection: post.organization_config?.subsection ?? post.subsection,
    order: post.organization_config?.order ?? post.order,
    // Flatten media_config
    main_photo: post.media_config?.main_photo ?? post.main_photo,
    // Flatten author_config
    is_with_author: post.author_config?.is_with_author ?? post.is_with_author,
    is_company_author: post.author_config?.is_company_author ?? post.is_company_author,
    author_id: post.author_config?.author_id ?? post.author_id,
    // Flatten CTA cards (array)
    cta_card_one_id: post.cta_config?.cta_cards?.[0] ?? post.cta_card_one_id,
    cta_card_two_id: post.cta_config?.cta_cards?.[1] ?? post.cta_card_two_id,
    cta_card_three_id: post.cta_config?.cta_cards?.[2] ?? post.cta_card_three_id,
    cta_card_four_id: post.cta_config?.cta_cards?.[3] ?? post.cta_card_four_id,
    // Flatten products (array)
    product_1_id: post.product_config?.products?.[0] ?? post.product_1_id,
    product_2_id: post.product_config?.products?.[1] ?? post.product_2_id,
  };
}

// GET handler for featured blog posts (is_displayed_first_page = true)
export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const { data: posts, error: fetchError } = await supabase
      .from('blog_post')
      .select(`
        id, slug, title, description,
        display_config,
        organization_config,
        media_config,
        organization_id, created_on
      `)
      .eq('organization_id', organizationId)
      .eq('display_config->>is_displayed_first_page', 'true')
      .eq('display_config->>display_this_post', 'true')
      .order('created_on', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch featured posts', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json((posts || []).map(flattenBlogPost), { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/posts/featured:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
