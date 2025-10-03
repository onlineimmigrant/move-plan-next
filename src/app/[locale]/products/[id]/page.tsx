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
        // Use plan's base_currency to show correct currency per plan
        const planBaseCurrency = plan.base_currency || 'USD';
        const priceData = getPriceForCurrency(plan, planBaseCurrency);
        
        console.log(`[ProductDetail] Plan ${plan.id}: base_currency=${planBaseCurrency}, userCurrency=${userCurrency}, priceData:`, priceData);
        
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

// Loading component for better UX
function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 mx-auto max-w-7xl py-16 md:py-10">
        <div className="animate-pulse">
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
            {/* Product info skeleton */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
              {/* Pricing skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            {/* Image skeleton */}
            <div className="mt-8 lg:mt-0">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
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

      <div className="min-h-screen bg-gray-50">
        <div className="md:hidden">
          {totalItems > 0 && <ProgressBar stage={1} />}
        </div>
        <div className="px-4 mx-auto max-w-7xl py-16 md:py-10">
          <div className="-mx-4 max-w-7xl md:px-4 md:py-4 sm:px-6 sm:py-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:items-start flex flex-col md:flex-row">
            <div className="order-1 md:order-2 lg:col-span-1 text-gray-900 text-sm md:text-base md:mt-2 sm:mt-0 mb-1 md:mb-2 lg:max-w-lg">
              <a
                href="#pricing-plans"
                className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-sky-500 focus:text-white focus:p-2 focus:rounded focus:z-50"
              >
                Skip to pricing plans
              </a>
              <ProductHeader productSubType={product.product_sub_type} productName={product_name} />
              {product_description && (
                <div className="text-gray-600 text-xs sm:border-t md:text-sm font-light px-8 border-gray-200 pt-2 md:pt-4 mt-2 md:mt-4 line-clamp-10">
                  {parse(product_description)}
                </div>
              )}
              {product.pricing_plans && product.pricing_plans.length > 0 ? (
                <div id="pricing-plans" className={product_description ? 'px-4 mt-4 md:mt-8' : 'px-4 mt-2 md:mt-4'}>
                  <ProductDetailPricingPlans pricingPlans={product.pricing_plans} amazonBooksUrl={product.amazon_books_url} />
                </div>
              ) : (
                <div className="px-4 mt-4 text-gray-500 bg-gray-100 rounded-lg p-4">
                  <p className="text-center">No pricing plans available.</p>
                </div>
              )}
            </div>
            <div className="order-2 md:order-1 lg:col-span-1 py-4 sm:pt-6 md:pb-8 flex justify-center items-center">
              {product_media && product_media.length > 0 ? (
                <ProductDetailMediaDisplay mediaItems={product_media} />
              ) : (
                <>
                  {links_to_image ? (
                    <div className="relative rounded-lg overflow-hidden shadow-sm">
                      <Image
                        src={links_to_image}
                        alt={product_name || 'Product image'}
                        width={384}
                        height={384}
                        className="max-h-56 md:max-h-96 object-contain w-full"
                        priority
                      />
                    </div>
                  ) : (
                    <div className="w-full h-56 md:h-96 bg-gray-200 flex items-center justify-center rounded-lg">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <CategoryBarProductDetailPage currentProduct={product} />
          <div className="mx-auto max-w-7xl space-y-8">
            <FeedbackAccordion type="product" slug={slug} />
            <FAQSection slug={product.slug || ''} faqs={faqs} />
          </div>
        </div>
      </div>
    </Suspense>
  );
}