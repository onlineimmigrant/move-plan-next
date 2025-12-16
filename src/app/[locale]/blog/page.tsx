import { supabase } from '../../../lib/supabaseClient';
import { getOrganizationWithType, getOrganizationId } from '../../../lib/supabase';
import { getBaseUrl } from '../../../lib/utils';
import ClientBlogPage from './ClientBlogPage';
import { Suspense } from 'react';
import PerfBlogMount from '@/components/perf/PerfBlogMount';
import type { Metadata } from 'next';

export const revalidate = 60;

export default async function BlogPage() {
  const baseUrl = getBaseUrl(true) || getBaseUrl();
  let organizationType = 'general';
  let organizationId: string | null = null;
  let initialPosts: any[] = [];
  let initialTotal = 0;
  let initialHasMore = false;

  try {
    const orgData = await getOrganizationWithType(baseUrl);
    if (orgData?.type) organizationType = orgData.type;
    if (orgData?.id) organizationId = orgData.id;
  } catch (err) {
    console.error('BlogPage: failed to get organization type', err);
  }

  if (!organizationId) {
    try {
      organizationId = await getOrganizationId(baseUrl) as any;
    } catch (err) {
      console.error('BlogPage: failed to resolve organizationId', err);
    }
  }

  if (organizationId) {
    try {
      // First get all posts, then filter in code since JSONB boolean filtering is tricky
      const { data, error } = await supabase
        .from('blog_post')
        .select('id, slug, title, description, display_config, organization_config, media_config, last_modified, author_name')
        .eq('organization_id', organizationId)
        .order('last_modified', { ascending: false });
      
      if (!error && data) {
        // Filter posts that should be displayed as blog posts
        // Only include posts where both flags are true or undefined/null (default to true)
        const blogPosts = data.filter((p: any) => {
          const displayThis = p.display_config?.display_this_post;
          const asBlogPost = p.display_config?.display_as_blog_post;
          
          // If explicitly false, exclude
          if (displayThis === false || asBlogPost === false) {
            return false;
          }
          
          // Otherwise include (true, null, or undefined)
          return true;
        });
        
        console.log('[BlogPage SSR] Total posts from DB:', data.length);
        console.log('[BlogPage SSR] Filtered blog posts:', blogPosts.length);
        console.log('[BlogPage SSR] Excluded posts:', data.length - blogPosts.length);
        
        // Take first 12 for initial display
        initialPosts = blogPosts.slice(0, 12).map((p: any) => ({
          id: p.id,
          slug: p.slug,
            title: p.title,
            description: p.description,
            display_this_post: p.display_config?.display_this_post ?? true,
            display_as_blog_post: p.display_config?.display_as_blog_post ?? true,
            subsection: p.organization_config?.subsection ?? null,
            order: p.organization_config?.order ?? null,
            main_photo: p.media_config?.main_photo ?? null,
            media_config: p.media_config || null,
            last_modified: p.last_modified ?? null,
            author_name: p.author_name ?? null,
        }));
        initialTotal = blogPosts.length;
        initialHasMore = initialTotal > initialPosts.length;
      } else if (error) {
        console.error('BlogPage: initial posts fetch error', error.message);
      }
    } catch (err) {
      console.error('BlogPage: unexpected error fetching initial posts', err);
    }
  }

  return (
    <Suspense fallback={<div className="py-32 text-center text-gray-500">Loading...</div>}>
      <PerfBlogMount />
      <ClientBlogPage
        organizationType={organizationType}
        initialPosts={initialPosts}
        initialTotal={initialTotal}
        initialHasMore={initialHasMore}
        organizationIdProp={organizationId}
      />
    </Suspense>
  );
}