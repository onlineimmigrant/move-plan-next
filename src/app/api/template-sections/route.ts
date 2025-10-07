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
        section_title_translation,
        section_description,
        section_description_translation,
        text_style_variant,
        background_color,
        grid_columns,
        is_full_width,
        is_section_title_aligned_center,
        is_section_title_aligned_right,
        is_image_bottom,
        is_slider,
        image_metrics_height,
        order,
        url_page,
        organization_id,
        is_reviews_section,
        is_help_center_section,
        is_real_estate_modal,
        website_templatesection_metrics!templatesection_id (
          metric_id,
          order,
          website_metric!metric_id (
            id,
            title,
            title_translation,
            description,
            description_translation,
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
    const transformedSections: TemplateSection[] = (sectionsData || []).map(section => {
      console.log('Transforming section:', {
        id: section.id,
        title: section.section_title,
        rawMetricsLinks: section.website_templatesection_metrics,
        metricsLinksCount: section.website_templatesection_metrics?.length || 0
      });
      
      const metrics = section.website_templatesection_metrics
        ?.filter((metricLink: any) =>
          metricLink.website_metric?.organization_id === null ||
          metricLink.website_metric?.organization_id === organizationId
        )
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
        .map((metricLink: any) => metricLink.website_metric) || [];
      
      console.log('Transformed metrics for section', section.id, ':', {
        metricsCount: metrics.length,
        metrics
      });
      
      return {
        ...section,
        website_metric: metrics,
        organization_id: section.organization_id || null,
      };
    });

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

/**
 * POST /api/template-sections
 * Create a new template section
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('Creating new template section:', body);

    // Validate required fields
    if (!body.section_title || !body.url_page) {
      return NextResponse.json(
        { error: 'section_title and url_page are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get the highest order value for this url_page
    const { data: existingSections, error: orderError } = await supabase
      .from('website_templatesection')
      .select('order')
      .eq('url_page', body.url_page)
      .eq('organization_id', organizationId)
      .order('order', { ascending: false })
      .limit(1);

    if (orderError) {
      console.error('Error fetching order:', orderError);
    }

    const nextOrder = existingSections && existingSections.length > 0 
      ? (existingSections[0].order || 0) + 1 
      : 1;

    // Prepare insert data
    const insertData = {
      section_title: body.section_title,
      section_description: body.section_description || null,
      section_title_translation: body.section_title_translation || {},
      section_description_translation: body.section_description_translation || {},
      text_style_variant: body.text_style_variant || 'default',
      background_color: body.background_color || null,
      grid_columns: body.grid_columns || 3,
      is_full_width: body.is_full_width ?? false,
      is_section_title_aligned_center: body.is_section_title_aligned_center ?? false,
      is_section_title_aligned_right: body.is_section_title_aligned_right ?? false,
      is_image_bottom: body.is_image_bottom ?? false,
      is_slider: body.is_slider ?? false,
      image_metrics_height: body.image_metrics_height || null,
      order: nextOrder,
      url_page: body.url_page,
      organization_id: organizationId,
      is_reviews_section: body.is_reviews_section ?? false,
      is_help_center_section: body.is_help_center_section ?? false,
      is_real_estate_modal: body.is_real_estate_modal ?? false,
    };

    // Insert the new template section
    const { data, error } = await supabase
      .from('website_templatesection')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating template section:', error);
      return NextResponse.json(
        { error: 'Failed to create template section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created template section:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/template-sections:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}