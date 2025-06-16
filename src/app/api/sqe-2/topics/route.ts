import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

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

const VALID_SECTION_IDS = [
  'Criminal Litigation',
  'Business organisations, rules and procedures',
  'Wills and Intestacy, Probate Administration and Practice',
  'Property Practice',
  'Dispute Resolution',
];

export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  const section_id = searchParams.get('section_id');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '100', 10); // High limit for client-side filtering

  console.log('GET /api/sqe-2/topics:', { section_id, page, limit });

  if (!section_id || !VALID_SECTION_IDS.includes(section_id)) {
    console.error('Invalid section_id:', section_id);
    return NextResponse.json(
      { error: `section_id must be one of ${VALID_SECTION_IDS.join(', ')}` },
      { status: 400 }
    );
  }

  if (page < 1 || limit < 1) {
    console.error('Invalid pagination parameters:', { page, limit });
    return NextResponse.json(
      { error: 'Invalid pagination parameters: page and limit must be positive integers' },
      { status: 400 }
    );
  }

  try {
    // Build the query
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const query = supabase
      .from('blog_post')
      .select('id, title, slug, order')
      .eq('section_id', section_id)
      .eq('display_this_post', true)
      .order('order', { ascending: true })
      .range(from, to);

    const { data: posts, error: postsError } = await query;

    if (postsError) {
      console.error('Supabase query error:', postsError);
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: postsError.message },
        { status: 500 }
      );
    }

    console.log('Fetched posts:', posts);

    // Get total count for pagination metadata
    const { count: totalCount, error: countError } = await supabase
      .from('blog_post')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', section_id)
      .eq('display_this_post', true);

    if (countError) {
      console.error('Supabase count error:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch total count', details: countError.message },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json(
      {
        posts,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: totalCount || 0,
          limit,
        },
      },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
      }
    );
  } catch (error) {
    console.error('Error in GET /api/sqe-2/topics:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}