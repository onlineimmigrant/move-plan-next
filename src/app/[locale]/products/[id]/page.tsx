import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import { detectUserCurrency, getPriceForCurrency } from '@/lib/currency';
import ProductDetailPricingPlans from '@/components/product/ProductDetailPricingPlans';
import CategoryBarProductDetailPage from '@/components/product/CategoryBarProductDetailPage';
import FAQSection from '@/components/HomePageSections/FAQSection';
import FeedbackAccordion from '@/components/FeedbackAccordion';
import parse from 'html-react-parser';
import ProgressBar from '@/components/product/ProgressBar';
import { getBasket } from '@/lib/basketUtils';
import ProductDetailMediaDisplay from '@/components/product/ProductDetailMediaDisplay';
import ProductHeader from '@/components/product/ProductHeader';
import { headers } from 'next/headers';


interface MediaItem {
  id: number;
  product_id: number;
  order: number;
  is_video: boolean;
  video_url?: string;
  video_player?: 'youtube' | 'vimeo';
  image_url?: string;
  thumbnail_url?: string;
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
        .select('id, product_id, order, is_video, video_url, video_player, image_url, thumbnail_url')
        .eq('product_id', productData.id)
        .eq('organization_id', organizationId)
        .order('order', { ascending: true }),
    ]);

    let pricingPlans: PricingPlan[] = [];
    if (!plansResult.error && plansResult.data) {
      pricingPlans = plansResult.data.map((plan) => {
        // In production, prioritize geolocation-detected currency over plan's base currency
        // In development, fallback to plan's base currency
        const isProduction = process.env.NODE_ENV === 'production';
        const planBaseCurrency = plan.base_currency || 'USD';
        
        const finalCurrency = isProduction ? userCurrency : planBaseCurrency;
        
        console.log(`[ProductDetail] Plan ${plan.id}: userCurrency=${userCurrency}, planBaseCurrency=${planBaseCurrency}, isProduction=${isProduction}, finalCurrency=${finalCurrency}`);
        
        const priceData = getPriceForCurrency(plan, finalCurrency);
        
        // Get Stripe price ID for the user's currency
        let stripePriceId: string | undefined;
        if (plan.stripe_price_ids && plan.stripe_price_ids[userCurrency]) {
          stripePriceId = plan.stripe_price_ids[userCurrency];
        } else if (plan.stripe_price_ids && plan.base_currency && plan.stripe_price_ids[plan.base_currency]) {
          stripePriceId = plan.stripe_price_ids[plan.base_currency];
        } else {
          stripePriceId = plan.stripe_price_id;
        }

        return {
          ...plan,
          product_name: productData.product_name,
          links_to_image: productData.links_to_image,
          currency: plan.currency || productData.currency_manual || 'GBP',
          currency_symbol: plan.currency_symbol || '£',
          // Add computed currency-aware fields
          computed_price: priceData?.price,
          computed_currency_symbol: priceData?.symbol,
          computed_stripe_price_id: stripePriceId,
          user_currency: userCurrency,
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
  const headersList = headers();
  const userCurrency = detectUserCurrency(headersList);
  
  console.log('ProductDetailPage baseUrl:', baseUrl, 'userCurrency:', userCurrency);

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

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <div className="md:hidden">
          {totalItems > 0 && <ProgressBar stage={1} />}
        </div>
        <div className="px-4 mx-auto max-w-7xl py-16 md:py-10">
          <div className="-mx-4 max-w-7xl md:px-4 md:py-4 sm:px-6 sm:py-4 lg:grid lg:grid-cols-12 lg:gap-x-12 lg:px-8 lg:items-start flex flex-col md:flex-row">
            <div className="order-1 md:order-2 lg:col-span-7 text-gray-900 text-sm md:text-base md:mt-2 sm:mt-0 mb-1 md:mb-2">
              <a
                href="#pricing-plans"
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-sky-500 focus:text-white focus:p-2 focus:rounded focus:z-50"
              >
                Skip to pricing plans
              </a>
              <ProductHeader productSubType={product.product_sub_type} productName={product_name} />
              {product_description && (
                <div className="relative bg-white/40 backdrop-blur-sm border border-white/30 rounded-2xl p-6 shadow-lg shadow-blue-100/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/20 rounded-2xl"></div>
                  <div className="relative text-gray-700 text-sm md:text-base font-normal leading-relaxed">
                    {parse(product_description)}
                  </div>
                </div>
              )}
              {product.pricing_plans && product.pricing_plans.length > 0 ? (
                <div id="pricing-plans" className={product_description ? 'mt-8' : 'mt-6'}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-sky-500/5 to-indigo-500/5 rounded-3xl blur-3xl"></div>
                    <div className="relative">
                      <ProductDetailPricingPlans pricingPlans={product.pricing_plans} amazonBooksUrl={product.amazon_books_url} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 bg-white/60 backdrop-blur-sm border border-white/30 rounded-2xl p-8 shadow-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                      </svg>
                    </div>
                    <p className="text-gray-600 font-medium">No pricing plans available at the moment</p>
                    <p className="text-gray-500 text-sm mt-2">Please check back later or contact support</p>
                  </div>
                </div>
              )}
            </div>
            <div className="order-2 md:order-1 lg:col-span-5 py-4 sm:pt-6 md:pb-8 flex justify-center items-start">
              <div className="w-full max-w-lg">
                {product_media && product_media.length > 0 ? (
                  <div className="bg-white/40 backdrop-blur-sm border border-white/20 rounded-2xl p-4">
                    <ProductDetailMediaDisplay mediaItems={product_media} />
                  </div>
                ) : (
                  <>
                    {links_to_image ? (
                      <div className="group relative bg-white/60 backdrop-blur-sm border border-white/30 rounded-3xl p-6 shadow-2xl shadow-blue-100/20 hover:shadow-3xl hover:shadow-blue-100/30 transition-all duration-500">
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 rounded-3xl group-hover:to-blue-50/40 transition-all duration-500"></div>
                        <div className="relative rounded-2xl overflow-hidden">
                          <Image
                            src={links_to_image}
                            alt={product_name || 'Product image'}
                            width={512}
                            height={512}
                            className="max-h-64 md:max-h-80 lg:max-h-96 object-contain w-full transform group-hover:scale-105 transition-transform duration-700"
                            priority
                          />
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
              </div>
            </div>
          </div>
          <div className="mt-16">
            <CategoryBarProductDetailPage currentProduct={product} />
          </div>
          
          <div className="mx-auto max-w-7xl space-y-12 mt-20">
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