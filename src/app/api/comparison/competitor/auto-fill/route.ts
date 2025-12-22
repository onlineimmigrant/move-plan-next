import { NextRequest, NextResponse } from 'next/server';

/**
 * AI-powered competitor data extraction
 * Fetches website, extracts logo, pricing, and features
 */
export async function POST(request: NextRequest) {
  try {
    const { url, organizationId } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    let websiteUrl: URL;
    try {
      websiteUrl = new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const result: any = {
      name: '',
      logo_url: null,
      website_url: url,
      suggested_pricing: [],
      suggested_features: [],
    };

    // Fetch website content
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ComparisonBot/1.0)',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.statusText}`);
      }

      const html = await response.text();

      // Extract company name from title or meta tags
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch) {
        result.name = titleMatch[1]
          .replace(/\s*[-–|]\s*.*$/, '') // Remove taglines after dash/pipe
          .trim();
      }

      // Extract logo from meta tags or common patterns
      const logoPatterns = [
        /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
        /<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i,
        /<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i,
        /<img[^>]*class=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i,
      ];

      for (const pattern of logoPatterns) {
        const match = html.match(pattern);
        if (match && match[1]) {
          let logoUrl = match[1];
          // Convert relative URLs to absolute
          if (logoUrl.startsWith('/')) {
            logoUrl = `${websiteUrl.origin}${logoUrl}`;
          } else if (!logoUrl.startsWith('http')) {
            logoUrl = `${websiteUrl.origin}/${logoUrl}`;
          }
          result.logo_url = logoUrl;
          break;
        }
      }

      // Extract pricing information (common patterns)
      const pricingPatterns = [
        /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:\/|per)\s*(mo|month|yr|year)/gi,
        /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP)\s*(?:\/|per)\s*(mo|month|yr|year)/gi,
      ];

      const prices: any[] = [];
      for (const pattern of pricingPatterns) {
        const matches = [...html.matchAll(pattern)];
        matches.forEach(match => {
          const price = parseFloat(match[1].replace(/,/g, ''));
          const interval = match[2].toLowerCase().startsWith('mo') ? 'monthly' : 'yearly';
          if (price && price < 100000) { // Sanity check
            prices.push({ price, interval });
          }
        });
      }

      if (prices.length > 0) {
        result.suggested_pricing = prices.slice(0, 3); // Top 3 prices found
      }

      // Extract features (look for lists, bullet points)
      const featurePatterns = [
        /<ul[^>]*class=["'][^"']*features?[^"']*["'][^>]*>(.*?)<\/ul>/gis,
        /<div[^>]*class=["'][^"']*features?[^"']*["'][^>]*>(.*?)<\/div>/gis,
      ];

      const features: string[] = [];
      for (const pattern of featurePatterns) {
        const matches = [...html.matchAll(pattern)];
        matches.forEach(match => {
          const listItems = [...match[1].matchAll(/<li[^>]*>([^<]+)<\/li>/gi)];
          listItems.forEach(li => {
            const feature = li[1].trim().replace(/<[^>]*>/g, '');
            if (feature.length > 5 && feature.length < 100) {
              features.push(feature);
            }
          });
        });
      }

      if (features.length > 0) {
        result.suggested_features = [...new Set(features)].slice(0, 10); // Unique, top 10
      }

    } catch (fetchError: any) {
      console.error('Error fetching website:', fetchError);
      // Continue with partial data
      result.error = `Could not fully analyze website: ${fetchError.message}`;
    }

    // If we couldn't extract a name, use domain name
    if (!result.name) {
      result.name = websiteUrl.hostname.replace(/^www\./, '').split('.')[0];
      result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1);
    }

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('AI auto-fill error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract competitor data' },
      { status: 500 }
    );
  }
}
