import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';
import { getPostUrl } from '@/lib/postUtils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET handler for the sitemap
export async function GET(request: NextRequest) {
  // Get the actual host and protocol from the request
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const actualBaseUrl = `${protocol}://${host}`;

  // Get the organization ID
  const organizationId = await getOrganizationId();
  let baseUrl = actualBaseUrl;

  if (organizationId) {
    // Fetch organization's base_url from Supabase
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('base_url')
      .eq('id', organizationId)
      .single();

    // Log organization data
    console.log('Organization data:', {
      organizationId,
      baseUrl: orgData?.base_url || null,
      actualBaseUrl,
      orgError: orgError?.message || null,
      orgErrorCode: orgError?.code || null,
      orgErrorDetails: orgError?.details || null,
      requestHeaders: Object.fromEntries(request.headers.entries()),
    });

    if (!orgError && orgData?.base_url) {
      // Use Supabase base_url only if it’s a valid URL and not a Vercel-like deployment URL
      try {
        const url = new URL(orgData.base_url);
        // Check if base_url is a valid tenant domain (not a Vercel-like URL)
        if (!url.hostname.includes('vercel.app')) {
          baseUrl = orgData.base_url;
        }
      } catch (e) {
        console.warn('Invalid base_url in Supabase, using actualBaseUrl:', {
          baseUrl: orgData.base_url,
        });
      }
    } else if (orgError) {
      console.error('Error fetching organization base_url:', {
        message: orgError?.message || 'No error message',
        code: orgError?.code || 'No code',
        details: orgError?.details || 'No details',
        host,
      });
    }
  } else {
    console.error('No organization found for sitemap generation', { host });
  }

  // Define common static pages with priority 1.0 (always included)
  const commonStaticPages = [
    { url: `${baseUrl}/`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/about-us`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/products`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/blog`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/faq`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/features`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/support`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/terms`, lastmod: new Date().toISOString(), priority: 1.0 },
  ];

  // Initialize arrays for dynamic pages
  let additionalStaticPages: { url: string; lastmod: string; priority: number }[] = [];
  let dynamicPages: { url: string; lastmod: string; priority: number }[] = [];
  let dynamicFeaturePages: { url: string; lastmod: string; priority: number }[] = [];
  let dynamicProductsPages: { url: string; lastmod: string; priority: number }[] = [];

  // Only fetch dynamic pages if organizationId exists
  if (organizationId) {
    // Fetch additional static pages from sitemap_static_pages
    const { data: staticPagesData, error: staticPagesError } = await supabase
      .from('sitemap_static_pages')
      .select('url_path, priority, last_modified')
      .eq('organization_id', organizationId);

    console.log('Static pages query:', {
      staticPagesCount: staticPagesData?.length || 0,
      staticPages: staticPagesData || [],
      staticPagesError: staticPagesError?.message || null,
      staticPagesErrorCode: staticPagesError?.code || null,
      staticPagesErrorDetails: staticPagesError?.details || null,
      organizationId,
    });

    additionalStaticPages = (staticPagesData || []).map((page) => ({
      url: `${baseUrl}${page.url_path}`,
      lastmod: page.last_modified ? new Date(page.last_modified).toISOString() : new Date().toISOString(),
      priority: page.priority || 1.0,
    }));

    // Fetch blog posts
    const { data: posts, error: postError } = await supabase
      .from('blog_post')
      .select('slug, last_modified, display_this_post, section_id')
      .eq('display_this_post', true)
      .eq('organization_id', organizationId);

    console.log('Blog posts query:', {
      postsCount: posts?.length || 0,
      posts: posts || [],
      postError: postError?.message || null,
      postErrorCode: postError?.code || null,
      postErrorDetails: postError?.details || null,
      organizationId,
    });

    dynamicPages = (posts || []).map((post) => ({
      url: `${baseUrl}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`,
      lastmod: post.last_modified || new Date().toISOString(),
      priority: 0.8,
    }));

    // Fetch features
    const { data: features, error: featureError } = await supabase
      .from('feature')
      .select('slug, created_at')
      .eq('organization_id', organizationId);

    console.log('Features query:', {
      featuresCount: features?.length || 0,
      features: features || [],
      featureError: featureError?.message || null,
      featureErrorCode: featureError?.code || null,
      featureErrorDetails: featureError?.details || null,
      organizationId,
    });

    dynamicFeaturePages = (features || []).map((feature) => ({
      url: `${baseUrl}/features/${feature.slug}`,
      lastmod: feature.created_at || new Date().toISOString(),
      priority: 0.8,
    }));

    // Fetch products
    const { data: products, error: productError } = await supabase
      .from('product')
      .select('slug, updated_at')
      .eq('organization_id', organizationId);

    console.log('Products query:', {
      productsCount: products?.length || 0,
      products: products || [],
      productError: productError?.message || null,
      productErrorCode: productError?.code || null,
      productErrorDetails: productError?.details || null,
      organizationId,
    });

    dynamicProductsPages = (products || []).map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastmod: product.updated_at || new Date().toISOString(),
      priority: 0.8,
    }));
  } else {
    console.log('Skipping dynamic pages: No organizationId available');
  }

  // Combine all pages
  const pages = [
    ...commonStaticPages,
    ...additionalStaticPages,
    ...dynamicPages,
    ...dynamicFeaturePages,
    ...dynamicProductsPages,
  ];

  // Log final pages
  console.log('Sitemap pages:', {
    totalPages: pages.length,
    commonStaticPages: commonStaticPages.length,
    additionalStaticPages: additionalStaticPages.length,
    dynamicPages: dynamicPages.length,
    dynamicFeaturePages: dynamicFeaturePages.length,
    dynamicProductsPages: dynamicProductsPages.length,
    host,
    baseUrl,
    pageUrls: pages.map((p) => p.url),
  });

  // Generate and return the sitemap
  return new Response(generateSitemap(pages), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

// Helper function to generate XML sitemap
function generateSitemap(pages: { url: string; lastmod: string; priority: number }[]) {
  // Ensure at least the homepage is included
  const finalPages = pages.length > 0 ? pages : [{
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/`,
    lastmod: new Date().toISOString(),
    priority: 1.0,
  }];

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${finalPages
        .map(
          (page) => `
            <url>
              <loc>${page.url}</loc>
              <lastmod>${page.lastmod}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>${page.priority}</priority>
            </url>
          `
        )
        .join('')}
    </urlset>`;
}

// Helper function to generate sitemap with default homepage
function generateSitemapWithDefault(baseUrl: string) {
  const defaultPage = [{
    url: `${baseUrl}/`,
    lastmod: new Date().toISOString(),
    priority: 1.0,
  }];

  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${defaultPage
        .map(
          (page) => `
            <url>
              <loc>${page.url}</loc>
              <lastmod>${page.lastmod}</lastmod>
              <changefreq>weekly</changefreq>
              <priority>${page.priority}</priority>
            </url>
          `
        )
        .join('')}
    </urlset>`;
}