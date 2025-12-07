import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import PerfDetailMount from '@/components/perf/PerfDetailMount';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import { detectUserCurrency, getPriceForCurrency } from '@/lib/currency';
import CategoryBarProductDetailPage from '@/components/product/CategoryBarProductDetailPage';
import FAQSection from '@/components/TemplateSections/FAQSection';
import FeedbackAccordion from '@/components/TemplateSections/FeedbackAccordion';
import ProgressBar from '@/components/product/ProgressBar';
import { getBasket } from '@/lib/basketUtils';
import ProductDetailMediaDisplay from '@/components/product/ProductDetailMediaDisplay';
import ClientProductDetail from '@/components/product/ClientProductDetail';
import { headers } from 'next/headers';

// SSG for product pages - pre-build at deploy time, fallback to ISR if needed
export const dynamic = 'force-static';
export const dynamicParams = true; // Allow dynamic routes not in generateStaticParams
export const revalidate = false; // Fully static for pre-built pages

// Generate static params for all products
export async function generateStaticParams() {
  try {
    // Only generate static params if we have Supabase credentials
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('[SSG] Skipping product static generation - missing Supabase credentials');
      return [];
    }
    
    // Get the production organization ID
    const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || 'e534f121-e396-462c-9aab-acd2e66d8837';
    
    // Fetch all products
    const { data: products, error } = await supabase
      .from('product')
      .select('slug')
      .eq('organization_id', organizationId)
      .not('slug', 'is', null);
    
    if (error) {
      console.error('[SSG] Error fetching products:', error.message);
      return [];
    }
    
    if (!products) return [];
    
    // Generate params for English locale
    // Pages will be generated at /en/products/id
    // Middleware with localePrefix:'as-needed' will redirect /en/* -> /* for default locale
    const params = products.map(product => ({
      id: product.slug,
      locale: 'en'
    }));
    
    console.log(`[SSG] Generating ${params.length} product pages`);
    return params;
  } catch (error) {
    console.error('[SSG] Error generating product params:', error);
    return [];
  }
}


interface MediaItem {
  id: number;
  product_id: number;
  order: number;
  is_video: boolean;
  video_url?: string;
  video_player?: 'youtube' | 'vimeo';
  image_url?: string;
  thumbnail_url?: string;
  attrs?: {
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
    [key: string]: any;
  };
}

interface Feature {
  id: string;
  name: string;
  content: string;
  slug: string;
}

interface ProductSubType {
  id: number;
  name: string;
}

interface Product {
  id: number;
  slug?: string;
  organization_id: string;
  product_name: string;
  links_to_image?: string;
  product_description?: string;
  price_manual?: number;
  currency_manual?: string;
  product_sub_type_id: number;
  product_sub_type: ProductSubType | null;
  pricing_plans?: PricingPlan[];
  amazon_books_url?: string;
  product_media?: MediaItem[];
  attrs?: {
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

interface PricingPlan {
  id: number;
  product_id: number;
  package?: string;
  type: string;
  measure?: string;
  currency: string;
  currency_symbol: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: { status: string }[];
  buy_url?: string;
  slug?: string;
  product_name?: string;
  links_to_image?: string;
  features?: Feature[];
  // Multi-currency support
  prices_multi_currency?: { 
    [currency: string]: { 
      price: number; 
      symbol: string; 
    } 
  };
  stripe_price_ids?: { [currency: string]: string };
  base_currency?: string;
  computed_price?: number;
  computed_currency_symbol?: string;
  computed_stripe_price_id?: string;
  user_currency?: string;
  [key: string]: any;
}

interface FAQ {
  id: number;
  question: string;
  answer: string;
  section?: string;
  display_order?: number;
  order?: number;
  product_sub_type_id?: number;
  organization_id: string;
  [key: string]: any;
}

// Enhanced product data fetching with multi-currency support
async function fetchProduct(slug: string, baseUrl: string, userCurrency: string = 'USD'): Promise<Product | null> {
  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      throw new Error('Organization not found');
    }

    interface ProductData {
      id: number;
      slug: string;
      organization_id: string;
      product_name: string;
      links_to_image?: string;
      product_description?: string;
      price_manual?: number;
      currency_manual?: string;
      product_sub_type_id: number;
      product_sub_type: ProductSubType | null;
      attrs?: {
        unsplash_attribution?: {
          photographer: string;
          photographer_url: string;
          photo_url: string;
          download_location: string;
        };
        [key: string]: any;
      };
    }

    const { data: productData, error: productError } = await supabase
      .from('product')
      .select(`
        id,
        slug,
        organization_id,
        product_name,
        links_to_image,
        product_description,
        price_manual,
        currency_manual,
        product_sub_type_id,
        attrs,
        product_sub_type:product_sub_type (id, name)
      `)
      .eq('slug', slug)
      .eq('organization_id', organizationId)
      .single() as { data: ProductData | null; error: any };

    if (productError || !productData) {
      console.error('Error fetching product:', productError?.message || 'No product found');
      throw new Error('Product not found');
    }

    // Parallel data fetching for better performance with multi-currency support
    const [plansResult, mediaResult] = await Promise.all([
      supabase
        .from('pricingplan')
        .select(`
          *,
          inventory!fk_pricing_plan_id(status),
          pricingplan_features(feature:feature_id(id, name, content, slug))
        `)
        .eq('product_id', productData.id)
        .eq('organization_id', organizationId),
      supabase
        .from('product_media')
        .select('id, product_id, order, is_video, video_url, video_player, image_url, thumbnail_url, attrs')
        .eq('product_id', productData.id)
        .eq('organization_id', organizationId)
        .order('order', { ascending: true }),
    ]);

    let pricingPlans: PricingPlan[] = [];
    if (!plansResult.error && plansResult.data) {
      pricingPlans = plansResult.data.map((plan) => {
        // Always use base_currency from the pricing plan (ignore geolocation)
        // This ensures consistency between server and client rendering
        const finalCurrency = plan.base_currency || plan.currency || 'GBP';
        
        const priceData = getPriceForCurrency(plan, finalCurrency);
        
        // Get Stripe price ID for the final currency
        let stripePriceId: string | undefined;
        if (plan.stripe_price_ids && plan.stripe_price_ids[finalCurrency]) {
          stripePriceId = plan.stripe_price_ids[finalCurrency];
        } else if (plan.stripe_price_ids && plan.base_currency && plan.stripe_price_ids[plan.base_currency]) {
          stripePriceId = plan.stripe_price_ids[plan.base_currency];
        } else {
          stripePriceId = plan.stripe_price_id;
        }

        return {
          ...plan,
          product_name: productData.product_name,
          links_to_image: productData.links_to_image,
          // Use finalCurrency and computed symbol from priceData
          currency: finalCurrency,
          currency_symbol: priceData?.symbol || (finalCurrency === 'GBP' ? '£' : finalCurrency === 'USD' ? '$' : '€'),
          // Add computed currency-aware fields
          computed_price: priceData?.price,
          computed_currency_symbol: priceData?.symbol,
          computed_stripe_price_id: stripePriceId,
          // Remove user_currency to avoid hydration mismatch - always use base_currency
          features: plan.pricingplan_features
            ? plan.pricingplan_features
              .map((pf: any) => pf.feature)
              .filter((feature: any) => feature != null)
            : [],
        };
      });
    } else if (plansResult.error) {
      console.error('Error fetching pricing plans:', plansResult.error.message);
    }

    let productMedia: MediaItem[] = [];
    if (!mediaResult.error && mediaResult.data) {
      productMedia = mediaResult.data;
    } else if (mediaResult.error) {
      console.error('Error fetching product media:', mediaResult.error.message);
    }

    return {
      ...productData,
      product_sub_type: productData.product_sub_type,
      pricing_plans: pricingPlans,
      product_media: productMedia,
    };
  } catch (err) {
    console.error('Error in fetchProduct:', err);
    throw err;
  }
}

// Enhanced loading component with glassmorphism and shimmer effects
function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <div className="px-4 mx-auto max-w-7xl py-16 md:py-10">
        <div className="animate-pulse">
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
            {/* Enhanced product info skeleton */}
            <div className="space-y-6">
              {/* Breadcrumb skeleton with glassmorphism */}
              <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/40 rounded-full w-1/3 backdrop-blur-sm"></div>
              
              {/* Title skeleton with shimmer */}
              <div className="relative overflow-hidden">
                <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-4/5">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer transform -skew-x-12"></div>
                </div>
              </div>
              
              {/* Description skeleton */}
              <div className="space-y-3">
                <div className="h-4 bg-gradient-to-r from-gray-200/80 to-gray-300/60 rounded-lg backdrop-blur-sm"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200/70 to-gray-300/50 rounded-lg w-5/6 backdrop-blur-sm"></div>
                <div className="h-4 bg-gradient-to-r from-gray-200/60 to-gray-300/40 rounded-lg w-4/6 backdrop-blur-sm"></div>
              </div>
              
              {/* Enhanced pricing skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-12">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="relative bg-white/80 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl shadow-blue-100/20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30"></div>
                    <div className="relative space-y-4">
                      <div className="h-6 bg-gradient-to-r from-gray-200/60 to-gray-300/40 rounded-lg w-2/3"></div>
                      <div className="h-10 bg-gradient-to-r from-sky-200/60 to-sky-300/40 rounded-xl w-1/2"></div>
                      <div className="h-12 bg-gradient-to-r from-blue-200/60 to-blue-300/40 rounded-xl"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Enhanced image skeleton */}
            <div className="mt-8 lg:mt-0">
              <div className="relative bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-4 shadow-xl shadow-blue-100/10 overflow-hidden">
                <div className="h-96 bg-gradient-to-br from-gray-200/60 to-gray-300/40 rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer transform -skew-x-12"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// PerfDetailMount moved to client component file to avoid ssr:false dynamic import in server component

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Skip Supabase queries during Vercel static build
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  if (isBuild) {
    console.log('Skipping Supabase queries during Vercel build');
    return (
      <Suspense fallback={<ProductDetailLoading />}>
        <ProductDetailLoading />
      </Suspense>
    );
  }

  const { id: slug } = await params;
  let baseUrl = getBaseUrl(true);
  
  // Enhanced URL fallback logic
  if (!baseUrl || baseUrl === 'http://localhost:3000') {
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }

  // Detect user currency from headers (set by middleware)
  const headersList = await headers();
  const userCurrency = detectUserCurrency(headersList);
  
  // console.log('ProductDetailPage baseUrl:', baseUrl, 'userCurrency:', userCurrency);

  let product: Product | null = null;

  try {
    product = await fetchProduct(slug, baseUrl, userCurrency);
  } catch (err: any) {
    console.error('Error fetching data with primary baseUrl:', err.message);
    
    // Fallback strategy with alternative base URL
    const fallbackUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    if (fallbackUrl !== baseUrl) {
      console.log('Trying fallback baseUrl:', fallbackUrl);
      try {
        product = await fetchProduct(slug, fallbackUrl, userCurrency);
      } catch (fallbackErr: any) {
        console.error('Fallback fetch also failed:', fallbackErr.message);
        notFound();
      }
    } else {
      notFound();
    }
  }

  if (!product) {
    notFound();
  }

  const basket = await getBasket();
  const totalItems = basket.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);

  const { product_name, product_description, product_media, links_to_image } = product;

  // Fetch FAQs directly if still needed (or rely on layout-provided data)
  const { data: faqsData } = await supabase
    .from('faq')
    .select('id, question, answer, organization_id')
    .eq('product_sub_type_id', product.product_sub_type_id || 0)
    .eq('organization_id', product.organization_id);

  const faqs = faqsData?.map((faq, index) => ({
    id: faq.id || index,
    question: faq.question,
    answer: faq.answer,
    organization_id: faq.organization_id,
  })) || [];

  return (
    <Suspense fallback={<ProductDetailLoading />}>
      <PerfDetailMount />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="md:hidden">
          {totalItems > 0 && <ProgressBar stage={1} />}
        </div>
        <div className="mx-auto max-w-7xl py-16 md:py-10 md:px-4">
          <div className="max-w-7xl md:-mx-4 md:px-4 md:py-4 sm:px-6 sm:py-4 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:px-8 lg:items-start flex flex-col md:flex-row">
            <div className="order-2 md:order-2 lg:col-span-6 text-gray-900 text-sm md:text-base md:mt-2 sm:mt-0 mb-1 md:mb-2 px-4 md:px-0">
              <a
                href="#pricing-plans"
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-sky-500 focus:text-white focus:p-2 focus:rounded focus:z-50"
              >
                Skip to pricing plans
              </a>
              <ClientProductDetail
                productSubType={product.product_sub_type}
                productName={product_name}
                productId={product.id}
                productImage={links_to_image}
                productDescription={product_description}
                pricingPlans={product.pricing_plans || []}
                amazonBooksUrl={product.amazon_books_url}
              />
            </div>
            <div className="order-1 md:order-1 lg:col-span-6 py-4 sm:pt-6 md:pb-8 flex justify-center items-start">
              <div className="w-full max-w-lg -mx-4 md:mx-0 space-y-8">
                {product_media && product_media.length > 0 ? (
                  <div className="relative">
                    {/* Triple-layer glass effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-sky-500/5 to-indigo-500/5 rounded-none md:rounded-2xl blur-xl"></div>
                    <div className="relative bg-white/40 backdrop-blur-sm border-0 md:border border-white/20 rounded-none md:rounded-2xl md:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                      <ProductDetailMediaDisplay mediaItems={product_media} />
                    </div>
                  </div>
                ) : (
                  <>
                    {links_to_image ? (
                      <div className="group relative bg-white/60 backdrop-blur-sm border border-white/30 rounded-3xl p-6 hover:shadow-3xl hover:shadow-blue-100/30 transition-all duration-500" style={{ boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255,255,255,0.5)' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 rounded-3xl group-hover:to-blue-50/40 transition-all duration-500"></div>
                        {/* Glass reflection effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                        <div className="relative rounded-2xl overflow-hidden group/img">
                          <Image
                            src={links_to_image}
                            alt={product_name || 'Product image'}
                            width={512}
                            height={512}
                            className="max-h-64 md:max-h-80 lg:max-h-96 object-contain w-full transform group-hover:scale-105 transition-transform duration-700"
                            priority
                          />
                          {/* Unsplash Attribution - Two-tier design */}
                          {product.attrs?.unsplash_attribution && (
                            <>
                              {/* Always visible: Small Unsplash badge */}
                              <a
                                href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute bottom-2 right-2 bg-white/70 hover:bg-white/90 backdrop-blur-sm rounded p-1 shadow-md hover:shadow-lg transition-all group-hover/img:opacity-0 z-10"
                                title="Photo from Unsplash"
                              >
                                <svg className="w-3.5 h-3.5 text-black/80" fill="currentColor" viewBox="0 0 32 32">
                                  <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                                </svg>
                              </a>
                              
                              {/* On hover: Full attribution */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent backdrop-blur-md text-white text-sm px-4 py-3 opacity-0 group-hover/img:opacity-100 transition-all duration-300">
                                <div className="flex items-center gap-1.5">
                                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 32 32">
                                    <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                                  </svg>
                                  <span className="text-white/90">Photo by{' '}
                                    <a
                                      href={`${product.attrs.unsplash_attribution.photographer_url}?utm_source=codedharmony&utm_medium=referral`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-white font-medium hover:text-blue-300 transition-colors"
                                    >
                                      {product.attrs.unsplash_attribution.photographer}
                                    </a>
                                    {' '}on{' '}
                                    <a
                                      href="https://unsplash.com/?utm_source=codedharmony&utm_medium=referral"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-white font-medium hover:text-blue-300 transition-colors"
                                    >
                                      Unsplash
                                    </a>
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-64 md:h-80 lg:h-96 bg-white/40 backdrop-blur-sm border border-white/30 rounded-3xl flex flex-col items-center justify-center shadow-xl">
                        <div className="w-20 h-20 mb-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                         <p className="text-gray-500 font-medium text-lg">No image available</p>
                         <p className="text-gray-400 text-sm mt-2">Product image coming soon</p>
                      </div>
                    )}
                  </>
                )}
                
                {/* Related Products - Desktop only, in sidebar */}
                <div className="hidden md:block">
                  <CategoryBarProductDetailPage currentProduct={product} />
                </div>
              </div>
            </div>
            
            {/* Related Products - Mobile only, appears after both media and content */}
            <div className="md:hidden order-3 w-full mt-10 px-4">
              <CategoryBarProductDetailPage currentProduct={product} />
            </div>
          </div>
          
          <div className="mx-auto max-w-7xl space-y-12 mt-16">
            <div className="relative bg-white/40 backdrop-blur-sm border border-white/30 rounded-3xl shadow-xl shadow-blue-100/10">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 rounded-3xl"></div>
              <div className="relative">
                <FeedbackAccordion type="product" slug={slug} />
              </div>
            </div>
            
            <div className="relative bg-white/40 backdrop-blur-sm border border-white/30 rounded-3xl shadow-xl shadow-blue-100/10">
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 rounded-3xl"></div>
              <div className="relative">
                <FAQSection slug={product.slug || ''} faqs={faqs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}