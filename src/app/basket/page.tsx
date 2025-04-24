'use client';

import Link from 'next/link';
import { useBasket, BasketItem, PricingPlan } from '../../context/BasketContext';
import ProgressBar from '../../components/ProgressBar';
import BasketItemComponent from '../../components/BasketItem';
import { HiTrash } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Interface for a feature (aligned with BasketItemComponent)
interface Feature {
  id: number;
  name: string;
  feature_image?: string | undefined;
  content: string;
  slug: string;
}

// Interface for the Supabase query result
interface FeatureData {
  feature_id: number;
  feature: Feature[];
}

export default function BasketPage() {
  const { basket, updateQuantity, removeFromBasket, clearBasket } = useBasket();
  const [isMounted, setIsMounted] = useState(false);
  const [featuresMap, setFeaturesMap] = useState<{ [key: number]: Feature[] }>({});

  const totalItems = basket.reduce((sum, item: BasketItem) => sum + item.quantity, 0);
  const totalPrice = basket.reduce((sum, item: BasketItem) => {
    const price =
      item.plan.is_promotion && item.plan.promotion_price
        ? item.plan.promotion_price
        : item.plan.price;
    return sum + price * item.quantity;
  }, 0);

  const currency = basket.length > 0 ? basket[0].plan.currency || 'USD' : 'USD';

  // Set isMounted to true after the component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch associated features for each pricing plan in the basket
  useEffect(() => {
    const fetchFeatures = async () => {
      const newFeaturesMap: { [key: number]: Feature[] } = {};
      for (const item of basket) {
        if (!item.plan.id) {
          console.warn('Skipping item with undefined plan ID', item);
          continue;
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
          .eq('pricingplan_id', item.plan.id);

        if (featuresError) {
          console.error('Error fetching features for plan', item.plan.id, featuresError);
          newFeaturesMap[item.plan.id] = [];
        } else {
          newFeaturesMap[item.plan.id] =
            featuresData
              ?.flatMap((data: FeatureData) => data.feature)
              .filter((feature): feature is Feature => feature !== null && feature.id !== null) || [];
        }
      }
      setFeaturesMap(newFeaturesMap);
    };

    if (basket.length > 0) {
      fetchFeatures();
    }
  }, [basket]);

  return (
    <div>
      <div className="md:hidden">
        <ProgressBar stage={1} />
      </div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your Basket</h1>
          {/* Render the button only after the component has mounted on the client */}
          {isMounted && basket.length > 0 && (
            <button
              onClick={clearBasket}
              className="flex items-center gap-2 text-red-700 hover:text-red-800 text-sm font-medium transition-colors duration-200"
            >
              <HiTrash className="w-5 h-5" />
              Clear Basket
            </button>
          )}
        </div>

        {basket.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-base">Your basket is empty.</p>
            <Link href="/products">
              <span className="inline-block mt-4 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors duration-200">
                Continue Shopping
              </span>
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-6 mb-8">
              {basket
                .filter((item): item is BasketItem & { plan: { id: number } } => item.plan.id !== undefined)
                .map((item) => (
                  <BasketItemComponent
                    key={item.plan.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeFromBasket={removeFromBasket}
                    associatedFeatures={featuresMap[item.plan.id] || []}
                  />
                ))}
            </div>

            <div className="bg-gray-100 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Total: {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold text-gray-900">
                    {currency}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {totalPrice}
                  </span>
                </div>
              </div>
              <Link href="/checkout">
                <button className="w-full py-3 px-4 text-sm font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-200 focus:ring-opacity-50 shadow-md bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-gray-800 hover:scale-105">
                  Proceed to Checkout
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}