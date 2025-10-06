// src/app/api/posts/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

// Define a type for the blog post body
type BlogPostBody = {
  title: string;
  slug: string;
  content: string;
  description?: string;
  display_this_post?: boolean;
  display_as_blog_post?: boolean;
  main_photo?: string | null;
  section_id?: number | null;
  subsection?: string | null;
  is_with_author?: boolean;
  is_company_author?: boolean;
  faq_section_is_title?: boolean;
  author_id?: number | null;
  cta_card_one_id?: number | null;
  cta_card_two_id?: number | null;
  cta_card_three_id?: number | null;
  cta_card_four_id?: number | null;
  product_1_id?: number | null;
  product_2_id?: number | null;
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

// GET handler for listing all posts
export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  
  console.log('Received GET request for /api/posts, organization_id:', organizationId);

  if (!organizationId) {
    console.error('Missing organization_id in query parameters');
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const { data: posts, error: fetchError } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, main_photo, display_this_post, display_as_blog_post, subsection, order, section_id, organization_id, created_on')
      .eq('organization_id', organizationId)
      .order('created_on', { ascending: false });

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(posts || [], { status: 200 });
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
      display_this_post = true,
      display_as_blog_post = false,
      main_photo = null,
      section_id = null,
      subsection = null,
      is_with_author = false,
      is_company_author = false,
      faq_section_is_title = false,
      author_id = null,
      cta_card_one_id = null,
      cta_card_two_id = null,
      cta_card_three_id = null,
      cta_card_four_id = null,
      product_1_id = null,
      product_2_id = null,
    } = body;

    if (!title || !slug || !content) {
      console.error('Missing required fields:', { title: !!title, slug: !!slug, content: !!content });
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
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
    
    // Build insert data object, only including fields that have values
    const insertData: Record<string, any> = {
      title,
      slug,
      content,
      description,
      display_this_post,
      display_as_blog_post,
      created_on: new Date().toISOString(),
      organization_id: organizationId,
    };
    
    // Add optional fields only if they have values
    if (main_photo !== null) insertData.main_photo = main_photo;
    if (section_id !== null) insertData.section_id = section_id;
    if (subsection !== null) insertData.subsection = subsection;
    if (is_with_author) insertData.is_with_author = is_with_author;
    if (is_company_author) insertData.is_company_author = is_company_author;
    if (faq_section_is_title) insertData.faq_section_is_title = faq_section_is_title;
    if (cta_card_one_id !== null) insertData.cta_card_one_id = cta_card_one_id;
    if (cta_card_two_id !== null) insertData.cta_card_two_id = cta_card_two_id;
    if (cta_card_three_id !== null) insertData.cta_card_three_id = cta_card_three_id;
    if (cta_card_four_id !== null) insertData.cta_card_four_id = cta_card_four_id;
    if (product_1_id !== null) insertData.product_1_id = product_1_id;
    if (product_2_id !== null) insertData.product_2_id = product_2_id;
    // Note: author_id is intentionally omitted as it doesn't exist in the schema
    
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
