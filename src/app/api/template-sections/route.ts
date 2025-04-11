// app/api/template-sections/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

  console.log('Creating Supabase client...');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
  );

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables');
    return NextResponse.json({ error: 'Server configuration error: Missing Supabase credentials' }, { status: 500 });
  }

  console.log('Supabase client created successfully');

  try {
    console.log('Fetching template sections from Supabase for url_page:', decodedUrlPage);
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('website_templatesection')
      .select(
        `
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
            is_card_type
          )
        )
      `
      )
      .eq('url_page', decodedUrlPage)
      .order('order', { ascending: true });

    if (sectionsError) {
      console.error('Supabase query error:', sectionsError);
      return NextResponse.json(
        { error: 'Failed to fetch template sections', details: sectionsError.message },
        { status: 500 }
      );
    }

    console.log('Fetched sections (raw):', sectionsData);

    // Transform the data to match the expected structure
    const transformedSections = sectionsData?.map(section => ({
      ...section,
      website_metric: section.website_templatesection_metrics?.map((metricLink: any) => metricLink.website_metric) || [],
    })) || [];

    console.log('Transformed sections:', transformedSections);

    if (!transformedSections || transformedSections.length === 0) {
      console.log('No sections found for url_page:', decodedUrlPage);
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