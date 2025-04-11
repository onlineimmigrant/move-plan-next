// app/api/posts/route.ts
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

  console.log('Received GET request for /api/posts');

  try {
    console.log('Fetching all posts from Supabase');
    const { data: postsData, error: postsError } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, display_this_post, display_as_blog_post, main_photo, section_id, subsection') // Explicitly includes subsection
      .eq('display_this_post', true)
      .order('created_on', { ascending: false });

    if (postsError) {
      console.error('Supabase query error:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    // Log each post's subsection to confirm it's fetched
    postsData.forEach(post => console.log(`Post ID ${post.id} subsection:`, post.subsection));
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

// POST handler unchanged for brevity, but it already handles subsection
export async function POST(request: Request) {
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

    console.log('Checking if slug exists:', slug);
    const { data: existingPost, error: slugCheckError } = await supabase
      .from('blog_post')
      .select('slug')
      .eq('slug', slug)
      .single();

    if (existingPost) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
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