'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useBasket } from '../../context/BasketContext';
import Button from '@/ui/Button';
import Link from 'next/link';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import PricingPlanFeatures from './PricingPlanFeatures';
import { useProductTranslations } from './useProductTranslations';

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
  [key: string]: any;
};

interface ProductDetailPricingPlansProps {
  pricingPlans: PricingPlan[];
  amazonBooksUrl?: string;
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

// Utility function for plan card styles
const planCardStyles = (isOutOfStock: boolean, isActive: boolean) =>
  `p-3 md:p-4 border rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 focus:bg-sky-100 outline-none relative
  ${
    isOutOfStock
      ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-70'
      : isActive
      ? 'border-sky-500 shadow-md shadow-sky-100 bg-sky-50 cursor-pointer'
      : 'bg-white border-sky-200 hover:shadow-sm hover:bg-gray-50 cursor-pointer'
  }`;

const ProductDetailPricingPlans = memo(function ProductDetailPricingPlans({
  pricingPlans = [],
  amazonBooksUrl,
}: ProductDetailPricingPlansProps) {
  const { t } = useProductTranslations();
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { basket, addToBasket } = useBasket();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isMounted, setIsMounted] = useState(false); // Add state to track hydration

  console.log('Pricing plans with features:', JSON.stringify(pricingPlans, null, 2));
  console.log('Selected plan:', JSON.stringify(selectedPlan, null, 2));

  // Track hydration state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const firstInStockPlan =
      pricingPlans.find((plan) => getStatus(plan).toLowerCase() !== 'out of stock') ||
      pricingPlans[0] ||
      null;
    setSelectedPlan(firstInStockPlan);
    console.log('Selected initial plan:', firstInStockPlan);
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
    console.log('Selected plan:', plan);
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
      await addToBasket(selectedPlan);
      setIsAdded(true);
      showToast(t.addedToCart, 'success');
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast(t.failedToLoad, 'error', () => handleAddToBasket());
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan, addToBasket, t]);

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
    (plan) => plan.slug === selectedPlan?.slug && getStatus(plan).toLowerCase() !== 'out of stock'
  );

  if (!pricingPlans || pricingPlans.length === 0) {
    return <div className="text-gray-500 px-4 sm:px-8">{t.noPricingPlans}</div>;
  }

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

<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-6 md:px-8 pb-4 md:pb-6">
  {pricingPlans.map((plan, idx) => {
    const isActive = plan.slug === selectedPlan?.slug;
    const status = getStatus(plan);
    const normalizedStatus = status.toLowerCase();
    const isOutOfStock = normalizedStatus === 'out of stock';

    return (
      <div key={plan.id} className="pricing-wrapper">
        <div
          className={`
            ${planCardStyles(isOutOfStock, isActive)}
            relative bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-5
            transition-all duration-300 ease-in-out
            ${isOutOfStock ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
          `}
          role="button"
          tabIndex={isOutOfStock ? -1 : 0}
          onClick={() => !isOutOfStock && handlePlanSelect(plan)}
          onKeyDown={(e) => !isOutOfStock && handleKeyDown(e, plan, idx)}
          aria-label={`Select ${plan.package || 'Unknown'} plan, priced at ${
            plan.currency_symbol
          }${plan.is_promotion && plan.promotion_price ? plan.promotion_price : plan.price}, ${
            normalizedStatus === 'in stock'
              ? 'in stock'
              : normalizedStatus === 'low stock'
              ? 'low stock'
              : 'out of stock'
          }${plan.is_promotion && plan.promotion_price !== undefined ? ', on sale' : ''}`}
        >
          <div className="relative pt-4 sm:pt-5 pb-5 sm:pb-6 min-h-[120px]">
            {/* Promotion Badge (Top-Left) */}
            {plan.is_promotion && plan.promotion_price !== undefined && (
              <span className="absolute top-0 right-0 -translate-y-1/3  px-2.5 py-1 text-xs font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full z-10 shadow-sm">
                {plan.promotion_percent}% Off
              </span>
            )}

            {/* Status Badge (Bottom-Left) */}
            <div className="absolute bottom-0 left-0 translate-y-1/3 t px-2 py-0.5 text-xs font-medium rounded-full z-10">
              {(() => {
                if (normalizedStatus === 'in stock') {
                  return (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium text-green-700 bg-green-50 rounded-full shadow-sm">
                      In Stock
                    </span>
                  );
                }
                if (normalizedStatus === 'low stock') {
                  return (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium text-yellow-700 bg-yellow-50 rounded-full shadow-sm">
                      Low Stock
                    </span>
                  );
                }
                if (normalizedStatus === 'out of stock') {
                  return (
                    <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full shadow-sm">
                      Out of Stock
                    </span>
                  );
                }
                return (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full shadow-sm">
                    Unknown
                  </span>
                );
              })()}
            </div>

            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className="flex flex-col">
                {/* Measure (Above Package) */}
                <span className="text-xs font-medium text-gray-500 mb-0.5">
                  {plan.measure}
                </span>
                <h2
                  className={`text-sm sm:text-base font-semibold ${
                    isActive ? 'text-sky-600' : 'text-gray-800'
                  } ${isOutOfStock ? 'text-gray-400' : ''}`}
                >
                  {plan.package || 'Product'}
                </h2>
              </div>
            </div>

            <div className="min-h-[36px] sm:min-h-[48px] flex items-end justify-end">
              {plan.is_promotion && plan.promotion_price !== undefined ? (
                <div className="flex flex-col items-end space-y-0.5">
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-2xl sm:text-2xl font-bold text-gray-800">
                      {plan.currency_symbol}
                      {(plan.promotion_price / 100).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400 font-medium line-through">
                    {plan.currency_symbol}
                    {(plan.price / 100).toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-end space-y-0.5">
                  <div className="flex items-baseline space-x-1.5">
                    <span
                      className={`text-2xl sm:text-2xl font-bold ${
                        isOutOfStock ? 'text-gray-400' : 'text-gray-800'
                      }`}
                    >
                      {plan.currency_symbol}
                      {(plan.price / 100).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-sm text-transparent">
                    {/* Placeholder for alignment */}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>

      <div className="mt-4 grid sm:grid-cols-1 gap-3 md:gap-2 px-4 sm:px-8">
        {activePlanCount === 0 || (selectedPlan && (selectedPlan.price === 0 || (selectedPlan.is_promotion && selectedPlan.promotion_price === 0))) ? (
          <Link href="/register-free-trial">
            <Button variant="start" aria-label="Register for free trial">
              Register
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
                ${
                  selectedPlanStatus !== 'out of stock' && !isLoading
                    ? isSelectedPlanActive
                      ? isAdded
                        ? 'bg-sky-500 text-white scale-105'
                        : 'bg-sky-500 text-white hover:bg-sky-600 hover:scale-105'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-105'
                    : 'bg-gray-200 text-gray-700 cursor-not-allowed'
                }`}
              aria-disabled={selectedPlanStatus === 'out of stock' || isLoading}
              aria-label={isLoading ? t.addingToCart : isAdded ? t.addedToCart : t.addToCart}
            >
              {isLoading ? (
                <span>{t.loading}</span>
              ) : (
                <>
                  <ShoppingCartIcon
                    className="w-4 md:w-5 h-4 md:h-5 mr-1.5 md:mr-2 transition-transform duration-300 group-hover:scale-110"
                    aria-hidden="true"
                  />
                  <span>{isAdded ? t.added : t.addToCart}</span>
                </>
              )}
            </Button>

            {/* Delay rendering of the "Proceed to Checkout" button until after hydration */}
            {isMounted ? (
              totalItems > 0 ? (
                <Link href="/checkout">
                  <Button
                    variant="start"
                    className="bg-sky-700"
                    aria-label={t.proceedToCheckout}
                  >
                    <span>{t.proceedToCheckout}</span>
                    <RightArrowDynamic />
                  </Button>
                </Link>
              ) : null
            ) : (
              <div className="h-14 w-full" /> // Placeholder to match button height
            )}
          </>
        )}
      </div>

      {amazonBooksUrl && (
        <div className="mt-3 md:mt-4 px-4 sm:px-8">
          <a
            href={amazonBooksUrl}
            title={t.getItOnAmazonKindle}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t.buyOnAmazonAriaLabel}
          >
            <Button variant="start" className="flex items-center bg-[#FF9900] text-gray-900 hover:text-white">
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

      {selectedPlan && <PricingPlanFeatures selectedPlan={selectedPlan} />}
    </div>
  );
});

export default ProductDetailPricingPlans;