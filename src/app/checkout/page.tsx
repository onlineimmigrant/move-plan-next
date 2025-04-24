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
  const [showOrderSummary, setShowOrderSummary] = useState(true);
  const [promoDiscount, setPromoDiscount] = useState(0); // Discount percentage
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const hasFetchedIntentRef = useRef(false); // Use useRef to track fetch status

  const totalItems = basket.reduce((sum, item: BasketItem) => sum + item.quantity, 0);
  const totalPrice = basket.reduce((sum, item: BasketItem) => {
    const price =
      item.plan.is_promotion && item.plan.promotion_price
        ? item.plan.promotion_price
        : item.plan.price;
    return sum + price * item.quantity;
  }, 0);

  const discountedPrice = totalPrice * (1 - promoDiscount / 100);
  const currency = basket.length > 0 ? basket[0].plan.currency || 'USD' : 'USD';

  // Memoize the fetchPaymentIntent function with minimal dependencies
  const fetchPaymentIntent = useCallback(
    async (amount: number, currency: string, totalItems: number, basket: BasketItem[]) => {
      try {
        console.log('Fetching Payment Intent...');
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
          throw new Error('Failed to create Payment Intent');
        }

        const data = await res.json();
        setClientSecret(data.client_secret);
        setPaymentIntentId(data.id);
        // Store clientSecret and paymentIntentId in localStorage for PaymentForm to access
        window.localStorage.setItem('clientSecret', data.client_secret);
        window.localStorage.setItem('paymentIntentId', data.id);
        hasFetchedIntentRef.current = true; // Mark as fetched
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
    if (hasFetchedIntentRef.current) return; // Prevent re-fetching if already fetched

    console.log('useEffect triggered:', { basketLength: basket.length });
    fetchPaymentIntent(discountedPrice, currency, totalItems, basket);
  }, [basket, fetchPaymentIntent, discountedPrice, currency, totalItems]);

  const handlePromoCodeApply = () => {
    // Mock promo code logic (replace with actual API call to validate promo code)
    if (promoCode.toLowerCase() === 'discount10') {
      setPromoApplied(true);
      setPromoDiscount(10); // 10% discount
      setPromoError(null);
      // Reset the Payment Intent to reflect the new discounted price
      hasFetchedIntentRef.current = false;
      setClientSecret(null);
      setPaymentIntentId(null);
    } else {
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoError('Invalid promo code');
      // Reset the Payment Intent to reflect the original price
      hasFetchedIntentRef.current = false;
      setClientSecret(null);
      setPaymentIntentId(null);
    }
  };

  if (paymentSucceeded) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center">
        <ProgressBar stage={3} />
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <ProgressBar stage={3} />
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
          Checkout
        </h1>
        <button
          onClick={() => setShowOrderSummary(!showOrderSummary)}
          className="text-sky-600 hover:text-sky-700 text-sm font-medium"
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
            <div className="space-y-6 mb-8">
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

          <div className="bg-gray-100 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-gray-900">
                  {currency}
                </span>
                <span className="text-base font-bold text-gray-900">
                  {discountedPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {promoDiscount > 0 && (
              <p className="text-green-500 text-sm mb-2">
                Discount Applied: {promoDiscount}% off
              </p>
            )}

            {error && (
              <div className="mb-4 text-red-500 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Promo Code */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Promo Code</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-sky-600 focus:ring-1 focus:ring-sky-600"
                  placeholder="Enter promo code (e.g., DISCOUNT10)"
                />
                <button
                  type="button"
                  onClick={handlePromoCodeApply}
                  className="py-2 px-4 text-sm font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors duration-200"
                >
                  Apply
                </button>
              </div>
              {promoError && (
                <div className="mt-2 text-red-500 text-sm font-medium">{promoError}</div>
              )}
              {promoApplied && (
                <div className="mt-2 text-green-500 text-sm font-medium">
                  Promo code applied! 10% discount.
                </div>
              )}
            </div>

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
                />
              </Elements>
            )}
          </div>
        </>
      )}
    </div>
  );
}