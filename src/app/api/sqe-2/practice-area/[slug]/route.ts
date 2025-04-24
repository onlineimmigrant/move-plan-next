import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

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
  created_on?: string;
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

export async function GET(_request: NextRequest, context: any) {
  if (!hasEnvVars) return envErrorResponse();

  const { slug } = context.params;
  console.log('Received GET request for /api/sqe-2/practice-area/[slug]:', slug);

  try {
    const { data: postData, error: postError } = await supabase
      .from('blog_post')
      .select('*')
      .eq('slug', slug)
      .single();

    if (postError) {
      console.error('Supabase query error:', postError);
      return NextResponse.json(
        { error: 'Failed to fetch post', details: postError.message },
        { status: 500 }
      );
    }

    if (!postData) {
      console.log('No post found for slug:', slug);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (postData.section_id !== 39) {
      console.log('Post does not belong to section_id 39:', slug);
      return NextResponse.json(
        { error: 'This route is only for posts with section_id 39' },
        { status: 403 }
      );
    }

    if (postData.display_this_post === false) {
      console.log('Post hidden due to display_this_post being false:', slug);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    console.log('Fetched post:', postData);
    return NextResponse.json(postData, {
      status: 200,
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Error in GET /api/sqe-2/practice-area/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  console.log('Received POST request for /api/sqe-2/practice-area/[slug]');

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
      return NextResponse.json(
        { error: 'Missing required fields: title, slug, and content are required' },
        { status: 400 }
      );
    }

    if (section_id !== 39) {
      console.log('Invalid section_id for this route:', section_id);
      return NextResponse.json(
        { error: 'This route requires section_id to be 39' },
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
    console.error('Error in POST /api/sqe-2/practice-area/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: any) {
  if (!hasEnvVars) return envErrorResponse();

  const { slug } = context.params;
  console.log('Received PATCH request for /api/sqe-2/practice-area/[slug]:', slug);

  try {
    const body: Partial<BlogPostBody> = await request.json();
    const {
      title,
      slug: newSlug,
      content,
      description,
      display_this_post,
      display_as_blog_post,
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
    } = body;

    console.log('Checking if post exists for slug:', slug);
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_post')
      .select('id, section_id')
      .eq('slug', slug)
      .single();

    if (fetchError || !existingPost) {
      console.error('Post not found or fetch error:', fetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.section_id !== 39) {
      console.log('Post does not belong to section_id 39:', slug);
      return NextResponse.json(
        { error: 'This route is only for posts with section_id 39' },
        { status: 403 }
      );
    }

    if (section_id !== undefined && section_id !== 39) {
      console.log('Attempt to change section_id to non-39 value:', section_id);
      return NextResponse.json(
        { error: 'This route requires section_id to remain 39' },
        { status: 400 }
      );
    }

    if (newSlug && newSlug !== slug) {
      console.log('Checking if new slug exists:', newSlug);
      const { data: slugCheck, error: slugCheckError } = await supabase
        .from('blog_post')
        .select('slug')
        .eq('slug', newSlug)
        .single();

      if (slugCheck) {
        return NextResponse.json({ error: 'New slug already exists' }, { status: 409 });
      }
      if (slugCheckError && slugCheckError.code !== 'PGRST116') {
        console.error('Slug check error:', slugCheckError);
        return NextResponse.json({ error: 'Failed to check slug availability' }, { status: 500 });
      }
    }

    console.log('Updating post in Supabase...');
    const updateData: Partial<BlogPostBody> = {};
    if (title !== undefined) updateData.title = title;
    if (newSlug !== undefined) updateData.slug = newSlug;
    if (description !== undefined) updateData.description = description;
    if (display_this_post !== undefined) updateData.display_this_post = display_this_post;
    if (display_as_blog_post !== undefined) updateData.display_as_blog_post = display_as_blog_post;
    if (content !== undefined) updateData.content = content;
    if (main_photo !== undefined) updateData.main_photo = main_photo;
    if (section_id !== undefined) updateData.section_id = section_id;
    if (subsection !== undefined) updateData.subsection = subsection;
    if (is_with_author !== undefined) updateData.is_with_author = is_with_author;
    if (is_company_author !== undefined) updateData.is_company_author = is_company_author;
    if (faq_section_is_title !== undefined) updateData.faq_section_is_title = faq_section_is_title;
    if (author_id !== undefined) updateData.author_id = author_id;
    if (cta_card_one_id !== undefined) updateData.cta_card_one_id = cta_card_one_id;
    if (cta_card_two_id !== undefined) updateData.cta_card_two_id = cta_card_two_id;
    if (cta_card_three_id !== undefined) updateData.cta_card_three_id = cta_card_three_id;
    if (cta_card_four_id !== undefined) updateData.cta_card_four_id = cta_card_four_id;
    if (product_1_id !== undefined) updateData.product_1_id = product_1_id;
    if (product_2_id !== undefined) updateData.product_2_id = product_2_id;

    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_post')
      .update(updateData)
      .eq('slug', slug)
      .select('*')
      .single();

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update post', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('Post updated:', updatedPost);
    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error('Error in PATCH /api/sqe-2/practice-area/[slug]:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}