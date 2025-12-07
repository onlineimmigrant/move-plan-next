'use client';

import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useBasket } from '../../context/BasketContext';
import Button from '@/ui/Button';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { useProductTranslations } from './useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

// Define types for pricing plans and props
interface Feature {
  id: string;
  name: string;
  content: string;
  slug: string;
  description?: string;
}

type PricingPlan = {
  id: number;
  slug?: string;
  package?: string;
  measure?: string;
  description?: string;
  recurring_interval?: string;
  recurring_interval_count?: number;
  commitment_months?: number;
  annual_size_discount?: number;
  type?: 'recurring' | 'one_time' | string;
  currency: string;
  currency_symbol: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: { status: string }[];
  buy_url?: string;
  product_id?: number;
  product_name?: string;
  links_to_image?: string;
  features?: Feature[];
  // Multi-currency support
  computed_price?: number;
  computed_currency_symbol?: string;
  computed_stripe_price_id?: string;
  user_currency?: string;
  [key: string]: any;
};

interface ProductDetailPricingPlansProps {
  pricingPlans: PricingPlan[];
  amazonBooksUrl?: string;
  billingCycle?: 'monthly' | 'annual';
}

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warn';
  onRetry?: () => void;
}

// Custom Toast Component
const CustomToast = memo(
  ({
    message,
    type,
    onClose,
    onRetry,
    duration = 2000,
    position = 'top-0 right-0',
  }: {
    message: string;
    type: 'success' | 'error' | 'warn';
    onClose: () => void;
    onRetry?: () => void;
    duration?: number;
    position?: string;
  }) => {
    const { t } = useProductTranslations();
    
    useEffect(() => {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }, [onClose, duration]);

    return (
      <div
        className={`px-4 py-2 rounded-lg shadow-lg border animate-fade-in-out flex items-center justify-between
          ${type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-600' : ''}
          ${type === 'error' ? 'bg-red-50 border-red-200 text-red-600' : ''}
          ${type === 'warn' ? 'bg-yellow-50 border-yellow-200 text-yellow-600' : ''}`}
        role="alert"
        aria-live="polite"
      >
        <span>{message}</span>
        <div className="flex items-center space-x-2">
          {onRetry && type === 'error' && (
            <button
              onClick={onRetry}
              className="text-sm underline hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-300"
              aria-label={t.retryAddingToCart}
            >
              {t.retry}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-teal-600 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
            aria-label={t.closeNotification}
          >
            <XMarkIcon className="ml-4 w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }
);

CustomToast.displayName = 'CustomToast';

// Enhanced utility function for plan card styles with glassmorphism
// Lazily load features section to reduce initial payload
const LazyPricingPlanFeatures = dynamic(() => import('./PricingPlanFeatures'));

const ProductDetailPricingPlans = memo(function ProductDetailPricingPlans({
  pricingPlans = [],
  amazonBooksUrl,
  billingCycle = 'monthly',
}: ProductDetailPricingPlansProps) {
  const { t, getSafeTranslation } = useProductTranslations();
  const themeColors = useThemeColors();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [featuresVisible, setFeaturesVisible] = useState(false);
  
  const planCardStyles = (isOutOfStock: boolean, isActive: boolean) => {
    if (isOutOfStock) {
      return {
        className: 'relative cursor-not-allowed overflow-hidden transition-all duration-300 ease-in-out rounded-lg bg-gray-50/30 backdrop-blur-sm opacity-60 z-0',
        style: {}
      };
    }
    if (isActive) {
      return {
        className: 'relative cursor-pointer overflow-hidden transition-all duration-500 ease-in-out rounded-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 z-10',
        style: {
          borderWidth: '1px',
          borderColor: themeColors.cssVars.primary.border,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }
      };
    }
    return {
      className: 'relative cursor-pointer overflow-hidden transition-all duration-300 ease-in-out rounded-lg backdrop-blur-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 z-0',
      style: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
      }
    };
  };
  
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { basket, addToBasket } = useBasket();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false); // Add state to track hydration

  // console.log('Pricing plans with features:', JSON.stringify(pricingPlans, null, 2));
  // console.log('Selected plan:', JSON.stringify(selectedPlan, null, 2));

  // Track hydration state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Observe visibility for features section lazy render
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setFeaturesVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const firstInStockPlan =
      pricingPlans.find((plan) => getStatus(plan).toLowerCase() !== 'out of stock') ||
      pricingPlans[0] ||
      null;
    setSelectedPlan(firstInStockPlan);
    // console.log('Selected initial plan:', firstInStockPlan);
  }, [pricingPlans]);

  // Memoized toast management
  const showToast = useCallback((
    message: string,
    type: 'success' | 'error' | 'warn',
    onRetry?: () => void
  ) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, onRetry }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const handlePlanSelect = useCallback((plan: PricingPlan) => {
    const status = getStatus(plan).toLowerCase();
    if (status === 'out of stock') return;
    setSelectedPlan(plan);
    // console.log('Selected plan:', plan);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent, plan: PricingPlan, index: number) => {
    const status = getStatus(plan).toLowerCase();
    if (status === 'out of stock') return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handlePlanSelect(plan);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % pricingPlans.length;
      handlePlanSelect(pricingPlans[nextIndex]);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + pricingPlans.length) % pricingPlans.length;
      handlePlanSelect(pricingPlans[prevIndex]);
    }
  };

  const handleAddToBasket = useCallback(async () => {
    if (!selectedPlan) {
      showToast('Please select a plan', 'warn');
      return;
    }

    setIsLoading(true);
    try {
      await addToBasket(selectedPlan, billingCycle);
      setIsAdded(true);
      showToast(t.addedToCart, 'success');
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast(t.failedToLoad, 'error', () => handleAddToBasket());
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan, addToBasket, t, billingCycle]);

  // Prefetch checkout route on hover to speed navigation
  const prefetchCheckout = useCallback(() => {
    try {
      router.prefetch('/checkout');
    } catch {}
  }, [router]);

  const getStatus = useCallback((plan: PricingPlan | null) => {
    if (!plan) return t.outOfStock;
    const inv = Array.isArray(plan.inventory) ? plan.inventory[0] : plan.inventory;
    return inv?.status || t.outOfStock;
  }, [t]);

  const selectedPlanStatus = getStatus(selectedPlan).toLowerCase();
  const totalItems = isMounted
    ? basket.reduce((sum, item) => sum + item.quantity, 0)
    : 0; // Default to 0 during SSR

  // Count active pricing plans (not out of stock)
  const activePlanCount = pricingPlans.filter(
    (plan) => getStatus(plan).toLowerCase() !== 'out of stock'
  ).length;

  const isSelectedPlanActive = pricingPlans.some(
    (plan) => plan.id === selectedPlan?.id && getStatus(plan).toLowerCase() !== 'out of stock'
  );

  if (!pricingPlans || pricingPlans.length === 0) {
    return <div className="text-gray-500 px-4 sm:px-8">{t.noPricingPlans}</div>;
  }

  // Centralized Intl price formatter
  const formatAmount = useCallback(
    (amount: number, currency: string) => {
      try {
        return new Intl.NumberFormat(undefined, {
          style: 'currency',
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(amount);
      } catch {
        return `${amount.toFixed(2)} ${currency}`;
      }
    },
    []
  );

  // Helper to split price into whole and decimal parts for styling
  const formatPriceWithSmallDecimals = useCallback((priceString: string) => {
    // Match currency symbol, whole number, and decimal part
    const match = priceString.match(/^([^\d]*)(\d+(?:,\d{3})*)([.,]\d+)?$/);
    if (match) {
      const [, symbol, whole, decimal] = match;
      return { symbol, whole, decimal: decimal || '' };
    }
    // Fallback if pattern doesn't match
    return { symbol: '', whole: priceString, decimal: '' };
  }, []);

  const getDisplayPrice = useCallback((plan: PricingPlan) => {
    // Always use plan.currency which is set to base_currency on the server
    const currency = plan.currency || 'GBP';
    const base = plan.computed_price ?? (plan.price ?? 0) / 100;
    if (
      billingCycle === 'annual' &&
      plan.type === 'recurring' &&
      plan.commitment_months
    ) {
      const discountRaw = plan.annual_size_discount;
      let multiplier = 1;
      if (typeof discountRaw === 'number') {
        if (discountRaw > 1) {
          multiplier = (100 - discountRaw) / 100;
        } else if (discountRaw > 0 && discountRaw <= 1) {
          multiplier = discountRaw;
        }
      }
      const commitmentMonths = plan.commitment_months || 12;
      const annualAmount = base * commitmentMonths * multiplier;
      return formatAmount(annualAmount, currency);
    }
    if (plan.is_promotion && (plan.promotion_price !== undefined || plan.promotion_percent)) {
      if (plan.promotion_percent) {
        return formatAmount(base * (1 - plan.promotion_percent / 100), currency);
      }
      if (typeof plan.promotion_price === 'number') {
        return formatAmount(plan.promotion_price, currency);
      }
    }
    return formatAmount(base, currency);
  }, [formatAmount, billingCycle]);

  const getOriginalPrice = useCallback((plan: PricingPlan) => {
    // Always use plan.currency which is set to base_currency on the server
    const currency = plan.currency || 'GBP';
    const base = plan.computed_price ?? (plan.price ?? 0) / 100;
    if (
      billingCycle === 'annual' &&
      plan.type === 'recurring' &&
      plan.commitment_months
    ) {
      const commitmentMonths = plan.commitment_months || 12;
      const annualUndiscounted = base * commitmentMonths;
      return formatAmount(annualUndiscounted, currency);
    }
    return formatAmount(base, currency);
  }, [formatAmount, billingCycle]);

  return (
    <div className="mt-2 md:mt-6 relative pt-4 sm:pt-2">
      <div className="absolute top-0 right-0 z-50 space-y-2">
        {toasts.map((toast) => (
          <CustomToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
            onRetry={toast.onRetry}
            duration={2000}
            position="top-0 right-0"
          />
        ))}
      </div>

      {/* Pricing cards grid */}
      <div className="relative" role="radiogroup" aria-label={t.selectPlan} aria-live="polite">
        <div className={`grid grid-cols-1 ${
            pricingPlans.length >= 3 
              ? 'sm:grid-cols-2' 
              : 'sm:grid-cols-2'
          }`}>
            {pricingPlans.map((plan, idx) => {
              const isActive = plan.id === selectedPlan?.id;
              const status = getStatus(plan);
              const normalizedStatus = status.toLowerCase();
              const isOutOfStock = normalizedStatus === 'out of stock';

              const cardStyles = planCardStyles(isOutOfStock, isActive);
              
              return (
                <div key={plan.id} className="animate-fade-in-up" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div
                    className={cardStyles.className}
                    style={cardStyles.style}
                    role="radio"
                    aria-checked={isActive}
                    tabIndex={isOutOfStock ? -1 : 0}
                    onClick={() => !isOutOfStock && handlePlanSelect(plan)}
                    onKeyDown={(e) => !isOutOfStock && handleKeyDown(e, plan, idx)}
                    aria-label={`${t.selectPlan} ${plan.package || t.unknown} plan, priced at ${
                      getDisplayPrice(plan)
                    }, ${
                      normalizedStatus === 'in stock'
                        ? t.inStock.toLowerCase()
                        : normalizedStatus === 'low stock'
                        ? t.lowStock.toLowerCase()
                        : t.outOfStock.toLowerCase()
                    }${plan.is_promotion && plan.promotion_price !== undefined ? `, ${t.onSale}` : ''}`}
                  >
                    <div className="relative px-5 sm:px-6 pt-8 sm:pt-10 pb-4 sm:pb-5">

                      {/* Subtle Status Badge - Informational and Minimal */}
                      <div className="absolute top-2 sm:top-4 left-3 sm:left-4 z-10">
                        {(() => {
                          if (normalizedStatus === 'in stock') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium text-green-700 bg-green-50/60 border border-green-200/40 rounded-md">
                                <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                                {t.inStock}
                              </span>
                            );
                          }
                          if (normalizedStatus === 'low stock') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium text-yellow-700 bg-yellow-50/60 border border-yellow-200/40 rounded-md">
                                <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
                                {t.lowStock}
                              </span>
                            );
                          }
                          if (normalizedStatus === 'out of stock') {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-50/80 border border-gray-200/50 rounded-md">
                                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                {t.outOfStock}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      <div className="relative flex flex-col gap-3 sm:gap-4">
                        {/* Price at top right */}
                        <div className="flex justify-end">
                          {plan.is_promotion && (plan.promotion_price !== undefined || plan.promotion_percent) ? (
                            <div className="flex flex-col items-end space-y-1">
                              {/* Inline: Discount % | Crossed Price | New Price */}
                              <div className="flex items-baseline gap-3 sm:gap-4">
                                {plan.promotion_percent && (
                                  <span className="text-xs font-semibold" style={{ color: themeColors.cssVars.primary.base }}>
                                    {plan.promotion_percent}{t.percentOff}
                                  </span>
                                )}
                                <span className="text-base text-gray-500 font-medium line-through">
                                  {getOriginalPrice(plan)}
                                </span>
                                <span 
                                  className={`text-xl sm:text-2xl font-extrabold ${
                                    isOutOfStock ? 'text-gray-400' : ''
                                  }`}
                                  style={!isOutOfStock ? { color: themeColors.cssVars.primary.base } : {}}
                                >
                                  {(() => {
                                    const price = getDisplayPrice(plan);
                                    const { symbol, whole, decimal } = formatPriceWithSmallDecimals(price);
                                    return (
                                      <>
                                        {symbol}{whole}<span className="text-base sm:text-lg">{decimal}</span>
                                      </>
                                    );
                                  })()}
                                </span>
                              </div>
                              {(plan.recurring_interval || plan.measure) && (
                                <span className="text-xs text-gray-500 font-medium">{
                                  (() => {
                                    if (billingCycle === 'annual' && plan.type === 'recurring' && plan.commitment_months) {
                                      return getSafeTranslation('perYear', 'per year');
                                    }
                                    const interval = (plan.recurring_interval || '').toString().toLowerCase();
                                    if (!interval) return plan.measure || null;
                                    if (interval === 'month' || interval === 'monthly') return getSafeTranslation('perMonth', 'per month');
                                    if (interval === 'week' || interval === 'weekly') return getSafeTranslation('perWeek', 'per week');
                                    if (interval === 'year' || interval === 'annually' || interval === 'annual') return getSafeTranslation('perYear', 'per year');
                                    if (interval === 'day' || interval === 'daily') return getSafeTranslation('perDay', 'per day');
                                    if (interval === 'quarter' || interval === 'quarterly') return getSafeTranslation('perQuarter', 'per quarter');
                                    return getSafeTranslation('everyX', `every ${plan.recurring_interval}`).replace('{interval}', String(plan.recurring_interval));
                                  })()
                                }</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end space-y-1">
                              <div className="flex items-baseline space-x-1.5">
                                <span
                                  className={`text-xl sm:text-2xl font-bold ${
                                    isOutOfStock ? 'text-gray-400' : isActive ? 'text-gray-800' : 'text-gray-600'
                                  }`}
                                >
                                  {(() => {
                                    const price = getDisplayPrice(plan);
                                    const { symbol, whole, decimal } = formatPriceWithSmallDecimals(price);
                                    return (
                                      <>
                                        {symbol}{whole}<span className="text-base sm:text-lg">{decimal}</span>
                                      </>
                                    );
                                  })()}
                                </span>
                              </div>
                              <span className="text-sm text-transparent">
                                {/* Placeholder for alignment */}
                              </span>
                              {(plan.recurring_interval || plan.measure) && (
                                <span className="text-xs text-gray-500 font-medium">{
                                  (() => {
                                    if (billingCycle === 'annual' && plan.type === 'recurring' && plan.commitment_months) {
                                      return getSafeTranslation('perYear', 'per year');
                                    }
                                    const interval = (plan.recurring_interval || '').toString().toLowerCase();
                                    if (!interval) return plan.measure || null;
                                    if (interval === 'month' || interval === 'monthly') return getSafeTranslation('perMonth', 'per month');
                                    if (interval === 'week' || interval === 'weekly') return getSafeTranslation('perWeek', 'per week');
                                    if (interval === 'year' || interval === 'annually' || interval === 'annual') return getSafeTranslation('perYear', 'per year');
                                    if (interval === 'day' || interval === 'daily') return getSafeTranslation('perDay', 'per day');
                                    if (interval === 'quarter' || interval === 'quarterly') return getSafeTranslation('perQuarter', 'per quarter');
                                    return getSafeTranslation('everyX', `every ${plan.recurring_interval}`).replace('{interval}', String(plan.recurring_interval));
                                  })()
                                }</span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Subtle divider */}
                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent"></div>

                        {/* Package name and measure/description in separate row */}
                        <div className="flex justify-between items-end gap-2 sm:gap-4">
                          <h2
                            className={`text-sm sm:text-base font-semibold truncate max-w-[50%] ${
                              isOutOfStock ? 'text-gray-400' : ''
                            }`}
                            style={!isOutOfStock && isActive ? { color: themeColors.cssVars.primary.base } : !isOutOfStock ? { color: '#6b7280' } : {}}
                            title={plan.package || t.product}
                          >
                            {plan.package || t.product}
                          </h2>
                          <span className={`text-xs sm:text-sm font-semibold truncate max-w-[50%] ${
                            isOutOfStock ? 'text-gray-400' : isActive ? 'text-gray-600' : 'text-gray-500'
                          }`} title={plan.type === 'one_time' ? plan.description : plan.measure}>
                            {plan.type === 'one_time' ? (plan.description || plan.measure) : plan.measure}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="mt-4 md:mt-6 px-4 sm:px-0 space-y-3">
        {activePlanCount === 0 || (selectedPlan && ((selectedPlan.computed_price || selectedPlan.price / 100) === 0 || (selectedPlan.is_promotion && (selectedPlan.computed_price ? selectedPlan.computed_price === 0 : (selectedPlan.promotion_price || 0) === 0)))) ? (
          <Link href="/register-free-trial">
            <Button 
              variant="start" 
              className="h-14 md:h-16 text-base md:text-lg font-medium md:hover:scale-[1.02] active:scale-100 transition-all duration-200" 
              aria-label={t.registerForFreeTrial}
            >
              {t.register}
              <RightArrowDynamic />
            </Button>
          </Link>
        ) : (
          <>
            <Button
              variant="start"
              onClick={handleAddToBasket}
              disabled={selectedPlanStatus === 'out of stock' || isLoading}
              className={`
                h-14 md:h-16 text-base md:text-lg font-medium
                ${
                  selectedPlanStatus !== 'out of stock' && !isLoading
                    ? isSelectedPlanActive
                      ? isAdded
                        ? 'scale-[1.02]'
                        : 'md:hover:scale-[1.02] active:scale-100 transition-all duration-200'
                      : 'bg-white/80 backdrop-blur-sm text-gray-700 border-2 border-gray-300 hover:bg-white hover:border-gray-400 md:hover:scale-[1.02] active:scale-100 transition-all duration-200'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60 border-2 border-gray-300'
                }`}
              aria-disabled={selectedPlanStatus === 'out of stock' || isLoading}
              aria-label={isLoading ? t.addingToCart : isAdded ? t.addedToCart : t.addToCart}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" style={{ animationTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', willChange: 'transform' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t.loading}</span>
                </div>
              ) : (
                <>
                  {isAdded ? (
                    <>
                      <svg className="w-5 md:w-6 h-5 md:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>{t.added}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCartIcon
                        className="w-5 md:w-6 h-5 md:h-6 mr-2 transition-transform duration-300 group-hover:scale-110"
                        aria-hidden="true"
                      />
                      <span>{t.addToCart}</span>
                    </>
                  )}
                </>
              )}
            </Button>

            {/* Delay rendering of the "Proceed to Checkout" button until after hydration */}
            {isMounted ? (
              totalItems > 0 ? (
                <Link href="/checkout">
                  <Button
                    variant="start"
                    className="h-16 md:h-[4.5rem] text-lg md:text-xl font-semibold md:hover:scale-[1.02] active:scale-100 transition-all duration-200"
                    aria-label={t.proceedToCheckout}
                    onMouseEnter={prefetchCheckout}
                  >
                    <span>{t.proceedToCheckout}</span>
                    <RightArrowDynamic />
                  </Button>
                </Link>
              ) : null
            ) : (
              <div className="h-16 md:h-[4.5rem] w-full" /> // Placeholder to match button height
            )}
          </>
        )}
      </div>

      {amazonBooksUrl && (
        <div className="mt-3 md:mt-4 px-4 sm:px-0">
          <a
            href={amazonBooksUrl}
            title={t.getItOnAmazonKindle}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.buyOnAmazonAriaLabel}
          >
            <Button variant="start" className="h-14 md:h-16 text-base md:text-lg font-medium flex items-center bg-gradient-to-r from-[#FF9900] to-[#FF8800] text-white hover:from-[#FF8800] hover:to-[#FF7700] border-2 border-[#FF9900] hover:border-[#FF8800] md:hover:scale-[1.02] active:scale-100 transition-all duration-200">
              <svg
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                className="w-4 h-4 mr-4"
                aria-hidden="true"
              >
                <g id="SVGRepo_bgCarrier"></g>
                <g id="SVGRepo_tracerCarrier"></g>
                <g id="SVGRepo_iconCarrier">
                  <title>amazon</title>
                  <rect width="24" height="24" fill="none"></rect>
                  <path d="M15.93,17.09a.54.54,0,0,1-.63.06,6.55,6.55,0,0,1-1.54-1.79,5.31,5.31,0,0,1-4.42,1.95,3.8,3.8,0,0,1-4-4.17A4.55,4.55,0,0,1,8.19,8.76a18.39,18.39,0,0,1,5-.93V7.5a3.42,3.42,0,0,0-.33-2,1.79,1.79,0,0,0-1.5-.7A2,2,0,0,0,9.25,6.45a.6.6,0,0,1-.47.49l-2.6-.28a.47.47,0,0,1-.40-.56C6.38,3,9.23,2,11.78,2a6.1,6.1,0,0,1,4,1.33C17.11,4.55,17,6.18,17,8v4.17a3.6,3.6,0,0,0,1,2.48c.17.25.21.54,0,.71l-2.06,1.78h0m-2.7-6.53V10c-1.94,0-4,.39-4,2.67,0,1.16.61,1.95,1.63,1.95a2.19,2.19,0,0,0,1.86-1.22,5.32,5.32,0,0,0,.5-2.84m6.93,9A14.29,14.29,0,0,1,12.1,22a14.59,14.59,0,0,1-9.85-3.76c-.20-.18,0-.43.25-.29a19.68,19.68,0,0,0,9.83,2.61A19.69,19.69,0,0,0,19.84,19c.37-.16.66.24.32.51m.91-1c-.28-.36-1.85-.17-2.57-.08-.19,0-.22-.16,0-.30A3.92,3.92,0,0,1,22,17.79a3.86,3.86,0,0,1-1.24,3.32c-.18.16-.35.07-.26-.11C20.76,20.33,21.35,18.86,21.07,18.5Z"></path>
                </g>
              </svg>
              <span>{t.buyOnAmazon}</span>
              <RightArrowDynamic />
            </Button>
          </a>
        </div>
      )}
      <div ref={sectionRef} className="mt-4">
        {featuresVisible && selectedPlan && (
          <LazyPricingPlanFeatures selectedPlan={selectedPlan} />
        )}
      </div>
    </div>
  );
});

export default ProductDetailPricingPlans;