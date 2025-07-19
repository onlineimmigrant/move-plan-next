// src/app/features/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import parse from 'html-react-parser';
import { ArrowRightIcon, BeakerIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import FeatureHeader from '../../../../../components/FeatureHeader';
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
    <div className="animate-pulse space-y-4 mb-24">
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
    <div className="h-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="w-full p-8 flex justify-center">
        <div className="w-36 h-36 bg-gray-200 rounded-full"></div>
      </div>
      <div className="p-6 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
        <div className="h-5 bg-gray-200 rounded w-2/3"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 ml-auto"></div>
      </div>
      <div className="px-6 py-4 border-t border-gray-100/50">
        <div className="h-3 bg-gray-200 rounded w-1/4 ml-auto"></div>
      </div>
    </div>
  );
}

function FeatureContent({ content, description }: { content: string; description?: string }) {
  if (!content && !description) {
    return (
      <div className="rounded-2xl shadow-lg border border-gray-200 p-8 mb-24 backdrop-blur-sm bg-white/95 text-center">
        <BeakerIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No content available for this feature.</p>
      </div>
    );
  }

  return (
    <section className="rounded-2xl shadow-lg border border-gray-200 p-8 mb-24 backdrop-blur-sm bg-white/95">
      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
        {parse(description || content || '')}
      </div>
    </section>
  );
}

function PricingPlanCard({ plan, color }: { plan: PricingPlan; color: string }) {
  const displayPrice = plan.is_promotion && plan.promotion_price 
    ? plan.promotion_price 
    : plan.price;
  
  const currencySymbol = plan.currency_symbol || plan.currency || '£';

  return (
    <div className="h-full bg-white/95 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-sky-200 overflow-hidden flex flex-col transition-all duration-300 transform hover:-translate-y-1">
      <div className="w-full h-auto p-8 flex-shrink-0 flex justify-center">
        <div className={`w-36 h-36 ${color} rounded-2xl flex items-center justify-center shadow-lg`}>
          <span className="text-white font-bold text-3xl drop-shadow-sm">
            {plan.product_name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow gap-2">
        {plan.measure && (
          <span className="font-medium text-xs text-sky-500 tracking-widest hover:underline mb-1 cursor-pointer uppercase">
            {plan.measure}
          </span>
        )}
        
        <h2 className="tracking-tight text-lg line-clamp-2 font-semibold text-gray-900 group-hover:text-sky-600 transition-colors duration-200 leading-tight">
          {plan.product_name}
        </h2>
        
        <div className="flex justify-end items-baseline mt-auto">
          {plan.is_promotion && plan.promotion_price && (
            <span className="text-sm text-gray-400 line-through mr-2">
              {currencySymbol}{plan.price}
            </span>
          )}
          <div className="flex items-baseline">
            <span className="text-gray-600 text-sm font-medium">{currencySymbol}</span>
            <span className="text-2xl font-bold text-gray-900">{displayPrice}</span>
          </div>
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50/80 to-transparent flex-shrink-0 flex justify-between items-center border-t border-gray-100/50">
        {plan.measure && plan.measure.trim() !== '' ? (
          <>
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide group-hover:opacity-60 transition-opacity duration-200">
              View Details
            </span>
            <ArrowRightIcon className="h-4 w-4 text-sky-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
          </>
        ) : (
          <div className="flex-1 flex justify-end">
            <ArrowRightIcon className="h-4 w-4 text-sky-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        )}
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Suspense fallback={<FeatureContentSkeleton />}>
            <FeatureHeader feature={feature} />
            <FeatureContent content={feature.content} description={feature.description} />

            {associatedPricingPlans && associatedPricingPlans.length > 0 && (
              <section className="mt-16">
                {/* Enhanced Section Header */}
                <div className="rounded-2xl shadow-lg border border-gray-200 p-6 mb-8 backdrop-blur-sm bg-white/95">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl shadow-lg">
                      <ShoppingBagIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 tracking-tight">Available Products</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {associatedPricingPlans.length} {associatedPricingPlans.length === 1 ? 'product' : 'products'} available with this feature
                      </p>
                    </div>
                  </div>
                </div>

                {/* Enhanced Pricing Plans Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {associatedPricingPlans.map((plan: PricingPlan, index: number) => (
                    <Link key={plan.id} href={`/products/${plan.product_slug}`} className="group">
                      <PricingPlanCard plan={plan} color={colors[index % colors.length]} />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Back to Features Link */}
            <div className="mt-16 text-center">
              <Link 
                href="/features"
                className="inline-flex items-center space-x-2 px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/95 backdrop-blur-sm hover:bg-gray-50 hover:border-sky-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <ArrowRightIcon className="h-4 w-4 rotate-180" />
                <span>Back to All Features</span>
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