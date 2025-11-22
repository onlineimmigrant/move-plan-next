import { getOrganizationWithType, supabase, getOrganizationId } from '../../../lib/supabase';
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
      const { data, error, count } = await supabase
        .from('blog_post')
        .select('id, slug, title, description, display_config, organization_config, media_config', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('organization_config->order', { ascending: true })
        .limit(8);
      if (!error && data) {
        initialPosts = data.map((p: any) => ({
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
        }));
        initialTotal = count || initialPosts.length;
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