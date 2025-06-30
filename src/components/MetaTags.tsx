// components/MetaTags.tsx
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { getOrganizationId, getSettings } from '@/lib/getSettings';
import { Settings } from '@/types/settings';

interface MetaTagsProps {
  path: string;
}

export async function MetaTags({ path }: MetaTagsProps) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const headersList = headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const currentDomain = `${protocol}://${host}`;
  const organizationId = await getOrganizationId({ headers: { host } });
  const settings: Settings = await getSettings(currentDomain);

  // Initialize metaData with defaults from settings table
  let metaData = {
    title: settings.seo_title || 'Default Title',
    description: settings.seo_description || 'Default Description',
    keywords: settings.seo_keywords || '',
    ogImage: settings.seo_og_image || '/default-image.jpg',
    ogUrl: `${currentDomain}/${path}`,
  };

  // Normalize path (remove leading/trailing slashes)
  const normalizedPath = path.replace(/^\/|\/$/g, '') || 'home';

  // Dynamic check for static pages in the pages table
  const { data: pageExists, error: pageCheckError } = await supabase
    .from('pages')
    .select('path')
    .eq('path', normalizedPath)
    .eq('organization_id', organizationId)
    .single();

 

  if (pageExists) {
    // Static page found in pages table
    const { data, error } = await supabase
      .from('pages')
      .select('title, description, keywords, og_image, og_url')
      .eq('path', normalizedPath)
      .eq('organization_id', organizationId)
      .single();
    if (error) {
      console.error(`Error fetching page data for ${normalizedPath}:`, error);
    } else if (data) {
      metaData = {
        title: data.title || settings.seo_title || 'Default Title',
        description: data.description || settings.seo_description || 'Default Description',
        keywords: data.keywords || settings.seo_keywords || '',
        ogImage: data.og_image || settings.seo_og_image || '/default-image.jpg',
        ogUrl: data.og_url || `${currentDomain}/${normalizedPath}`,
      };
    }
  } else if (path.startsWith('products/')) {
    // Products from product table (e.g., /products/[slug])
    const slug = normalizedPath.split('/').pop() || '';
    const { data, error } = await supabase
      .from('product')
      .select('product_name, metadescription_for_page, links_to_image')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single();
    if (error) {
      console.error(`Error fetching product data for ${slug}:`, error);
    } else if (data) {
      metaData = {
        title: data.product_name || settings.seo_title || 'Default Title',
        description: data.metadescription_for_page || settings.seo_description || 'Default Description',
        keywords: settings.seo_keywords || '',
        ogImage: data.links_to_image || settings.seo_og_image || '/default-image.jpg',
        ogUrl: `${currentDomain}/${normalizedPath}`,
      };
    }
  } else {
    // Blog posts from blog_post table (e.g., /[slug])
    const slug = normalizedPath;
    const { data, error } = await supabase
      .from('blog_post')
      .select('title, metadescription_for_page, main_photo')
      .eq('slug', slug)
      .eq('display_this_post', true)
      .eq('organization_id', organizationId)
      .single();
    if (error) {
      console.error(`Error fetching blog post data for ${slug}:`, error);
    } else if (data) {
      metaData = {
        title: data.title || settings.seo_title || 'Default Title',
        description: data.metadescription_for_page || settings.seo_description || 'Default Description',
        keywords: settings.seo_keywords || '',
        ogImage: data.main_photo || settings.seo_og_image || '/default-image.jpg',
        ogUrl: `${currentDomain}/${normalizedPath}`,
      };
    }
  }

  console.log('Generated MetaData for', normalizedPath, ':', metaData);

  return (
    <>
      <title>{metaData.title}</title>
      <meta name="description" content={metaData.description} />
      <meta name="keywords" content={metaData.keywords} />
      <meta property="og:title" content={metaData.title} />
      <meta property="og:description" content={metaData.description} />
      <meta property="og:image" content={metaData.ogImage} />
      <meta property="og:url" content={metaData.ogUrl} />
      <meta property="og:type" content={path.startsWith('products/') ? 'product' : 'article'} />
      <meta property="og:site_name" content={settings.site || 'Your Site Name'} />
      <meta name="twitter:card" content={settings.seo_twitter_card || 'summary_large_image'} />
      <meta name="twitter:title" content={metaData.title} />
      <meta name="twitter:description" content={metaData.description} />
      <meta name="twitter:image" content={metaData.ogImage} />
      <link rel="canonical" href={metaData.ogUrl} />
    </>
  );
}