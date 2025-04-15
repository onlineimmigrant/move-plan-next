'use client';

import { useState, useEffect } from 'react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useBasket } from '../context/BasketContext';

// Define types for pricing plans and props
type PricingPlan = {
  id?: number;
  slug?: string;
  package?: string;
  measure?: string;
  currency: string;
  price: number;
  promotion_price?: number;
  promotion_percent?: number;
  is_promotion?: boolean;
  inventory?: any[] | any;
  buy_url?: string;
  product_id?: number;
  [key: string]: any;
};

interface ProductDetailPricingPlansProps {
  pricingPlans: PricingPlan[];
  productId: number;
  amazonBooksUrl?: string;
}

export default function ProductDetailPricingPlans({
  pricingPlans = [],
  productId,
  amazonBooksUrl,
}: ProductDetailPricingPlansProps) {
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(pricingPlans[0] || null);
  const { basket, addToBasket } = useBasket();

  useEffect(() => {
    setSelectedPlan(pricingPlans[0] || null);
  }, [pricingPlans]);

  const handlePlanSelect = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    console.log('Selected plan:', plan);
  };

  const handleAddToBasket = () => {
    if (selectedPlan) {
      addToBasket(selectedPlan);
    }
  };

  const getStatus = (plan: PricingPlan | null) => {
    if (!plan) return 'Out of Stock';
    const inv = Array.isArray(plan.inventory) ? plan.inventory[0] : plan.inventory;
    return inv?.status || 'Out of Stock';
  };

  const selectedPlanStatus = getStatus(selectedPlan).toLowerCase();
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const canCheckout = totalItems > 0 && selectedPlanStatus !== 'out of stock';

  return (
    <div className="mt-6">
      {/* Pricing Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
        {pricingPlans.map((plan, idx) => {
          const isActive = plan.slug === selectedPlan?.slug;
          const status = getStatus(plan);
          const normalizedStatus = status.toLowerCase();

          return (
            <div key={idx} className="pricing-wrapper">
              <div
                className={`p-8 sm:p-4 border rounded-lg cursor-pointer transition-shadow duration-200 
                  ${
                    isActive
                      ? 'border-sky-500 shadow-md shadow-sky-100'
                      : 'border-gray-200 hover:shadow-sm'
                  }
                `}
                role="button"
                tabIndex={0}
                onClick={() => handlePlanSelect(plan)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handlePlanSelect(plan);
                }}
                aria-label={`Select plan: ${plan.package || 'Unknown'}`}
              >
                {/* Status Badge and Plan Info */}
                <div className="flex justify-between mb-2 -mx-1.5">
                  <div>
                    <span className="block text-xs uppercase text-gray-400">
                      {plan.package === 'one_time'
                        ? 'One-Time Payment'
                        : `${plan.package || 'Subscription'}`}
                    </span>
                  </div>
                  {(() => {
                    if (normalizedStatus === 'in stock') {
                      return (
                        <span className="inline-block px-1 py-0.5 text-xs font-medium text-green-800 bg-green-50 rounded-full">
                          In Stock
                        </span>
                      );
                    }
                    if (normalizedStatus === 'low stock') {
                      return (
                        <span className="inline-block px-1 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-50 rounded-full">
                          Low Stock
                        </span>
                      );
                    }
                    if (normalizedStatus === 'out of stock') {
                      return (
                        <span className="inline-block px-1 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                          Out of Stock
                        </span>
                      );
                    }
                    return (
                      <span className="inline-block px-1 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                        Unknown
                      </span>
                    );
                  })()}
                </div>

                {/* Plan Measure */}
                <div className="mb-2">
                  <h2
                    className={`text-xl font-semibold ${
                      isActive ? 'text-sky-600' : 'text-gray-900'
                    }`}
                  >
                    {plan.measure || 'Product'}
                  </h2>
                </div>

                {/* Pricing */}
                <div>
                  {plan.is_promotion && plan.promotion_price ? (
                    <div className="flex items-baseline justify-between space-x-2">
                      <span className="text-sm font-medium text-gray-900 bg-green-50 p-1">
                        -{plan.promotion_percent}% off
                      </span>
                      <div>
                        <span className="text-xl text-gray-900 font-medium line-through mr-2">
                          {plan.currency}
                          {plan.price}
                        </span>
                        <span className="text-xl font-bold text-gray-900">
                          {plan.currency}
                          {plan.promotion_price}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline justify-end space-x-2">
                      <span className="text-xl font-bold text-gray-900">
                        {plan.currency}
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

      {/* Amazon Link (optional) */}
      {amazonBooksUrl && (
        <div className="border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex justify-center">
            <a
              href={amazonBooksUrl}
              title="Get it on Amazon Kindle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:text-sky-700 text-sm font-medium transition-colors duration-200"
            >
              Buy on Amazon
            </a>
          </div>
        </div>
      )}

      {/* Add to Cart and Checkout Buttons */}
      <div className="mt-4 space-y-3">
        <button
          onClick={handleAddToBasket}
          disabled={selectedPlanStatus === 'out of stock'}
          className={`group relative flex items-center justify-center w-full py-3 px-4 text-base font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-sky-200 focus:ring-opacity-50 shadow-md ${
            selectedPlanStatus !== 'out of stock'
              ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white hover:from-sky-600 hover:to-sky-700 hover:scale-105'
              : 'bg-gray-200 text-gray-700 cursor-not-allowed'
          }`}
          aria-disabled={selectedPlanStatus === 'out of stock'}
        >
          <ShoppingCartIcon
            className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:scale-110"
            aria-hidden="true"
          />
          <span>Add to Cart</span>
        </button>

        {totalItems > 0 && (
          <Link
            href={
              totalItems === 1
                ? `/pricing-plans/${basket[0].plan.slug}`
                : '/pricing-plans/combined-checkout'
            }
          >
            <button
              className="group relative flex items-center justify-center w-full py-3 px-4 text-base font-semibold rounded-full transition-all duration-300 focus:outline-none 
              focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 shadow-md bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800 hover:scale-105 "
            >
              <span>Proceed to Checkout</span>
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}