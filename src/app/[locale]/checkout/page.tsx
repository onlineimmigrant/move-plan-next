// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useBasket, BasketItem } from '../../../context/BasketContext';
import ProgressBar from '../../../components/product/ProgressBar';
import BasketItemComponent from '@/components/product/BasketItem';
import { HiShoppingBag } from 'react-icons/hi';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../../../components/product/PaymentForm';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useProductTranslations } from '../../../components/product/useProductTranslations';

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
  const { t } = useProductTranslations();
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          {/* Header Section with enhanced styling */}
          <div className="rounded-3xl shadow-lg border border-gray-200 p-6 mb-8 backdrop-blur-sm bg-white/95">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                  <HiShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.paymentSuccessful}</h1>
                  <p className="text-sm text-gray-600 mt-1">{t.transactionCompleted}</p>
                </div>
              </div>
            </div>
          </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8 mt-8">
          <div className="p-6 bg-gradient-to-br from-emerald-100 to-sky-100 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {t.paymentSuccessful}
          </h1>
          <p className="text-gray-600 text-base mb-2 leading-relaxed">
            {t.thankYouForPurchase}
          </p>
          <p className="text-gray-600 text-base mb-8 font-semibold">
            {t.amountPaid} {finalCurrency} {finalAmount.toFixed(2)}
          </p>
          <Link href="/products">
            <span className="text-sky-600 hover:text-sky-700 text-sm font-semibold inline-block transition-colors duration-200 bg-sky-50 hover:bg-sky-100 px-6 py-3 rounded-full border border-sky-200 hover:border-sky-300">
              {t.continueShopping} →
            </span>
          </Link>
        </div>
        <div className="mt-8">
          <ProgressBar stage={3} />
        </div>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section with enhanced styling */}
          <div className="rounded-3xl shadow-lg border border-gray-200 p-6 mb-8 backdrop-blur-sm bg-white/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl shadow-lg">
                  <HiShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.checkout}</h1>
                  <p className="text-sm text-gray-600 mt-1">{t.loadingOrderDetails}</p>
                </div>
              </div>
              <button
                className="flex items-center space-x-2 px-4 py-2.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-all duration-200 border border-sky-200 hover:border-sky-300"
                disabled
              >
                <span className="text-sm font-medium">{t.showOrderSummary}</span>
              </button>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6 mt-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-0">
              <h2 className="text-sm font-semibold text-gray-900">{t.loadingEllipsis}</h2>
            </div>
          </div>
          <div className="mt-8">
            <ProgressBar stage={2} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section with enhanced styling */}
        <div className="rounded-3xl shadow-lg border border-gray-200 p-6 mb-8 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-sky-500 to-sky-600 rounded-2xl shadow-lg">
                <HiShoppingBag className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.checkout}</h1>
                <p className="text-sm text-gray-600 mt-1">{t.reviewAndCompleteOrder}</p>
              </div>
            </div>
            <button
              onClick={() => setShowOrderSummary(!showOrderSummary)}
              className="flex items-center space-x-2 px-4 py-2.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-xl transition-all duration-200 border border-sky-200 hover:border-sky-300"
            >
              <span className="text-sm font-medium">
                {showOrderSummary ? t.hideOrderSummary : t.showOrderSummary}
              </span>
            </button>
          </div>
        </div>

      {basket.length === 0 ? (
        <div className="text-center py-12 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 mt-6 max-w-2xl mx-auto">
          <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
            <HiShoppingBag className="w-12 h-12 text-gray-500" />
          </div>
          <p className="text-gray-600 text-base mb-6">{t.cartEmpty}</p>
          <Link href="/products">
            <span className="text-sky-600 hover:text-sky-700 text-sm font-semibold mt-4 inline-block transition-colors duration-200 bg-sky-50 hover:bg-sky-100 px-6 py-3 rounded-full border border-sky-200 hover:border-sky-300">
              {t.startShopping} →
            </span>
          </Link>
        </div>
      ) : (
        <>
          {showOrderSummary && (
            <div className="space-y-4 mt-6 bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6 max-w-2xl mx-auto">
              <h3 className="font-bold text-gray-900 mb-4">{t.orderItems}</h3>
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

          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 mt-6 mb-6 p-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {t.orderTotal} ({totalItems} {totalItems === 1 ? t.item : t.items})
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold text-gray-900 uppercase">
                  {currency}
                </span>
                <span className="text-3xl font-bold text-gray-900">
                  {discountedAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {promoDiscount > 0 && (
              <div className="mb-4 p-3 bg-sky-50 rounded-xl border border-sky-200">
                <p className="text-center font-semibold text-sky-700 text-sm">
                  🎉 {t.discountApplied}: {promoDiscount.toFixed(2)}% {t.off}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 rounded-xl border border-red-200">
                <p className="text-red-600 text-sm font-semibold text-center">{error}</p>
              </div>
            )}
            <div className="mt-4">
              {paymentIntentLoading ? (
                <div className="text-center text-gray-600 py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-4"></div>
                  <p>{t.loadingPaymentDetails}</p>
                </div>
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
                <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl">
                  <p className="font-semibold">⚠️ {t.failedToLoadPaymentDetails}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
        <div className="mt-8">
          <ProgressBar stage={2} />
        </div>
      </div>
    </div>
  );
}