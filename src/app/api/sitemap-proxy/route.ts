import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const baseUrl = searchParams.get('baseUrl');

    if (!organizationId || !baseUrl) {
      return NextResponse.json(
        { error: 'organizationId and baseUrl are required' },
        { status: 400 }
      );
    }

    console.log('[Sitemap Proxy] Fetching sitemap:', {
      organizationId,
      baseUrl
    });

    // Fetch the sitemap from the organization's URL
    const sitemapUrl = `${baseUrl}/sitemap.xml`;
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SiteMapProxy/1.0)',
      },
    });

    if (!response.ok) {
      console.error('[Sitemap Proxy] Failed to fetch:', response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch sitemap: ${response.statusText}` },
        { status: response.status }
      );
    }

    const xmlText = await response.text();

    // Return the XML with proper content type
    return new Response(xmlText, {
      status: 200,
      headers: {
        'Content-Type': 'text/xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[Sitemap Proxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
