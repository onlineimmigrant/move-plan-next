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
  // Get the organization ID
  const organizationId = await getOrganizationId();
  if (!organizationId) {
    console.error('No organization found for sitemap generation');
    return new Response(generateSitemap([]), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

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
    return new Response(generateSitemap([]), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const baseUrl = orgData.base_url || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch additional static pages from sitemap_static_pages
  const { data: staticPagesData, error: staticPagesError } = await supabase
    .from('sitemap_static_pages')
    .select('url_path, priority, last_modified')
    .eq('organization_id', organizationId);

  if (staticPagesError) {
    console.error('Error fetching static pages:', {
      message: staticPagesError.message || 'No error message',
      code: staticPagesError.code || 'No code',
      details: staticPagesError.details || 'No details',
      organizationId,
    });
  }

  // Map additional static pages
  const additionalStaticPages = staticPagesData?.map((page) => ({
    url: `${baseUrl}${page.url_path}`,
    lastmod: page.last_modified ? new Date(page.last_modified).toISOString() : new Date().toISOString(),
    priority: page.priority || 1.0,
  })) || [];

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
    // Deactivated or managed in sitemap_static_pages:
    // { url: `${baseUrl}/become-affiliate-partner`, lastmod: new Date().toISOString(), priority: 1.0 },
    // { url: `${baseUrl}/referral-bonuses`, lastmod: new Date().toISOString(), priority: 1.0 },
    // { url: `${baseUrl}/investors`, lastmod: new Date().toISOString(), priority: 1.0 },
    // { url: `${baseUrl}/developers`, lastmod: new Date().toISOString(), priority: 1.0 },
    // { url: `${baseUrl}/education-hub/study-resources`, lastmod: new Date().toISOString(), priority: 1.0 },
    // { url: `${baseUrl}/education-hub/courses`, lastmod: new Date().toISOString(), priority: 1.0 },
    // { url: `${baseUrl}/education-hub/quizzes`, lastmod: new Date().toISOString(), priority: 1.0 },
  ];

  // Fetch dynamic pages from Supabase (blog_post table)
  const { data: posts, error: postError } = await supabase
    .from('blog_post')
    .select('slug, last_modified, display_this_post, section_id')
    .eq('display_this_post', true)
    .eq('organization_id', organizationId);

  if (postError) {
    console.error('Error fetching posts:', {
      message: postError.message || 'No error message',
      code: postError.code || 'No code',
      details: postError.details || 'No details',
    });
  }

  // Fetch features
  const { data: features, error: featureError } = await supabase
    .from('feature')
    .select('slug, created_at')
    .eq('organization_id', organizationId);

  if (featureError) {
    console.error('Error fetching features:', {
      message: featureError.message || 'No error message',
      code: featureError.code || 'No code',
      details: featureError.details || 'No details',
    });
  }

  // Fetch products
  const { data: products, error: productError } = await supabase
    .from('product')
    .select('slug, updated_at')
    .eq('organization_id', organizationId);

  if (productError) {
    console.error('Error fetching products:', {
      message: productError.message || 'No error message',
      code: productError.code || 'No code',
      details: productError.details || 'No details',
    });
  }

  // Map dynamic pages from blog_post with priority 0.8
  const dynamicPages = posts?.map((post) => ({
    url: `${baseUrl}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`,
    lastmod: post.last_modified || new Date().toISOString(),
    priority: 0.8,
  })) || [];

  const dynamicFeaturePages = features?.map((feature) => ({
    url: `${baseUrl}/features/${feature.slug}`,
    lastmod: feature.created_at || new Date().toISOString(),
    priority: 0.8,
  })) || [];

  const dynamicProductsPages = products?.map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastmod: product.updated_at || new Date().toISOString(),
    priority: 0.8,
  })) || [];

  // Combine common static, additional static, and dynamic pages
  const pages = [...commonStaticPages, ...additionalStaticPages, ...dynamicPages, ...dynamicFeaturePages, ...dynamicProductsPages];

  // Generate and return the sitemap
  return new Response(generateSitemap(pages), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
    });
}

// Helper function to generate XML sitemap
function generateSitemap(pages: { url: string; lastmod: string; priority: number }[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
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