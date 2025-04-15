// app/api/courses/route.ts
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

  console.log('Received GET request for /api/courses');

  try {
    console.log('Fetching all courses from Supabase');
    const { data: coursesData, error: coursesError } = await supabase
      .from('edu_pro_course')
      .select(`
        *,
        product:product_id (slug)
      `); // Fetch all course fields and product.slug

    if (coursesError) {
      console.error('Supabase query error:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: coursesError.message },
        { status: 500 }
      );
    }

    // Map to include product_slug
    const formattedCourses = coursesData.map((course) => ({
      ...course,
      product_slug: course.product?.slug || '', // Add product_slug, empty string if no product
    }));

    // Log each course’s subsection and product_slug
    formattedCourses.forEach((course) =>
      console.log(`Course ID ${course.id} subsection: ${course.subsection}, product_slug: ${course.product_slug}`)
    );
    console.log('Fetched courses:', formattedCourses);

    return NextResponse.json(formattedCourses, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in GET /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler unchanged exactly as you provided
export async function POST(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/courses');

  try {
    const body = await request.json();
    const {
      title,
      slug,
      content,
      description = '',
      display_this_course = true,
      display_as_blog_course = false,
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

    console.log('Checking if slug exists:', slug);
    const { data: existingCourse, error: slugCheckError } = await supabase
      .from('edu_pro_ourse')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingCourse) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    }
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Slug check error:', slugCheckError);
      return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
    }

    console.log('Inserting new course into Supabase...');
    const { data: newCourse, error: insertError } = await supabase
      .from('edu_pro_course')
      .insert('*')
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create course', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('New course created:', newCourse);
    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}