import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// Define a type for the course body (all fields from edu_pro_course table with defaults)
type CourseBody = {
  title: string;
  slug: string;
  content: string;
  description?: string;
  display_this_course?: boolean;
  display_as_blog_course?: boolean;
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
  created_on?: string; // Optional, set by server
};

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

export async function GET(_request: NextRequest) {
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

export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/courses');

  try {
    const body: CourseBody = await request.json();
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
      .from('edu_pro_course') // Fixed typo: was 'edu_pro_ourse'
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
      .insert({
        title,
        slug,
        content,
        description,
        display_this_course,
        display_as_blog_course,
        main_photo,
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
        created_on: new Date().toISOString(),
      })
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