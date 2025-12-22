// src/app/api/posts/route.ts
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
  };
  
  organization_config?: {
    section_id?: number | null;
    subsection?: string | null;
    order?: number;
    section?: string | null; // Section name like 'Landing'
  };
  
  cta_config?: {
    cta_cards?: number[];  // Array of CTA card IDs
  };
  
  author_config?: {
    is_with_author?: boolean;
    is_company_author?: boolean;
    author_id?: number | null;
  };
  
  product_config?: {
    products?: number[];  // Array of product IDs
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
  
  translations?: Record<string, { title?: string; description?: string; content?: string }>;
  
  // Metadata
  organization_id?: number;
  created_on?: string;
  last_modified?: string;
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

// In-memory cache + single-flight handling
const POSTS_CACHE_TTL_MS = 30_000; // 30s TTL (adjust as needed)
type PostsCacheEntry = { payload: any; expires: number };
const postsCache = new Map<string, PostsCacheEntry>();
const inflightPosts = new Map<string, Promise<any>>();

function buildCacheKey(org: string, limit: string | null, offset: string | null) {
  return `${org}:${limit || '8'}:${offset || '0'}`;
}

async function fetchPostsFromDB(organizationId: string, limit: string | null, offset: string | null) {
  // Get all posts first, then filter in code since JSONB boolean filtering is tricky
  const { data: allPosts, error } = await supabase
    .from('blog_post')
    .select(
      `id, slug, title, description, display_config, organization_config, media_config, last_modified, author_name`
    )
    .eq('organization_id', organizationId)
    .order('last_modified', { ascending: false });

  if (error) throw error;

  // Filter posts that should be displayed as blog posts
  // Only include posts where both flags are true or undefined/null (default to true)
  const blogPosts = (allPosts || []).filter((p: any) => {
    const displayThis = p.display_config?.display_this_post;
    const asBlogPost = p.display_config?.display_as_blog_post;
    
    // If explicitly false, exclude
    if (displayThis === false || asBlogPost === false) {
      return false;
    }
    
    // Otherwise include (true, null, or undefined)
    return true;
  });

  const parsedLimit = parseInt(limit || '8');
  const parsedOffset = parseInt(offset || '0');

  // Apply pagination
  const paginatedPosts = parsedLimit > 0 
    ? blogPosts.slice(parsedOffset, parsedOffset + parsedLimit)
    : blogPosts;

  return {
    posts: paginatedPosts.map(flattenBlogPost),
    total: blogPosts.length,
    hasMore: parsedOffset + paginatedPosts.length < blogPosts.length
  };
}

// GET handler for listing all posts (cached)
export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');
  const nocache = searchParams.get('nocache') === '1';

  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  const key = buildCacheKey(organizationId, limit, offset);

  if (!nocache) {
    const cached = postsCache.get(key);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(cached.payload, { status: 200 });
    }
  }

  if (!nocache && inflightPosts.has(key)) {
    try {
      const payload = await inflightPosts.get(key)!;
      return NextResponse.json(payload, { status: 200 });
    } catch (err) {
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: err instanceof Error ? err.message : 'Unknown error' },
        { status: 500 }
      );
    }
  }

  const promise = fetchPostsFromDB(organizationId, limit, offset)
    .then((payload) => {
      postsCache.set(key, { payload, expires: Date.now() + POSTS_CACHE_TTL_MS });
      return payload;
    })
    .finally(() => {
      inflightPosts.delete(key);
    });

  inflightPosts.set(key, promise);

  try {
    const payload = await promise;
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler for creating new posts
export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/posts');

  try {
    const body: BlogPostBody = await request.json();
    const {
      title,
      slug,
      content,
      description = '',
      faq_section_is_title = false,
      
      // Extract nested JSONB fields (with defaults)
      display_config = {},
      organization_config = {},
      cta_config = {},
      author_config = {},
      product_config = {},
      media_config = {},
      translations = {},
    } = body;

    // Extract individual fields for easier handling
    const display_this_post = display_config.display_this_post ?? true;
    const display_as_blog_post = display_config.display_as_blog_post ?? false;
    const is_displayed_first_page = display_config.is_displayed_first_page ?? false;
    const is_help_center = display_config.is_help_center ?? false;
    const help_center_order = display_config.help_center_order ?? 0;
    
    const section_id = organization_config.section_id ?? null;
    const subsection = organization_config.subsection ?? null;
    const order = organization_config.order ?? 0;
    const section = organization_config.section ?? null;
    
    const cta_cards = cta_config.cta_cards ?? [];
    const products = product_config.products ?? [];
    
    const is_with_author = author_config.is_with_author ?? false;
    const is_company_author = author_config.is_company_author ?? false;
    const author_id = author_config.author_id ?? null;

    // Only require title and content if section is NOT 'Landing'
    const isLandingPage = section === 'Landing';
    
    if (!isLandingPage && (!title || !slug || !content)) {
      console.error('Missing required fields:', { title: !!title, slug: !!slug, content: !!content, section });
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }
    
    // For landing pages, only slug is required
    if (isLandingPage && !slug) {
      console.error('Missing required field for landing page:', { slug: !!slug, section });
      return NextResponse.json(
        { error: 'Missing required field: slug is required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('Checking if slug exists:', slug, 'organization_id:', organizationId);
    const { data: existingPost, error: slugCheckError } = await supabase
      .from('blog_post')
      .select('slug')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single();

    if (existingPost) {
      console.error('Slug already exists:', slug);
      return NextResponse.json({ error: 'Slug already exists for this organization' }, { status: 409 });
    }
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Slug check error:', slugCheckError);
      return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
    }

    console.log('Inserting new post into Supabase...');
    
    // Build insert data with JSONB fields
    const insertData = {
      title,
      slug,
      content,
      description,
      faq_section_is_title,
      created_on: new Date().toISOString(),
      organization_id: organizationId,
      
      // JSONB fields
      display_config: {
        display_this_post,
        display_as_blog_post,
        is_displayed_first_page,
        is_help_center,
        help_center_order,
      },
      
      organization_config: {
        section_id,
        subsection,
        order,
      },
      
      cta_config: {
        cta_cards,
      },
      
      author_config: {
        is_with_author,
        is_company_author,
        author_id,
      },
      
      product_config: {
        products,
      },
      
      media_config,
      
      ...(Object.keys(translations).length > 0 && { translations }),
    };
    
    const { data: newPost, error: insertError } = await supabase
      .from('blog_post')
      .insert(insertData)
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create post', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('New post created successfully:', newPost);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
