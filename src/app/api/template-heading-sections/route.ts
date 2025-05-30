// /app/api/template-heading-sections/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';

export async function GET(request: Request) {
  console.log('Received GET request for /api/template-heading-sections:', request.url);

  const { searchParams } = new URL(request.url);
  const url_page = searchParams.get('url_page');

  console.log('url_page:', url_page);

  if (!url_page) {
    console.log('Missing url_page parameter');
    return NextResponse.json({ error: 'url_page is required' }, { status: 400 });
  }

  const decodedUrlPage = decodeURIComponent(url_page);
  console.log('Decoded url_page:', decodedUrlPage);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('Fetching template heading sections for organization_id:', organizationId);
    const { data: headingsData, error: headingsError } = await supabase
      .from('website_templatesectionheading')
      .select(`
        id,
        name,
        name_part_2,
        name_part_3,
        description_text,
        button_text,
        url,
        url_page,
        image,
        background_color,
        font_family,
        text_color,
        button_color,
        button_text_color,
        text_size_h1,
        text_size_h1_mobile,
        text_size,
        font_weight_1,
        font_weight,
        h1_text_color,
        is_text_link,
        image_first,
        is_included_template_sections_active,
        organization_id
      `)
      .eq('url_page', decodedUrlPage)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (headingsError) {
      console.error('Supabase query error:', headingsError);
      return NextResponse.json(
        { error: 'Failed to fetch template heading sections', details: headingsError.message },
        { status: 500 }
      );
    }

    console.log('Fetched heading sections:', headingsData);

    if (!headingsData || headingsData.length === 0) {
      console.log('No heading sections found for url_page:', decodedUrlPage, 'and organization_id:', organizationId);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(headingsData, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in template-heading-sections API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}