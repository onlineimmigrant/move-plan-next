// app/checkout/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef, memo, lazy, Suspense } from 'react';
import { useBasket, BasketItem } from '../../../context/BasketContext';
import BasketItemComponent from '@/components/product/BasketItem';
import { HiShoppingBag } from 'react-icons/hi';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/ui/Button';
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
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { fetchWithRetry } from '@/lib/retry';
import { getCurrencySymbol } from '@/utils/pricingUtils';
import { useSettings } from '@/context/SettingsContext';
import LocalizedLink from '@/components/LocalizedLink';

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
  const { settings } = useSettings();
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
  const networkInfo = useNetworkStatus();
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

  // Using useNetworkStatus hook; no manual listeners needed here.

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
          // Treat "no rows" and similar as benign; avoid noisy empty error logs
          const benignStatuses = new Set([404, 406]);
          const benignCodes = new Set(['PGRST116']); // PostgREST no rows
          const isBenign = benignStatuses.has((error as any).status) || benignCodes.has((error as any).code);
          if (!isBenign) {
            console.warn('Could not fetch user email', {
              code: (error as any).code,
              status: (error as any).status,
              message: (error as any).message || 'Unknown error',
            });
          }
          return;
        }

        if (data?.email && !isSubmittingRef.current) {
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
        const p: any = item.plan || {};
        const baseUnit = typeof p.computed_price === 'number' ? p.computed_price : ((p.price ?? 0) / 100);
        const isRecurring = (p.type || p.recurring_interval) ? true : false;
        let unit = baseUnit;
        if (item.billingCycle === 'annual' && isRecurring) {
          const commitmentMonths = p.commitment_months || 12;
          const discountRaw = p.annual_size_discount;
          let multiplier = 1;
          if (typeof discountRaw === 'number') {
            if (discountRaw > 1) multiplier = (100 - discountRaw) / 100; else if (discountRaw > 0 && discountRaw <= 1) multiplier = discountRaw;
          }
          unit = baseUnit * commitmentMonths * multiplier;
        } else if (typeof p.computed_price !== 'number') {
          const cents = (p.is_promotion && typeof p.promotion_price === 'number') ? p.promotion_price : p.price;
          unit = (cents || 0) / 100;
        }
        return sum + unit * item.quantity;
      }, 0)
    : 0;

  useEffect(() => {
    if (isMounted && !isSubmittingRef.current) {
      setDiscountedAmount(totalPrice);
    }
  }, [isMounted, totalPrice]);

  const currency = isMounted && basket.length > 0 ? basket[0].plan.currency || 'GBP' : 'GBP';

  // Check if basket has recurring items
  const hasRecurringItems = isMounted && basket.some(item => {
    const plan: any = item.plan || {};
    return plan.type === 'recurring';
  });

  // Use centralized fetchWithRetry

  const managePaymentIntent = useCallback(
    async (email?: string, isCustomerUpdateOnly: boolean = false) => {
      if (!isMounted || basket.length === 0 || isProcessingRef.current) return;

      // Check if basket contains subscription/recurring items
      const hasRecurringItems = basket.some(item => {
        const plan: any = item.plan || {};
        return plan.type === 'recurring';
      });

      // For subscription items, create subscription instead of payment intent
      if (hasRecurringItems) {
        const effectiveEmail = email || customerEmail;
        
        // Email is required for subscriptions
        // If no email provided yet, skip creation silently (will be created on form submission)
        if (!effectiveEmail) {
          console.log('No email yet - subscription will be created when user submits payment');
          isProcessingRef.current = false;
          return;
        }
        
        // Prevent duplicate subscription creation
        if (clientSecret || paymentIntentId) {
          console.log('Subscription already created, skipping');
          isProcessingRef.current = false;
          return;
        }
        
        console.log('Basket contains recurring items, creating subscription with email:', effectiveEmail);
        isProcessingRef.current = true;
        setPaymentIntentLoading(true);
        setError(null);
        
        try {
          const response = await fetchWithRetry('/api/create-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              basketItems: basket,
              customerEmail: effectiveEmail,
            }),
          });

          if (!response.clientSecret) {
            throw new Error('No client secret returned from subscription creation');
          }

          console.log('Subscription created, client secret obtained');
          setClientSecret(response.clientSecret);
          // Store the payment intent ID (not subscription ID) for verification
          setPaymentIntentId(response.paymentIntentId || response.subscriptionId);
        } catch (err: any) {
          console.error('Failed to create subscription:', err);
          setError(err.message || 'Failed to create subscription');
        } finally {
          setPaymentIntentLoading(false);
          isProcessingRef.current = false;
        }
        return;
      }

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

        const data = await fetchWithRetry(
          '/api/create-payment-intent',
          {
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
                      billing_cycle: item.billingCycle || 'monthly',
                    }))
                ),
              },
              promoCodeId: promoCodeId || undefined,
              paymentIntentId: paymentIntentId || undefined,
              customerEmail: email || undefined,
              isCustomerUpdateOnly,
            }),
          },
          { retries: 3, baseDelayMs: 600 }
        );
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
        const offline = typeof navigator !== 'undefined' && !navigator.onLine;
        if (offline) {
          setError('You appear to be offline. Please reconnect and try again.');
        } else {
          setError(err.message || 'Failed to initialize payment');
        }
      } finally {
        if (!isCustomerUpdateOnly) {
          setPaymentIntentLoading(false);
        }
        isProcessingRef.current = false;
      }
    },
    [isMounted, basket, totalItems, totalPrice, currency, promoCodeId, paymentIntentId]
  );

  // Initial payment intent creation
  useEffect(() => {
    console.log('[Effect] Initial payment intent check:', {
      isMounted,
      basketLength: basket.length,
      hasFetchedIntent: hasFetchedIntentRef.current,
      isProcessing: isProcessingRef.current,
      hasRecurringItems,
      customerEmail: !!customerEmail,
      clientSecret: !!clientSecret,
      paymentIntentId,
    });
    
    if (!isMounted || basket.length === 0 || hasFetchedIntentRef.current || isProcessingRef.current) {
      return;
    }
    
    // Skip if we already have a client secret or payment intent
    if (clientSecret || paymentIntentId) {
      console.log('[Effect] Already have payment details, skipping');
      hasFetchedIntentRef.current = true;
      return;
    }

    // For recurring items WITHOUT authenticated email, skip initial creation
    // The subscription will be created when user enters email and clicks pay
    if (hasRecurringItems && !customerEmail) {
      console.log('[Effect] Subscription requires email - will be created when user submits payment');
      // Set flag to prevent re-running this effect
      hasFetchedIntentRef.current = true;
      return;
    }

    console.log('[Effect] Creating payment intent/subscription');
    hasFetchedIntentRef.current = true;
    managePaymentIntent(customerEmail || undefined);
  }, [isMounted, basket.length, hasRecurringItems, customerEmail, clientSecret, paymentIntentId]);

  // Update payment intent when promoCodeId changes (for regular payments only)
  useEffect(() => {
    if (!isMounted || basket.length === 0 || hasRecurringItems || isProcessingRef.current) {
      return;
    }

    // Only update if we already have a payment intent and customer email
    if (paymentIntentId && customerEmail && hasFetchedIntentRef.current) {
      console.log('Updating payment intent with promo code');
      managePaymentIntent(customerEmail, true);
    }
  }, [promoCodeId]);

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
    try {
      if (paymentIntentId) {
        // First, finalize subscription if this is a subscription payment
        console.log('Finalizing subscription payment...');
        const finalizeResponse = await fetch('/api/finalize-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId }),
        });
        
        if (finalizeResponse.ok) {
          const finalizeResult = await finalizeResponse.json();
          console.log('Subscription finalized:', finalizeResult);
        } else {
          const finalizeError = await finalizeResponse.json().catch(() => ({}));
          console.warn('Subscription finalization failed (may not be a subscription):', finalizeError);
        }
        
        // Then verify payment intent for amount details
        const response = await fetch(`/api/verify-payment-intent?session_id=${paymentIntentId}`, {
          method: 'POST',
        });
        const rawText = await response.text().catch(() => '');
        let result: any = {};
        try {
          result = rawText ? JSON.parse(rawText) : {};
        } catch (e) {
          console.error('Invalid JSON from /api/verify-payment-intent:', rawText);
        }
        console.log('Payment intent verification result:', result);
        if (response.ok) {
          setFinalAmount((result.amount || 0) / 100);
          setFinalCurrency(((result.currency as string) || '').toUpperCase());
        } else {
          const errorMessage = (result && (result.error || result.message)) || response.statusText || `HTTP ${response.status}`;
          console.error('Failed to verify payment intent:', errorMessage);
          setFinalAmount(discountedAmount);
          setFinalCurrency((currency || '').toUpperCase());
        }
      } else {
        setFinalAmount(discountedAmount);
        setFinalCurrency((currency || '').toUpperCase());
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
    } finally {
      // Only now turn off loading state after everything completes
      setIsLoading(false);
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

  // Fire confetti when payment succeeds (must not call hooks conditionally)
  useEffect(() => {
    if (!paymentSucceeded) return;
    const timer = setTimeout(() => {
      fireConfetti();
    }, 300);
    return () => clearTimeout(timer);
  }, [paymentSucceeded, fireConfetti]);

  if (paymentSucceeded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Logo Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200/30">
          <div className="max-w-4xl mx-auto">
            <LocalizedLink href="/" className="inline-block">
              {settings?.image ? (
                <Image
                  src={settings.image}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="h-8 w-auto"
                  priority={true}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                  sizes="48px"
                  quality={90}
                />
              ) : (
                <span className="text-xl font-semibold text-gray-900">{settings?.company_name || 'Store'}</span>
              )}
            </LocalizedLink>
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="rounded-3xl shadow-lg border border-gray-200/30 mb-8 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
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
        <div className="backdrop-blur-sm rounded-2xl border border-gray-200/30 p-8 mt-8" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className={`p-6 bg-gradient-to-br from-emerald-100 to-${primary.bgLighter} rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner`}>
            <span className="text-4xl">🎉</span>
          </div>
          {/* Success heading already shown above; avoid repeating here */}
          <p className="text-gray-600 text-base mb-2 leading-relaxed">
            {t.thankYouForPurchase}
          </p>
          <p className="text-gray-600 text-base mb-8 font-semibold">
            {t.amountPaid}
            {' '}
            {getCurrencySymbol((finalCurrency || '').toUpperCase())}
            <AnimatedCounter value={finalAmount} decimals={2} />
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Logo Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-gray-200/30">
          <div className="max-w-7xl mx-auto">
            <LocalizedLink href="/" className="inline-block">
              {settings?.image ? (
                <Image
                  src={settings.image}
                  alt="Logo"
                  width={48}
                  height={48}
                  className="h-8 w-auto"
                  priority={true}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                  sizes="48px"
                  quality={90}
                />
              ) : (
                <span className="text-xl font-semibold text-gray-900">{settings?.company_name || 'Store'}</span>
              )}
            </LocalizedLink>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl shadow-lg border border-gray-200/30 mb-8 backdrop-blur-sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            {/* Header Content */}
            <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 bg-gradient-to-br from-${primary.bg} to-${primary.bgActive} rounded-2xl shadow-lg`}>
                  <HiShoppingBag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.checkout}</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    {t.loadingOrderDetails} <span className="text-gray-400">· {t.nextPayment}</span>
                  </p>
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
          <div className="backdrop-blur-sm rounded-3xl border border-gray-200/30 p-6 mt-6 max-w-2xl mx-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex justify-between items-center mb-0">
              <h2 className="text-sm font-semibold text-gray-900">{t.loadingEllipsis}</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Logo Header */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 border-b border-gray-200/30">
        <div className="max-w-7xl mx-auto">
          <LocalizedLink href="/" className="inline-block">
            {settings?.image ? (
              <Image
                src={settings.image}
                alt="Logo"
                width={48}
                height={48}
                className="h-8 w-auto"
                priority={true}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                sizes="48px"
                quality={90}
              />
            ) : (
              <span className="text-xl font-semibold text-gray-900">{settings?.company_name || 'Store'}</span>
            )}
          </LocalizedLink>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-8">
      {basket.length === 0 ? (
        <div className="text-center py-12 backdrop-blur-sm rounded-2xl border border-gray-200/30 mt-6 max-w-2xl mx-auto relative overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
          <div className="relative z-10">
          <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-inner">
            <HiShoppingBag className="w-12 h-12 text-gray-500" />
          </div>
          <p className="text-gray-600 text-base mb-6">{t.cartEmpty}</p>
          <Link href="/products" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="mt-4 rounded-full w-full sm:w-auto">
              {t.startShopping} →
            </Button>
          </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column: Header + Order Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Header Section - Mobile: standalone, Desktop: part of left column */}
            <div className="rounded-2xl border border-gray-200/30 backdrop-blur-sm relative overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                {/* Header Content */}
                <div className="p-3 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`p-2 bg-gradient-to-br from-${primary.bg} to-${primary.bgActive} rounded-xl shadow-md flex-shrink-0`}>
                        <HiShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight truncate">{t.checkout}</h1>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          {t.reviewAndCompleteOrder} <span className="text-gray-400">· {t.nextPayment}</span>
                        </p>
                      </div>
                    </div>
                    <Link href="/products" className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="rounded-xl w-full sm:w-auto">
                        {t.continueShopping} →
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl border border-gray-200/30 p-3 sm:p-5" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
              <div className="relative z-10">
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4">{t.orderItems}</h3>
                <div className="space-y-3">
                  {basket
                    .filter((item): item is BasketItem & { plan: { id: number } } => item.plan.id !== undefined)
                    .map((item, index) => (
                      <div key={item.plan.id} className={index > 0 ? 'border-t border-gray-200 pt-4' : ''}>
                        <BasketItemComponent
                          item={item}
                          updateQuantity={updateQuantity}
                          removeFromBasket={removeFromBasket}
                          associatedFeatures={[]}
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Total & Payment */}
          <div className="relative overflow-hidden backdrop-blur-sm rounded-2xl border border-gray-200/30 p-3 lg:sticky lg:top-24" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0 mb-5">
                <h2 className="font-bold text-gray-900 tracking-tight">
                  {t.orderTotal} <span className="text-gray-400">•</span> {totalItems} {totalItems === 1 ? t.item : t.items}
                </h2>
                <div className="flex items-center justify-center sm:justify-end space-x-2" aria-live="polite" aria-atomic="true">
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
                ) : hasRecurringItems && !customerEmail ? (
                  <div className="backdrop-blur-sm p-4 rounded-2xl border border-gray-200/30 relative overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                    <div className="relative z-10">
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const email = formData.get('email') as string;
                        if (email) {
                          setPaymentIntentLoading(true);
                          await managePaymentIntent(email, false);
                          setPaymentIntentLoading(false);
                        }
                      }}>
                        <div className="mb-4">
                          <label htmlFor="subscription-email" className="block text-sm font-semibold text-gray-900 mb-2">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            id="subscription-email"
                            name="email"
                            type="email"
                            required
                            className="w-full py-2.5 px-3 rounded-2xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none transition-colors duration-200 border border-gray-200/30"
                            style={{ 
                              backgroundColor: 'rgba(255, 255, 255, 0.05)'
                            }}
                            placeholder="your@email.com"
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="start"
                          className="w-full"
                          disabled={paymentIntentLoading}
                        >
                          {paymentIntentLoading ? 'Processing...' : 'Continue to Payment'}
                        </Button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl">
                    <p className="font-semibold mb-3">⚠️ {t.failedToLoadPaymentDetails}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => managePaymentIntent(customerEmail || undefined, false)}
                      aria-label="Retry loading payment details"
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </div>
              {!networkInfo.isOnline && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                  <p className="text-yellow-700 text-sm font-medium" role="status" aria-live="polite">You are offline. Some actions are disabled until you reconnect.</p>
                </div>
              )}
              <div className="mt-3 text-center">
                <p className="text-xs text-gray-500">
                  All prices in
                  <span className={`ml-1 inline-block px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-${primary.bgLighter} text-${primary.text} border border-${primary.border} align-middle`}>
                    {(currency || 'GBP').toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}