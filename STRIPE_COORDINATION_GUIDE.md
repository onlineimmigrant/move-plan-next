# Stripe Coordination Guide: Custom UI with Subscriptions

## Current Structure

### Your Data Model
```
Product (1)
  └── Pricing Plan 1 (Basic)
      ├── stripe_price_id (monthly billing)
      └── stripe_price_id_annual (annual prepay)
  └── Pricing Plan 2 (Pro)
      ├── stripe_price_id (monthly billing)
      └── stripe_price_id_annual (annual prepay)
  └── Pricing Plan 3 (Enterprise)
      ├── stripe_price_id (monthly billing)
      └── stripe_price_id_annual (annual prepay)
```

### Stripe's Data Model
```
Stripe Product (1)
  ├── Price 1: Basic - Monthly ($49/month)
  ├── Price 2: Basic - Annual ($470/year - 20% off)
  ├── Price 3: Pro - Monthly ($99/month)
  ├── Price 4: Pro - Annual ($950/year - 20% off)
  ├── Price 5: Enterprise - Monthly ($199/month)
  └── Price 6: Enterprise - Annual ($1,910/year - 20% off)
```

## ✅ What You're Already Doing Right

1. **One Stripe Product per Product** ✓
   - Your POST endpoint creates Stripe Prices attached to the Product's `stripe_product_id`
   - Each Pricing Plan creates 1-2 Stripe Prices (monthly + optional annual)

2. **Dual Price Creation** ✓
   - Monthly billing price: `interval: 'month', interval_count: 1`
   - Annual prepay price: `interval: 'year', interval_count: 1`
   - Metadata tracks `billing_type`, `commitment_months`, `discount_percent`

3. **Price Storage** ✓
   - `stripe_price_id` stores monthly Stripe Price ID
   - `stripe_price_id_annual` stores annual Stripe Price ID

## 🔧 What Needs to Be Fixed

### Problem 1: Checkout Doesn't Use Stripe Price IDs

**Current Issue**: Your checkout creates a PaymentIntent with just an amount, but doesn't specify which Stripe Price to use.

**Impact**: 
- Stripe doesn't know which subscription to create
- No automatic recurring billing
- Customer data isn't properly linked to the subscription

**Solution**: Update checkout to create Stripe Subscriptions with the correct `stripe_price_id` based on `billingCycle`

### Problem 2: Missing Subscription Creation

**Current Issue**: You're creating PaymentIntents but not Stripe Subscriptions.

**Impact**: 
- One-time payments instead of recurring subscriptions
- No automatic renewal
- No subscription management in Stripe Dashboard

**Solution**: Create Subscriptions with your custom PaymentForm UI

## 🎯 Implementation with Custom UI

### Step 1: Create Subscription API Endpoint

### Step 1: Create Subscription API Endpoint

```typescript
// src/app/api/create-subscription/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basketItems, customerEmail, paymentMethodId } = body;

    // 1. Create or retrieve Stripe Customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        payment_method: paymentMethodId,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });
    }

    // 2. Attach payment method to customer if not already attached
    if (paymentMethodId) {
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });
    }

    // 3. Build subscription items from basket
    const items = basketItems.map((item: any) => {
      // Choose the correct Stripe Price ID based on billing cycle
      const stripePriceId = item.billingCycle === 'annual'
        ? item.plan.stripe_price_id_annual
        : item.plan.stripe_price_id;

      if (!stripePriceId) {
        throw new Error(`Missing Stripe Price ID for plan ${item.plan.id}`);
      }

      return {
        price: stripePriceId,
        quantity: item.quantity,
      };
    });

    // 4. Create Stripe Subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: items,
      default_payment_method: paymentMethodId,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        item_count: basketItems.length,
        item_ids: basketItems.map((item: any) => item.plan.id).join(','),
      },
    });

    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice.payment_intent;

    return NextResponse.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Step 2: Update PaymentForm to Collect Payment Method

Your existing PaymentForm already collects payment details. We just need to capture the payment method ID:

```typescript
// src/components/product/PaymentForm.tsx
// After successful payment element confirmation

const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
  elements,
  redirect: 'if_required',
  confirmParams: {
    payment_method_data: {
      billing_details: {
        email: customerEmail,
      },
    },
  },
});

if (!confirmError && paymentIntent) {
  // Get the payment method ID
  const paymentMethodId = paymentIntent.payment_method as string;
  
  // Now create subscription with this payment method
  const subscriptionResponse = await fetch('/api/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      basketItems: basket, // Get from context
      customerEmail: customerEmail,
      paymentMethodId: paymentMethodId,
    }),
  });

  const subscriptionData = await subscriptionResponse.json();
  
  if (subscriptionData.error) {
    throw new Error(subscriptionData.error);
  }

  // Success! Subscription created
  onSuccess();
}
```

### Step 3: Update Basket to Include Stripe Price IDs

```typescript
// src/context/BasketContext.tsx
export interface BasketItem {
  plan: PricingPlan;
  quantity: number;
  billingCycle?: 'monthly' | 'annual';
  stripePriceId?: string; // ADD THIS
}

const addToBasket = async (
  plan: PricingPlan, 
  billingCycle: 'monthly' | 'annual' = 'monthly'
) => {
  // Get the correct Stripe Price ID
  const stripePriceId = billingCycle === 'annual'
    ? (plan as any).stripe_price_id_annual
    : (plan as any).stripe_price_id;

  if (!stripePriceId) {
    console.warn(`Missing Stripe Price ID for plan ${plan.id}, billingCycle: ${billingCycle}`);
  }

  setBasket(prev => {
    const existing = prev.find(item =>
      item.plan.id === plan.id && item.billingCycle === billingCycle
    );

    if (existing) {
      return prev.map(item =>
        item.plan.id === plan.id && item.billingCycle === billingCycle
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...prev, {
      plan,
      quantity: 1,
      billingCycle,
      stripePriceId, // Store it with the item
    }];
  });
};
```

### Step 4: Alternative - Two-Step Flow

If you prefer to keep your current PaymentIntent flow, use this approach:

```typescript
// src/app/api/create-payment-intent/route.ts
// Current endpoint - keep as is for initial payment

// src/app/api/convert-to-subscription/route.ts
// NEW endpoint - converts successful payment to subscription
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe-supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, basketItems } = body;

    // 1. Retrieve the PaymentIntent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const customerId = paymentIntent.customer as string;
    const paymentMethodId = paymentIntent.payment_method as string;

    // 2. Build subscription items
    const items = basketItems.map((item: any) => {
      const stripePriceId = item.billingCycle === 'annual'
        ? item.plan.stripe_price_id_annual
        : item.plan.stripe_price_id;

      return {
        price: stripePriceId,
        quantity: item.quantity,
      };
    });

    // 3. Create subscription starting from next billing period
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: items,
      default_payment_method: paymentMethodId,
      billing_cycle_anchor: 'now',
      proration_behavior: 'none',
      metadata: {
        initial_payment_intent: paymentIntentId,
      },
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

## 📋 Implementation Steps

### Phase 1: Add Stripe Price ID Tracking

**Update Basket Context:**
```typescript
// Store stripePriceId with each basket item
stripePriceId: billingCycle === 'annual' 
  ? plan.stripe_price_id_annual 
  : plan.stripe_price_id
```

**Update PricingPlan Type:**
```typescript
// Add to src/types/pricingplan.ts (already done)
stripe_price_id?: string;
stripe_price_id_annual?: string;
```

### Phase 2: Choose Your Flow

**Option A - Subscription First (Recommended)**
1. Collect payment details via PaymentForm
2. Create Subscription with payment method
3. Confirm subscription payment with client secret
4. Handle success/failure

**Option B - Payment Then Subscription**
1. Create PaymentIntent (keep current flow)
2. Confirm payment (keep current flow)  
3. After success, convert to subscription
4. Handle recurring billing separately

### Phase 3: Update Checkout Flow

**For Option A:**
```typescript
// In checkout page, after payment details collected
const handleSubscriptionPayment = async (paymentMethodId: string) => {
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      basketItems: basket,
      customerEmail: customerEmail,
      paymentMethodId: paymentMethodId,
    }),
  });

  const { clientSecret, error } = await response.json();
  
  if (error) {
    setError(error);
    return;
  }

  // Confirm the subscription payment
  const { error: confirmError } = await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: `${window.location.origin}/checkout/success`,
    },
  });

  if (confirmError) {
    setError(confirmError.message);
  }
};
```

**For Option B:**
```typescript
// After existing PaymentIntent succeeds
const handlePaymentSuccess = async (paymentIntentId: string) => {
  // Convert to subscription
  await fetch('/api/convert-to-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentIntentId,
      basketItems: basket,
    }),
  });
  
  onSuccess();
};
```

### Phase 4: Handle Webhooks

```typescript
// src/app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe-supabase';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'invoice.payment_succeeded':
      const invoice = event.data.object;
      await handlePaymentSucceeded(invoice);
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      await handlePaymentFailed(failedInvoice);
      break;

    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleSubscriptionCancelled(subscription);
      break;

    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      await handleSubscriptionUpdated(updatedSubscription);
      break;
  }

  return new Response(JSON.stringify({ received: true }));
}

async function handlePaymentSucceeded(invoice: any) {
  // Save successful payment to database
  await supabase.from('payments').insert({
    stripe_invoice_id: invoice.id,
    stripe_subscription_id: invoice.subscription,
    amount: invoice.amount_paid,
    currency: invoice.currency,
    status: 'paid',
    paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
  });
}

async function handlePaymentFailed(invoice: any) {
  // Log failed payment, send notification
  console.error('Payment failed for subscription:', invoice.subscription);
}

async function handleSubscriptionCancelled(subscription: any) {
  // Update subscription status in database
  await supabase
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionUpdated(subscription: any) {
  // Update subscription details
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}
```

## 🔑 Key Stripe Concepts

### Price IDs vs Products
- **Product**: The thing you're selling (e.g., "Business OS Pro")
- **Price**: How much and how often (e.g., "$99/month" or "$950/year")
- One Product can have many Prices
- Your Pricing Plans map to different Prices of the same Product

### Subscriptions with Custom UI
- Customer provides payment details in your PaymentForm
- You create a Subscription with the Stripe Price ID
- Stripe returns a client_secret for payment confirmation
- You confirm the payment in your UI
- Stripe handles automatic recurring billing

### Subscription Items
When a customer subscribes, they get a Subscription with multiple Items:
```javascript
Subscription {
  id: "sub_123",
  items: [
    { price: "price_basic_monthly", quantity: 1 },
    { price: "price_pro_annual", quantity: 1 }
  ]
}
```

### Billing Cycles
- **Monthly billing**: Customer charged every month
- **Annual billing**: Customer charged once per year
- Your `commitment_months` = contract length
- Stripe's `interval` = how often to charge

## ✅ Recommended Approach for Custom UI

**Use Option A (Subscription First)** because:
- Payment and subscription created together
- Cleaner flow - one API call
- Stripe handles the first payment automatically
- Customer is subscribed immediately after payment

**Avoid Option B (Payment Then Subscription)** because:
- Two separate charges (PaymentIntent + Subscription)
- Complex reconciliation
- Customer gets double-charged for first period

## ✅ Validation Checklist

Before going live, verify:

- [ ] Each Pricing Plan has `stripe_price_id` set
- [ ] Annual Pricing Plans have `stripe_price_id_annual` set
- [ ] Basket items store correct `stripePriceId` based on `billingCycle`
- [ ] Subscription API endpoint creates subscriptions with correct Price IDs
- [ ] PaymentForm captures payment method ID
- [ ] Webhooks handle subscription events
- [ ] Test mode works end-to-end
- [ ] Stripe Dashboard shows correct products/prices/subscriptions
- [ ] Subscription renewals work automatically
- [ ] Failed payments trigger appropriate notifications

## 🚀 Quick Start

1. **Add `stripePriceId` to BasketItem interface**
2. **Update `addToBasket` to store the correct Price ID**
3. **Create `/api/create-subscription` endpoint**
4. **Update PaymentForm to call subscription endpoint**
5. **Set up webhook handler at `/api/webhooks/stripe`**
6. **Test with Stripe test cards**
7. **Verify subscription in Stripe Dashboard**

## 📚 Resources

- [Stripe Subscriptions with Custom UI](https://stripe.com/docs/billing/subscriptions/build-subscriptions)
- [Stripe Payment Method Collection](https://stripe.com/docs/payments/save-during-payment)
- [Stripe Price Object](https://stripe.com/docs/api/prices)
- [Stripe Webhook Events](https://stripe.com/docs/webhooks)
- [Handling Subscription Lifecycle](https://stripe.com/docs/billing/subscriptions/overview#subscription-lifecycle)

---

**Next Steps**: Implement Phase 1-4 above using the Subscription First approach (Option A) to integrate Stripe subscriptions with your custom PaymentForm UI.
