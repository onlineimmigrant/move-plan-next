import React from 'react';
import { notFound } from 'next/navigation';
import { getOrganizationId } from '@/lib/supabase';
import { supabase } from '@/lib/supabaseClient';
import PostPageClient from './PostPageClient';
import { PostPageErrorBoundary } from '@/components/PostPage/PostPageErrorBoundary';
import PerfPostMount from '../../../components/perf/PerfPostMount';
import { renderMarkdownToHtml } from '@/lib/markdown/renderMarkdownToHtml';

// ISR for blog posts - pre-build at deploy time, allow admin edits to appear within 60s
export const dynamicParams = true; // Allow dynamic routes not in generateStaticParams
export const revalidate = 60; // Revalidate every 60 seconds for admin changes

// Set proper cache headers for CDN
export const metadata = {
  other: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },
};

// Generate static params for all blog posts
export async function generateStaticParams() {
  try {
    // Only generate static params if we have Supabase credentials
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('[SSG] Skipping blog post static generation - missing Supabase credentials');
      return [];
    }
    
    // Get the production organization ID
    const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'e534f121-e396-462c-9aab-acd2e66d8837';
    
    // Fetch all published blog posts
    const { data: posts, error } = await supabase
      .from('blog_post')
      .select('slug, display_config')
      .eq('organization_id', organizationId);
    
    if (error) {
      console.error('[SSG] Error fetching blog posts:', error.message);
      return [];
    }
    
    if (!posts) return [];
    
    // Filter for displayable posts and generate params
    // With next-intl and localePrefix:'as-needed', don't specify locale in params
    // next-intl will automatically generate for default locale without prefix
    const params = posts
      .filter(post => {
        const displayConfig = post.display_config as any;
        return displayConfig?.display_this_post !== false;
      });
    
    console.log(`[SSG] Generating ${params.length} blog post static params`);
    return params.map(post => ({ slug: post.slug }));
  } catch (error) {
    console.error('[SSG] Error generating blog post params:', error);
    return [];
  }
}

interface Post {
  id: string;
  slug: string;
  title: string;
  description: string;
  content?: string;
  content_type?: 'html' | 'markdown';
  section?: string;
  subsection?: string;
  created_on: string;
  is_with_author: boolean;
  is_company_author: boolean;
  author?: { first_name: string; last_name: string };
  excerpt?: string;
  featured_image?: string;
  keywords?: string;
  section_id?: string | null;
  last_modified: string;
  author_name?: string;
  display_this_post: boolean;
  reviews?: { rating: number; author: string; comment: string }[];
  faqs?: { question: string; answer: string }[];
  organization_id?: string;
  main_photo?: string;
  additional_photo?: string;
  doc_set?: string | null;
  doc_set_order?: number | null;
  doc_set_title?: string | null;
  type?: 'default' | 'minimal' | 'landing' | 'doc_set';
  translations?: Record<string, { title?: string; description?: string; content?: string }>;
}

// Flatten JSONB style fields similar to API route
function flattenPost(raw: any): Post | null {
  if (!raw) return null;
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    content: raw.content,
    content_type: raw.content_type,
    section: raw.section,
    subsection: raw.organization_config?.subsection ?? raw.subsection,
    created_on: raw.created_on,
    is_with_author: raw.author_config?.is_with_author ?? raw.is_with_author ?? false,
    is_company_author: raw.author_config?.is_company_author ?? raw.is_company_author ?? false,
    author: raw.author,
    excerpt: raw.excerpt,
    featured_image: raw.featured_image,
    keywords: raw.keywords,
    section_id: raw.organization_config?.section_id ?? raw.section_id ?? null,
    last_modified: raw.last_modified,
    author_name: raw.author_name ?? null,
    display_this_post: raw.display_config?.display_this_post ?? raw.display_this_post ?? true,
    organization_id: raw.organization_id,
    main_photo: raw.media_config?.main_photo ?? raw.main_photo,
    additional_photo: raw.additional_photo,
    doc_set: raw.organization_config?.doc_set ?? raw.doc_set ?? null,
    doc_set_order: raw.organization_config?.doc_set_order ?? raw.doc_set_order ?? null,
    doc_set_title: raw.organization_config?.doc_set_title ?? raw.doc_set_title ?? null,
    type: raw.display_config?.type ?? raw.type,
    reviews: raw.reviews,
    faqs: raw.faqs,
    translations: raw.translations ?? {},
  } as Post;
}

// Direct Supabase fetch (avoids extra API hop)
async function fetchPostData(slug: string): Promise<Post | null> {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      console.warn('[PostPage] No organization id resolved');
      return null;
    }
    console.log('🔍 [ServerSide] Fetching post (direct) slug:', slug, 'org:', organizationId);
    const { data, error } = await supabase
      .from('blog_post')
      .select('id, slug, title, description, content, content_type, created_on, last_modified, author_name, organization_id, display_config, organization_config, media_config, translations')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .maybeSingle();
    if (error) {
      console.error('[PostPage] Supabase error:', error.message);
      return null;
    }
    if (!data) return null;
    const flattened = flattenPost(data);
    if (!flattened?.display_this_post) return null;

    if (flattened.content_type === 'markdown' && flattened.content) {
      try {
        flattened.content = await renderMarkdownToHtml(flattened.content);
        flattened.content_type = 'html';
      } catch (err) {
        console.error('[PostPage] Failed to render markdown to HTML:', err);
      }
    }

    return flattened;
  } catch (err) {
    console.error('[PostPage] Unexpected fetch error:', err);
    return null;
  }
}

interface PostPageProps {
  params: Promise<{ slug: string; locale: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  // console.log('🔥 [ServerSide] PostPage component loading');
  
  const { slug, locale } = await params;
  // console.log('🔥 [ServerSide] PostPage params - slug:', slug, 'locale:', locale);
  
  // Fetch post data server-side
  const post = await fetchPostData(slug);
  
  if (!post) {
    console.log('❌ [ServerSide] Post not found, calling notFound()');
    notFound();
  }
  
  if (!post.display_this_post) {
    console.log('❌ [ServerSide] Post not set to display, calling notFound()');
    notFound();
  }
  
  // console.log('✅ [ServerSide] Post found and will be rendered:', post.title);
  // console.log('🔍 [ServerSide] Article structured data will be generated by SEO system');
  
  return (
    <>
      {/* Client component for interactive functionality */}
      <PerfPostMount />
      <PostPageErrorBoundary>
        <PostPageClient post={post} slug={slug} locale={locale} />
      </PostPageErrorBoundary>
    </>
  );
}