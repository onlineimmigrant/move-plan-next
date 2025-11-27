// /app/api/template-heading-sections/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/supabase';
import { TemplateHeadingSection } from '@/types/template_heading_section';

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Keep regular client for read operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Cache organization ID to avoid repeated lookups
let cachedOrgId: string | null = null;
let cacheTime: number = 0;
const CACHE_TTL = 60000; // 60 seconds

async function getCachedOrganizationId(baseUrl: string): Promise<string | null> {
  const now = Date.now();
  if (cachedOrgId && (now - cacheTime) < CACHE_TTL) {
    console.log('[Cache] Using cached organization ID:', cachedOrgId);
    return cachedOrgId;
  }
  
  console.log('[Cache] Fetching fresh organization ID');
  const orgId = await getOrganizationId(baseUrl);
  if (orgId) {
    cachedOrgId = orgId;
    cacheTime = now;
  }
  return orgId;
}

export async function GET(request: Request) {
  const startTime = Date.now();
  console.log('[Template Headings] Received GET request:', request.url);

  const { searchParams } = new URL(request.url);
  const url_page = searchParams.get('url_page');

  if (!url_page) {
    console.log('[Template Headings] Missing url_page parameter');
    return NextResponse.json({ error: 'url_page is required' }, { status: 400 });
  }

  const decodedUrlPage = decodeURIComponent(url_page);
  console.log('[Template Headings] Decoded url_page:', decodedUrlPage);

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getCachedOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('[Template Headings] Organization not found');
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    console.log('Fetching template heading sections for organization_id:', organizationId);
    const { data: headingsData, error: headingsError } = await supabase
      .from('website_templatesectionheading')
      .select(`
        id,
        comment,
        order,
        url_page,
        organization_id,
        updated_at,
        content,
        translations,
        style
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
      const elapsed = Date.now() - startTime;
      console.log(`[Template Headings] ✅ No headings found (${elapsed}ms)`);
      return NextResponse.json([], { status: 200 });
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Template Headings] ✅ Success - ${headings.length} headings in ${elapsed}ms`);
    
    return NextResponse.json(headings, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'CDN-Cache-Control': 'no-store',
        'Vercel-CDN-Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[Template Headings] ❌ Error after ${elapsed}ms:`, error);
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
    if (!body.content?.title) {
      return NextResponse.json(
        { error: 'content.title is required', message: 'Heading title is required' },
        { status: 400 }
      );
    }
    
    if (!body.url_page) {
      return NextResponse.json(
        { error: 'url_page is required', message: 'Page URL is required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found', message: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get the highest order value for this url_page
    const { data: existingSections, error: orderError } = await supabaseAdmin
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

    // Prepare insert data with new JSONB structure
    const insertData = {
      url_page: body.url_page,
      organization_id: organizationId,
      comment: body.comment || null,
      order: nextOrder,
      content: {
        title: body.content.title,
        description: body.content.description || null,
        image: body.content.image || null,
        button: {
          text: body.content.button?.text || null,
          url: body.content.button?.url || null,
          is_text_link: body.content.button?.is_text_link ?? true,
        },
      },
      translations: body.translations || {},
      style: {
        background_color: body.style?.background_color || 'white',
        title: {
          color: body.style?.title?.color || null,
          size: body.style?.title?.size || '3xl',
          font: body.style?.title?.font || 'sans',
          weight: body.style?.title?.weight || 'bold',
        },
        description: {
          color: body.style?.description?.color || null,
          size: body.style?.description?.size || 'md',
          font: body.style?.description?.font || 'sans',
          weight: body.style?.description?.weight || 'normal',
        },
        button: {
          color: body.style?.button?.color || null,
          text_color: body.style?.button?.text_color || 'white',
        },
        alignment: body.style?.alignment || 'left',
        image_first: body.style?.image_first ?? false,
        image_style: body.style?.image_style || 'default',
        gradient: body.style?.gradient || { enabled: false },
      },
    };

    // Insert the new template heading section using service role
    const { data, error } = await supabaseAdmin
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