import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';

type CourseBody = {
  title: string;
  slug: string;
  content: string;
  description?: string;
  image?: string | null;
  subsection?: string | null;
  section_id?: number | null;
  product_id?: number | null;
  organization_id?: string;
};

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

  console.log('Received GET request for /api/courses');

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    console.log('Query organization_id:', organizationId);

    if (!organizationId) {
      console.error('Missing organization_id in query parameters');
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log('Fetching courses from Supabase for organization_id:', organizationId);
    const { data: coursesData, error: coursesError } = await supabase
      .from('edu_pro_course')
      .select(`
        id,
        slug,
        title,
        description,
        image,
        subsection,
        section_id,
        product_id,
        organization_id,
        product:product_id (slug)
      `)
      .or(`organization_id.eq.${organizationId},organization_id.is-null`);

    if (coursesError) {
      console.error('Supabase query error:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch courses', details: coursesError.message },
        { status: 500 },
      );
    }

    const formattedCourses = coursesData.map(course => ({
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      image: course.image,
      subsection: course.subsection,
      section_id: course.section_id,
      product_id: course.product_id?.toString() || '',
      product_slug: course.product && course.product[0]?.slug || '', // Fixed: Access first item
      organization_id: course.organization_id,
    }));

    formattedCourses.forEach(course =>
      console.log(`Course ID ${course.id} subsection: ${course.subsection}, product_slug: ${course.product_slug}, organization_id: ${course.organization_id}`)
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
      { status: 500 },
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
      image = null,
      subsection = null,
      section_id = null,
      product_id = null,
    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 },
      );
    }

    let organizationId: string | null;
    try {
      organizationId = await getOrganizationId();
    } catch (err) {
      console.error('Failed to fetch organization_id:', err);
      return NextResponse.json({ error: 'Failed to retrieve organization' }, { status: 500 });
    }
    console.log('Retrieved organization_id:', organizationId);
    if (!organizationId) {
      console.error('Organization not found');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('Checking if slug exists:', slug, 'organization_id:', organizationId);
    const { data: existingCourse, error: slugCheckError } = await supabase
      .from('edu_pro_course')
      .select('slug')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single();

    if (existingCourse) {
      return NextResponse.json({ error: 'Slug already exists for this organization' }, { status: 409 });
    }
    if (slugCheckError && slugCheckError.code !== 'PGRST116') {
      console.error('Slug check error:', slugCheckError);
      return NextResponse.json({ error: 'Failed to check slug availability', details: slugCheckError.message }, { status: 500 });
    }

    console.log('Inserting new course into Supabase...');
    const { data: newCourse, error: insertError } = await supabase
      .from('edu_pro_course')
      .insert({
        title,
        slug,
        content,
        description,
        image,
        subsection,
        section_id,
        product_id,
        organization_id: organizationId,
      })
      .select(`
        id,
        slug,
        title,
        description,
        image,
        subsection,
        section_id,
        product_id,
        organization_id,
        product:product_id (slug)
      `)
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create course', details: insertError.message },
        { status: 500 },
      );
    }

    const formattedCourse = {
      id: newCourse.id,
      slug: newCourse.slug,
      title: newCourse.title,
      description: newCourse.description,
      image: newCourse.image,
      subsection: newCourse.subsection,
      section_id: newCourse.section_id,
      product_id: newCourse.product_id?.toString() || '',
      product_slug: newCourse.product && newCourse.product[0]?.slug || '', // Fixed: Access first item
      organization_id: newCourse.organization_id,
    };

    console.log('New course created:', formattedCourse);
    return NextResponse.json(formattedCourse, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/courses:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}