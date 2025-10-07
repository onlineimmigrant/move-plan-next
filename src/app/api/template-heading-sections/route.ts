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

/**
 * POST /api/template-heading-sections
 * Create a new template heading section
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    console.log('Creating new template heading section:', body);

    // Validate required fields
    if (!body.name || !body.description_text || !body.url_page) {
      return NextResponse.json(
        { error: 'name, description_text, and url_page are required' },
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
      .from('website_templatesectionheading')
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
      name: body.name,
      name_part_2: body.name_part_2 || null,
      name_part_3: body.name_part_3 || null,
      name_translation: body.name_translation || {},
      description_text: body.description_text,
      description_text_translation: body.description_text_translation || {},
      button_text: body.button_text || null,
      button_text_translation: body.button_text_translation || {},
      url: body.url || null,
      url_page: body.url_page,
      image: body.image || null,
      image_first: body.image_first ?? false,
      is_included_template_sections_active: body.is_included_template_sections_active ?? false,
      organization_id: organizationId,
      style_variant: body.style_variant || 'default',
      text_style_variant: body.text_style_variant || 'default',
      is_text_link: body.is_text_link ?? false,
      order: nextOrder,
    };

    // Insert the new template heading section
    const { data, error } = await supabase
      .from('website_templatesectionheading')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating template heading section:', error);
      return NextResponse.json(
        { error: 'Failed to create template heading section', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully created template heading section:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/template-heading-sections:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}