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
    <div className="neomorphic rounded-3xl overflow-hidden animate-pulse h-full flex flex-col">
      {/* Optional image header skeleton */}
      <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-50"></div>
      
      <div className="p-8 sm:p-12 space-y-4 bg-gradient-to-br from-white to-gray-50 flex flex-col flex-grow">
        {/* Badge skeleton */}
        <div className="flex justify-center">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto"></div>
        {/* Price skeleton */}
        <div className="flex-grow flex items-center justify-center">
          <div className="h-10 bg-gray-200 rounded w-1/2"></div>
        </div>
        {/* Arrow skeleton */}
        <div className="flex justify-center">
          <div className="h-6 w-6 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

function FeatureContent({ content, description }: { content: string; description?: string }) {
  if (!content && !description) {
    return (
      <div className="neomorphic rounded-3xl p-12 sm:p-16 mb-20 text-center">
        <BeakerIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
        <p className="text-gray-600 text-xl font-light tracking-wide">No content available for this feature.</p>
      </div>
    );
  }

  return (
    <section className="neomorphic rounded-3xl p-12 sm:p-16 mb-20">
      <div className="prose prose-xl max-w-none text-gray-600 leading-relaxed prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:tracking-[-0.02em] prose-p:font-normal prose-p:leading-relaxed prose-p:tracking-wider">
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

  // Get product image
  const productImage = plan.product?.links_to_image;

  return (
    <Link 
      href={`/products/${plan.product_slug}`}
      className="group block h-full"
    >
      <div className="h-full neomorphic rounded-3xl hover:scale-[1.02] transition-all duration-500 overflow-hidden flex flex-col">
        {/* Product Image Header (if available) */}
        {productImage && (
          <div className="w-full h-32 relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
            <img 
              src={productImage} 
              alt={plan.product_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Card Content */}
        <div className="p-8 sm:p-12 flex flex-col flex-grow bg-gradient-to-br from-white to-gray-50 text-center gap-y-4">
          {/* Refined Badge */}
          {plan.measure && (
            <div className="flex justify-center">
              <span className="inline-block px-4 py-1.5 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
                {plan.measure}
              </span>
            </div>
          )}
          
          {/* Elegant Title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 leading-relaxed tracking-[-0.02em]">
            {plan.product_name}
          </h3>
          
          {/* Refined Price Display */}
          <div className="flex flex-col items-center flex-grow justify-center">
            {plan.is_promotion && plan.promotion_price && (
              <span className="text-sm text-gray-400 line-through mb-1 font-light">
                {currencySymbol}{originalPrice}
              </span>
            )}
            <div className="flex items-baseline">
              <span className="text-gray-600 text-lg font-normal mr-1">{currencySymbol}</span>
              <span className="text-4xl font-semibold text-gray-900 tracking-tight">{displayPrice}</span>
            </div>
            {plan.is_promotion && (
              <span className="text-xs text-sky-600 font-medium mt-2 tracking-wide">
                Limited Time Offer
              </span>
            )}
          </div>

          {/* Arrow Icon */}
          <div className="flex justify-center mt-2">
            <span className="text-xl text-sky-500 group-hover:text-sky-600 group-hover:scale-110 transition-all duration-200">↗</span>
          </div>
        </div>
      </div>
    </Link>
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
        <div className="max-w-5xl mx-auto px-6 sm:px-8 pb-12 lg:py-12">
          <Suspense fallback={<FeatureContentSkeleton />}>
            <FeatureHeader feature={feature} />
            <FeatureContent content={feature.content} description={feature.description} />

            {associatedPricingPlans && associatedPricingPlans.length > 0 && (
              <section className="mt-20">
                {/* Elegant Section Header */}
                <div className="text-center mb-16">
                  <h2 className="text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 mb-6 tracking-tight leading-none">
                    Available Products
                  </h2>
                  <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-8"></div>
                  <p className="text-lg sm:text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
                    Discover {associatedPricingPlans.length} carefully crafted {associatedPricingPlans.length === 1 ? 'product' : 'products'} featuring this capability
                  </p>
                </div>

                {/* Elegant Pricing Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {associatedPricingPlans.map((plan: PricingPlan) => (
                    <PricingPlanCard key={plan.id} plan={plan} color="" />
                  ))}
                </div>
              </section>
            )}

            {/* Elegant Back Navigation */}
            <div className="mt-24 text-center">
              <Link 
                href="/features"
                className="inline-flex items-center space-x-3 px-8 py-4 neomorphic text-sm font-light rounded-full text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-300 group"
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