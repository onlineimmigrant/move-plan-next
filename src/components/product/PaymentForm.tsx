'use client';

import { useState, useEffect, useRef } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';
import Button from '@/ui/Button';
import { useProductTranslations } from './useProductTranslations';

interface PaymentFormProps {
  onSuccess: (email?: string) => void; // Update to accept email parameter
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  totalPrice: number;
  setPromoDiscount: (discount: number) => void;
  setPromoCodeId: (id: string | null) => void;
  resetPaymentIntent: () => void;
  setDiscountedAmount?: (amount: number) => void;
  customerEmail?: string | null;
  setCustomerEmail: (email: string | null) => void;
  updatePaymentIntentWithEmail: (email?: string, isCustomerUpdateOnly?: boolean) => Promise<void>;
}

export default function PaymentForm({
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
}: PaymentFormProps) {
  const stripe = useStripe() as Stripe | null;
  const elements = useElements() as StripeElements | null;
  const { t } = useProductTranslations();
  const [message, setMessage] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [localDiscountPercent, setLocalDiscountPercent] = useState<number>(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [email, setEmail] = useState(customerEmail || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [payBarVisible, setPayBarVisible] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('PaymentForm mounted, elements:', elements);
    // Animate mobile pay bar appearance
    setTimeout(() => setPayBarVisible(true), 50);
    return () => {
      isMountedRef.current = false;
      console.log('PaymentForm unmounted');
    };
  }, [elements]);

  useEffect(() => {
    if (promoApplied) {
      console.log('Promo code applied, waiting for payment intent update:', { promoCode, localDiscountPercent });
      setIsApplyingPromo(true);
      setTimeout(() => {
        console.log('Payment intent update delay complete');
        setIsApplyingPromo(false);
      }, 2000);
    }
  }, [promoApplied]);

  useEffect(() => {
    setEmail(customerEmail || '');
  }, [customerEmail]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (newEmail && !emailRegex.test(newEmail)) {
      setEmailError(t.pleaseEnterValidEmail);
    } else {
      setEmailError(null);
    }
  };

  const handlePromoCodeApply = async () => {
    if (!promoCode) {
      setPromoError(t.pleaseEnterPromoCode);
      return;
    }

    setPromoLoading(true);
    setPromoError(null);
    setPromoApplied(false);
    setLocalDiscountPercent(0);
    setPromoDiscount(0);
    setPromoCodeId(null);
    if (setDiscountedAmount) setDiscountedAmount(totalPrice);

    try {
      console.log('Validating promo code:', promoCode);
      const response = await fetch('/api/validate-promo-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode, totalPrice }),
      });

      const result = await response.json();
      console.log('Promo code validation result:', result);

      if (!response.ok) {
        throw new Error(result.error || t.failedToValidatePromo);
      }

      if (result.success) {
        // Limit discount percentage to 100% maximum
        const limitedDiscountPercent = Math.min(result.discountPercent, 100);
        
        setPromoApplied(true);
        setLocalDiscountPercent(limitedDiscountPercent);
        setPromoDiscount(limitedDiscountPercent);
        setPromoCodeId(result.promoCodeId);
        setPromoError(null);
        if (setDiscountedAmount) {
          setDiscountedAmount(totalPrice * (1 - limitedDiscountPercent / 100));
        }
      }
    } catch (err: any) {
      console.error('Promo code error:', err);
      setPromoApplied(false);
      setLocalDiscountPercent(0);
      setPromoDiscount(0);
      setPromoCodeId(null);
      setPromoError(err.message || t.failedToApplyPromo);
      if (setDiscountedAmount) setDiscountedAmount(totalPrice);
      resetPaymentIntent();
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      const errorMsg = t.stripeNotInitialized;
      console.error(errorMsg);
      setMessage(errorMsg);
      onError(errorMsg);
      return;
    }

    if (!isMountedRef.current) {
      const errorMsg = t.componentUnmounted;
      console.error(errorMsg);
      setMessage(errorMsg);
      onError(errorMsg);
      resetPaymentIntent();
      return;
    }

    setIsLoading(true);

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        const errorMsg = 'A valid email address is required';
        console.error(errorMsg);
        setEmailError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Update customerEmail state just before submission
      console.log('Setting customerEmail:', email);
      setCustomerEmail(email);

      // Update payment intent with customer email, without updating clientSecret
      console.log('Calling updatePaymentIntentWithEmail with email:', email);
      await updatePaymentIntentWithEmail(email, true);

      // Submit the form to validate all elements
      console.log('Submitting elements:', elements);
      const submitResult = await elements.submit();
      if (submitResult.error) {
        const errorDetails = submitResult.error;
        const errorMsg = errorDetails.message || 'Form submission failed. Please ensure all payment fields are filled correctly.';
        console.error('Elements submission error:', errorDetails);
        setMessage(errorMsg);
        onError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Add a delay to ensure PaymentElement is still mounted
      await new Promise(resolve => setTimeout(resolve, 500));

      // Double-check that elements is still available and component is mounted
      if (!isMountedRef.current) {
        const errorMsg = 'Component unmounted during payment confirmation. Please try again.';
        console.error(errorMsg);
        setMessage(errorMsg);
        onError(errorMsg);
        resetPaymentIntent();
        setIsLoading(false);
        return;
      }

      if (!elements) {
        const errorMsg = 'Payment elements are not mounted. Please try again.';
        console.error(errorMsg);
        setMessage(errorMsg);
        onError(errorMsg);
        setIsLoading(false);
        return;
      }

      // Confirm the payment directly using stripe.confirmPayment
      console.log('Confirming payment with elements:', elements);
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
        },
        redirect: 'if_required',
      });

      if (error) {
        const errorMsg = error.message || 'An error occurred during payment confirmation';
        console.error('Payment confirmation error:', error);
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(errorMsg);
          onError(errorMsg);
        } else {
          setMessage(t.unexpectedPaymentError);
          onError(t.unexpectedPaymentError);
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded inline:', paymentIntent);
        // Pass the email directly to onSuccess
        onSuccess(email);
      } else {
        console.log('Payment intent status:', paymentIntent?.status);
        const errorMsg = `${t.paymentDidNotSucceed} ${paymentIntent?.status}`;
        setMessage(errorMsg);
        onError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || t.paymentFailedUnexpectedly;
      console.error('Payment error:', err);
      setMessage(errorMsg);
      onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: 'accordion' as const,
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="backdrop-blur-sm bg-white/30 dark:bg-gray-800/30 p-3 sm:p-4 rounded-2xl border border-white/40 dark:border-gray-700/40 relative overflow-hidden pb-24 sm:pb-0">
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
      <div className="mb-2 sm:mb-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          className="w-full py-2 px-3 border border-white/60 dark:border-gray-600/60 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors duration-200"
          placeholder="Enter email"
          required
        />
        {emailError && (
          <div className="mt-1 text-red-500 text-sm font-medium">{emailError}</div>
        )}
      </div>

      <div className="mb-2 sm:mb-3">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
          Payment Details
        </label>
        <div className="backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-lg border border-white/60 dark:border-gray-600/60 p-0">
          <PaymentElement id="payment-element" options={paymentElementOptions} />
        </div>
      </div>

      <div className="mb-2 sm:mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">Promo Code</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full py-2 px-3 border border-white/60 dark:border-gray-600/60 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors duration-200"
            placeholder={t.enterPromoCode}
            disabled={promoLoading}
          />
          <button
            type="button"
            onClick={handlePromoCodeApply}
            disabled={promoLoading}
            className={`py-1.5 px-2.5 sm:px-3 text-sm font-medium text-white bg-gray-600/90 backdrop-blur-sm rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
              promoLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {promoLoading ? t.applying : t.apply}
          </button>
        </div>
        {promoError && (
          <div className="mt-1 mb-1 text-red-500 text-sm font-medium">{promoError}</div>
        )}
        {promoApplied && (
          <div className="mt-1 mb-1 text-teal-500 text-sm font-medium">
            Promo code applied! {localDiscountPercent.toFixed(2)}% off
          </div>
        )}
      </div>

      {message && (
        <div id="payment-message" className="mt-1 mb-3 text-red-500 text-sm font-medium">
          {message}
        </div>
      )}

      {/* Desktop / larger screens button */}
      <div className="hidden sm:block">
        <Button
          variant='start'
          type="submit"
          disabled={isLoading || !stripe || !elements || isApplyingPromo}
          className={`${isLoading || !stripe || !elements || isApplyingPromo ? 'cursor-not-allowed opacity-70' : ''}`}
          aria-label={t.payNow}
        >
          {isLoading ? t.processing : isApplyingPromo ? t.applyingDiscount : t.payNow}
        </Button>
      </div>
      </div>
      {/* Mobile fixed footer button */}
      <div className={`sm:hidden fixed left-0 right-0 bottom-0 z-40 px-4 py-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-xl bg-white/85 dark:bg-gray-900/85 border-t border-white/40 dark:border-gray-700/40 transition-all duration-300 ${payBarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <Button
          variant='start'
          type="submit"
          disabled={isLoading || !stripe || !elements || isApplyingPromo}
          className={`w-full ${isLoading || !stripe || !elements || isApplyingPromo ? 'cursor-not-allowed opacity-70' : ''}`}
          aria-label={t.payNow}
        >
          {isLoading ? t.processing : isApplyingPromo ? t.applyingDiscount : t.payNow}
        </Button>
      </div>
    </form>
  );
}