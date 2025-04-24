import { notFound } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import PricingPlanClient from './PricingPlanClient';
import ProgressBar from '../../../components/ProgressBar';
import Link from 'next/link';
import { getBasket } from '../../../lib/basketUtils';

interface PricingPlan {
  id: number;
  slug?: string;
  package?: string;
  measure?: string;
  currency: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: { status: string }[];
  buy_url?: string;
  product_id?: number;
  product?: { product_name: string; slug?: string; links_to_image?: string };
  stripe_product_id?: string;
}

interface Feature {
  id: number;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
}

interface FeatureResponse {
  feature_id: number;
  feature: {
    id: number;
    name: string;
    feature_image?: string;
    content: string;
    slug: string;
  }[];
}

interface PricingPlanPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PricingPlanPage({ params }: PricingPlanPageProps) {
  const { slug } = await params;

  if (!slug || slug === 'null') {
    console.error('Pricing plan slug is null or undefined');
    notFound();
  }

  const { data: pricingPlan, error: pricingPlanError } = await supabase
    .from('pricingplan')
    .select(`
      *,
      product:product_id (
        id,
        product_name,
        slug,
        links_to_image
      )
    `)
    .eq('slug', slug)
    .single();

  if (pricingPlanError || !pricingPlan) {
    console.error('Error fetching pricing plan:', pricingPlanError);
    notFound();
  }

  const { data: featuresData, error: featuresError } = await supabase
    .from('pricingplan_features')
    .select(`
      feature_id,
      feature:feature_id (
        id,
        name,
        feature_image,
        content,
        slug
      )
    `)
    .eq('pricingplan_id', pricingPlan.id);

  if (featuresError) {
    console.error('Error fetching features:', featuresError);
  }

  const associatedFeatures: Feature[] = featuresData
    ? featuresData
        .flatMap((item: FeatureResponse) =>
          item.feature.map((feature): Feature | null =>
            feature && feature.id
              ? {
                  id: feature.id,
                  name: feature.name,
                  feature_image: feature.feature_image,
                  content: feature.content,
                  slug: feature.slug,
                }
              : null
          )
        )
        .filter((feature): feature is Feature => feature !== null)
    : [];

  // Fetch the basket on the server side
  const basket = await getBasket();

  return (
    <div>
      <div className="md:hidden">
        <ProgressBar stage={2} />
      </div>

      {basket.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-base">Your basket is empty.</p>
          <Link href="/products">
            <span className="text-sky-600 hover:text-sky-700 text-sm font-medium mt-4 inline-block transition-colors duration-200">
              Continue Shopping
            </span>
          </Link>
        </div>
      ) : (
        <PricingPlanClient pricingPlan={pricingPlan} associatedFeatures={associatedFeatures} />
      )}
    </div>
  );
}