// /app/api/template-heading-sections/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { TemplateHeadingSection } from '@/types/template_heading_section';

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
        name_translation,
        name_part_2,
        name_part_3,
        description_text,
        description_text_translation,
        button_text,
        button_text_translation,
        url,
        url_page,
        image,
        image_first,
        is_included_template_sections_active,
        organization_id,
        style_variant,
        text_style_variant,
        is_text_link
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

    const headings: TemplateHeadingSection[] = (headingsData || []).map(item => ({
      ...item,
      organization_id: item.organization_id || null,
    }));

    if (!headingsData || headingsData.length === 0) {
      console.log('No heading sections found for url_page:', decodedUrlPage, 'and organization_id:', organizationId);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(headings, {
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