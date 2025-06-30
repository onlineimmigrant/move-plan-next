// components/StructuredData.tsx
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { getOrganizationId, getSettings } from '@/lib/getSettings';
import { Settings } from '@/types/settings';

interface StructuredDataProps {
  path: string;
}

interface BlogPostData {
  title: string;
  metadescription_for_page: string;
  main_photo: string;
}

interface ProductData {
  product_name: string;
  metadescription_for_page: string;
  links_to_image: string;
  price_manual?: number;
  currency_manual?: string;
  organization_id: string;
  brand?: string;
  id: number;
}

interface PageData {
  title: string;
  description: string;
  og_url: string;
}

type Data = BlogPostData | ProductData | PageData | null;

export async function StructuredData({ path }: StructuredDataProps) {
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

  let data: Data = null;
  // Normalize path
  const normalizedPath = path.replace(/^\/|\/$/g, '') || 'home';

  // Dynamic check for static pages
  const { data: pageExists, error: pageCheckError } = await supabase
    .from('pages')
    .select('path')
    .eq('path', normalizedPath)
    .eq('organization_id', organizationId)
    .single();



  if (pageExists) {
    // Static pages from pages table
    const { data: pageData, error } = await supabase
      .from('pages')
      .select('title, description, og_url')
      .eq('path', normalizedPath)
      .eq('organization_id', organizationId)
      .single();
    if (error) {
      console.error(`Error fetching page data for ${normalizedPath}:`, error);
    } else if (pageData) {
      data = pageData as PageData;
    }
  } else if (path.startsWith('products/')) {
    // Products from product table (e.g., /products/[slug])
    const slug = normalizedPath.split('/').pop() || '';
    const { data: productData, error } = await supabase
      .from('product')
      .select('product_name, metadescription_for_page, links_to_image, price_manual, currency_manual, organization_id, id')
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single();
    if (error) {
      console.error(`Error fetching product data for ${slug}:`, error);
    } else if (productData) {
      data = { ...productData, brand: settings.site || 'Default Brand' } as ProductData;
    }
  } else {
    // Blog posts from blog_post table (e.g., /[slug])
    const slug = normalizedPath;
    const { data: postData, error } = await supabase
      .from('blog_post')
      .select('title, metadescription_for_page, main_photo')
      .eq('slug', slug)
      .eq('display_this_post', true)
      .eq('organization_id', organizationId)
      .single();
    if (error) {
      console.error(`Error fetching blog post data for ${slug}:`, error);
    } else if (postData) {
      data = postData as BlogPostData;
    }
  }

  if (!data) {
    console.warn(`No data found for path: ${normalizedPath}`);
    // Use seo_structured_data from settings if available
    if (settings.seo_structured_data) {
      try {
        return <script type="application/ld+json">{settings.seo_structured_data}</script>;
      } catch (error) {
        console.error('Error parsing seo_structured_data from settings:', error);
      }
    }
    return null;
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': pageExists
      ? 'WebPage'
      : path.startsWith('products/')
      ? 'Product'
      : 'BlogPosting',
    name: ('title' in data
      ? data.title
      : 'product_name' in data
      ? data.product_name
      : settings.seo_title || 'Default Title') as string,
    description: ('metadescription_for_page' in data
      ? data.metadescription_for_page
      : 'description' in data
      ? data.description
      : settings.seo_description || 'Default Description') as string,
    url: ('main_photo' in data
      ? `${currentDomain}/${normalizedPath}`
      : 'links_to_image' in data
      ? `${currentDomain}/${normalizedPath}`
      : data.og_url || `${currentDomain}/${normalizedPath}`) as string,
    ...(path.startsWith('products/') && 'price_manual' in data
      ? {
          sku: `PRODUCT_${(data as ProductData).id}`,
          offers: {
            '@type': 'Offer',
            price: (data as ProductData).price_manual?.toString() || '0.00',
            priceCurrency: (data as ProductData).currency_manual || 'USD',
            availability: 'https://schema.org/InStock',
            url: `${currentDomain}/${normalizedPath}`,
          },
          brand: {
            '@type': 'Brand',
            name: (data as ProductData).brand || settings.site || 'Default Brand',
          },
          image: (data as ProductData).links_to_image || settings.seo_og_image || '/default-image.jpg',
        }
      : {}),
  };

  console.log('Generated JSON-LD for', normalizedPath, ':', JSON.stringify(jsonLd, null, 2));

  return (
    <script type="application/ld+json">
      {JSON.stringify(jsonLd, null, 2)}
    </script>
  );
}