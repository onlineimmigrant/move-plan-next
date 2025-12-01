// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, memo, lazy, Suspense } from 'react';
import { useBasket, BasketItem } from '../../../context/BasketContext';
import ProgressBar from '../../../components/product/ProgressBar';
import BasketItemComponent from '@/components/product/BasketItem';
import { HiShoppingBag } from 'react-icons/hi';
import Link from 'next/link';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/context/AuthContext';
import { useProductTranslations } from '../../../components/product/useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useConfetti } from '@/hooks/useConfetti';
import AnimatedCounter from '@/components/AnimatedCounter';
import { useKeyboardShortcuts, SHORTCUTS } from '@/hooks/useKeyboardShortcuts';
import { useRouter } from 'next/navigation';

// Lazy load PaymentForm for code splitting
const PaymentForm = lazy(() => import('../../../components/product/PaymentForm'));

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch Stripe publishable key dynamically
let stripePromiseCache: Promise<Stripe | null> | null = null;
const getStripePromise = async (): Promise<Stripe | null> => {
  if (!stripePromiseCache) {
    stripePromiseCache = (async () => {
      try {
        const response = await fetch('/api/stripe/publishable-key');
        const { publishableKey } = await response.json();
        return loadStripe(publishableKey);
      } catch (error) {
        console.error('Failed to load Stripe publishable key:', error);
        // Fallback to env var
        return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
      }
    })();
  }
  return stripePromiseCache;
};

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
    const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
    
    useEffect(() => {
      getStripePromise().then(setStripeInstance);
    }, []);
    
    console.log('PaymentFormWrapper rendered with clientSecret:', clientSecret);
    
    if (!stripeInstance) {
      return <div className="text-center py-4">Loading Stripe...</div>;
    }
    
    return (
      <Elements
        stripe={stripeInstance}
        options={{
          clientSecret,
        }}
      >
        <Suspense fallback={
          <div className="text-center py-8 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading payment form...</p>
          </div>
        }>
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
        </Suspense>
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
  const themeColors = useThemeColors();
  const { primary } = themeColors;
  const { fireConfetti } = useConfetti();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentIntentLoading, setPaymentIntentLoading] = useState(false);
  const [paymentSucceeded, setPaymentSucceeded] = useState(false);
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

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...SHORTCUTS.BASKET,
      action: () => router.push('/basket'),
    },
    {
      ...SHORTCUTS.PRODUCTS,
      action: () => router.push('/products'),
    },
  ]);

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
    // Fire confetti on mount
    useEffect(() => {
      const timer = setTimeout(() => {
        fireConfetti();
      }, 300);
      return () => clearTimeout(timer);
    }, [fireConfetti]);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          {/* Header Section with integrated progress bar */}
          <div className="rounded-3xl shadow-lg border border-gray-200 mb-8 backdrop-blur-sm bg-white/95">
            {/* Progress Bar */}
            <div className="border-b border-gray-200/60">
              <ProgressBar stage={3} />
            </div>
            
            {/* Header Content */}
            <div className="p-6">
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
          </div>
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-8 mt-8">
          <div className={`p-6 bg-gradient-to-br from-emerald-100 to-${primary.bgLighter} rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner`}>
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
            {t.paymentSuccessful}
          </h1>
          <p className="text-gray-600 text-base mb-2 leading-relaxed">
            {t.thankYouForPurchase}
          </p>
          <p className="text-gray-600 text-base mb-8 font-semibold">
            {t.amountPaid} {finalCurrency} <AnimatedCounter value={finalAmount} decimals={2} />
          </p>
          <Link href="/products">
            <span className={`text-${primary.text} hover:text-${primary.textHover} text-sm font-semibold inline-block transition-colors duration-200 bg-${primary.bgLighter} hover:bg-${primary.bgLight} px-6 py-3 rounded-full border border-${primary.border} hover:border-${primary.border}`}>
              {t.continueShopping} →
            </span>
          </Link>
        </div>
        </div>
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section with integrated progress bar */}
          <div className="rounded-3xl shadow-lg border border-gray-200 mb-8 backdrop-blur-sm bg-white/95">
            {/* Progress Bar */}
            <div className="border-b border-gray-200/60">
              <ProgressBar stage={2} />
            </div>
            
            {/* Header Content */}
            <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-gradient-to-br from-${primary.bg} to-${primary.bgActive} rounded-2xl shadow-lg`}>
                  <HiShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.checkout}</h1>
                  <p className="text-sm text-gray-600 mt-1">{t.loadingOrderDetails}</p>
                </div>
              </div>
              <button
                className={`flex items-center space-x-2 px-4 py-2.5 text-${primary.text} hover:text-${primary.textHover} hover:bg-${primary.bgLighter} rounded-xl transition-all duration-200 border border-${primary.border} hover:border-${primary.border}`}
                disabled
              >
                <span className="text-sm font-medium">{t.showOrderSummary}</span>
              </button>
            </div>
            </div>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200 p-6 mt-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-0">
              <h2 className="text-sm font-semibold text-gray-900">{t.loadingEllipsis}</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header Section with integrated progress bar */}
        <div className="rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 mb-6 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
          {/* Progress Bar */}
          <div className="border-b border-gray-200/60">
            <ProgressBar stage={2} />
          </div>
          
          {/* Header Content */}
          <div className="p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`p-2 bg-gradient-to-br from-${primary.bg} to-${primary.bgActive} rounded-xl shadow-md flex-shrink-0`}>
                <HiShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{t.checkout}</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{t.reviewAndCompleteOrder}</p>
              </div>
            </div>
          </div>
          </div>
          </div>
        </div>

      {basket.length === 0 ? (
        <div className="text-center py-12 backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-3xl shadow-xl border border-white/40 dark:border-gray-700/40 mt-6 max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
          <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
            <HiShoppingBag className="w-12 h-12 text-gray-500" />
          </div>
          <p className="text-gray-600 text-base mb-6">{t.cartEmpty}</p>
          <Link href="/products">
            <span className={`text-${primary.text} hover:text-${primary.textHover} text-sm font-semibold mt-4 inline-block transition-colors duration-200 bg-${primary.bgLighter} hover:bg-${primary.bgLight} px-6 py-3 rounded-full border border-${primary.border} hover:border-${primary.border}`}>
              {t.startShopping} →
            </span>
          </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-2 mb-6">
          {/* Left Column: Order Items */}
          <div className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 p-3 sm:p-5 space-y-3">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4">{t.orderItems}</h3>
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
          </div>

          {/* Right Column: Order Total & Payment */}
          <div className="relative overflow-hidden backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-md border border-white/40 dark:border-gray-700/40 p-3 sm:p-5 lg:sticky lg:top-24">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-5">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 text-center sm:text-left">
                  {t.orderTotal} ({totalItems} {totalItems === 1 ? t.item : t.items})
                </h2>
                <div className="flex items-center justify-center sm:justify-end space-x-2" aria-live="polite" aria-atomic="true">
                  <span className="text-sm sm:text-base font-bold text-gray-900 uppercase">
                    {currency}
                  </span>
                  {(() => {
                    const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'GBP', minimumFractionDigits: 2 });
                    return (
                      <span className="text-2xl sm:text-3xl font-bold text-gray-900 tabular-nums" data-formatted>
                        {formatter.format(discountedAmount)}
                      </span>
                    );
                  })()}
                  <span className="sr-only">{t.orderTotal}: {discountedAmount}</span>
                </div>
              </div>

              {promoDiscount > 0 && (
                <div className={`mb-4 p-3 bg-${primary.bgLighter} rounded-xl border border-${primary.border}`}>
                  <p className={`text-center font-semibold text-${primary.text} text-sm`}>
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
                    <div className={`inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-${primary.border} mb-4`}></div>
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
          </div>
        </div>
      )}
      </div>
    </div>
  );
}