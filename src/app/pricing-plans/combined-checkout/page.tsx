'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useBasket } from '../../../context/BasketContext';
import { HiTrash } from 'react-icons/hi';
import ProgressBar from '../../../components/ProgressBar';
import BasketItem from '../../../components/BasketItem';
import { supabase } from '../../../lib/supabaseClient';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../../../components/PaymentForm';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

// Load Stripe with your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Feature {
  id: number;
  name: string;
  feature_image?: string;
  content: string;
  slug: string;
}

interface FeatureResponse {
  feature_id: number;
  feature: {
    id: number;
    name: string;
    feature_image?: string;
    content: string;
    slug: string;
  }[];
}

export default function CombinedCheckoutPage() {
  const { basket, updateQuantity, removeFromBasket, clearBasket } = useBasket();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featuresMap, setFeaturesMap] = useState<{ [key: number]: Feature[] }>({});
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const hasFetchedIntentRef = useRef(false);

  // Generate or retrieve a unique checkout session ID
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = window.localStorage.getItem('checkoutSessionId');
    if (!sessionId) {
      const newSessionId = uuidv4();
      window.localStorage.setItem('checkoutSessionId', newSessionId);
      setCheckoutSessionId(newSessionId);
    } else {
      setCheckoutSessionId(sessionId);
    }
  }, []);

  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = basket.reduce((sum, item) => {
    const price = item.plan.is_promotion && item.plan.promotion_price
      ? item.plan.promotion_price
      : item.plan.price;
    return sum + price * item.quantity;
  }, 0);

  const currency = basket.length > 0 ? basket[0].plan.currency || 'USD' : 'USD';

  // Fetch associated features for each pricing plan in the basket
  useEffect(() => {
    const fetchFeatures = async () => {
      const newFeaturesMap: { [key: number]: Feature[] } = {};
      for (const item of basket) {
        if (item.plan.id === undefined) {
          console.warn('Skipping item with undefined plan.id:', item);
          continue;
        }
        const { data: featuresData, error: featuresError } = await supabase
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

        if (featuresError) {
          console.error('Error fetching features for plan', item.plan.id, featuresError);
          newFeaturesMap[item.plan.id] = [];
        } else {
          newFeaturesMap[item.plan.id] = featuresData
            ? featuresData
                .flatMap((dataItem: FeatureResponse) =>
                  dataItem.feature.map((feature): Feature | null =>
                    feature && feature.id
                      ? {
                          id: feature.id,
                          name: feature.name,
                          feature_image: feature.feature_image,
                          content: feature.content,
                          slug: feature.slug,
                        }
                      : null
                  )
                )
                .filter((feature): feature is Feature => feature !== null)
            : [];
        }
      }
      setFeaturesMap(newFeaturesMap);
    };

    if (basket.length > 0) {
      fetchFeatures();
    }
  }, [basket]);

  // Fetch the Payment Intent client secret when the page loads
  const fetchPaymentIntent = useCallback(
    async (amount: number, currency: string, totalItems: number, basket: any[], sessionId: string) => {
      try {
        console.log('Fetching Payment Intent for session:', sessionId);
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
                    quantity: item.quantity,
                  }))
              ),
              checkout_session_id: sessionId,
            },
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to create Payment Intent');
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

  useEffect(() => {
    if (!checkoutSessionId) return;

    const existingPaymentIntentId = window.localStorage.getItem('paymentIntentId');
    const existingClientSecret = window.localStorage.getItem('clientSecret');
    const storedSessionId = window.localStorage.getItem('checkoutSessionId');

    if (existingPaymentIntentId && existingClientSecret && storedSessionId === checkoutSessionId) {
      console.log('Using existing Payment Intent:', existingPaymentIntentId);
      setPaymentIntentId(existingPaymentIntentId);
      setClientSecret(existingClientSecret);
      hasFetchedIntentRef.current = true;
      return;
    }

    if (basket.length === 0) return;
    if (hasFetchedIntentRef.current) return;

    console.log('useEffect triggered:', { basketLength: basket.length, sessionId: checkoutSessionId });
    fetchPaymentIntent(totalPrice, currency, totalItems, basket, checkoutSessionId);
  }, [basket, fetchPaymentIntent, checkoutSessionId, totalPrice]);

  const handleSuccess = () => {
    clearBasket();
    window.localStorage.removeItem('clientSecret');
    window.localStorage.removeItem('paymentIntentId');
    window.localStorage.removeItem('checkoutSessionId');
    hasFetchedIntentRef.current = false;
    router.push(`/success?payment_intent=${paymentIntentId}`);
  };

  if (paymentSucceeded) {
    router.push(`/success?payment_intent=${paymentIntentId}`);
    return null;
  }

  return (
    <div>
      <div className="md:hidden">
        <ProgressBar stage={3} />
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Checkout
          </h1>
          {basket.length > 0 && (
            <button
              onClick={clearBasket}
              className="text-red-700 hover:text-red-800 text-sm font-medium flex items-center gap-2 transition-colors duration-200"
            >
              <HiTrash className="w-5 h-5" />
              Clear Basket
            </button>
          )}
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
          <div className="space-y-6">
            {basket.map((item) => (
              <BasketItem
                key={item.plan.id}
                item={item}
                updateQuantity={updateQuantity}
                removeFromBasket={removeFromBasket}
                associatedFeatures={featuresMap[item.plan.id] || []}
              />
            ))}

            <div className="bg-gray-100 rounded-lg p-6 mt-6">
              {error && (
                <div className="mb-4 text-red-500 text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-gray-900">
                  Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                </h2>
                <div className="flex items-center space-x-2">
                  <span className="text-base font-semibold text-gray-900">
                    {currency}
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    onSuccess={handleSuccess}
                    onError={setError}
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </Elements>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}