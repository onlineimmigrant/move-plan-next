"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useProductTranslations } from './useProductTranslations';

// Fetch Stripe publishable key dynamically
let stripePromiseCache = null;
const getStripePromise = async () => {
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

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useProductTranslations();

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: "http://localhost:3000/success",
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
    } else {
      setMessage(t.unexpectedError);
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "accordion",
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      <button disabled={isLoading || !stripe || !elements} id="submit">
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : t.payNow}
        </span>
      </button>
      {/* Show any error or success messages */}
      {message && <div id="payment-message">{message}</div>}
    </form>
  );
}

export default function CheckoutForm({ clientSecret }) {
  const [stripeInstance, setStripeInstance] = useState(null);
  
  useEffect(() => {
    getStripePromise().then(setStripeInstance);
  }, []);
  
  if (!stripeInstance) {
    return <div>Loading Stripe...</div>;
  }
  
  const appearance = {
    theme: 'stripe',
  };
  return (
    <Elements stripe={stripeInstance} options={{ appearance, clientSecret }}>
      <PaymentForm />
    </Elements>
  )
}
