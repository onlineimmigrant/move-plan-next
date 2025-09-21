import { supabase, getOrganizationId } from '../../../lib/supabase';
import { getBaseUrl } from '../../../lib/utils';
import { fetchProductsListingSEOData } from '../../../lib/supabase/seo';
import ClientProductsPage from './ClientProductsPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';

// Enhanced type definitions with better type safety
type Product = {
  id: number;
  slug?: string;
  is_displayed: boolean;
  organization_id: string;
  product_name: string | null;
  product_sub_type_id: number;
  product_sub_type_additional_id: number;
  order: number;
  price_manual?: string | null;
  currency_manual_symbol?: string | null;
  links_to_image?: string | null;
  [key: string]: any;
};

type ProductSubType = {
  id: number;
  name: string;
  display_for_products: boolean;
  title_english?: string;
  [key: string]: any;
};

// Optimized product fetching with better error handling
async function fetchProducts(baseUrl: string, categoryId?: string): Promise<Product[]> {
  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for fetchProducts, baseUrl:', baseUrl);
      throw new Error('Organization not found');
    }

    let query = supabase
      .from('product')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_displayed', true);

    // Filter by category if provided
    if (categoryId) {
      query = query.or(`product_sub_type_id.eq.${categoryId},product_sub_type_additional_id.eq.${categoryId}`);
    }

    const { data, error } = await query.order('order', { ascending: true });

    if (error) {
      console.error('Supabase error fetching products:', error);
      throw new Error(`Failed to load products: ${error.message}`);
    }

    console.log('Successfully fetched products:', data?.length || 0, 'items for organization:', organizationId);
    return data || [];
  } catch (err) {
    console.error('Error in fetchProducts:', err);
    throw err;
  }
}

// Optimized product sub-types fetching
async function fetchProductSubTypes(baseUrl: string): Promise<ProductSubType[]> {
  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for fetchProductSubTypes, baseUrl:', baseUrl);
      throw new Error('Organization not found');
    }

    const { data, error } = await supabase
      .from('product_sub_type')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('display_for_products', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching product sub-types:', error);
      throw new Error(`Failed to load product categories: ${error.message}`);
    }

    console.log('Successfully fetched product sub-types:', data?.length || 0, 'items for organization:', organizationId);
    return data || [];
  } catch (err) {
    console.error('Error in fetchProductSubTypes:', err);
    throw err;
  }
}

// Loading component for better UX
function ProductsLoading() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-32 mx-auto mb-12"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  try {
    // Enhanced URL determination with better fallback logic
    let baseUrl = getBaseUrl(true);
    if (!baseUrl || baseUrl === 'http://localhost:3000') {
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    }

    // Await searchParams before using
    const resolvedSearchParams = await searchParams;

    // Fetch SEO data for products listing
    const seoData = await fetchProductsListingSEOData(baseUrl, resolvedSearchParams.category);

    return {
      title: seoData.title || 'Products',
      description: seoData.description || 'Browse our complete product catalog',
      keywords: Array.isArray(seoData.keywords) ? seoData.keywords.join(', ') : seoData.keywords,
      openGraph: {
        title: seoData.title || 'Products',
        description: seoData.description || 'Browse our complete product catalog',
        url: seoData.canonicalUrl,
        images: seoData.seo_og_image ? [{ url: seoData.seo_og_image }] : [],
      },
      alternates: {
        canonical: seoData.canonicalUrl,
      },
      other: {
        'structured-data': JSON.stringify(seoData.structuredData || []),
      },
    };
  } catch (error) {
    console.error('Error generating products page metadata:', error);
    return {
      title: 'Products',
      description: 'Browse our complete product catalog',
    };
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  // Skip Supabase queries during Vercel static build
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  if (isBuild) {
    console.log('Skipping Supabase queries during Vercel build');
    return (
      <Suspense fallback={<ProductsLoading />}>
        <ClientProductsPage
          initialProducts={[]}
          initialSubTypes={[]}
          initialError={null}
          isAdmin={false}
        />
      </Suspense>
    );
  }

  // Enhanced URL determination with better fallback logic
  let baseUrl = getBaseUrl(true);
  if (!baseUrl || baseUrl === 'http://localhost:3000') {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
  
  console.log('ProductsPage baseUrl:', baseUrl, 'VERCEL_URL:', process.env.VERCEL_URL);

  let allProducts: Product[] = [];
  let productSubTypes: ProductSubType[] = [];
  let error: string | null = null;
  const isAdmin = false;
  
  // Await searchParams before using
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams.category;

  try {
    // Parallel data fetching for better performance
    const [products, subTypes] = await Promise.all([
      fetchProducts(baseUrl, categoryId),
      fetchProductSubTypes(baseUrl)
    ]);
    
    allProducts = products;
    productSubTypes = subTypes;
  } catch (err: any) {
    console.error('Error fetching data with primary baseUrl:', err.message);
    
    // Fallback strategy with alternative base URL
    const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (fallbackUrl !== baseUrl) {
      console.log('Trying fallback baseUrl:', fallbackUrl);
      try {
        const [products, subTypes] = await Promise.all([
          fetchProducts(fallbackUrl, categoryId),
          fetchProductSubTypes(fallbackUrl)
        ]);
        
        allProducts = products;
        productSubTypes = subTypes;
      } catch (fallbackErr: any) {
        console.error('Fallback fetch also failed:', fallbackErr.message);
        error = `Failed to load products data: ${fallbackErr.message}`;
      }
    } else {
      error = `Failed to load products data: ${err.message}`;
    }
  }

  return (
    <Suspense fallback={<ProductsLoading />}>
      <ClientProductsPage
        initialProducts={allProducts}
        initialSubTypes={productSubTypes}
        initialError={error}
        isAdmin={isAdmin}
      />
    </Suspense>
  );
}