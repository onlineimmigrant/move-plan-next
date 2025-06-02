// /app/api/template-sections/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { TemplateSection } from '@/types/template_section';

export async function GET(request: Request) {
  console.log('Received GET request for /api/template-sections:', request.url);

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

    console.log('Fetching template sections for organization_id:', organizationId);
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('website_templatesection')
      .select(`
        id,
        section_title,
        section_title_color,
        section_title_size,
        section_title_weight,
        section_description,
        section_description_color,
        section_description_size,
        section_description_weight,
        metric_title_color,
        metric_title_size,
        metric_title_weight,
        metric_description_color,
        metric_description_size,
        metric_description_weight,
        background_color,
        font_family,
        grid_columns,
        is_full_width,
        is_section_title_aligned_center,
        is_section_title_aligned_right,
        is_image_bottom,
        image_metrics_height,
        order,
        url_page,
        organization_id,
        website_templatesection_metrics!templatesection_id (
          metric_id,
          website_metric!metric_id (
            id,
            title,
            description,
            image,
            is_image_rounded_full,
            is_title_displayed,
            background_color,
            is_card_type,
            organization_id
          )
        )
      `)
      .eq('url_page', decodedUrlPage)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (sectionsError) {
      console.error('Supabase query error:', sectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch template sections', details: sectionsError.message },
        { status: 500 }
      );
    }

    console.log('Fetched sections (raw):', sectionsData);

    // Transform data to match expected structure
    const transformedSections: TemplateSection[] = (sectionsData || []).map(section => ({
      ...section,
      website_metric: section.website_templatesection_metrics
        ?.filter((metricLink: any) =>
          metricLink.website_metric?.organization_id === null ||
          metricLink.website_metric?.organization_id === organizationId
        )
        .map((metricLink: any) => metricLink.website_metric) || [],
      organization_id: section.organization_id || null,
    }));

    console.log('Transformed sections:', transformedSections);

    if (!transformedSections || transformedSections.length === 0) {
      console.log('No sections found for url_page:', decodedUrlPage, 'and organization_id:', organizationId);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(transformedSections, {
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Error in template-sections API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}