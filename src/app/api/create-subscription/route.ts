// app/api/create-subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { customerId, pricingPlanId, paymentIntentId, userId, customerEmail } = await request.json();

    if (!customerId || !pricingPlanId || !userId || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch pricing plan details from Supabase
    const { data: pricingPlan, error: pricingPlanError } = await supabase
      .from('pricingplan')
      .select('stripe_price_id, product_id')
      .eq('id', pricingPlanId)
      .single();

    if (pricingPlanError || !pricingPlan?.stripe_price_id) {
      console.error('Error fetching pricing plan:', pricingPlanError);
      return NextResponse.json({ error: 'Invalid pricing plan' }, { status: 400 });
    }

    // Create Stripe subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: pricingPlan.stripe_price_id }],
      payment_behavior: 'default_incomplete',
      metadata: {
        supabase_user_id: userId,
        customer_email: customerEmail,
        pricing_plan_id: pricingPlanId,
        product_id: pricingPlan.product_id,
      },
    });

    // Store subscription in Supabase
    const { error: subscriptionError } = await supabase.from('subscriptions').insert({
      customer_id: userId,
      pricingplan_id: pricingPlanId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
    });

    if (subscriptionError) {
      console.error('Error storing subscription:', subscriptionError);
      throw new Error('Failed to store subscription');
    }

    console.log('Subscription created:', {
      subscriptionId: subscription.id,
      customerId,
      pricingPlanId,
    });

    return NextResponse.json({ subscriptionId: subscription.id });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}