// src/app/features/[slug]/page.tsx
import { notFound } from 'next/navigation';
import FeatureHeader from '../../../../components/FeatureHeader';
import SocialShare from '../../../../components/features/SocialShare';
import ThemedPricingCard from '../../../../components/features/ThemedPricingCard';
import ThemedRelatedFeatureCard from '../../../../components/features/ThemedRelatedFeatureCard';
import ThemedSectionDivider from '../../../../components/features/ThemedSectionDivider';
import ThemedBackButton from '../../../../components/features/ThemedBackButton';
import ThemedFeatureContent from '../../../../components/features/ThemedFeatureContent';
import { getOrganizationId } from '@/lib/supabase';
import { Suspense } from 'react';
import { Metadata } from 'next';

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

// Generate static params for all features (required for Next.js 16 production builds)
export async function generateStaticParams() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return [];
    }

    const response = await fetch(`${baseUrl}/api/features?organization_id=${organizationId}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Failed to fetch features for static params');
      return [];
    }

    const features = await response.json();
    
    return Array.isArray(features) ? features.map((feature: Feature) => ({
      slug: feature.slug,
    })) : [];
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: FeaturePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const organizationId = await getOrganizationId(baseUrl);
    
    if (!organizationId) {
      return {
        title: 'Feature Not Found',
      };
    }

    const apiUrl = process.env.NODE_ENV === 'production' 
      ? `${baseUrl}/api/features/${slug}?organization_id=${organizationId}`
      : `http://localhost:3000/api/features/${slug}?organization_id=${organizationId}`;

    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (!response.ok) {
      return {
        title: 'Feature Not Found',
      };
    }

    const { feature } = await response.json();

    if (!feature) {
      return {
        title: 'Feature Not Found',
      };
    }

    const description = feature.description || `Discover ${feature.name} - a powerful feature designed to enhance your experience.`;

    return {
      title: `${feature.name} | Feature Details`,
      description: description.slice(0, 160),
      openGraph: {
        title: feature.name,
        description: description.slice(0, 160),
        type: 'article',
        url: `${baseUrl}/features/${slug}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: feature.name,
        description: description.slice(0, 160),
      },
      keywords: [feature.name, feature.type || 'feature', 'software', 'capability'].join(', '),
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Feature Details',
    };
  }
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
      <div className="w-full h-32 bg-linear-to-br from-gray-100 to-gray-50"></div>
      
      <div className="p-8 sm:p-12 space-y-4 bg-linear-to-br from-white to-gray-50 flex flex-col grow">
        {/* Badge skeleton */}
        <div className="flex justify-center">
          <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        </div>
        {/* Title skeleton */}
        <div className="h-5 bg-gray-200 rounded w-2/3 mx-auto"></div>
        {/* Price skeleton */}
        <div className="grow flex items-center justify-center">
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

    // Fetch all features for related features section
    const allFeaturesUrl = process.env.NODE_ENV === 'production' 
      ? `${baseUrl}/api/features?organization_id=${organizationId}`
      : `http://localhost:3000/api/features?organization_id=${organizationId}`;
    
    let relatedFeatures: Feature[] = [];
    try {
      const featuresResponse = await fetch(allFeaturesUrl, { cache: 'no-store' });
      if (featuresResponse.ok) {
        const allFeatures = await featuresResponse.json();
        // Get features of the same type, excluding current feature
        relatedFeatures = allFeatures
          .filter((f: Feature) => f.type === feature.type && f.id !== feature.id)
          .slice(0, 3);
      }
    } catch (error) {
      console.error('Error fetching related features:', error);
    }

    // Generate structured data (JSON-LD) for SEO
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: feature.name,
      description: feature.description || feature.content?.replace(/<[^>]*>/g, '').slice(0, 200),
      category: feature.type || 'Software Feature',
      offers: associatedPricingPlans?.map((plan: PricingPlan) => ({
        '@type': 'Offer',
        name: plan.product_name,
        price: (plan.price / 100).toFixed(2),
        priceCurrency: plan.currency?.toUpperCase() || 'GBP',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/products/${plan.product_slug}`,
      })) || [],
    };

    return (
      <>
        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pt-20">
          <div className="max-w-5xl mx-auto px-6 sm:px-8 py-12">
            <Suspense fallback={<FeatureContentSkeleton />}>
            <FeatureHeader feature={feature} />
            <ThemedFeatureContent content={feature.content} description={feature.description} />
            <SocialShare featureName={feature.name} slug={slug} />

            {associatedPricingPlans && associatedPricingPlans.length > 0 && (
              <section className="mt-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                {/* Elegant Section Header */}
                <div className="text-center mb-16">
                  <h2 className="text-[clamp(2rem,4vw,3rem)] font-thin text-gray-900 mb-6 tracking-tight leading-[1.1]">
                    Available Products
                  </h2>
                  <ThemedSectionDivider />
                  <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
                    Discover {associatedPricingPlans.length} carefully crafted {associatedPricingPlans.length === 1 ? 'product' : 'products'} featuring this capability
                  </p>
                </div>

                {/* Elegant Pricing Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 max-w-5xl mx-auto">
                  {associatedPricingPlans.map((plan: PricingPlan, index: number) => (
                    <div key={plan.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 150}ms` }}>
                      <ThemedPricingCard plan={plan} featureName={feature.name} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Features Section */}
            {relatedFeatures.length > 0 && (
              <section className="mt-24 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
                <div className="text-center mb-12">
                  <h2 className="text-[clamp(2rem,4vw,3rem)] font-thin text-gray-900 mb-6 tracking-tight leading-[1.1]">
                    Related Features
                  </h2>
                  <ThemedSectionDivider />
                  <p className="text-[clamp(1rem,2vw,1.25rem)] text-gray-500 font-light">
                    Explore similar capabilities in the same category
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relatedFeatures.map((relatedFeature, index) => (
                    <ThemedRelatedFeatureCard key={relatedFeature.id} feature={relatedFeature} index={index} />
                  ))}
                </div>
              </section>
            )}

            {/* Elegant Back Navigation */}
            <div className="mt-24 text-center animate-in fade-in duration-700 delay-700">
              <ThemedBackButton />
            </div>
          </Suspense>
        </div>
      </div>
      </>
    );
  } catch (error) {
    console.error('Error in FeaturePage:', error);
    notFound();
  }
}