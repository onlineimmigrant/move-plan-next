import { supabase, getOrganizationId, getOrganizationWithType } from '../../../lib/supabase';
import { getBaseUrl } from '../../../lib/utils';
import { fetchProductsListingSEOData } from '../../../lib/supabase/seo';
import { detectUserCurrency, getPriceForCurrency } from '../../../lib/currency';
import ClientProductsPage from './ClientProductsPage';
import { Suspense } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';

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
  computed_min_price?: number | null;
  computed_currency_symbol?: string | null;
  computed_stripe_price_id?: string | null;
  user_currency?: string;
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

// Optimized product fetching with multi-currency support and backward compatibility
async function fetchProducts(baseUrl: string, categoryId?: string, userCurrency: string = 'USD'): Promise<Product[]> {
  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for fetchProducts, baseUrl:', baseUrl);
      throw new Error('Organization not found');
    }

    let query = supabase
      .from('product')
      .select(`
        *,
        pricingplans:pricingplan(
          id,
          price,
          currency,
          currency_symbol,
          stripe_price_id,
          is_active,
          is_promotion,
          promotion_percent,
          prices_multi_currency,
          stripe_price_ids,
          base_currency
        )
      `)
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

    // Process products with currency-aware pricing
    const processedProducts = (data || []).map(product => {
      const activePlans = product.pricingplans?.filter((plan: any) => plan.is_active) || [];
      
      let minPrice: number | null = null;
      let currencySymbol: string | null = null;
      let stripePriceId: string | null = null;
      
      if (activePlans.length > 0) {
        const minPlan = activePlans.reduce((min: any, current: any) => {
          // Get price using backward-compatible function
          const currentPriceData = getPriceForCurrency(current, userCurrency);
          const minPriceData = getPriceForCurrency(min, userCurrency);
          
          if (!currentPriceData) return min;
          if (!minPriceData) return current;
          
          let currentEffectivePrice = currentPriceData.price;
          let minEffectivePrice = minPriceData.price;
          
          // Apply promotions
          if (current.is_promotion && current.promotion_percent) {
            currentEffectivePrice = currentEffectivePrice * (1 - current.promotion_percent / 100);
          }
          if (min.is_promotion && min.promotion_percent) {
            minEffectivePrice = minEffectivePrice * (1 - min.promotion_percent / 100);
          }
          
          return currentEffectivePrice < minEffectivePrice ? current : min;
        });
        
        // In production, prioritize geolocation-detected currency over plan's base currency
        // In development, fallback to plan's base currency
        const isProduction = process.env.NODE_ENV === 'production';
        const planBaseCurrency = minPlan.base_currency || 'USD';
        
        const finalCurrency = isProduction ? userCurrency : planBaseCurrency;
        
        // console.log('🏷️ PRODUCTS CURRENCY LOGIC:', {
        //   userCurrency,
        //   planBaseCurrency, 
        //   isProduction,
        //   finalCurrency,
        //   productId: product.id
        // });
        
        let finalPriceData = getPriceForCurrency(minPlan, finalCurrency);
        
        // If base currency fails, try user currency as fallback
        if (!finalPriceData) {
          finalPriceData = getPriceForCurrency(minPlan, userCurrency);
        }
        
        // console.log(`[${product.product_name}] Plan ${minPlan.id}: base_currency=${planBaseCurrency}, userCurrency=${userCurrency}, priceData:`, finalPriceData);
        
        if (finalPriceData) {
          let finalPrice = finalPriceData.price; // Already divided by 100 in getPriceForCurrency
          if (minPlan.is_promotion && minPlan.promotion_percent) {
            finalPrice = finalPrice * (1 - minPlan.promotion_percent / 100);
          }
          
          minPrice = finalPrice;
          currencySymbol = finalPriceData.symbol;
        }
        
        // Get Stripe price ID - try multi-currency first, then fallback
        const stripePriceIds = minPlan.stripe_price_ids || {};
        stripePriceId = stripePriceIds[userCurrency] || stripePriceIds[minPlan.base_currency || 'USD'] || minPlan.stripe_price_id;
      }

      const { pricingplans, ...productData } = product;
      
      return {
        ...productData,
        computed_min_price: minPrice,
        computed_currency_symbol: currencySymbol,
        computed_stripe_price_id: stripePriceId,
        user_currency: userCurrency,
        // Keep original fields as fallback (UNCHANGED)
        price_manual: product.price_manual,
        currency_manual_symbol: product.currency_manual_symbol
      };
    });

    // console.log('Successfully fetched products:', processedProducts?.length || 0, 'items for organization:', organizationId, 'currency:', userCurrency);
    return processedProducts || [];
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

    // console.log('Successfully fetched product sub-types:', data?.length || 0, 'items for organization:', organizationId);
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
          organizationType="services"
        />
      </Suspense>
    );
  }

  // Enhanced URL determination with better fallback logic
  let baseUrl = getBaseUrl(true);
  if (!baseUrl || baseUrl === 'http://localhost:3000') {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
  
  // Detect user currency from headers (set by middleware)
  // Note: We'll use individual plan base_currency for better accuracy in fetchProducts
  const headersList = await headers();
  const userCurrency = detectUserCurrency(headersList);
  
  // console.log('ProductsPage baseUrl:', baseUrl, 'userCurrency:', userCurrency, 'VERCEL_URL:', process.env.VERCEL_URL);

  let allProducts: Product[] = [];
  let productSubTypes: ProductSubType[] = [];
  let error: string | null = null;
  let organizationType: string = 'services'; // Default fallback
  const isAdmin = false;
  
  // Await searchParams before using
  const resolvedSearchParams = await searchParams;
  const categoryId = resolvedSearchParams.category;

  try {
    // Parallel data fetching for better performance
    const [products, subTypes, organizationData] = await Promise.all([
      fetchProducts(baseUrl, categoryId, userCurrency),
      fetchProductSubTypes(baseUrl),
      getOrganizationWithType(baseUrl)
    ]);
    
    allProducts = products;
    productSubTypes = subTypes;
    organizationType = organizationData?.type || 'services';
  } catch (err: any) {
    console.error('Error fetching data with primary baseUrl:', err.message);
    
    // Fallback strategy with alternative base URL
    const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (fallbackUrl !== baseUrl) {
      console.log('Trying fallback baseUrl:', fallbackUrl);
      try {
        const [products, subTypes, organizationData] = await Promise.all([
          fetchProducts(fallbackUrl, categoryId, userCurrency),
          fetchProductSubTypes(fallbackUrl),
          getOrganizationWithType(fallbackUrl)
        ]);
        
        allProducts = products;
        productSubTypes = subTypes;
        organizationType = organizationData?.type || 'services';
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
        organizationType={organizationType}
      />
    </Suspense>
  );
}