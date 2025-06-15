// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useBasket, BasketItem } from '../../context/BasketContext';
import ProgressBar from '../../components/product/ProgressBar';
import BasketItemComponent from '@/components/product/BasketItem';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../../components/product/PaymentForm';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Isolate Elements in a separate component to prevent re-renders
const PaymentFormWrapper = memo(
  ({
    clientSecret,
    onSuccess,
    onError,
    isLoading,
    setIsLoading,
    totalPrice,
    setPromoDiscount,
    setPromoCodeId,
    resetPaymentIntent,
    setDiscountedAmount,
    customerEmail,
    setCustomerEmail,
    updatePaymentIntentWithEmail,
  }: {
    clientSecret: string;
    onSuccess: () => void;
    onError: (error: string) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    totalPrice: number;
    setPromoDiscount: (discount: number) => void;
    setPromoCodeId: (id: string | null) => void;
    resetPaymentIntent: () => void;
    setDiscountedAmount: (amount: number) => void;
    customerEmail: string | null;
    setCustomerEmail: (email: string | null) => void;
    updatePaymentIntentWithEmail: (email?: string, isCustomerUpdateOnly?: boolean) => Promise<void>;
  }) => {
    console.log('PaymentFormWrapper rendered with clientSecret:', clientSecret);
    return (
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
        }}
      >
        <PaymentForm
          onSuccess={onSuccess}
          onError={onError}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          totalPrice={totalPrice}
          setPromoDiscount={setPromoDiscount}
          setPromoCodeId={setPromoCodeId}
          resetPaymentIntent={resetPaymentIntent}
          setDiscountedAmount={setDiscountedAmount}
          customerEmail={customerEmail}
          setCustomerEmail={setCustomerEmail}
          updatePaymentIntentWithEmail={updatePaymentIntentWithEmail}
        />
      </Elements>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.clientSecret === nextProps.clientSecret &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.totalPrice === nextProps.totalPrice &&
      prevProps.customerEmail === nextProps.customerEmail &&
      prevProps.onSuccess === nextProps.onSuccess &&
      prevProps.onError === nextProps.onError &&
      prevProps.setIsLoading === nextProps.setIsLoading &&
      prevProps.setPromoDiscount === nextProps.setPromoDiscount &&
      prevProps.setPromoCodeId === nextProps.setPromoCodeId &&
      prevProps.resetPaymentIntent === nextProps.resetPaymentIntent &&
      prevProps.setDiscountedAmount === nextProps.setDiscountedAmount &&
      prevProps.setCustomerEmail === nextProps.setCustomerEmail &&
      prevProps.updatePaymentIntentWithEmail === nextProps.updatePaymentIntentWithEmail
    );
  }
);

PaymentFormWrapper.displayName = 'PaymentFormWrapper';

export default function CheckoutPage() {
  const { basket, updateQuantity, removeFromBasket, clearBasket } = useBasket();
  const { session } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentIntentLoading, setPaymentIntentLoading] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
  const [showOrderSummary, setShowOrderSummary] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeId, setPromoCodeId] = useState<string | null>(null);
  const [discountedAmount, setDiscountedAmount] = useState<number>(0);
  const [finalAmount, setFinalAmount] = useState<number>(0);
  const [finalCurrency, setFinalCurrency] = useState<string>('GBP');
  const [isMounted, setIsMounted] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const hasFetchedIntentRef = useRef(false);
  const isProcessingRef = useRef(false);
  const initialClientSecretRef = useRef<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Log clientSecret changes
  useEffect(() => {
    console.log('clientSecret updated:', clientSecret);
    if (clientSecret && !initialClientSecretRef.current) {
      initialClientSecretRef.current = clientSecret;
    }
  }, [clientSecret]);

  // Fetch user email if authenticated
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', session.user.id)
          .single();
        if (error) {
          console.error('Error fetching user email:', error);
        } else if (data && data.email && !isSubmittingRef.current) {
          setCustomerEmail(data.email);
        }
      }
    };

    fetchUserEmail();
  }, [session]);

  const totalItems = isMounted
    ? basket.reduce((sum, item: BasketItem) => sum + item.quantity, 0)
    : 0;
  const totalPrice = isMounted
    ? basket.reduce((sum, item: BasketItem) => {
        const price =
          item.plan.is_promotion && item.plan.promotion_price
            ? item.plan.promotion_price
            : item.plan.price;
        return sum + (price || 0) * item.quantity / 100;
      }, 0)
    : 0;

  useEffect(() => {
    if (isMounted && !isSubmittingRef.current) {
      setDiscountedAmount(totalPrice);
    }
  }, [isMounted, totalPrice]);

  const currency = isMounted && basket.length > 0 ? basket[0].plan.currency || 'GBP' : 'GBP';

  const managePaymentIntent = useCallback(
    async (email?: string, isCustomerUpdateOnly: boolean = false) => {
      if (!isMounted || basket.length === 0 || isProcessingRef.current) return;

      isProcessingRef.current = true;
      if (!isCustomerUpdateOnly) {
        setPaymentIntentLoading(true);
      }

      try {
        console.log('Managing Payment Intent...', {
          amount: totalPrice,
          currency,
          totalItems,
          promoCodeId,
          paymentIntentId,
          customerEmail: email,
          isCustomerUpdateOnly,
        });

        const res = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Math.round(totalPrice * 100),
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
            promoCodeId: promoCodeId || undefined,
            paymentIntentId: paymentIntentId || undefined,
            customerEmail: email || undefined,
            isCustomerUpdateOnly,
          }),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Failed to process Payment Intent: ${res.status} ${errorText}`);
        }

        const data = await res.json();
        console.log('Payment Intent response:', data);

        if (!isCustomerUpdateOnly) {
          if (!initialClientSecretRef.current || promoCodeId) {
            setClientSecret(data.client_secret);
            setPaymentIntentId(data.id);
            initialClientSecretRef.current = data.client_secret;
          }
          setDiscountedAmount(data.discountedAmount || totalPrice);
          setPromoDiscount(data.discountPercent || 0);
          window.localStorage.setItem('clientSecret', data.client_secret);
          window.localStorage.setItem('paymentIntentId', data.id);
        }
      } catch (err: any) {
        console.error('Error processing Payment Intent:', err);
        setError(err.message || 'Failed to initialize payment');
      } finally {
        if (!isCustomerUpdateOnly) {
          setPaymentIntentLoading(false);
        }
        isProcessingRef.current = false;
      }
    },
    [isMounted, basket, totalItems, totalPrice, currency, promoCodeId, paymentIntentId]
  );

  // Initial payment intent creation (remove session.user.id dependency)
  useEffect(() => {
    if (!isMounted || basket.length === 0 || hasFetchedIntentRef.current) {
      console.log('Skipping initial payment intent creation due to conditions:', {
        isMounted,
        basketLength: basket.length,
        hasFetchedIntent: hasFetchedIntentRef.current,
      });
      return;
    }

    hasFetchedIntentRef.current = true;
    managePaymentIntent(); // Create payment intent without customerEmail initially
  }, [isMounted, basket, managePaymentIntent]);

  // Update payment intent when promoCodeId or customerEmail changes
  useEffect(() => {
    if (!isMounted || basket.length === 0 || !paymentIntentId || !customerEmail) {
      console.log('Skipping payment intent update due to conditions:', {
        isMounted,
        basketLength: basket.length,
        paymentIntentId,
        customerEmail,
      });
      return;
    }

    managePaymentIntent(customerEmail, true);
  }, [promoCodeId, paymentIntentId, customerEmail, managePaymentIntent, isMounted, basket]);

  useEffect(() => {
    console.log('PromoCodeId state changed:', promoCodeId);
  }, [promoCodeId]);

  const resetPaymentIntent = useCallback(() => {
    console.log('Resetting payment intent');
    setClientSecret(null);
    setPaymentIntentId(null);
    setDiscountedAmount(totalPrice);
    setPromoDiscount(0);
    setPromoCodeId(null);
    initialClientSecretRef.current = null;
    hasFetchedIntentRef.current = false;
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('clientSecret');
      window.localStorage.removeItem('paymentIntentId');
      console.log('Cleared payment data from localStorage');
    }
  }, [totalPrice]);

  const handleSuccess = useCallback(async () => {
    console.log('Payment succeeded, clearing basket and payment data');
    if (paymentIntentId) {
      try {
        const response = await fetch(`/api/verify-payment-intent?session_id=${paymentIntentId}`);
        const result = await response.json();
        console.log('Payment intent verification result:', result);
        if (response.ok) {
          setFinalAmount(result.amount / 100);
          setFinalCurrency(result.currency.toUpperCase());
        } else {
          console.error('Failed to verify payment intent:', result.error);
          setFinalAmount(discountedAmount);
          setFinalCurrency(currency);
        }
      } catch (err) {
        console.error('Error fetching payment intent:', err);
        setFinalAmount(discountedAmount);
        setFinalCurrency(currency);
      }
    } else {
      setFinalAmount(discountedAmount);
      setFinalCurrency(currency);
    }
    setPaymentSucceeded(true);
    clearBasket();
    resetPaymentIntent();
    if (typeof window !== 'undefined') {
      console.log('localStorage after clearing:', {
        basket: localStorage.getItem('basket'),
        clientSecret: localStorage.getItem('clientSecret'),
        paymentIntentId: localStorage.getItem('paymentIntentId'),
      });
    }
  }, [paymentIntentId, discountedAmount, currency, clearBasket, resetPaymentIntent]);

  const setErrorCallback = useCallback((error: string | null) => {
    if (!isSubmittingRef.current) {
      setError(error);
    }
  }, []);

  const setIsLoadingCallback = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const setDiscountedAmountCallback = useCallback((amount: number) => {
    if (!isSubmittingRef.current) {
      setDiscountedAmount(amount);
    }
  }, []);

  const setPromoDiscountCallback = useCallback((discount: number) => {
    setPromoDiscount(discount);
  }, []);

  const setPromoCodeIdCallback = useCallback((id: string | null) => {
    setPromoCodeId(id);
  }, []);

  const setCustomerEmailCallback = useCallback((email: string | null) => {
    if (!isSubmittingRef.current) {
      setCustomerEmail(email);
    }
  }, []);

  const updatePaymentIntentWithEmailCallback = useCallback(
    async (email?: string, isCustomerUpdateOnly: boolean = false) => {
      isSubmittingRef.current = true;
      try {
        await managePaymentIntent(email, isCustomerUpdateOnly);
      } finally {
        isSubmittingRef.current = false;
      }
    },
    [managePaymentIntent]
  );

  if (paymentSucceeded) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 text-center min-h-screen">
        <div className="-mx-8 mt-8 mb-2 sm:mt-10 bg-gray-50 py-4 flex items-center justify-between">
          <h1 className="px-8 text-base md:text-xl font-semibold tracking-tight leading-tight">
            Payment
          </h1>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 my-16">
          Payment Successful!
        </h1>
        <p className="text-gray-600 text-base mb-2">
          Thank you for your purchase. Your payment has been successfully processed.
        </p>
        <p className="text-gray-600 text-base mb-6">
          Amount Paid: {finalCurrency} {finalAmount.toFixed(2)}
        </p>
        <Link href="/products">
          <span className="text-sky-600 hover:text-sky-700 text-sm font-medium inline-block transition-colors duration-200">
            Continue Shopping
          </span>
        </Link>
        <ProgressBar stage={3} />
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="max-w-2xl mx-auto p-8 min-h-screen">
        <div className="-mx-8 mt-8 mb-2 sm:mt-10 bg-gray-50 py-4 flex items-center justify-between">
          <h1 className="px-8 text-base md:text-xl font-semibold tracking-tight leading-tight">
            Checkout
          </h1>
          <button
            className="px-8 text-sky-600 hover:text-sky-700 text-sm font-medium"
            disabled
          >
            Show Order Summary
          </button>
        </div>
        <div className="bg-transparent rounded-lg mt-2 mb-6">
          <div className="flex justify-between items-center mb-0">
            <h2 className="text-sm font-semibold text-gray-900">Loading...</h2>
          </div>
        </div>
        <ProgressBar stage={2} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 min-h-screen">
      <div className="-mx-8 mt-8 mb-2 sm:mt-10 bg-gray-50 py-4 flex items-center justify-between">
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
            <div className="space-y-2">
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

          <div className="bg-transparent rounded-lg mt-2 mb-6">
            <div className="flex justify-between items-center mb-0">
              <h2 className="text-sm font-semibold text-gray-900">
                Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-base font-semibold text-gray-900 uppercase">
                  {currency}
                </span>
                <span className="text-3xl font-bold text-gray-900">
                  {discountedAmount.toFixed(2)}
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
              {paymentIntentLoading ? (
                <div className="text-center text-gray-600">Loading payment details...</div>
              ) : clientSecret ? (
                <PaymentFormWrapper
                  clientSecret={clientSecret}
                  onSuccess={handleSuccess}
                  onError={setErrorCallback}
                  isLoading={isLoading}
                  setIsLoading={setIsLoadingCallback}
                  totalPrice={totalPrice}
                  setPromoDiscount={setPromoDiscountCallback}
                  setPromoCodeId={setPromoCodeIdCallback}
                  resetPaymentIntent={resetPaymentIntent}
                  setDiscountedAmount={setDiscountedAmountCallback}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmailCallback}
                  updatePaymentIntentWithEmail={updatePaymentIntentWithEmailCallback}
                />
              ) : (
                <div className="text-center text-red-500">Failed to load payment details</div>
              )}
            </div>
          </div>
        </>
      )}
      <ProgressBar stage={2} />
    </div>
  );
}