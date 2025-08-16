// src/app/features/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import parse from 'html-react-parser';
import { ArrowRightIcon, BeakerIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import FeatureHeader from '../../../../components/FeatureHeader';
import { getOrganizationId } from '@/lib/supabase';
import { Suspense } from 'react';

interface Feature {
  id: string;
  created_at: string;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
  display_content: boolean;
  display_on_product_card: boolean;
  type?: string;
  package?: string;
  description?: string;
  type_display?: string;
  organization_id: string | null; // Added
}

interface PricingPlan {
  id: string;
  slug?: string;
  product_name: string;
  product_slug: string;
  package?: string;
  measure?: string;
  price: number;
  currency: string;
  currency_symbol?: string;
  is_promotion?: boolean;
  promotion_price?: number;
  product?: {
    links_to_image?: string;
    is_displayed?: boolean;
  };
}

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

// Enhanced color palette with better contrast
const colors = [
  'bg-gradient-to-br from-pink-500 to-pink-600',
  'bg-gradient-to-br from-purple-500 to-purple-600',
  'bg-gradient-to-br from-amber-400 to-amber-500',
  'bg-gradient-to-br from-emerald-400 to-emerald-500',
  'bg-gradient-to-br from-sky-400 to-sky-500',
  'bg-gradient-to-br from-red-400 to-red-500',
];

// Loading Components
function FeatureContentSkeleton() {
  return (
    <div className="animate-pulse space-y-4 mb-16">
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );
}

function PricingPlanCardSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
      <div className="w-full p-8 flex justify-center">
        <div className="w-24 h-24 bg-gray-200 rounded-2xl"></div>
      </div>
      <div className="p-6 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 ml-auto"></div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-1/4 ml-auto"></div>
      </div>
    </div>
  );
}

function FeatureContent({ content, description }: { content: string; description?: string }) {
  if (!content && !description) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 mb-20 text-center">
        <BeakerIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
        <p className="text-gray-500 text-xl font-extralight tracking-wide">No content available for this feature.</p>
      </div>
    );
  }

  return (
    <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-12 mb-20">
      <div className="prose prose-xl max-w-none text-gray-700 leading-relaxed prose-headings:font-extralight prose-headings:text-gray-800 prose-p:font-light prose-p:leading-relaxed">
        {parse(description || content || '')}
      </div>
    </section>
  );
}

function PricingPlanCard({ plan, color }: { plan: PricingPlan; color: string }) {
  // Convert prices from cents to actual currency units
  const displayPrice = plan.is_promotion && plan.promotion_price 
    ? (plan.promotion_price / 100).toFixed(2)
    : (plan.price / 100).toFixed(2);
  
  const originalPrice = (plan.price / 100).toFixed(2);
  
  // Use currency_symbol field with fallback
  const currencySymbol = plan.currency_symbol || '£';

  // Get product image or fallback to color
  const productImage = plan.product?.links_to_image;

  return (
    <div className="group bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-500 overflow-hidden transform hover:-translate-y-1">
      {/* Full-width Product Image or Color Header - 1/3 height */}
      <div className="w-full h-32 relative group-hover:scale-105 transition-transform duration-300 origin-top">
        {productImage ? (
          <img 
            src={productImage} 
            alt={plan.product_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full ${color} flex items-center justify-center`}>
            <span className="text-white font-bold text-3xl drop-shadow-md">
              {plan.product_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-8 text-center">
        {/* Refined Badge */}
        {plan.measure && (
          <span className="inline-block px-4 py-1.5 bg-gray-50 text-gray-600 text-xs font-medium rounded-full mb-4 uppercase tracking-widest border border-gray-100">
            {plan.measure}
          </span>
        )}
        
        {/* Elegant Title */}
        <h3 className="text-xl font-extralight text-gray-700 mb-6 leading-tight tracking-tight">
          {plan.product_name}
        </h3>
        
        {/* Refined Price Display */}
        <div className="flex flex-col items-center mb-8">
          {plan.is_promotion && plan.promotion_price && (
            <span className="text-sm text-gray-400 line-through mb-1 font-light">
              {currencySymbol}{originalPrice}
            </span>
          )}
          <div className="flex items-baseline">
            <span className="text-gray-600 text-lg font-extralight mr-1">{currencySymbol}</span>
            <span className="text-4xl font-extralight text-gray-700 tracking-tight">{displayPrice}</span>
          </div>
          {plan.is_promotion && (
            <span className="text-xs text-gray-400 font-medium mt-2 tracking-wide">
              Limited Time Offer
            </span>
          )}
        </div>

        {/* Elegant Refined Button */}
        <Link
          href={`/products/${plan.product_slug}`}
          className="inline-flex items-center justify-center w-full py-3.5 px-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-gray-700 rounded-full font-light text-sm hover:from-gray-100 hover:to-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all duration-300 shadow-sm hover:shadow-md group-hover:scale-[1.02] tracking-wide"
        >
          <span>Explore Product</span>
          <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;

  try {
    // Fetch organization_id
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      notFound();
    }

    // Fetch feature and pricing plans via API with better error handling
    const apiUrl = process.env.NODE_ENV === 'production' 
      ? `${baseUrl}/api/features/${slug}?organization_id=${organizationId}`
      : `http://localhost:3000/api/features/${slug}?organization_id=${organizationId}`;

    const response = await fetch(apiUrl, { 
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Error fetching feature: ${response.status} ${response.statusText}`);
      notFound();
    }

    const { feature, pricingPlans: associatedPricingPlans } = await response.json();

    if (!feature) {
      console.error('Feature not found for slug:', slug);
      notFound();
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
          <Suspense fallback={<FeatureContentSkeleton />}>
            <FeatureHeader feature={feature} />
            <FeatureContent content={feature.content} description={feature.description} />

            {associatedPricingPlans && associatedPricingPlans.length > 0 && (
              <section className="mt-20">
                {/* Elegant Section Header */}
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-extralight text-gray-700 mb-4 tracking-tight">
                    Available Products
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6"></div>
                  <p className="text-gray-500 font-light text-lg max-w-2xl mx-auto leading-relaxed">
                    Discover {associatedPricingPlans.length} carefully crafted {associatedPricingPlans.length === 1 ? 'product' : 'products'} featuring this capability
                  </p>
                </div>

                {/* Elegant Pricing Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {associatedPricingPlans.map((plan: PricingPlan, index: number) => (
                    <PricingPlanCard key={plan.id} plan={plan} color={colors[index % colors.length]} />
                  ))}
                </div>
              </section>
            )}

            {/* Elegant Back Navigation */}
            <div className="mt-24 text-center">
              <Link 
                href="/features"
                className="inline-flex items-center space-x-3 px-8 py-4 border border-gray-200 text-sm font-light rounded-full text-gray-600 bg-white hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <ArrowRightIcon className="h-4 w-4 rotate-180 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="tracking-wide">Back to All Features</span>
              </Link>
            </div>
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in FeaturePage:', error);
    notFound();
  }
}