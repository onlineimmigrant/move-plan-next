import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

const envErrorResponse = () => {
  console.error('Missing Supabase environment variables');
  return NextResponse.json(
    { error: 'Server configuration error: Missing Supabase credentials' },
    { status: 500 }
  );
};

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received GET request for /api/posts');

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    console.log('organization_id:', organizationId);

    if (!organizationId) {
      console.error('Missing organization_id in query parameters');
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log('Fetching posts from Supabase for organization_id:', organizationId);
    const { data: postsData, error: postsError } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, display_this_post, display_as_blog_post, main_photo, section_id, subsection, organization_id')
      .eq('display_this_post', true)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('created_on', { ascending: false });

    if (postsError) {
      console.error('Supabase query error:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    // Log each post's subsection and organization_id to confirm
    postsData.forEach(post => console.log(`Post ID ${post.id} subsection:`, post.subsection, 'organization_id:', post.organization_id));
    console.log('Fetched posts:', postsData);

    return NextResponse.json(postsData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in GET /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/posts');

  try {
    const body = await request.json();
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
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Fetch organization_id
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
      return NextResponse.json({ error: 'Slug already exists for this organization' }, { status: 409 });
    }
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Slug check error:', slugCheckError);
      return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
    }

    console.log('Inserting new post into Supabase...');
    const { data: newPost, error: insertError } = await supabase
      .from('blog_post')
      .insert({
        title,
        slug,
        content,
        description,
        display_this_post,
        display_as_blog_post,
        main_photo,
        created_on: new Date().toISOString(),
        section_id,
        subsection,
        is_with_author,
        is_company_author,
        faq_section_is_title,
        author_id,
        cta_card_one_id,
        cta_card_two_id,
        cta_card_three_id,
        cta_card_four_id,
        product_1_id,
        product_2_id,
        organization_id: organizationId,
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create post', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('New post created:', newPost);
    return NextResponse.json(newPost, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/posts:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}