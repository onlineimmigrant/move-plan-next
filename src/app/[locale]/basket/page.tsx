'use client';

import Link from 'next/link';
import { useBasket, BasketItem } from '../../../context/BasketContext';
import ProgressBar from '../../../components/product/ProgressBar';
import BasketItemComponent from '@/components/product/BasketItem';
import { HiTrash, HiShoppingBag, HiArrowRight } from 'react-icons/hi';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import Button from '@/ui/Button';
import { useProductTranslations } from '../../../components/product/useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/navigation';

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
  const { t } = useProductTranslations();
  const themeColors = useThemeColors();
  const { primary } = themeColors;
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [featuresMap, setFeaturesMap] = useState<{ [key: number]: Feature[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.CHECKOUT,
      action: () => {
        if (basket.length > 0) {
          router.push('/checkout');
        }
      },
    },
    {
      ...SHORTCUTS.PRODUCTS,
      action: () => router.push('/products'),
    },
  ]);

  // Memoized calculations for better performance
  const { totalItems, totalPrice, currency } = useMemo(() => {
    const items = basket.reduce((sum, item: BasketItem) => sum + item.quantity, 0);
    const price = basket.reduce((sum, item: BasketItem) => {
      const itemPrice = item.plan.is_promotion && item.plan.promotion_price
        ? item.plan.promotion_price
        : item.plan.price;
      return sum + itemPrice * item.quantity / 100;
    }, 0);
    const curr = basket.length > 0 ? basket[0].plan.currency_symbol || '£' : '£';
    
    return { totalItems: items, totalPrice: price, currency: curr };
  }, [basket]);

  // Optimized clear basket function
  const handleClearBasket = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearBasket();
    } finally {
      setIsLoading(false);
    }
  }, [clearBasket]);

  // Set isMounted to true after the component mounts on the client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Optimized features fetching with better error handling
  const fetchFeatures = useCallback(async () => {
    if (basket.length === 0) {
      setFeaturesMap({});
      return;
    }

    setIsLoading(true);
    const newFeaturesMap: { [key: number]: Feature[] } = {};
    
    try {
      // Batch fetch all features in parallel for better performance
      const featurePromises = basket
        .filter(item => item.plan.id)
        .map(async (item) => {
          const { data: featuresData, error } = await supabase
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

          if (error) {
            console.error('Error fetching features for plan', item.plan.id, error);
            return { planId: item.plan.id, features: [] };
          }

          const features = featuresData
            ?.flatMap((data: FeatureData) => data.feature)
            .filter((feature): feature is Feature => feature !== null && feature.id !== null) || [];

          return { planId: item.plan.id, features };
        });

      const results = await Promise.all(featurePromises);
      results.forEach(({ planId, features }) => {
        newFeaturesMap[planId] = features;
      });

      setFeaturesMap(newFeaturesMap);
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setIsLoading(false);
    }
  }, [basket]);

  // Fetch associated features for each pricing plan in the basket
  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section with integrated progress bar */}
        <div className="rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 mb-6 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
          {/* Progress Bar */}
          <div className="border-b border-gray-200/60">
            <ProgressBar stage={1} />
          </div>
          
          {/* Header Content */}
          <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 bg-gradient-to-br from-${primary.bg} to-${primary.bgActive} rounded-xl shadow-md flex-shrink-0`}>
                <HiShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{t.shoppingBasket}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {totalItems} {totalItems === 1 ? t.item : t.items}
                </p>
              </div>
            </div>
            
            {basket.length > 0 && (
              <button
                onClick={handleClearBasket}
                disabled={isLoading}
                className="flex items-center justify-center sm:justify-start space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50 border border-red-200 hover:border-red-300 w-full sm:w-auto"
              >
                <HiTrash className="w-4 h-4" />
                <span className="text-sm font-medium">Clear All</span>
              </button>
            )}
          </div>
          </div>
          </div>
        </div>

        {basket.length === 0 ? (
          /* Enhanced Empty State */
          <div className="rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 p-8 sm:p-10 text-center backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
              <HiShoppingBag className="w-12 h-12 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{t.yourBasketIsEmpty}</h3>
            <p className="text-gray-600 mb-10 max-w-md mx-auto leading-relaxed">{t.discoverAmazingProducts}</p>
            <Link href="/products">
              <Button variant="start" className="inline-flex items-center space-x-2 px-8 py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200">
                <span>{t.startShopping}</span>
                <HiArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Enhanced Basket Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <div className="rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 p-3 sm:p-5 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">{t.itemsInYourBasket}</h2>
                <div className="space-y-3">
                  {basket
                    .filter((item): item is BasketItem & { plan: { id: number } } => item.plan.id !== undefined)
                    .map((item, index) => (
                      <div key={item.plan.id} className={index > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                        <BasketItemComponent
                          item={item}
                          updateQuantity={updateQuantity}
                          removeFromBasket={removeFromBasket}
                          associatedFeatures={featuresMap[item.plan.id] || []}
                        />
                      </div>
                    ))}
                </div>
                </div>
              </div>
              
              {/* Enhanced Continue Shopping */}
              <Link href="/products">
                <div className={`rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 p-3 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 hover:bg-${primary.bgLighter}/80 group relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
                  <div className="relative z-10 flex items-center justify-between">
                    <span className={`text-${primary.text} font-semibold group-hover:text-${primary.textHover} transition-colors`}>{t.continueShopping}</span>
                    <HiArrowRight className={`w-4 h-4 text-${primary.text} group-hover:text-${primary.textHover} group-hover:translate-x-1 transition-all duration-200`} />
                  </div>
                </div>
              </Link>
            </div>

            {/* Enhanced Order Summary */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 p-3 sm:p-5 lg:sticky lg:top-24 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
                <div className="relative z-10">
                <h3 className="text-lg font-bold text-gray-900 mb-4 tracking-tight">{t.cartTotal}</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Items ({totalItems})</span>
                    <span className="font-semibold text-gray-900">
                      {currency}<AnimatedCounter value={totalPrice} decimals={2} />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-emerald-600">Free</span>
                  </div>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <div className="flex justify-between pt-2">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {currency}<AnimatedCounter value={totalPrice} decimals={2} className="tabular-nums" />
                    </span>
                  </div>
                </div>

                <Link 
                  href="/checkout"
                  onMouseEnter={() => {
                    if (basket.length > 0) {
                      router.prefetch('/checkout');
                    }
                  }}
                >
                  <Button 
                    variant="start" 
                    className="w-full justify-center whitespace-nowrap py-3 text-base font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                    data-testid="proceed-to-checkout-button"
                    aria-label={`${t.proceedToCheckout} - Total: ${currency}${totalPrice.toFixed(2)} - Press C to checkout`}
                  >
                    <span>{t.proceedToCheckout}</span>
                    <HiArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 bg-white/50 backdrop-blur-sm rounded-full px-3 py-2 inline-block border border-gray-200/50">🔒 Secure checkout powered by Stripe</p>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}