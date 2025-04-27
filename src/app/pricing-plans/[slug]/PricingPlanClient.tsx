'use client';

import { useBasket } from '../../../context/BasketContext';
import { useState } from 'react';
import BasketItem from '../../../components/BasketItem';
import { useRouter } from 'next/navigation';

interface PricingPlan {
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
  product?: {
    product_name: string;
    slug?: string;
    links_to_image?: string;
  };
  stripe_product_id?: string;
  stripe_price_id?: string;
}

interface Feature {
  id: number;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
}

interface PricingPlanClientProps {
  pricingPlan: PricingPlan;
  associatedFeatures: Feature[];
}

export default function PricingPlanClient({
  pricingPlan,
  associatedFeatures,
}: PricingPlanClientProps) {
  const { basket, updateQuantity, removeFromBasket } = useBasket();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Find the current plan in the basket to retrieve quantity
  const basketItem = basket.find((item) => item.plan.id === pricingPlan.id);
  const quantity = basketItem ? basketItem.quantity : 0;

  // Redirect to custom checkout page
  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);
      router.push('/checkout');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Error redirecting to checkout');
      setIsLoading(false);
    }
  };

  // Decide on button label: "Add to Cart" if not in basket, else "Proceed to Payment"
  const buttonLabel = quantity === 0 ? 'Add to Cart' : 'Proceed to Payment';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          Checkout
        </h1>
      </div>

      {/* If in basket, show the item card */}
      {quantity > 0 && basketItem && basketItem.plan.id !== undefined ? (
        <div className="mb-6">
          <BasketItem
            item={{
              ...basketItem,
              plan: {
                ...basketItem.plan,
                id: basketItem.plan.id!, // Assert non-undefined after check
              },
            }}
            updateQuantity={updateQuantity}
            removeFromBasket={removeFromBasket}
            associatedFeatures={associatedFeatures}
          />
        </div>
      ) : null}

      {/* Action Button */}
      <div>
        {error && (
          <div className="mb-4 text-red-500 text-sm font-medium">{error}</div>
        )}
        <button
          onClick={() => {
            if (quantity === 0) {
              // "Add to Cart" logic
              updateQuantity(pricingPlan.id, 1);
            } else {
              // "Proceed to Payment" logic
              handleCheckout();
            }
          }}
          disabled={isLoading}
          className={`
            w-full py-3 px-4 text-sm font-semibold rounded-full border border-sky-600 
            text-sky-600 bg-white transition-all duration-200 
            focus:outline-none focus:ring-4 focus:ring-sky-200 focus:ring-opacity-50 
            shadow-sm hover:bg-sky-50 hover:scale-105 
            ${isLoading ? 'cursor-not-allowed opacity-70' : ''}
          `}
        >
          {isLoading ? 'Processing...' : buttonLabel}
        </button>
      </div>
    </div>
  );
}