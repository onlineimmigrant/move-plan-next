import { notFound } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabaseClient';
import parse from 'html-react-parser';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import FeatureHeader from '../../../components/FeatureHeader'; // Adjust path as needed

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
}

interface PricingPlan {
  id: string;
  slug?: string;
  product_name: string;
  package?: string;
  measure?: string;
  price: number;
  currency: string;
}

interface PricingPlanResponse {
  pricingplan_id: string;
  pricingplan: {
    id: string;
    slug?: string;
    package?: string;
    measure?: string;
    price: number;
    currency: string;
    product: {
      product_name: string;
    }[]; // Changed to array
  }[];
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
      <div className="p-6 flex flex-col flex-grow">
        <h2 className="tracking-tight text-lg line-clamp-2 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
          {plan.product_name}
        </h2>
        <p className="tracking-widest text-base text-gray-600 font-light line-clamp-2 flex-grow">
          {plan.package && `${plan.package} - `}{plan.currency} {plan.price}
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

  // Fetch the feature by slug
  const { data: feature, error: featureError } = await supabase
    .from('feature')
    .select('*')
    .eq('slug', slug)
    .single();

  if (featureError || !feature) {
    console.error('Error fetching feature:', featureError);
    notFound();
  }

  // Fetch associated pricing plans with slug
  const { data: pricingPlansData, error: pricingPlansError } = await supabase
    .from('pricingplan_features')
    .select(`
      pricingplan_id,
      pricingplan:pricingplan_id (
        id,
        slug,
        package,
        measure,
        price,
        currency,
        product:product_id (
          product_name
        )
      )
    `)
    .eq('feature_id', feature.id);

  if (pricingPlansError) {
    console.error('Error fetching pricing plans:', pricingPlansError);
  }

  const associatedPricingPlans: PricingPlan[] = (pricingPlansData ?? [])
    .flatMap((item: PricingPlanResponse): PricingPlan[] =>
      item.pricingplan
        .map((plan): PricingPlan | null => {
          if (!plan || !plan.id) return null;
          // Use the first product in the array or fallback to 'Unknown Product'
          const product_name = plan.product?.[0]?.product_name ?? 'Unknown Product';
          return {
            id: plan.id.toString(),
            slug: plan.slug ?? plan.id.toString(),
            product_name,
            package: plan.package ?? undefined,
            measure: plan.measure ?? undefined,
            price: plan.price,
            currency: plan.currency,
          };
        })
        .filter((plan): plan is PricingPlan => plan !== null)
    );

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
            {associatedPricingPlans.map((plan, index) => (
              <Link key={plan.id} href={`/pricing/${plan.slug}`} className="group">
                <PricingPlanCard plan={plan} color={colors[index % colors.length]} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}