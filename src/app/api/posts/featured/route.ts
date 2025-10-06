import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const envErrorResponse = () =>
  NextResponse.json(
    { error: 'Missing environment variables' },
    { status: 500 }
  );

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET handler for featured blog posts (is_displayed_first_page = true)
export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organization_id');
  
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
  }

  try {
    const { data: posts, error: fetchError } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, main_photo, subsection, section_id, organization_id, created_on')
      .eq('organization_id', organizationId)
      .eq('is_displayed_first_page', true)
      .eq('display_this_post', true)
      .order('created_on', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch featured posts', details: fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(posts || [], { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/posts/featured:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
