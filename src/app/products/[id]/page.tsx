import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ProductDetailPricingPlans from '../../../components/ProductDetailPricingPlans';
import CategoryBarProductDetailPage from '../../../components/CategoryBarProductDetailPage';
import FAQSection from '../../../components/FAQSection';
import FeedbackAccordion from '../../../components/FeedbackAccordion';
import parse from 'html-react-parser';
import ProgressBar from '../../../components/ProgressBar';
import { getBasket } from '../../../lib/basketUtils';

// Define types for the product, pricing plans, and FAQs
type Product = {
  id: number;
  slug?: string;
  product_name: string;
  links_to_image?: string;
  product_description?: string;
  price_manual?: number;
  currency_manual?: string;
  product_sub_type_id: number;
  product_sub_type?: { name: string };
  pricing_plans?: PricingPlan[];
  amazon_books_url?: string;
  [key: string]: any;
};

type PricingPlan = {
  id: number;
  product_id: number;
  package?: string;
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
  [key: string]: any;
};

type FAQ = {
  id: number;
  question: string;
  answer: string;
  section?: string;
  display_order?: number;
  order?: number;
  product_sub_type_id?: number;
  [key: string]: any;
};

// Fetch product data on the server side
async function fetchProduct(slug: string): Promise<Product> {
  const { data: productData, error: productError } = await supabase
    .from('product')
    .select('*')
    .eq('slug', slug)
    .single();

  if (productError || !productData || !productData.product_sub_type_id) {
    console.error('Error fetching product:', productError);
    throw new Error('Failed to load product: ' + (productError?.message || 'Product not found'));
  }

  let productSubType = null;
  const { data: subTypeData, error: subTypeError } = await supabase
    .from('product_sub_type')
    .select('name')
    .eq('id', productData.product_sub_type_id)
    .single();

  if (subTypeError) {
    console.error('Error fetching product sub-type:', subTypeError);
  } else {
    productSubType = subTypeData;
  }

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
      )
    `)
    .eq('product_id', productData.id);

  if (plansError) {
    console.error('Error fetching pricing plans:', plansError);
  } else {
    pricingPlans = (plansData || []).map((plan) => ({
      ...plan,
      product_name: plan.product?.product_name || productData.product_name,
      links_to_image: plan.product?.links_to_image || productData.links_to_image,
      currency: plan.currency || productData.currency_manual || 'USD',
    }));
  }

  const product: Product = {
    ...productData,
    product_sub_type_id: productData.product_sub_type_id,
    product_sub_type: productSubType,
    pricing_plans: pricingPlans,
  };

  console.log('Fetched product data:', product);
  return product;
}

// Fetch FAQs on the server side
async function fetchFAQs(slug: string): Promise<FAQ[]> {
  const { data: product, error: productError } = await supabase
    .from('product')
    .select('id, product_sub_type_id')
    .eq('slug', slug.toLowerCase())
    .single();

  if (productError || !product || !product.product_sub_type_id) {
    console.error('Error fetching product for FAQs:', productError);
    return [];
  }

  const { data, error } = await supabase
    .from('faq')
    .select('id, order, display_order, question, answer, section')
    .eq('product_sub_type_id', product.product_sub_type_id)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching FAQs:', error);
    return [];
  }

  return data || [];
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;

  let product: Product | null = null;
  let faqs: FAQ[] = [];
  let error: string | null = null;

  try {
    product = await fetchProduct(slug);
    faqs = await fetchFAQs(slug);
  } catch (err: any) {
    error = err.message;
  }

  // User-facing error handling with retry option
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error: {error || 'Product not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-sky-500 text-white rounded-full"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get the basket on the server side
  const basket = await getBasket();
  const totalItems = basket.reduce((sum: number, item: any) => sum + item.quantity, 0);

  const { product_name, links_to_image, product_description } = product;

  console.log('Product slug:', product.slug);
  console.log('Fetched FAQs:', faqs);

  return (
    <div className="min-h-screen">
      <div className="md:hidden">
        {totalItems > 0 && <ProgressBar stage={1} />}
      </div>
      <div className="px-4 mx-auto max-w-7xl py-16 md:py-16">
        <div className="mx-auto max-w-7xl px-2 md:px-4 py-2 md:py-4 sm:px-6 sm:py-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:items-start flex flex-col md:flex-row">
          {/* Text Section (Moved above image on mobile) */}
          <div className="order-1 md:order-2 lg:col-span-1 text-gray-900 text-sm md:text-base mt-1 md:mt-2 sm:mt-0 mb-1 md:mb-2 lg:max-w-lg">
            {/* Skip link for accessibility */}
            <a
              href="#pricing-plans"
              className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-sky-500 focus:text-white focus:p-2 focus:rounded focus:z-50"
            >
              Skip to pricing plans
            </a>

            <div className="flex flex-col  bg-sky-50 sm:bg-transparent  p-2">
              <Link
                href="/products"
                className="font-medium text-xs text-sky-500 tracking-widest hover:underline mb-0"
              >
                {product.product_sub_type?.name || 'Unknown Sub-Type'}
              </Link>
              <h1 className="text-base md:text-lg font-semibold tracking-tight leading-tight">
                {product_name}
              </h1>
            </div>
            {/* Conditionally render description section only if product_description exists */}
            {product_description && (
              <div className="text-gray-500 text-sm md:text-base font-light border-t border-gray-200 pt-2 md:pt-4 mt-2 md:mt-4 line-clamp-2">
                {parse(product_description)}
              </div>
            )}

            {product.pricing_plans && product.pricing_plans.length > 0 && (
              <div
                id="pricing-plans"
                className={product_description ? "mt-4 md:mt-8" : "mt-2 md:mt-4"}
              >
                <ProductDetailPricingPlans
                  pricingPlans={product.pricing_plans}
                  amazonBooksUrl={product.amazon_books_url}
                />
              </div>
            )}
          </div>

          {/* Image Section (Moved below text on mobile, smaller size) */}
          <div className="order-2 md:order-1 lg:col-span-1 pb-4 pt-8 sm:pt-0 md:pb-8 flex justify-center items-center">
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
          </div>
        </div>
        <CategoryBarProductDetailPage currentProduct={product} />
        <div className="mx-auto max-w-7xl mt-8">
          <FeedbackAccordion type="product" slug={slug} />
          <FAQSection slug={product.slug || ''} faqs={faqs} />
        </div>
      </div>
    </div>
  );
}