'use client';

import Link from 'next/link';
import { useBasket, BasketItem } from '../../../context/BasketContext';
import BasketItemComponent from '@/components/product/BasketItem';
import { HiTrash, HiShoppingBag, HiArrowRight } from 'react-icons/hi';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  const shopMoreButtonRef = useRef<HTMLAnchorElement>(null);

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
  const { totalItems, totalPrice, currencyCode, currencySymbol } = useMemo(() => {
    const items = basket.reduce((sum, item: BasketItem) => sum + item.quantity, 0);
    const computeUnit = (bi: BasketItem) => {
      const p: any = bi.plan || {};
      const baseUnit = typeof p.computed_price === 'number' ? p.computed_price : ((p.price ?? 0) / 100);
      const isRecurring = (p.type || p.recurring_interval) ? true : false;
      if (bi.billingCycle === 'annual' && isRecurring) {
        let count = (typeof p.recurring_interval_count === 'number' && p.recurring_interval_count > 0)
          ? p.recurring_interval_count
          : (() => {
              const v = String(p.recurring_interval || '').toLowerCase();
              if (v === 'month' || v === 'monthly') return 12;
              if (v === 'week' || v === 'weekly') return 52;
              if (v === 'day' || v === 'daily') return 365;
              if (v === 'quarter' || v === 'quarterly') return 4;
              if (v === 'year' || v === 'annually' || v === 'annual') return 1;
              return 1;
            })();
        const discountRaw = p.annual_size_discount;
        let multiplier = 1;
        if (typeof discountRaw === 'number') {
          if (discountRaw > 1) multiplier = (100 - discountRaw) / 100; else if (discountRaw > 0 && discountRaw <= 1) multiplier = discountRaw;
        }
        return baseUnit * count * multiplier;
      }
      if (typeof p.computed_price === 'number') return p.computed_price;
      const cents = (p.is_promotion && typeof p.promotion_price === 'number') ? p.promotion_price : p.price;
      return (cents || 0) / 100;
    };
    const price = basket.reduce((sum, item: BasketItem) => sum + computeUnit(item) * item.quantity, 0);
    const first = basket[0]?.plan || {};
    const currCode = first.currency || 'GBP';
    const currSymbol = first.computed_currency_symbol || first.currency_symbol || new Intl.NumberFormat(undefined, { style: 'currency', currency: currCode }).formatToParts(0).find(p => p.type === 'currency')?.value || '';
    
    return { totalItems: items, totalPrice: price, currencyCode: currCode, currencySymbol: currSymbol };
  }, [basket]);

  // Optimized clear basket function
  const handleClearBasket = useCallback(async () => {
    setIsLoading(true);
    try {
      await clearBasket();
      // Focus on the "Start Shopping" button after clearing basket
      setTimeout(() => {
        const startShoppingButton = document.querySelector<HTMLAnchorElement>('a[href="/products"]');
        if (startShoppingButton) {
          startShoppingButton.focus();
        }
      }, 100);
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
        {/* Header Section */}
        <div 
          className="rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 mb-6 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 relative overflow-hidden"
          role="region"
          aria-label="Shopping basket summary"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
          {/* Header Content */}
          <div className="p-3 sm:p-5">
          <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 bg-gradient-to-br from-${primary.bg} to-${primary.bgActive} rounded-xl shadow-md flex-shrink-0`}>
                <HiShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{t.shoppingBasket}</h1>
                <p 
                  className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block"
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {totalItems} {totalItems === 1 ? t.item : t.items} <span className="text-gray-400">· {t.nextCheckout}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {basket.length > 0 && (
                <button
                  onClick={handleClearBasket}
                  disabled={isLoading}
                  className="flex items-center justify-center space-x-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 border border-red-200 hover:border-red-300"
                  aria-label={`Clear all ${totalItems} ${totalItems === 1 ? 'item' : 'items'} from basket`}
                  aria-describedby="clear-basket-hint"
                >
                  <HiTrash className="w-4 h-4" aria-hidden="true" />
                  <span className="text-sm font-medium hidden sm:inline">Clear All</span>
                  <span className="text-sm font-medium sm:hidden">Clear</span>
                  <span id="clear-basket-hint" className="sr-only">This will remove all items from your shopping basket</span>
                </button>
              )}
              <Link href="/products" className="hidden sm:block" aria-label="Continue shopping for more products">
                <Button variant="outline" size="sm" className="rounded-xl">
                  {t.continueShopping} →
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="sm:hidden">
            <p 
              className="text-xs text-gray-600 mb-2"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {totalItems} {totalItems === 1 ? t.item : t.items} <span className="text-gray-400">· {t.nextCheckout}</span>
            </p>
            <Link href="/products" className="w-full block" aria-label="Continue shopping for more products">
              <Button variant="outline" size="default" className="w-full rounded-xl">
                {t.continueShopping} →
              </Button>
            </Link>
          </div>
          </div>
          </div>
          </div>
        </div>

        {basket.length === 0 ? (
          /* Empty state aligned with checkout */
          <div className="text-center py-12 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-xl border border-white/40 dark:border-gray-700/40 mt-6 max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
                <HiShoppingBag className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-gray-600 text-base mb-6">{t.cartEmpty}</p>
              <Link href="/products">
                <Button variant="outline" size="lg" className="mt-4 rounded-xl">
                  {t.startShopping} →
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
                      {currencySymbol}<AnimatedCounter value={totalPrice} decimals={2} />
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
                      {currencySymbol}<AnimatedCounter value={totalPrice} decimals={2} className="tabular-nums" />
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
                    aria-label={`${t.proceedToCheckout} - Total: ${currencySymbol}${totalPrice.toFixed(2)} (${(currencyCode || 'GBP').toUpperCase()}) - Press C to checkout`}
                  >
                    <span>{t.proceedToCheckout}</span>
                    <HiArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>

                <div className="mt-6 text-center">
                  <p className="text-xs text-gray-500 bg-white/50 backdrop-blur-sm rounded-full px-3 py-2 inline-block border border-gray-200/50">🔒 Secure checkout powered by Stripe</p>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500">
                    All prices in
                    <span className={`ml-1 inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-${primary.bgLighter} text-${primary.text} border border-${primary.border} align-middle`}>
                      {(currencyCode || 'GBP').toUpperCase()}
                    </span>
                  </p>
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