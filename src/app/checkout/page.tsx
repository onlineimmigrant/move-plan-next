'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBasket, BasketItem } from '../../context/BasketContext';
import ProgressBar from '../../components/ProgressBar';
import BasketItemComponent from '../../components/BasketItem';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../../components/PaymentForm';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
  const { basket, updateQuantity, removeFromBasket, clearBasket } = useBasket();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0); // Discount percentage
  const hasFetchedIntentRef = useRef(false);

  const totalItems = basket.reduce((sum, item: BasketItem) => sum + item.quantity, 0);
  const totalPrice = basket.reduce((sum, item: BasketItem) => {
    const price =
      item.plan.is_promotion && item.plan.promotion_price
        ? item.plan.promotion_price
        : item.plan.price;
    return sum + (price || 0) * item.quantity;
  }, 0);

  const discountedPrice = totalPrice * (1 - promoDiscount / 100);
  const currency = basket.length > 0 ? basket[0].plan.currency || 'USD' : 'USD';

  // Memoize the fetchPaymentIntent function with minimal dependencies
  const fetchPaymentIntent = useCallback(
    async (amount: number, currency: string, totalItems: number, basket: BasketItem[]) => {
      try {
        console.log('Fetching Payment Intent...', { amount, currency, totalItems });
        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Convert to cents
            currency: currency.toLowerCase(),
            metadata: {
              item_count: totalItems,
              item_ids: basket
                .filter((item) => item.plan.id !== undefined)
                .map((item) => item.plan.id)
                .join(','),
              items: JSON.stringify(
                basket
                  .filter((item) => item.plan.id !== undefined)
                  .map((item) => ({
                    id: item.plan.id,
                    product_name: item.plan.product_name || 'Unknown Product',
                    package: item.plan.package || 'Standard',
                    measure: item.plan.measure || 'One-time',
                  }))
              ),
            },
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to create Payment Intent: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.id);
        window.localStorage.setItem('clientSecret', data.client_secret);
        window.localStorage.setItem('paymentIntentId', data.id);
        hasFetchedIntentRef.current = true;
      } catch (err: any) {
        console.error('Error creating Payment Intent:', err);
        setError(err.message || 'Failed to initialize payment');
      }
    },
    []
  );

  // Fetch the Payment Intent client secret when the page loads
  useEffect(() => {
    if (basket.length === 0) return;
    if (hasFetchedIntentRef.current) return;

    console.log('useEffect triggered:', { basketLength: basket.length });
    fetchPaymentIntent(discountedPrice, currency, totalItems, basket);
  }, [basket, fetchPaymentIntent, discountedPrice, currency, totalItems]);

  const resetPaymentIntent = () => {
    hasFetchedIntentRef.current = false;
    setClientSecret(null);
    setPaymentIntentId(null);
  };

  if (paymentSucceeded) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
        <ProgressBar stage={2} />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 text-base mb-6">
          Thank you for your purchase. Your payment has been successfully processed.
        </p>
        <Link href="/products">
          <span className="text-sky-600 hover:text-sky-700 text-sm font-medium inline-block transition-colors duration-200">
            Continue Shopping
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 min-h-screen">
      <div className="-mx-8 mt-8 mb-2 sm:mt-10 bg-gray-50  py-4 flex items-center justify-between">
        <h1 className="px-8 text-base md:text-xl font-semibold tracking-tight leading-tight">
          Checkout
        </h1>
        <button
          onClick={() => setShowOrderSummary(!showOrderSummary)}
          className="px-8 text-sky-600 hover:text-sky-700 text-sm font-medium"
        >
          {showOrderSummary ? 'Hide Order Summary' : 'Show Order Summary'}
        </button>
      </div>

      {basket.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 text-base">Your basket is empty.</p>
          <Link href="/products">
            <span className="text-sky-600 hover:text-sky-700 text-sm font-medium mt-4 inline-block transition-colors duration-200">
              Continue Shopping
            </span>
          </Link>
        </div>
      ) : (
        <>
          {showOrderSummary && (
            <div className="space-y-2 ">
              {basket
                .filter((item): item is BasketItem & { plan: { id: number } } => item.plan.id !== undefined)
                .map((item) => (
                  <BasketItemComponent
                    key={item.plan.id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeFromBasket={removeFromBasket}
                    associatedFeatures={[]}
                  />
                ))}
            </div>
          )}

          <div className="bg-transparent rounded-lg mt-2  mb-6">
            <div className="flex justify-between items-center mb-0">
              <h2 className="text-sm font-semibold text-gray-900">
                Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-gray-900 uppercase">
                  {currency}
                </span>
                <span className="text-3xl font-bold text-gray-900">
                  {discountedPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {promoDiscount > 0 && (
              <p className="text-right font-medium text-sky-600 text-sm mb-2">
                Discount Applied: {promoDiscount}% off
              </p>
            )}

            {error && (
              <div className="mb-4 text-red-500 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="mt-4">
            {clientSecret && (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  onSuccess={() => {
                    setPaymentSucceeded(true);
                    clearBasket();
                  }}
                  onError={setError}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  totalPrice={totalPrice}
                  setPromoDiscount={setPromoDiscount}
                  resetPaymentIntent={resetPaymentIntent}
                />
              </Elements>
            )}
          </div>
          </div>
        </>
      )}
      <ProgressBar stage={2} />
    </div>
  );
}