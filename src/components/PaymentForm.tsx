'use client';

import { useState, useEffect, useRef } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';

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
  const [message, setMessage] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [localDiscountPercent, setLocalDiscountPercent] = useState<number>(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [email, setEmail] = useState(customerEmail || '');
  const [emailError, setEmailError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    console.log('PaymentForm mounted, elements:', elements);
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
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  };

  const handlePromoCodeApply = async () => {
    if (!promoCode) {
      setPromoError('Please enter a promo code');
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
        throw new Error(result.error || 'Failed to validate promo code');
      }

      if (result.success) {
        setPromoApplied(true);
        setLocalDiscountPercent(result.discountPercent);
        setPromoDiscount(result.discountPercent);
        setPromoCodeId(result.promoCodeId);
        setPromoError(null);
        if (setDiscountedAmount) {
          setDiscountedAmount(totalPrice * (1 - result.discountPercent / 100));
        }
      }
    } catch (err: any) {
      console.error('Promo code error:', err);
      setPromoApplied(false);
      setLocalDiscountPercent(0);
      setPromoDiscount(0);
      setPromoCodeId(null);
      setPromoError(err.message || 'Failed to apply promo code');
      if (setDiscountedAmount) setDiscountedAmount(totalPrice);
      resetPaymentIntent();
    } finally {
      setPromoLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      const errorMsg = 'Stripe has not been initialized';
      console.error(errorMsg);
      setMessage(errorMsg);
      onError(errorMsg);
      return;
    }

    if (!isMountedRef.current) {
      const errorMsg = 'Component is unmounted. Please try again.';
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
          setMessage('An unexpected error occurred during payment.');
          onError('An unexpected error occurred during payment.');
        }
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded inline:', paymentIntent);
        // Pass the email directly to onSuccess
        onSuccess(email);
      } else {
        console.log('Payment intent status:', paymentIntent?.status);
        const errorMsg = 'Payment did not succeed. Status: ' + paymentIntent?.status;
        setMessage(errorMsg);
        onError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Payment failed unexpectedly';
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
    <form id="payment-form" onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors duration-200"
          placeholder="Enter email"
          required
        />
        {emailError && (
          <div className="mt-1 text-red-500 text-sm font-medium">{emailError}</div>
        )}
      </div>

      <div className="mb-3">
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Payment Details
        </label>
        <div className="bg-white rounded-lg">
          <PaymentElement id="payment-element" options={paymentElementOptions} />
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Promo Code</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors duration-200"
            placeholder="Enter promo code (e.g., WELCOME20)"
            disabled={promoLoading}
          />
          <button
            type="button"
            onClick={handlePromoCodeApply}
            disabled={promoLoading}
            className={`py-1.5 px-3 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200 ${
              promoLoading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {promoLoading ? 'Applying...' : 'Apply'}
          </button>
        </div>
        {promoError && (
          <div className="mt-1 mb-1 text-red-500 text-sm font-medium">{promoError}</div>
        )}
        {promoApplied && (
          <div className="mt-1 mb-1 text-teal-500 text-sm font-medium">
            Promo code applied! {localDiscountPercent}% off
          </div>
        )}
      </div>

      {message && (
        <div id="payment-message" className="mt-1 mb-3 text-red-500 text-sm font-medium">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements || isApplyingPromo}
        className={`
          w-full py-3 px-4 text-sm font-semibold rounded-lg 
          text-white bg-gray-600 transition-all duration-200 
          focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
          shadow-sm hover:bg-gray-700 hover:scale-105 
          ${isLoading || !stripe || !elements || isApplyingPromo ? 'cursor-not-allowed opacity-70' : ''}
        `}
      >
        {isLoading ? 'Processing...' : isApplyingPromo ? 'Applying Discount...' : 'Pay Now'}
      </button>
    </form>
  );
}