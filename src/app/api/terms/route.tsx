import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
);

const envErrorResponse = () => {
  console.error('Missing Supabase environment variables');
  return NextResponse.json(
    { error: 'Server configuration error: Missing Supabase credentials' },
    { status: 500 },
  );
};

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received GET request for /api/terms');

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    console.log('organization_id:', organizationId);

    if (!organizationId) {
      console.error('Missing organization_id in query parameters');
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log('Fetching terms from Supabase for organization_id:', organizationId);
    const { data: termsData, error: termsError } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, display_this_post, display_as_blog_post, main_photo, section_id, subsection, organization_id')
      .eq('display_this_post', true)
      .eq('subsection', 'Terms')
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('created_on', { ascending: false });

    if (termsError) {
      console.error('Supabase query error:', termsError);
      return NextResponse.json(
        { error: 'Failed to fetch terms', details: termsError.message },
        { status: 500 },
      );
    }

    termsData.forEach(post => console.log(`Term ID ${post.id} subsection:`, post.subsection, 'organization_id:', post.organization_id));
    console.log('Fetched terms:', termsData);

    return NextResponse.json(termsData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in GET /api/terms:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/terms');

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
        { status: 400 },
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
      return NextResponse.json({ error: 'Slug already exists for this organization' }, { status: 409 });
    }
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Slug check error:', slugCheckError);
      return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
    }

    console.log('Inserting new term into Supabase...');
    const { data: newTerm, error: insertError } = await supabase
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
        subsection: 'Terms',
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
        { error: 'Failed to create term', details: insertError.message },
        { status: 500 },
      );
    }

    console.log('New term created:', newTerm);
    return NextResponse.json(newTerm, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/terms:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}