// app/sitemap.xml/route.tsx
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getPostUrl } from '@/lib/postUtils'; // Import getPostUrl

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET handler for the sitemap
export async function GET() {
  // Get the base URL from environment variable
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  // Fetch dynamic pages from Supabase (blog_post table)
  const { data: posts, error } = await supabase
    .from('blog_post')
    .select('slug, last_modified, display_this_post, section_id')
    .eq('display_this_post', true); // Only fetch posts where display_this_post is true

  if (error) {
    console.error('Error fetching posts:', error);
    // Return an empty sitemap in case of error
    return new Response(generateSitemap([]), {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  const { data: features} = await supabase
    .from('feature')
    .select('slug, created_at')
  
  const { data: product} = await supabase
    .from('product')
    .select('slug, updated')
  


  // Define static pages with priority 1.0
  const staticPages = [
    { url: `${baseUrl}/`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/about-us`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/products`, lastmod: new Date().toISOString(), priority: 1.0 },
    {
      url: `${baseUrl}/become-affiliate-partner`,
      lastmod: new Date().toISOString(),
      priority: 1.0,
    },
    { url: `${baseUrl}/blog`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/developers`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/faq`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/features`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/investors`, lastmod: new Date().toISOString(), priority: 1.0 },
    {
      url: `${baseUrl}/referral-bonuses`,
      lastmod: new Date().toISOString(),
      priority: 1.0,
    },
    { url: `${baseUrl}/support`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/terms`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/education-hub/study-resources`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/education-hub/courses`, lastmod: new Date().toISOString(), priority: 1.0 },
    { url: `${baseUrl}/education-hub/quizzes`, lastmod: new Date().toISOString(), priority: 1.0 },
  ];

  // Map dynamic pages from blog_post with priority 0.8
  const dynamicPages = posts?.map((post) => ({
    url: `${baseUrl}${getPostUrl({ section_id: post.section_id, slug: post.slug })}`,
    lastmod: post.last_modified || new Date().toISOString(),
    priority: 0.8,
  })) || [];

   
  const dynamicFeaturePages = features?.map((feature) => ({
      url: `${baseUrl}/features/${ feature.slug }`,
      lastmod: feature.created_at || new Date().toISOString(),
      priority: 0.8,
    })) || [];

  const dynamicProductsPages = product?.map((product) => ({
      url: `${baseUrl}/products/${ product.slug }`,
      lastmod: product.updated || new Date().toISOString(),
      priority: 0.8,
    })) || [];

  // Combine static and dynamic pages
  const pages = [...staticPages, ...dynamicPages, ...dynamicFeaturePages, ...dynamicProductsPages];

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