import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import ProductDetailPricingPlans from '../../../components/ProductDetailPricingPlans';
import CategoryBarProductDetailPage from '../../../components/CategoryBarProductDetailPage';
import FAQSection from '../../../components/FAQSection';
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

  if (error || !product) {
    notFound();
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
      <div className="px-4 mx-auto max-w-7xl py-8">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:px-8 lg:items-start">
          <div className="lg:col-span-1 pb-8 flex justify-center items-center">
            {links_to_image ? (
              <Image
                src={links_to_image}
                alt={product_name}
                width={384}
                height={384}
                className="max-h-96 object-contain"
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>

          <div className="lg:col-span-1 text-gray-900 text-base mt-2 sm:mt-0 mb-2 lg:max-w-lg">
            <CategoryBarProductDetailPage currentProduct={product} />
            <span className="px-3 py-1 text-xs font-medium rounded transition-colors bg-green-200 text-green-800 hover:bg-gray-1000">
              {product.product_sub_type?.name || 'Unknown Sub-Type'}
            </span>
            <h1 className="text-lg font-semibold tracking-tight">{product_name}</h1>

            <div className="text-gray-500 text-base font-light">
              {product_description ? parse(product_description) : 'No description'}
            </div>

            {product.pricing_plans && product.pricing_plans.length > 0 && (
              <ProductDetailPricingPlans
                pricingPlans={product.pricing_plans}
                amazonBooksUrl={product.amazon_books_url}
              />
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-8">
          <FAQSection slug={product.slug || ''} faqs={faqs} />
        </div>
      </div>
    </div>
  );
}