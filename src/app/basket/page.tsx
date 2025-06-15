'use client';

import Link from 'next/link';
import { useBasket, BasketItem } from '../../context/BasketContext';
import ProgressBar from '../../components/product/ProgressBar';
import BasketItemComponent from '@/components/product/BasketItem';
import { HiTrash } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Button from '@/ui/Button';

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
    return sum + price * item.quantity / 100;
  }, 0);

  const currency = basket.length > 0 ? basket[0].plan.currency_symbol || 'GBP' : 'GBP';

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
    <div className="max-w-2xl mx-auto p-8 min-h-screen">
      <div className="-mx-8 mt-8 mb-2 sm:mt-10 bg-gray-50  py-4 flex items-center justify-between">
      <h1 className="px-8 text-base md:text-xl font-semibold tracking-tight leading-tight">
          Basket
        </h1>
        {isMounted && basket.length > 0 && (
          <button
            onClick={clearBasket}
            className="px-8 flex items-center gap-2 text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors duration-200"
          >
            <HiTrash className="w-5 h-5" />
            Clear Basket
          </button>
        )}
      </div>




      <div className="flex justify-between items-center mb-8">
              <h2 className="text-sm font-semibold text-gray-900">
                Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-gray-900 uppercase">
                  {currency}
                </span>
                <span className="text-3xl font-bold text-gray-900">
                  {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>

          <Link href="/products">
            <span className="mb-4 inline-block text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors duration-200">
              Continue Shopping
            </span>
        </Link>

      {basket.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-base">Your basket is empty.</p>
          <Link href="/products">
          {/*
            <span className="inline-block mt-4 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors duration-200">
              Continue Shopping
            </span>*/}
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-6">
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

          <div className="bg-transparent rounded-lg mb-6">

            <Link href="/checkout">
              <Button 
              variant='start'>
                    Proceed to Checkout
              </Button>
            </Link>
          </div>
        </>
      )}

      <ProgressBar stage={1} />
    </div>
  );
}