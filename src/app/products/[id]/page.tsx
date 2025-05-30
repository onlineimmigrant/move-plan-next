// /src/app/products/[id]/page.tsx
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase, getOrganizationId } from '../../../lib/supabase';
import ProductDetailPricingPlans from '../../../components/ProductDetailPricingPlans';
import CategoryBarProductDetailPage from '../../../components/CategoryBarProductDetailPage';
import FAQSection from '../../../components/HomePageSections/FAQSection';
import FeedbackAccordion from '../../../components/FeedbackAccordion';
import parse from 'html-react-parser';
import ProgressBar from '../../../components/ProgressBar';
import { getBasket } from '../../../lib/basketUtils';
import ProductDetailMediaDisplay from '../../../components/ProductDetailMediaDisplay';
import ProductHeader from '../../../components/ProductHeader';

// Define types for the product, pricing plans, FAQs, features, and media items
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
  product_sub_type: { name: string } | null;
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

// Fetch product data on the server side
async function fetchProduct(slug: string): Promise<Product | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    console.error('Organization not found');
    return null;
  }

  const { data: productData, error: productError } = await supabase
    .from('product')
    .select('*')
    .eq('slug', slug)
    .eq('organization_id', organizationId)
    .single();

  if (productError || !productData) {
    console.error('Error fetching product:', productError?.message || 'No product found');
    return null;
  }

  if (!productData.product_sub_type_id) {
    console.error('Product missing product_sub_type_id:', productData.id);
    return null;
  }

  // Fetch product sub-type
  let productSubType: { name: string } | null = null;
  const { data: subTypeData, error: subTypeError } = await supabase
    .from('product_sub_type')
    .select('name')
    .eq('id', productData.product_sub_type_id)
    .eq('organization_id', organizationId)
    .single();

  if (subTypeError) {
    console.error('Error fetching product sub-type:', subTypeError);
  } else {
    productSubType = subTypeData;
  }

  // Fetch pricing plans with associated features
  let pricingPlans: PricingPlan[] = [];
  const { data: plansData, error: plansError } = await supabase
    .from('pricingplan')
    .select(`
      *,
      inventory!fk_pricing_plan_id (
        status
      ),
      product:product_id (
        product_name,
        links_to_image
      ),
      pricingplan_features (
        feature:feature_id (
          id,
          name,
          content,
          slug
        )
      )
    `)
    .eq('product_id', productData.id)
    .eq('organization_id', organizationId);

  if (plansError) {
    console.error('Error fetching pricing plans:', plansError);
    // Fallback to fetch pricing plans without features
    const { data: fallbackPlansData, error: fallbackPlansError } = await supabase
      .from('pricingplan')
      .select(`
        *,
        inventory!fk_pricing_plan_id (
          status
        ),
        product:product_id (
          product_name,
          links_to_image
        )
      `)
      .eq('product_id', productData.id)
      .eq('organization_id', organizationId);

    if (fallbackPlansError) {
      console.error('Fallback error fetching pricing plans:', fallbackPlansError);
    } else {
      pricingPlans = (fallbackPlansData || []).map((plan) => ({
        ...plan,
        product_name: plan.product?.product_name || productData.product_name,
        links_to_image: plan.product?.links_to_image || productData.links_to_image,
        currency: plan.currency || productData.currency_manual || 'GBP',
        features: [],
      }));
    }
  } else {
    pricingPlans = (plansData || []).map((plan) => ({
      ...plan,
      product_name: plan.product?.product_name || productData.product_name,
      links_to_image: plan.product?.links_to_image || productData.links_to_image,
      currency: plan.currency || productData.currency_manual || 'GBP',
      features: plan.pricingplan_features
        ? plan.pricingplan_features
            .map((pf: any) => pf.feature)
            .filter((feature: any) => feature != null)
        : [],
    }));
  }

  // Fetch product media
  let productMedia: MediaItem[] = [];
  const { data: mediaData, error: mediaError } = await supabase
    .from('product_media')
    .select('id, product_id, order, is_video, video_url, video_player, image_url, thumbnail_url')
    .eq('product_id', productData.id)
    .eq('organization_id', organizationId);

  if (mediaError) {
    console.error('Error fetching product media:', mediaError);
  } else {
    productMedia = mediaData || [];
  }

  const product: Product = {
    ...productData,
    product_sub_type_id: productData.product_sub_type_id,
    product_sub_type: productSubType,
    pricing_plans: pricingPlans,
    product_media: productMedia,
  };

  console.log('Fetched product data:', JSON.stringify(product, null, 2), 'for organization_id:', organizationId);
  return product;
}

// Fetch FAQs on the server side
async function fetchFAQs(slug: string): Promise<FAQ[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    console.error('Organization not found');
    return [];
  }

  const { data: product, error: productError } = await supabase
    .from('product')
    .select('id, product_sub_type_id')
    .eq('slug', slug.toLowerCase())
    .eq('organization_id', organizationId)
    .single();

  if (productError || !product || !product.product_sub_type_id) {
    console.error('Error fetching product for FAQs:', productError?.message || 'No product found');
    return [];
  }

  const { data, error } = await supabase
    .from('faq')
    .select('id, order, display_order, question, answer, section, organization_id')
    .eq('product_sub_type_id', product.product_sub_type_id)
    .eq('organization_id', organizationId)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }

  console.log('Fetched FAQs:', data, 'for organization_id:', organizationId);
  return data || [];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;

  const product = await fetchProduct(slug);
  if (!product) {
    notFound(); // Trigger Next.js 404 page
  }

  const faqs = await fetchFAQs(slug);

  // Get the basket on the server side
  const basket = await getBasket();
  const totalItems = basket.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const { product_name, product_description, product_media, links_to_image } = product;

  console.log('Product slug:', product.slug);

  return (
    <div className="min-h-screen">
      <div className="md:hidden">
        {totalItems > 0 && <ProgressBar stage={1} />}
      </div>
      <div className="px-4 mx-auto max-w-7xl py-16 md:py-10">
        <div className=" -mx-4 max-w-7xl  md:px-4 md:py-4 sm:px-6 sm:py-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:items-start flex flex-col md:flex-row">
          {/* Text Section */}
          <div className="order-1 md:order-2 lg:col-span-1 text-gray-900 text-sm md:text-base md:mt-2 sm:mt-0 mb-1 md:mb-2 lg:max-w-lg">
            <a
              href="#pricing-plans"
              className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-sky-500 focus:text-white focus:p-2 focus:rounded focus:z-50"
            >
              Skip to pricing plans
            </a>

            <ProductHeader
              productSubType={product.product_sub_type}
              productName={product_name}
            />

            {product_description && (
              <div className="text-gray-500 text-xs sm:border-t md:text-sm font-light px-8 border-gray-200 pt-2 md:pt-4 mt-2 md:mt-4 line-clamp-10">
                {parse(product_description)}
              </div>
            )}

            {product.pricing_plans && product.pricing_plans.length > 0 && (
              <div
                id="pricing-plans"
                className={product_description ? 'px-4 mt-4 md:mt-8' : 'px-4 mt-2 md:mt-4'}
              >
                <ProductDetailPricingPlans
                  pricingPlans={product.pricing_plans}
                  amazonBooksUrl={product.amazon_books_url}
                />
              </div>
            )}
          </div>

          {/* Media Section */}
          <div className="order-2 md:order-1 lg:col-span-1 py-4 sm:pt-6 md:pb-8 flex justify-center items-center">
            {product_media && product_media.length > 0 ? (
              <ProductDetailMediaDisplay mediaItems={product_media} />
            ) : (
              <>
                {links_to_image ? (
                  <Image
                    src={links_to_image}
                    alt={product_name || 'Product image'}
                    width={384}
                    height={384}
                    className="max-h-56 md:max-h-96 object-contain w-full"
                  />
                ) : (
                  <div className="w-full h-56 md:h-96 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <CategoryBarProductDetailPage currentProduct={product} />
        <div className="mx-auto max-w-7xl">
          <FeedbackAccordion type="product" slug={slug} />
          <FAQSection slug={product.slug || ''} faqs={faqs} />
        </div>
      </div>
    </div>
  );
}