// app/api/study-resources/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received GET request for /api/study-resources');

  try {
    console.log('Fetching all resources from Supabase');
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('edu_pro_resource')
      .select(`
        *,
        product:product_id (slug)
      `); // Fetch all resource fields and product.slug

    if (resourcesError) {
      console.error('Supabase query error:', resourcesError);
      return NextResponse.json(
        { error: 'Failed to fetch resources', details: resourcesError.message },
        { status: 500 }
      );
    }

    // Map to include product_slug
    const formattedResources = resourcesData.map((resource) => ({
      ...resource,
      product_slug: resource.product?.slug || '', // Add product_slug, empty string if no product
    }));

    // Log each resource’s subsection and product_slug
    formattedResources.forEach((resource) =>
      console.log(`Resource ID ${resource.id} subsection: ${resource.subsection}, product_slug: ${resource.product_slug}`)
    );
    console.log('Fetched resources:', formattedResources);

    return NextResponse.json(formattedResources, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in GET /api/study-resources:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler unchanged exactly as you provided
export async function POST(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/resources');

  try {
    const body = await request.json();
    const {
      name,
      slug,
      content,
      description = '',
      display_this_resource = true,
      display_as_blog_resource = false,
      main_photo = null,
      section_id = null,
      subsection = null,
      is_with_author = false,
      is_company_author = false,
      faq_section_is_name = false,
      author_id = null,
      cta_card_one_id = null,
      cta_card_two_id = null,
      cta_card_three_id = null,
      cta_card_four_id = null,
      product_1_id = null,
      product_2_id = null,
    } = body;

    if (!name || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug, and content are required' },
        { status: 400 }
      );
    }

    console.log('Checking if slug exists:', slug);
    const { data: existingQuiz, error: slugCheckError } = await supabase
      .from('edu_pro_resource')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingQuiz) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Slug check error:', slugCheckError);
      return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
    }

    console.log('Inserting new resource into Supabase...');
    const { data: newQuiz, error: insertError } = await supabase
      .from('edu_pro_resource')
      .insert('*')
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create resource', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('New resource created:', newQuiz);
    return NextResponse.json(newQuiz, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/resources:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}