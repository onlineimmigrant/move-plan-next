import Image from 'next/image';
import { notFound } from 'next/navigation';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import ProductDetailPricingPlans from '@/components/product/ProductDetailPricingPlans';
import CategoryBarProductDetailPage from '@/components/product/CategoryBarProductDetailPage';
import FAQSection from '@/components/HomePageSections/FAQSection';
import FeedbackAccordion from '@/components/FeedbackAccordion';
import parse from 'html-react-parser';
import ProgressBar from '@/components/product/ProgressBar';
import { getBasket } from '@/lib/basketUtils';
import ProductDetailMediaDisplay from '@/components/product/ProductDetailMediaDisplay';
import ProductHeader from '@/components/product/ProductHeader';

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

async function fetchProduct(slug: string, baseUrl: string): Promise<Product | null> {
 const organizationId = await getOrganizationId(baseUrl);
 if (!organizationId) {
 console.error('Organization not found for baseUrl:', baseUrl);
 return null;
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
 return null;
 }

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
 .eq('organization_id', organizationId),
 ]);

 let pricingPlans: PricingPlan[] = [];
 if (!plansResult.error && plansResult.data) {
 pricingPlans = plansResult.data.map((plan) => ({
 ...plan,
 product_name: productData.product_name,
 links_to_image: productData.links_to_image,
 currency: plan.currency || productData.currency_manual || 'GBP',
 currency_symbol: plan.currency_symbol || '£',
 features: plan.pricingplan_features
 ? plan.pricingplan_features
 .map((pf: any) => pf.feature)
 .filter((feature: any) => feature != null)
 : [],
 }));
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
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
 if (isBuild) {
 console.log('Skipping Supabase queries during Vercel build');
 notFound();
 }

 const { id: slug } = await params;
 let baseUrl = getBaseUrl(true);

 let product: Product | null = null;

 try {
 product = await fetchProduct(slug, baseUrl);
 if (!product) throw new Error('Product not found');
 } catch (err: any) {
 console.error('Error fetching data, trying fallback:', err.message);
 baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
 try {
 product = await fetchProduct(slug, baseUrl);
 if (!product) throw new Error('Product not found');
 } catch (fallbackErr: any) {
 console.error('Fallback failed:', fallbackErr.message);
 notFound();
 }
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
 <div className="min-h-screen">
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
 <div className="text-gray-500 text-xs sm:border-t md:text-sm font-light px-8 border-gray-200 pt-2 md:pt-4 mt-2 md:mt-4 line-clamp-10">
 {parse(product_description)}
 </div>
 )}
 {product.pricing_plans && product.pricing_plans.length > 0 ? (
 <div id="pricing-plans" className={product_description ? 'px-4 mt-4 md:mt-8' : 'px-4 mt-2 md:mt-4'}>
 <ProductDetailPricingPlans pricingPlans={product.pricing_plans} amazonBooksUrl={product.amazon_books_url} />
 </div>
 ) : (
 <div className="px-4 mt-4 text-gray-500">No pricing plans available.</div>
 )}
 </div>
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
 <div className="w-full h-56 md:h-96 bg-gray-200 flex items-center justify-center">
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