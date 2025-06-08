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
  if (!organizationId) {
    console.error('No organization found for sitemap generation', { host });
    return new Response(generateSitemapWithDefault(actualBaseUrl), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Fetch organization's base_url from Supabase
  const { data: orgData, error: orgError } = await supabase
    .from('organizations')
    .select('base_url')
    .eq('id', organizationId)
    .single();

  // Use Supabase base_url or fallback to actualBaseUrl
  const baseUrl = orgData?.base_url && !orgData.base_url.includes('move-plan-next.vercel.app')
    ? orgData.base_url
    : actualBaseUrl;

  // Log organization data
  console.log('Organization data:', {
    organizationId,
    baseUrl,
    actualBaseUrl,
    orgError: orgError?.message || null,
  });

  // If there's an error fetching organization data, use actualBaseUrl
  if (orgError || !orgData) {
    console.error('Error fetching organization base_url:', {
      message: orgError?.message || 'No error message',
      code: orgError?.code || 'No code',
      details: orgError?.details || 'No details',
      host,
    });
    return new Response(generateSitemapWithDefault(baseUrl), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Define common static pages with priority 1.0
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

  // Fetch additional static pages from sitemap_static_pages
  const { data: staticPagesData, error: staticPagesError } = await supabase
    .from('sitemap_static_pages')
    .select('url_path, priority, last_modified')
    .eq('organization_id', organizationId);

  // Log static pages result
  console.log('Static pages query:', {
    staticPagesCount: staticPagesData?.length || 0,
    staticPagesError: staticPagesError?.message || null,
    organizationId,
  });

  // Map additional static pages
  const additionalStaticPages = (staticPagesData || []).map((page) => ({
    url: `${baseUrl}${page.url_path}`,
    lastmod: page.last_modified ? new Date(page.last_modified).toISOString() : new Date().toISOString(),
    priority: page.priority || 1.0,
  }));

  // Fetch dynamic pages from Supabase (blog_post table)
  const { data: posts, error: postError } = await supabase
    .from('blog_post')
    .select('slug, last_modified, display_this_post, section_id')
    .eq('display_this_post', true)
    .eq('organization_id', organizationId);

  // Log blog posts result
  console.log('Blog posts query:', {
    postsCount: posts?.length || 0,
    postError: postError?.message || null,
    organizationId,
  });

  // Map dynamic pages from blog_post with priority 0.8
  const dynamicPages = (posts || []).map((post) => ({
    url: `${baseUrl}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`,
    lastmod: post.last_modified || new Date().toISOString(),
    priority: 0.8,
  }));

  // Fetch features
  const { data: features, error: featureError } = await supabase
    .from('feature')
    .select('slug, created_at')
    .eq('organization_id', organizationId);

  // Log features result
  console.log('Features query:', {
    featuresCount: features?.length || 0,
    featureError: featureError?.message || null,
    organizationId,
  });

  // Map dynamic feature pages
  const dynamicFeaturePages = (features || []).map((feature) => ({
    url: `${baseUrl}/features/${feature.slug}`,
    lastmod: feature.created_at || new Date().toISOString(),
    priority: 0.8,
  }));

  // Fetch products
  const { data: products, error: productError } = await supabase
    .from('product')
    .select('slug, updated_at')
    .eq('organization_id', organizationId);

  // Log products result
  console.log('Products query:', {
    productsCount: products?.length || 0,
    productError: productError?.message || null,
    organizationId,
  });

  // Map dynamic product pages
  const dynamicProductsPages = (products || []).map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastmod: product.updated_at || new Date().toISOString(),
    priority: 0.8,
  }));

  // Combine all pages
  const pages = [
    ...commonStaticPages,
    ...additionalStaticPages,
    ...dynamicPages,
    ...dynamicFeaturePages,
    ...dynamicProductsPages,
  ];

  // Log final pages count
  console.log('Sitemap pages:', {
    totalPages: pages.length,
    commonStaticPages: commonStaticPages.length,
    additionalStaticPages: additionalStaticPages.length,
    dynamicPages: dynamicPages.length,
    dynamicFeaturePages: dynamicFeaturePages.length,
    dynamicProductsPages: dynamicProductsPages.length,
    host,
  });

  // Generate and return the sitemap
  return new Response(generateSitemap(pages), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

// Helper function to generate XML sitemap
function generateSitemap(pages: { url: string; lastmod: string; priority: number }[]) {
  // If pages array is empty, include at least the homepage
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