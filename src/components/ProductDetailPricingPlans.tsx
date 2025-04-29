'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useBasket } from '../context/BasketContext';
import { toast, ToastContainer } from 'react-toastify'; // Added for toast notifications
import 'react-toastify/dist/ReactToastify.css'; // Toastify CSS

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

export default function ProductDetailPricingPlans({
  pricingPlans = [],
  amazonBooksUrl,
}: ProductDetailPricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(pricingPlans[0] || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdded, setIsAdded] = useState(false); // Track if item was added to cart
  const { basket, addToBasket } = useBasket();

  useEffect(() => {
    setSelectedPlan(pricingPlans[0] || null);
  }, [pricingPlans]);

  // Handle plan selection with keyboard support
  const handlePlanSelect = useCallback((plan: PricingPlan) => {
    const status = getStatus(plan).toLowerCase();
    if (status === 'out of stock') return; // Prevent selecting out-of-stock plans
    setSelectedPlan(plan);
    console.log('Selected plan:', plan);
  }, []);

  // Add keyboard navigation for plans
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
    if (selectedPlan) {
      setIsLoading(true);
      try {
        await addToBasket(selectedPlan);
        setIsAdded(true); // Reflect added state
        toast.success('Added to cart!', { autoClose: 2000 });
        setTimeout(() => setIsAdded(false), 2000); // Reset after 2 seconds
      } catch (error) {
        console.error('Error adding to basket:', error);
        toast.error('Failed to add to cart', { autoClose: 2000 });
      } finally {
        setIsLoading(false);
      }
    } else {
      toast.warn('Please select a plan', { autoClose: 2000 });
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
    <div className="mt-2 md:mt-6">
      {/* Toast Container for notifications */}
      <ToastContainer position="top-right" autoClose={2000} hideProgressBar />

      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 pb-2 md:pb-4">
        {pricingPlans.map((plan, idx) => {
          const isActive = plan.slug === selectedPlan?.slug;
          const status = getStatus(plan);
          const normalizedStatus = status.toLowerCase();
          const isOutOfStock = normalizedStatus === 'out of stock';

          return (
            <div key={idx} className="pricing-wrapper">
              <div
                className={`p-3 md:p-4 border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-sky-500 focus:outline-none
                  ${
                    isOutOfStock
                      ? 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-70'
                      : isActive
                      ? 'border-sky-500 shadow-md shadow-sky-100 bg-sky-50 cursor-pointer'
                      : 'border-gray-200 hover:shadow-sm hover:bg-gray-50 cursor-pointer'
                  }`}
                role="button"
                tabIndex={isOutOfStock ? -1 : 0} // Disable tab focus for out-of-stock plans
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
                      <span className="text-lg md:text-xl font-bold text-gray-900">
                        {plan.currency_symbol}
                        {plan.promotion_price}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-end space-x-1.5">
                      <span
                        className={`text-lg md:text-xl font-bold ${
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
      <div className="mt-1 md:mt-2 grid grid-cols-2 gap-3 md:gap-4">
        <button
          onClick={handleAddToBasket}
          disabled={selectedPlanStatus === 'out of stock' || isLoading}
          className={`group relative flex items-center justify-center w-full py-4 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 shadow-md ${
            selectedPlanStatus !== 'out of stock' && !isLoading
              ? isSelectedPlanActive
                ? isAdded
                  ? 'bg-green-500 text-white'
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
          <Link
            href={
              totalItems === 1 && basket[0].plan?.slug
                ? `/pricing-plans/${basket[0].plan.slug}`
                : '/pricing-plans/combined-checkout'
            }
          >
            <button
              className="group relative flex items-center justify-center w-full py-4 px-3 md:px-4 text-xs md:text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-300 focus:ring-opacity-50 shadow-md bg-gray-700 text-white hover:bg-gray-800 hover:scale-105"
              aria-label="Proceed to checkout"
            >
              <span>Proceed to Checkout</span>
            </button>
          </Link>
        )}
      </div>

      {/* Amazon Link with Amazon's branding */}
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
            <span>Buy on Amazon</span>
          </a>
        </div>
      )}
    </div>
  );
}