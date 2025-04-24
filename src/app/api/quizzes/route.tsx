// app/api/quizzes/route.ts
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

  console.log('Received GET request for /api/quizzes');

  try {
    console.log('Fetching all quizzes from Supabase');
    const { data: quizzesData, error: quizzesError } = await supabase
      .from('quiz_quizcommon')
      .select(`
        *,
        product:product_id (slug)
      `); // Fetch all quiz fields and product.slug

    if (quizzesError) {
      console.error('Supabase query error:', quizzesError);
      return NextResponse.json(
        { error: 'Failed to fetch quizzes', details: quizzesError.message },
        { status: 500 }
      );
    }

    // Map to include product_slug
    const formattedQuizzes = quizzesData.map((quiz) => ({
      ...quiz,
      product_slug: quiz.product?.slug || '', // Add product_slug, empty string if no product
    }));

    // Log each quiz’s subsection and product_slug
    formattedQuizzes.forEach((quiz) =>
      console.log(`Quiz ID ${quiz.id} subsection: ${quiz.subsection}, product_slug: ${quiz.product_slug}`)
    );
    console.log('Fetched quizzes:', formattedQuizzes);

    return NextResponse.json(formattedQuizzes, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in GET /api/quizzes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST handler unchanged exactly as you provided
export async function POST(request: Request) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/quizzes');

  try {
    const body = await request.json();
    const {
      title,
      slug,
      content,

    } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    console.log('Checking if slug exists:', slug);
    const { data: existingQuiz, error: slugCheckError } = await supabase
      .from('blog_quiz')
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

    console.log('Inserting new quiz into Supabase...');
    const { data: newQuiz, error: insertError } = await supabase
      .from('quiz_quizcommon')
      .insert('*')
      .select('*')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create quiz', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('New quiz created:', newQuiz);
    return NextResponse.json(newQuiz, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/quizzes:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}