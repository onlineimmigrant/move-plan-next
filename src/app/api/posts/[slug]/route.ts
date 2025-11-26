//posts/[slug]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

// Define a type for the blog post body - UPDATED FOR JSONB
type BlogPostBody = {
  // Core fields
  title: string;
  slug: string;
  content?: string;
  description?: string;
  faq_section_is_title?: boolean;
  
  // JSONB configuration objects
  display_config?: {
    display_this_post?: boolean;
    display_as_blog_post?: boolean;
    is_displayed_first_page?: boolean;
    is_help_center?: boolean;
    help_center_order?: number;
    type?: 'default' | 'minimal' | 'landing' | 'doc_set';
    is_numbered?: boolean;
  };
  
  organization_config?: {
    section_id?: number | null;
    subsection?: string | null;
    order?: number;
    doc_set?: string | null;
    doc_set_order?: number | null;
    doc_set_title?: string | null;
  };
  
  cta_config?: {
    cta_cards?: number[];
  };
  
  author_config?: {
    is_with_author?: boolean;
    is_company_author?: boolean;
    author_id?: number | null;
  };
  
  product_config?: {
    products?: number[];
  };
  
  media_config?: {
    main_photo?: string | null;
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
  };
  
  // Metadata
  created_on?: string;
  organization_id?: string;
};

// Single Supabase client instance
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

// Predefined error response for missing environment variables
const envErrorResponse = () => {
  console.error('Missing Supabase environment variables');
  return NextResponse.json(
    { error: 'Server configuration error: Missing Supabase credentials' },
    { status: 500 }
  );
};

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
    is_numbered: post.display_config?.is_numbered ?? false,
    // Flatten organization_config
    section_id: post.organization_config?.section_id ?? post.section_id,
    subsection: post.organization_config?.subsection ?? post.subsection,
    order: post.organization_config?.order ?? post.order,
    doc_set: post.organization_config?.doc_set ?? null,
    doc_set_order: post.organization_config?.doc_set_order ?? null,
    doc_set_title: post.organization_config?.doc_set_title ?? null,
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

// GET handler
export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (!hasEnvVars) return envErrorResponse();

  const { slug } = await context.params;
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  console.log('Received GET request for /api/posts/[slug]:', slug, 'organization_id:', organizationId);

  const nocache = searchParams.get('nocache') === '1';

  if (!organizationId) {
    console.error('Missing organization_id in query parameters');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fallbackOrgId = await getOrganizationId(baseUrl);
    if (!fallbackOrgId) {
      return NextResponse.json({ error: 'Organization ID is required and could not be resolved' }, { status: 400 });
    }
    console.log('Using fallback organization_id:', fallbackOrgId);
    try {
      const { data: postData, error: postError } = await supabase
        .from('blog_post')
        .select('id, slug, title, description, content, content_type, created_on, last_modified, organization_id, display_config, organization_config, media_config')
        .eq('slug', slug)
        .eq('organization_id', fallbackOrgId)
        .maybeSingle();

      if (postError) {
        console.error('Supabase query error:', postError);
        return NextResponse.json(
          { error: 'Failed to fetch post', details: postError.message },
          { status: 500 }
        );
      }

      if (!postData) {
        console.log('No post found for slug:', slug, 'organization_id:', fallbackOrgId);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      if ((postData.display_config as any)?.display_this_post === false) {
        console.log('Post hidden via display_config.display_this_post false:', slug);
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
      }

      console.log('Fetched post:', postData);
      console.log('🔍 Content field check:', {
        hasContent: !!postData.content,
        contentLength: postData.content?.length || 0,
        contentType: postData.content_type,
        contentPreview: postData.content?.substring(0, 100)
      });
      return NextResponse.json(flattenBlogPost(postData), {
        status: 200,
        headers: nocache ? {
          'Cache-Control': 'no-store',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        } : {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    } catch (error) {
      console.error('Error in GET /api/posts/[slug] with fallback:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  try {
    console.log('Fetching post from Supabase for slug:', slug, 'organization_id:', organizationId);
    const { data: postData, error: postError } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, content, content_type, created_on, last_modified, organization_id, display_config, organization_config, media_config')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (postError) {
      console.error('Supabase query error:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch post', details: postError.message },
        { status: 500 }
      );
    }

    if (!postData) {
      console.log('No post found for slug:', slug, 'organization_id:', organizationId);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if ((postData.display_config as any)?.display_this_post === false) {
      console.log('Post hidden via display_config.display_this_post false:', slug);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    console.log('Fetched post:', postData);
    console.log('🔍 Content field check:', {
      hasContent: !!postData.content,
      contentLength: postData.content?.length || 0,
      contentType: postData.content_type,
      contentPreview: postData.content?.substring(0, 100)
    });
    
    const flattenedPost = flattenBlogPost(postData);
    console.log('🔍 After flattening:', {
      hasContent: !!flattenedPost.content,
      contentLength: flattenedPost.content?.length || 0,
      contentType: flattenedPost.content_type
    });
    
    return NextResponse.json(flattenedPost, {
      status: 200,
      headers: nocache ? {
        'Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      } : {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Error in GET /api/posts/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PATCH handler
export async function PATCH(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  if (!hasEnvVars) return envErrorResponse();

  const { slug } = await context.params;
  console.log('Received PATCH request for /api/posts/[slug]:', slug);
  console.log('Request headers:', Object.fromEntries(request.headers));

  try {
    const body = await request.json();
    console.log('PATCH request body:', body);

    const {
      title,
      slug: newSlug,
      content,
      content_type,
      description,
      faq_section_is_title,
      display_config,
      organization_config,
      cta_config,
      author_config,
      product_config,
      media_config,
      translations,
      organization_id: providedOrgId,
    } = body;

    // Fallback to getOrganizationId if organization_id is missing
    let organization_id: string | undefined = providedOrgId;
    if (!organization_id) {
      console.warn('Missing organization_id in request body, attempting fallback');
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const resolvedOrgId = await getOrganizationId(baseUrl);
      if (!resolvedOrgId) {
        console.error('Could not resolve organization_id');
        return NextResponse.json({ error: 'Organization ID is required and could not be resolved' }, { status: 400 });
      }
      organization_id = resolvedOrgId;
      console.log('Using fallback organization_id:', organization_id);
    }
    console.log('Resolved organization_id:', organization_id);

    console.log('Checking if post exists for slug:', slug, 'organization_id:', organization_id);
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_post')
      .select('id, display_config, organization_config, cta_config, author_config, product_config, media_config, translations')
      .eq('slug', slug)
      .or(`organization_id.eq.${organization_id},organization_id.is.null`)
      .single();

    if (fetchError || !existingPost) {
      console.error('Post not found or fetch error:', fetchError?.message || 'No post found');
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (newSlug && newSlug !== slug) {
      console.log('Checking if new slug exists:', newSlug, 'organization_id:', organization_id);
      const { data: slugCheck, error: slugCheckError } = await supabase
        .from('blog_post')
        .select('slug')
        .eq('slug', newSlug)
        .eq('organization_id', organization_id)
        .single();

      if (slugCheck) {
        console.error('New slug already exists:', newSlug);
        return NextResponse.json({ error: 'New slug already exists for this organization' }, { status: 409 });
      }
      if (slugCheckError && slugCheckError.code !== 'PGRST116') {
        console.error('Slug check error:', slugCheckError);
        return NextResponse.json({ error: 'Failed to check slug availability', details: slugCheckError.message }, { status: 500 });
      }
    }

    console.log('Building update data for post...');
    const updateData: Record<string, any> = {};
    
    // Update core fields
    if (title !== undefined) updateData.title = title;
    if (newSlug !== undefined) updateData.slug = newSlug;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) {
      updateData.content = content;
    }
    if (content_type !== undefined) {
      updateData.content_type = content_type;
    }
    if (faq_section_is_title !== undefined) updateData.faq_section_is_title = faq_section_is_title;
    
    // Update JSONB fields (merge with existing values)
    if (display_config !== undefined) {
      updateData.display_config = {
        ...existingPost.display_config,
        ...display_config,
      };
    }
    
    if (organization_config !== undefined) {
      updateData.organization_config = {
        ...existingPost.organization_config,
        ...organization_config,
      };
    }
    
    if (cta_config !== undefined) {
      updateData.cta_config = {
        ...existingPost.cta_config,
        ...cta_config,
      };
    }
    
    if (author_config !== undefined) {
      updateData.author_config = {
        ...existingPost.author_config,
        ...author_config,
      };
    }
    
    if (product_config !== undefined) {
      updateData.product_config = {
        ...existingPost.product_config,
        ...product_config,
      };
    }
    
    if (media_config !== undefined) {
      console.log('📸 API received media_config:', media_config);
      console.log('📸 Existing media_config:', existingPost.media_config);
      updateData.media_config = {
        ...existingPost.media_config,
        ...media_config,
      };
      console.log('📸 Merged media_config:', updateData.media_config);
    }

    if (translations !== undefined) {
      console.log('🌐 API received translations:', translations);
      console.log('🌐 Existing translations:', existingPost.translations);
      updateData.translations = translations; // Replace entirely, don't merge
      console.log('🌐 Updated translations:', updateData.translations);
    }

    if (Object.keys(updateData).length === 0) {
      console.warn('No fields provided to update');
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 });
    }

    console.log('Updating post in Supabase with data:', updateData);
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_post')
      .update(updateData)
      .eq('slug', slug)
      .or(`organization_id.eq.${organization_id},organization_id.is.null`)
      .select('*')
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update post', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('Post updated successfully:', updatedPost);
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/posts/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT handler (alias for PATCH for backward compatibility)
export async function PUT(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  return PATCH(request, context);
}