'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { ShoppingCartIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useBasket } from '../context/BasketContext';

// Define types for pricing plans and props
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
  onRetry?: () => void; // Optional retry callback for error toasts
}

// Custom Toast Component styled with Tailwind CSS, memoized to prevent unnecessary re-renders
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
              aria-label="Retry adding to cart"
            >
              Retry
            </button>
          )}
          <button
            onClick={onClose}
            className="text-teal-600 hover:text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-300"
            aria-label="Close notification"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }
);

// Add displayName to satisfy ESLint react/display-name rule
CustomToast.displayName = 'CustomToast';

// Utility function for plan card styles to reduce clutter
const planCardStyles = (isOutOfStock: boolean, isActive: boolean) =>
  `p-3 md:p-4 border rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-500 focus:ring-opacity-50 focus:bg-sky-100 outline-none
  ${
    isOutOfStock
      ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-70'
      : isActive
      ? 'border-sky-500 shadow-md shadow-sky-100 bg-sky-50 cursor-pointer'
      : 'border-gray-200 hover:shadow-sm hover:bg-gray-50 cursor-pointer'
  }`;

export default function ProductDetailPricingPlans({
  pricingPlans = [],
  amazonBooksUrl,
}: ProductDetailPricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null); // Default to null for better validation
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { basket, addToBasket } = useBasket(); // Context for managing the shopping basket (provides basket state and addToBasket function)
  const [toasts, setToasts] = useState<Toast[]>([]); // Array to manage multiple toasts with retry option

  // Initialize the selected plan to the first in-stock plan
  useEffect(() => {
    const firstInStockPlan = pricingPlans.find(
      (plan) => getStatus(plan).toLowerCase() !== 'out of stock'
    ) || pricingPlans[0] || null;
    setSelectedPlan(firstInStockPlan);
  }, [pricingPlans]);

  // Custom toast handler to show notifications
  const showToast = (
    message: string,
    type: 'success' | 'error' | 'warn',
    onRetry?: () => void
  ) => {
    const id = Date.now(); // Unique ID for each toast
    setToasts((prevToasts) => [...prevToasts, { id, message, type, onRetry }]);
  };

  // Remove toast by ID
  const removeToast = (id: number) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

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
      showToast('Added to cart!', 'success');
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Error adding to basket:', error);
      showToast('Failed to add to cart', 'error', () => handleAddToBasket()); // Retry option
    } finally {
      setIsLoading(false);
    }
  }, [selectedPlan, addToBasket]);

  const getStatus = useCallback((plan: PricingPlan | null) => {
    if (!plan) return 'Out of Stock';
    const inv = Array.isArray(plan.inventory) ? plan.inventory[0] : plan.inventory;
    return inv?.status || 'Out of Stock';
  }, []);

  const selectedPlanStatus = getStatus(selectedPlan).toLowerCase();
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);

  const isSelectedPlanActive = pricingPlans.some(
    (plan) => plan.slug === selectedPlan?.slug && getStatus(plan).toLowerCase() !== 'out of stock'
  );

  return (
    <div className="mt-2 md:mt-6 relative pt-4 sm:pt-2">
      {/* Toast Container with configurable position */}
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

      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 px-4 sm:px-8 pb-2 md:pb-4">
        {pricingPlans.map((plan, idx) => {
          const isActive = plan.slug === selectedPlan?.slug;
          const status = getStatus(plan);
          const normalizedStatus = status.toLowerCase();
          const isOutOfStock = normalizedStatus === 'out of stock';

          return (
            <div key={idx} className="pricing-wrapper">
              <div
                className={planCardStyles(isOutOfStock, isActive)}
                role="button"
                tabIndex={isOutOfStock ? -1 : 0}
                onClick={() => handlePlanSelect(plan)}
                onKeyDown={(e) => handleKeyDown(e, plan, idx)}
                aria-label={`Select ${plan.measure || 'Unknown'} plan, priced at ${
                  plan.currency_symbol
                }${plan.is_promotion && plan.promotion_price ? plan.promotion_price : plan.price}, ${
                  normalizedStatus === 'in stock'
                    ? 'in stock'
                    : normalizedStatus === 'low stock'
                    ? 'low stock'
                    : 'out of stock'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <h2
                    className={`text-sm md:text-base font-semibold ${
                      isActive ? 'text-sky-600' : 'text-gray-900'
                    } ${isOutOfStock ? 'text-gray-500' : ''}`}
                  >
                    {plan.measure || 'Product'}
                  </h2>
                  {(() => {
                    if (normalizedStatus === 'in stock') {
                      return (
                        <span className="inline-block px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium text-green-800 bg-green-50 rounded-full">
                          In Stock
                        </span>
                      );
                    }
                    if (normalizedStatus === 'low stock') {
                      return (
                        <span className="inline-block px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium text-yellow-800 bg-yellow-50 rounded-full">
                          Low Stock
                        </span>
                      );
                    }
                    if (normalizedStatus === 'out of stock') {
                      return (
                        <span className="inline-block px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium text-gray-600 bg-gray-100 rounded-full">
                          Out of Stock
                        </span>
                      );
                    }
                    return (
                      <span className="inline-block px-1.5 py-0.5 text-[8px] md:text-[10px] font-medium text-gray-600 bg-green-100 rounded-full">
                        Unknown
                      </span>
                    );
                  })()}
                </div>

                <div>
                  {plan.is_promotion && plan.promotion_price !== undefined ? (
                    <div className="flex items-baseline justify-end space-x-1.5">
                      <span className="text-lg md:text-xl text-gray-500 font-medium line-through">
                        {plan.currency_symbol}
                        {plan.price}
                      </span>
                      <span className="text-xl md:text-2xl font-bold text-gray-900">
                        {plan.currency_symbol}
                        {plan.promotion_price}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-end space-x-1.5">
                      <span
                        className={`text-xl md:text-2xl font-bold ${
                          isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {plan.currency_symbol}
                        {plan.price}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add to Cart and Proceed to Checkout Buttons */}
      <div className="mt-2 md:mt-4 grid sm:grid-cols-2 gap-3 md:gap-4">
        <button
          onClick={handleAddToBasket}
          disabled={selectedPlanStatus === 'out of stock' || isLoading}
          className={`group relative flex items-center justify-center w-full py-4 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 shadow-md transform transition-transform
            ${
              selectedPlanStatus !== 'out of stock' && !isLoading
                ? isSelectedPlanActive
                  ? isAdded
                    ? 'bg-sky-500 text-white scale-105' // Scale animation for "Added" state
                    : 'bg-sky-500 text-white hover:bg-sky-600 hover:scale-105'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:scale-105'
                : 'bg-gray-200 text-gray-700 cursor-not-allowed'
            }`}
          aria-disabled={selectedPlanStatus === 'out of stock' || isLoading}
          aria-label={isLoading ? 'Adding to cart' : isAdded ? 'Added to cart' : 'Add to cart'}
        >
          {isLoading ? (
            <span>Loading...</span>
          ) : (
            <>
              <ShoppingCartIcon
                className="w-4 md:w-5 h-4 md:h-5 mr-1.5 md:mr-2 transition-transform duration-300 group-hover:scale-110"
                aria-hidden="true"
              />
              <span>{isAdded ? 'Added' : 'Add to Cart'}</span>
            </>
          )}
        </button>

        {totalItems > 0 && (
          <Link href="/checkout">
            <button
              className="group relative flex items-center justify-center w-full py-4 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 shadow-md bg-gray-700 text-white hover:bg-gray-800 hover:scale-105"
              aria-label="Proceed to checkout"
            >
              <span>Proceed to Checkout</span>
            </button>
          </Link>
        )}
      </div>

      {/* Amazon Link with Logo */}
      {amazonBooksUrl && (
        <div className="mt-3 md:mt-4">
          <a
            href={amazonBooksUrl}
            title="Get it on Amazon Kindle"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center justify-center w-full py-4 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-200 focus:ring-opacity-50 shadow-md bg-[#FF9900] text-[#111] hover:bg-[#F5C146] hover:scale-105"
            aria-label="Buy on Amazon"
          >
            {/* Placeholder for Amazon logo (replace with actual SVG or image asset) */}
            <svg
              className="w-5 h-5 mr-2"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm0 16.5c-2.485 0-4.5-2.015-4.5-4.5S9.515 9.5 12 9.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z" />
            </svg>
            <span>Buy on Amazon</span>
          </a>
        </div>
      )}
    </div>
  );
}