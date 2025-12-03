'use client';

import { useState, useEffect, useRef } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { fetchWithRetry } from '@/lib/retry';
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
    const networkInfo = useNetworkStatus();
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
      const result = await fetchWithRetry<{ success: boolean; discountPercent: number; promoCodeId: string; error?: string }>(
        '/api/validate-promo-code',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode, totalPrice }),
        },
        { retries: 3, baseDelayMs: 400 }
      );
      console.log('Promo code validation result:', result);

      if (!result.success) {
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

      // Simply confirm the payment with the existing client secret
      // (subscription is already created by checkout page if needed)
      console.log('Confirming payment...');
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
        console.log('Payment succeeded:', paymentIntent);
        // Keep loading state active - handleSuccess will manage it
        onSuccess(email);
      } else {
        console.log('Payment intent status:', paymentIntent?.status);
        const errorMsg = `${t.paymentDidNotSucceed} ${paymentIntent?.status}`;
        setMessage(errorMsg);
        onError(errorMsg);
        setIsLoading(false);
      }
    } catch (err: any) {
      const errorMsg = err.message || t.paymentFailedUnexpectedly;
      console.error('Payment error:', err);
      setMessage(errorMsg);
      onError(errorMsg);
      setIsLoading(false);
    }
  };

  const paymentElementOptions = {
    layout: 'accordion' as const,
  };

  return (
    <form 
      id="payment-form" 
      onSubmit={handleSubmit} 
      className="backdrop-blur-sm p-3 sm:p-4 rounded-2xl border border-gray-200/30 relative overflow-hidden pb-24 sm:pb-0 shadow-md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
      aria-label="Payment form"
      noValidate
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
      <div className="relative z-10">
      <div className="mb-2 sm:mb-3">
        <label htmlFor="email-input" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
          {t.emailAddress} <span className="text-red-500" aria-label="required">*</span>
        </label>
        <input
          id="email-input"
          type="email"
          value={email}
          onChange={handleEmailChange}
          className="w-full py-2 px-3 border border-gray-200/40 backdrop-blur-sm rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors duration-200" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          placeholder={t.emailPlaceholder}
          required
          aria-required="true"
          aria-invalid={emailError ? 'true' : 'false'}
          aria-describedby={emailError ? 'email-error' : undefined}
        />
        {emailError && (
          <p id="email-error" className="mt-1 text-red-500 text-sm font-medium" role="alert" aria-live="assertive">{emailError}</p>
        )}
      </div>

      <div className="mb-2 sm:mb-3">
        <label htmlFor="payment-element" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
          {t.paymentDetails}
        </label>
        <div 
          className="backdrop-blur-sm rounded-lg border border-gray-200/40 p-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          role="group"
          aria-label="Payment card details"
        >
          <PaymentElement id="payment-element" options={paymentElementOptions} />
        </div>
      </div>

      <div className="mb-2 sm:mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1.5">{t.promoCode}</h3>
        <div className="flex items-center space-x-2" role="group" aria-label="Promotional code">
          <input
            id="promo-code-input"
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full py-2 px-3 border border-gray-200/40 backdrop-blur-sm rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors duration-200" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            placeholder={t.enterPromoCode}
            disabled={promoLoading || !networkInfo.isOnline}
            aria-label="Enter promotional code"
            aria-invalid={promoError ? 'true' : 'false'}
            aria-describedby={promoError ? 'promo-error' : promoApplied ? 'promo-success' : undefined}
          />
          <button
            type="button"
            onClick={handlePromoCodeApply}
            disabled={promoLoading}
            className={`py-1.5 px-2.5 sm:px-3 text-sm font-medium text-white bg-gray-600/90 backdrop-blur-sm rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
              promoLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
            aria-label={promoLoading ? 'Applying promotional code' : 'Apply promotional code'}
          >
            {promoLoading ? t.applying : t.apply}
          </button>
        </div>
        {promoError && (
          <p id="promo-error" className="mt-1 mb-1 text-red-500 text-sm font-medium" role="alert" aria-live="assertive">{promoError}</p>
        )}
        {promoApplied && (
          <p id="promo-success" className="mt-1 mb-1 text-teal-500 text-sm font-medium" role="status" aria-live="polite">
            {t.promoCodeApplied} {localDiscountPercent.toFixed(2)}{t.percentOffDiscount}
          </p>
        )}
      </div>

      {message && (
        <p id="payment-message" className="mt-1 mb-3 text-red-500 text-sm font-medium" role="alert" aria-live="assertive">
          {message}
        </p>
      )}

      {/* Desktop / larger screens button */}
      <div className="hidden sm:block mb-2">
        <Button
          variant='start'
          type="submit"
          disabled={isLoading || !stripe || !elements || isApplyingPromo || !networkInfo.isOnline}
          className={`${isLoading || !stripe || !elements || isApplyingPromo ? 'cursor-not-allowed opacity-70' : ''}`}
          aria-label={isLoading ? 'Processing payment' : 'Pay now and complete order'}
          aria-busy={isLoading}
          aria-disabled={isLoading || !stripe || !elements || isApplyingPromo || !networkInfo.isOnline}
        >
          {isLoading ? t.processing : isApplyingPromo ? t.applyingDiscount : t.payNow}
        </Button>
      </div>
      </div>
      {/* Mobile fixed footer button */}
      <div className={`sm:hidden fixed left-0 right-0 bottom-0 z-40 px-4 py-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm border-t border-gray-200/30 transition-all duration-300 ${payBarVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
        <Button
          variant='start'
          type="submit"
          disabled={isLoading || !stripe || !elements || isApplyingPromo || !networkInfo.isOnline}
          className={`w-full ${isLoading || !stripe || !elements || isApplyingPromo ? 'cursor-not-allowed opacity-70' : ''}`}
          aria-label={isLoading ? 'Processing payment' : 'Pay now and complete order'}
          aria-busy={isLoading}
          aria-disabled={isLoading || !stripe || !elements || isApplyingPromo || !networkInfo.isOnline}
        >
          {isLoading ? t.processing : isApplyingPromo ? t.applyingDiscount : t.payNow}
        </Button>
      </div>
    </form>
  );
}