import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';
import { getPostUrl } from '@/lib/postUtils';

// Runtime configuration for better performance
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

// Initialize Supabase client with error handling
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Types for better type safety
interface SitemapPage {
  url: string;
  lastmod: string;
  priority: number;
}

interface StaticPageData {
  url_path: string;
  priority: number | null;
  last_modified: string | null;
}

interface BlogPostData {
  slug: string;
  last_modified: string | null;
  display_config: {
    display_this_post?: boolean;
  } | null;
  organization_config: {
    section_id?: number | null;
  } | null;
}

interface FeatureData {
  slug: string;
  created_at: string | null;
}

interface ProductData {
  slug: string;
  updated_at: string | null;
}

// Cache for organization data to reduce database calls
const orgCache = new Map<string, { data: any; timestamp: number; ttl: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedOrganizationData = async (orgId: string): Promise<any> => {
  const cacheKey = `org-${orgId}`;
  const cached = orgCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  const { data, error } = await supabase
    .from('organizations')
    .select('base_url, type')
    .eq('id', orgId)
    .single();

  if (!error && data) {
    orgCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl: CACHE_TTL
    });
  }

  return { data, error };
};

// Utility functions for better organization
const getRequestContext = (request: NextRequest) => {
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const actualBaseUrl = `${protocol}://${host}`;
  
  return { host, protocol, actualBaseUrl };
};

const validateAndNormalizeUrl = (url: string): string => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.toString();
  } catch {
    return url; // Return original if invalid
  }
};

const getCurrentISOString = (): string => new Date().toISOString();

// Helper function to safely format dates to ISO string
const formatDateToISO = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return getCurrentISOString();
  }
  
  try {
    const date = new Date(dateString);
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(`Sitemap - Invalid date format: ${dateString}, using current time`);
      return getCurrentISOString();
    }
    return date.toISOString();
  } catch (error) {
    console.warn(`Sitemap - Error parsing date: ${dateString}, using current time`);
    return getCurrentISOString();
  }
};

// Helper function to validate lastmod format for XML sitemap
const validateLastmod = (lastmod: string): string => {
  // Ensure the date is in valid ISO format and remove any milliseconds for cleaner XML
  try {
    const date = new Date(lastmod);
    if (isNaN(date.getTime())) {
      return getCurrentISOString().split('.')[0] + 'Z';
    }
    // Remove milliseconds for cleaner sitemap
    return date.toISOString().split('.')[0] + 'Z';
  } catch (error) {
    return getCurrentISOString().split('.')[0] + 'Z';
  }
};

// GET handler for the sitemap
export async function GET(request: NextRequest): Promise<Response> {
  try {
    const { host, protocol, actualBaseUrl } = getRequestContext(request);

    // Log request context for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Sitemap - Request context:', {
        host,
        protocol,
        actualBaseUrl,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
          NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID,
        },
      });
    }

    // Get the organization ID
    const organizationId = await getOrganizationId(actualBaseUrl);
    let baseUrl = actualBaseUrl;

    if (organizationId) {
      // Fetch organization's base_url from Supabase with caching
      const { data: orgData, error: orgError } = await getCachedOrganizationData(organizationId);

      // Log organization data (only in development)
      if (process.env.NODE_ENV === 'development') {
        console.log('Sitemap - Organization data:', {
          organizationId,
          baseUrl: orgData?.base_url || null,
          actualBaseUrl,
          orgError: orgError?.message || null,
        });
      }

      if (!orgError && orgData?.base_url) {
        const validatedUrl = validateAndNormalizeUrl(orgData.base_url);
        if (validatedUrl !== orgData.base_url) {
          console.warn('Sitemap - Invalid base_url in Supabase, using actualBaseUrl');
        } else {
          baseUrl = orgData.base_url;
        }
      }
    }

    // Generate common static pages
    const currentTime = getCurrentISOString();
    const commonStaticPages: SitemapPage[] = [
      { url: `${baseUrl}/`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/about-us`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/products`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/features`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/blog`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/faq`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/support`, lastmod: currentTime, priority: 1.0 },
      { url: `${baseUrl}/terms`, lastmod: currentTime, priority: 1.0 },
    ];

    // Use fallback tenant ID if organizationId is not found
    const effectiveOrgId = organizationId || process.env.NEXT_PUBLIC_TENANT_ID;

    if (!effectiveOrgId) {
      console.warn('Sitemap - No organization ID available, returning only static pages');
      return new Response(generateSitemap(commonStaticPages), {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    // Fetch all dynamic content in parallel for better performance
    const [
      { data: staticPagesData, error: staticPagesError },
      { data: posts, error: postError },
      { data: features, error: featureError },
      { data: products, error: productError }
    ] = await Promise.all([
      supabase
        .from('sitemap_static_pages')
        .select('url_path, priority, last_modified')
        .eq('organization_id', effectiveOrgId)
        .limit(1000), // Allow up to 1000 static pages
      supabase
        .from('blog_post')
        .select('slug, last_modified, display_config, organization_config')
        .eq('organization_id', effectiveOrgId)
        .eq('display_config->>display_this_post', 'true')
        .limit(1000), // Allow up to 1000 blog posts
      supabase
        .from('feature')
        .select('slug, created_at')
        .eq('organization_id', effectiveOrgId)
        .limit(1000), // Allow up to 1000 features
      supabase
        .from('product')
        .select('slug, updated_at')
        .eq('organization_id', effectiveOrgId)
        .limit(1000) // Allow up to 1000 products
    ]);

    // Log errors if any (only in development)
    if (process.env.NODE_ENV === 'development') {
      if (staticPagesError) console.warn('Sitemap - Static pages error:', staticPagesError.message);
      if (postError) console.warn('Sitemap - Blog posts error:', postError.message);
      if (featureError) console.warn('Sitemap - Features error:', featureError.message);
      if (productError) console.warn('Sitemap - Products error:', productError.message);
    }

    // Process additional static pages
    const additionalStaticPages: SitemapPage[] = (staticPagesData || []).map((page: StaticPageData) => ({
      url: `${actualBaseUrl}${page.url_path}`,
      lastmod: formatDateToISO(page.last_modified),
      priority: page.priority || 1.0,
    }));

    // Process blog posts
    const dynamicPages: SitemapPage[] = (posts || []).map((post: BlogPostData) => ({
      url: `${baseUrl}${getPostUrl({ section_id: post.organization_config?.section_id?.toString() ?? null, slug: post.slug })}`,
      lastmod: formatDateToISO(post.last_modified),
      priority: 0.8,
    }));

    // Process features
    const dynamicFeaturePages: SitemapPage[] = (features || [])
      .filter((feature: FeatureData) => feature.slug && feature.slug.trim().length > 0)
      .map((feature: FeatureData) => ({
        url: `${baseUrl}/features/${feature.slug}`,
        lastmod: formatDateToISO(feature.created_at),
        priority: 0.8,
      }));

    // Process products
    const dynamicProductsPages: SitemapPage[] = (products || [])
      .filter((product: ProductData) => product.slug && product.slug.trim().length > 0)
      .map((product: ProductData) => ({
        url: `${baseUrl}/products/${product.slug}`,
        lastmod: formatDateToISO(product.updated_at),
        priority: 0.8,
      }));

    // Combine all pages and remove duplicates
    const allPages = [
      ...commonStaticPages,
      ...additionalStaticPages,
      ...dynamicPages,
      ...dynamicFeaturePages,
      ...dynamicProductsPages,
    ];

    // Normalize URLs (remove trailing slashes) and remove duplicates
    const normalizeUrl = (url: string): string => {
      // Remove trailing slash except for root URL
      if (url.endsWith('/') && url !== `${baseUrl}/`) {
        return url.slice(0, -1);
      }
      return url;
    };

    // Remove duplicate URLs (keeping the first occurrence, after normalization)
    const uniquePages = allPages
      .map(page => ({ ...page, url: normalizeUrl(page.url) }))
      .filter((page, index, arr) => 
        arr.findIndex(p => p.url === page.url) === index
      );

    // Log final pages count (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log('Sitemap - Generated pages:', {
        totalPages: uniquePages.length,
        commonStatic: commonStaticPages.length,
        additionalStatic: additionalStaticPages.length,
        blogPosts: dynamicPages.length,
        features: dynamicFeaturePages.length,
        products: dynamicProductsPages.length,
      });
    }

    // Generate and return the sitemap
    return new Response(generateSitemap(uniquePages), {
      status: 200,
      headers: { 
        'Content-Type': 'text/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Sitemap - Generation error:', error);
    
    // Return a minimal sitemap with just the homepage on error
    const fallbackBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const fallbackPages: SitemapPage[] = [{
      url: `${fallbackBaseUrl}/`,
      lastmod: formatDateToISO(null), // Use the helper function for consistency
      priority: 1.0,
    }];

    return new Response(generateSitemap(fallbackPages), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }
}

// Debug endpoint to test Supabase queries (only available in development)
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Only allow debug endpoint in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Debug endpoint not available in production' }, { status: 403 });
  }

  try {
    const { host } = getRequestContext(request);
    const organizationId = await getOrganizationId(`https://${host}`);
    
    const debugData: Record<string, any> = { 
      organizationId, 
      host,
      timestamp: getCurrentISOString(),
    };

    const effectiveOrgId = organizationId || process.env.NEXT_PUBLIC_TENANT_ID;
    
    if (!effectiveOrgId) {
      debugData.error = 'No organization ID or tenant ID available';
      return NextResponse.json(debugData);
    }

    // Test all queries in parallel
    const [
      orgResult,
      staticPagesResult,
      postsResult,
      featuresResult,
      productsResult
    ] = await Promise.allSettled([
      supabase.from('organizations').select('base_url, type').eq('id', effectiveOrgId).single(),
      supabase.from('sitemap_static_pages').select('url_path, priority, last_modified').eq('organization_id', effectiveOrgId).limit(1000),
      supabase.from('blog_post').select('slug, last_modified, display_config, organization_config').eq('organization_id', effectiveOrgId).eq('display_config->>display_this_post', 'true').limit(1000),
      supabase.from('feature').select('slug, created_at').eq('organization_id', effectiveOrgId).limit(1000),
      supabase.from('product').select('slug, updated_at').eq('organization_id', effectiveOrgId).limit(1000)
    ]);

    // Process results
    debugData.organizations = orgResult.status === 'fulfilled' 
      ? { data: orgResult.value.data, error: orgResult.value.error?.message }
      : { error: orgResult.reason };

    debugData.staticPages = staticPagesResult.status === 'fulfilled'
      ? { count: staticPagesResult.value.data?.length || 0, data: staticPagesResult.value.data, error: staticPagesResult.value.error?.message }
      : { error: staticPagesResult.reason };

    debugData.blogPosts = postsResult.status === 'fulfilled'
      ? { count: postsResult.value.data?.length || 0, data: postsResult.value.data, error: postsResult.value.error?.message }
      : { error: postsResult.reason };

    debugData.features = featuresResult.status === 'fulfilled'
      ? { count: featuresResult.value.data?.length || 0, data: featuresResult.value.data, error: featuresResult.value.error?.message }
      : { error: featuresResult.reason };

    debugData.products = productsResult.status === 'fulfilled'
      ? { count: productsResult.value.data?.length || 0, data: productsResult.value.data, error: productsResult.value.error?.message }
      : { error: productsResult.reason };

    return NextResponse.json(debugData);
    
  } catch (error) {
    console.error('Sitemap debug error:', error);
    return NextResponse.json({ 
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to generate XML sitemap with better formatting and validation
function generateSitemap(pages: SitemapPage[]): string {
  // Ensure at least the homepage is included
  const finalPages = pages.length > 0 ? pages : [{
    url: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    lastmod: formatDateToISO(null),
    priority: 1.0,
  }];

  // Validate and sanitize URLs
  const validPages = finalPages
    .filter(page => page.url && page.url.trim().length > 0)
    .map(page => ({
      ...page,
      url: page.url.trim(),
      priority: Math.min(Math.max(page.priority || 0.5, 0.0), 1.0), // Clamp between 0.0 and 1.0
    }));

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${validPages
  .map(page => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${validateLastmod(page.lastmod)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>`)
  .join('\n')}
</urlset>`;

  return xmlContent;
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}