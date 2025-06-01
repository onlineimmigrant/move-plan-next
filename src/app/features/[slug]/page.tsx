// src/app/features/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import parse from 'html-react-parser';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import FeatureHeader from '../../../components/FeatureHeader';
import { getOrganizationId } from '@/lib/supabase';

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
}

interface FeaturePageProps {
  params: Promise<{ slug: string }>;
}

const colors = [
  'bg-pink-500',
  'bg-purple-500',
  'bg-yellow-400',
  'bg-green-400',
  'bg-blue-400',
  'bg-red-400',
];

function FeatureContent({ content, description }: { content: string; description?: string }) {
  return (
    <section className="text-lg font-light max-w-none text-gray-700 mb-24 leading-relaxed">
      {parse(description || content || '')}
    </section>
  );
}

function PricingPlanCard({ plan, color }: { plan: PricingPlan; color: string }) {
  return (
    <div className="h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="w-full h-auto p-8 flex-shrink-0 flex justify-center">
        <div className={`w-36 h-36 ${color} rounded-full flex items-center justify-center`}>
          <span className="text-white font-bold text-3xl">
            {plan.product_name.charAt(0).toUpperCase()}
          </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow gap-1">
        <span
          className="font-medium text-xs text-sky-500 tracking-widest hover:underline mb-1 cursor-pointer"
        >
          {plan.measure || 'View Plan'}
        </span>
        <h2 className="tracking-tight text-lg line-clamp-2 font-semibold text-gray-900 group-hover:text-sky-400">
          {plan.product_name}
        </h2>
        <p className="flex justify-end tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow leading-tight uppercase">
          <span>{plan.currency} </span>
          <span className='text-xl'>{plan.price}</span>
        </p>
      </div>
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
        {plan.measure && plan.measure.trim() !== '' ? (
          <>
            <span className="text-gray-500 text-sm font-medium group-hover:opacity-0 transition-opacity duration-200">
              {plan.measure}
            </span>
            <span className="absolute right-6 text-sky-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <ArrowRightIcon className="h-5 w-5" />
            </span>
          </>
        ) : (
          <span className="text-sky-400">
            <ArrowRightIcon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

export default async function FeaturePage({ params }: FeaturePageProps) {
  const { slug } = await params;

  // Fetch organization_id
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    console.error('Organization not found for baseUrl:', baseUrl);
    notFound();
  }

  // Fetch feature and pricing plans via API
  const response = await fetch(
    `http://localhost:3000/api/features/${slug}?organization_id=${organizationId}`,
    { cache: 'no-store' }
  );
  if (!response.ok) {
    console.error('Error fetching feature:', response.statusText);
    notFound();
  }

  const { feature, pricingPlans: associatedPricingPlans } = await response.json();

  if (!feature) {
    console.error('Feature not found for slug:', slug);
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-24">
      <FeatureHeader feature={feature} />
      <FeatureContent content={feature.content} description={feature.description} />

      {associatedPricingPlans.length > 0 && (
        <section className="mt-24">
          <h2 className="text-base font-semibold text-gray-700 mb-4">
            Available with purchase
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {associatedPricingPlans.map((plan: PricingPlan, index: number) => (
              <Link key={plan.id} href={`/products/${plan.product_slug}`} className="group">
                <PricingPlanCard plan={plan} color={colors[index % colors.length]} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}