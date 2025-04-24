'use client';

import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Stripe, StripeElements } from '@stripe/stripe-js';

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function PaymentForm({ onSuccess, onError, isLoading, setIsLoading }: PaymentFormProps) {
  const stripe = useStripe() as Stripe | null;
  const elements = useElements() as StripeElements | null;
  const [message, setMessage] = useState<string | null>(null);

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
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Payment Details
        </label>
        <div className="p-3 bg-white border border-gray-300 rounded-lg">
          <PaymentElement id="payment-element" options={paymentElementOptions} />
        </div>
      </div>

      {message && (
        <div id="payment-message" className="mt-4 text-red-500 text-sm font-medium">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className={`
          w-full py-3 px-4 text-sm font-semibold rounded-full border border-sky-600 
          text-sky-600 bg-white transition-all duration-200 
          focus:outline-none focus:ring-4 focus:ring-sky-200 focus:ring-opacity-50 
          shadow-sm hover:bg-sky-50 hover:scale-105 
          ${isLoading || !stripe || !elements ? 'cursor-not-allowed opacity-70' : ''}
        `}
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}