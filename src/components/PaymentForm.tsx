'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  totalPrice: number;
  setPromoDiscount: (discount: number) => void;
  resetPaymentIntent: () => void;
}

export default function PaymentForm({
  onSuccess,
  onError,
  isLoading,
  setIsLoading,
  totalPrice,
  setPromoDiscount,
  resetPaymentIntent,
}: PaymentFormProps) {
  const stripe = useStripe() as Stripe | null;
  const elements = useElements() as StripeElements | null;
  const [message, setMessage] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const handlePromoCodeApply = () => {
    if (promoCode.toLowerCase() === 'discount10') {
      setPromoApplied(true);
      setPromoDiscount(10); // 10% discount
      setPromoError(null);
      resetPaymentIntent();
    } else {
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoError('Invalid promo code');
      resetPaymentIntent();
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe has not been initialized');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
        },
      });

      if (error) {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setMessage(error.message || 'An error occurred');
          onError(error.message || 'Payment failed');
        } else {
          setMessage('An unexpected error occurred.');
          onError('An unexpected error occurred.');
        }
      } else {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setMessage(err.message || 'Payment failed');
      onError(err.message || 'Payment failed');
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
            placeholder="Enter promo code (e.g., DISCOUNT10)"
          />
          <button
            type="button"
            onClick={handlePromoCodeApply}
            className="py-1.5 px-3 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            Apply
          </button>
        </div>
        {promoError && (
          <div className="mt-1 mb-1 text-red-500 text-sm font-medium">{promoError}</div>
        )}
        {promoApplied && (
          <div className="mt-1 mb-1 text-teal-500 text-sm font-medium">
            Promo code applied! 
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
        disabled={isLoading || !stripe || !elements}
        className={`
          w-full py-3 px-4 text-sm font-semibold rounded-lg 
          text-white bg-gray-600 transition-all duration-200 
          focus:outline-none focus:ring-4 focus:ring-gray-200 focus:ring-opacity-50 
          shadow-sm hover:bg-gray-700 hover:scale-105 
          ${isLoading || !stripe || !elements ? 'cursor-not-allowed opacity-70' : ''}
        `}
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}