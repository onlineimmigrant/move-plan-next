// app/sitemap.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';
import { getPostUrl } from '@/lib/postUtils';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET handler for the sitemap
export async function GET() {
  console.log('Generating sitemap...');

  // Get the organization ID
  const organizationId = await getOrganizationId();
  console.log('Organization ID:', organizationId);

  // Define common static pages with priority 1.0 (always included)
  const commonStaticPages = [
    { url: '/about-us', lastmod: new Date().toISOString(), priority: 1.0 },
    { url: '/products', lastmod: new Date().toISOString(), priority: 1.0 },
    { url: '/blog', lastmod: new Date().toISOString(), priority: 1.0 },
    { url: '/faq', lastmod: new Date().toISOString(), priority: 1.0 },
    { url: '/features', lastmod: new Date().toISOString(), priority: 1.0 },
    { url: '/support', lastmod: new Date().toISOString(), priority: 1.0 },
    { url: '/terms', lastmod: new Date().toISOString(), priority: 1.0 },
  ];

  let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  let pages = commonStaticPages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastmod: page.lastmod,
    priority: page.priority,
  }));

  if (!organizationId) {
    console.error('No organization found for sitemap generation');
  } else {
    // Fetch organization's base_url
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('base_url')
      .eq('id', organizationId)
      .single();

    if (orgError || !orgData) {
      console.error('Error fetching organization base_url:', {
        message: orgError?.message || 'No error message',
        code: orgError?.code || 'No code',
        details: orgError?.details || 'No details',
      });
    } else {
      baseUrl = orgData.base_url || baseUrl;
      console.log('Base URL:', baseUrl);
    }

    // Fetch additional static pages
    const { data: staticPagesData, error: staticPagesError } = await supabase
      .from('sitemap_static_pages')
      .select('url_path, priority, last_modified')
      .eq('organization_id', organizationId);

    if (staticPagesError) {
      console.error('Error fetching static pages:', {
        message: staticPagesError.message,
        code: staticPagesError.code,
        details: staticPagesError.details,
        organizationId,
      });
    }

    const additionalStaticPages = staticPagesData?.map((page) => ({
      url: `${baseUrl}${page.url_path.startsWith('/') ? page.url_path : `/${page.url_path}`}`,
      lastmod: page.last_modified ? new Date(page.last_modified).toISOString() : new Date().toISOString(),
      priority: page.priority || 1.0,
    })) || [];

    // Fetch blog posts
    const { data: posts, error: postError } = await supabase
      .from('blog_post')
      .select('slug, last_modified, display_this_post, section_id')
      .eq('display_this_post', true)
      .eq('organization_id', organizationId);

    if (postError) {
      console.error('Error fetching posts:', {
        message: postError.message,
        code: postError.code,
        details: postError.details,
      });
    }

    // Fetch features
    const { data: features, error: featureError } = await supabase
      .from('feature')
      .select('slug, created_at')
      .eq('organization_id', organizationId);

    if (featureError) {
      console.error('Error fetching features:', {
        message: featureError.message,
        code: featureError.code,
        details: featureError.details,
      });
    }

    // Fetch products
    const { data: products, error: productError } = await supabase
      .from('product')
      .select('slug, updated_at')
      .eq('organization_id', organizationId);

    if (productError) {
      console.error('Error fetching products:', {
        message: productError.message,
        code: productError.code,
        details: productError.details,
      });
    }

    // Map dynamic pages
    const dynamicPages = posts?.map((post) => ({
      url: `${baseUrl}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`,
      lastmod: post.last_modified ? new Date(post.last_modified).toISOString() : new Date().toISOString(),
      priority: 0.8,
    })) || [];

    const dynamicFeaturePages = features?.map((feature) => ({
      url: `${baseUrl}/features/${feature.slug}`,
      lastmod: feature.created_at ? new Date(feature.created_at).toISOString() : new Date().toISOString(),
      priority: 0.8,
    })) || [];

    const dynamicProductsPages = products?.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastmod: product.updated_at ? new Date(product.updated_at).toISOString() : new Date().toISOString(),
      priority: 0.8,
    })) || [];

    // Combine all pages
    pages = [...pages, ...additionalStaticPages, ...dynamicPages, ...dynamicFeaturePages, ...dynamicProductsPages];
  }

  console.log('Generated Pages:', pages);

  // Generate and return the sitemap
  return new Response(generateSitemap(pages), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

// Helper function to generate XML sitemap
function generateSitemap(pages: { url: string; lastmod: string; priority: number }[]) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .filter((page) => page.url && isValidUrl(page.url)) // Filter invalid URLs
  .map((page) => `
  <url>
    <loc>${sanitizeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority.toFixed(1)}</priority>
  </url>
`)
  .join('')}
</urlset>`;
  console.log('Generated Sitemap XML:', xml);
  return xml;
}

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    console.warn('Invalid URL filtered out:', url);
    return false;
  }
}

// Helper function to sanitize XML content
function sanitizeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}