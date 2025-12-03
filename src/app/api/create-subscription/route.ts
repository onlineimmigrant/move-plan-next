// app/api/create-subscription/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/getSettings';
import { createStripeInstance } from '@/lib/stripeInstance';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { basketItems, customerEmail, organizationId: bodyOrgId } = body;

    console.log('[Subscription] Creating subscription for:', customerEmail);
    console.log('[Subscription] Basket items:', basketItems?.length || 0);

    // Get organization ID
    const host = request.headers.get('host') || undefined;
    const organizationId = bodyOrgId || await getOrganizationId({ headers: { host } });
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    const stripe = await createStripeInstance(organizationId);

    // Validate input
    if (!basketItems || basketItems.length === 0) {
      return NextResponse.json({ error: 'Basket is empty' }, { status: 400 });
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'Customer email is required' }, { status: 400 });
    }

    // 1. Create or retrieve Stripe Customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('[Subscription] Using existing customer:', customer.id);
      
      // CRITICAL: Clear any default payment method to prevent auto-charging
      // We'll re-attach it after settling the invoice manually
      const customerData = customer as any;
      if (customerData.invoice_settings?.default_payment_method) {
        console.log('[Subscription] Clearing default payment method to prevent auto-charge');
        await stripe.customers.update(customer.id, {
          invoice_settings: {
            default_payment_method: '' as any, // Clear the default payment method
          },
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        metadata: {
          organization_id: organizationId,
        },
      });
      console.log('[Subscription] Created new customer:', customer.id);
    }

    // 2. Build subscription items from basket
    const items: Array<{ price: string; quantity: number }> = [];
    const oneTimeItems: Array<{ price: string; quantity: number }> = [];

    for (const item of basketItems) {
      const plan = item.plan;
      const isRecurring = plan.type === 'recurring';
      
      // Choose correct Stripe Price ID - only use annual for recurring plans
      let stripePriceId: string | null = null;
      
      if (isRecurring && item.billingCycle === 'annual' && plan.stripe_price_id_annual) {
        stripePriceId = plan.stripe_price_id_annual;
        console.log(`[Subscription] Annual price for plan ${plan.id}: ${stripePriceId}`);
      } else if (plan.stripe_price_id) {
        stripePriceId = plan.stripe_price_id;
        console.log(`[Subscription] ${isRecurring ? 'Monthly' : 'One-time'} price for plan ${plan.id}: ${stripePriceId}`);
      }

      if (!stripePriceId) {
        console.error(`[Subscription] Missing Price ID for plan ${plan.id}`, {
          type: plan.type,
          billingCycle: item.billingCycle,
          has_stripe_price_id: !!plan.stripe_price_id,
          has_stripe_price_id_annual: !!plan.stripe_price_id_annual,
        });
        return NextResponse.json(
          { error: `Missing Stripe Price ID for plan: ${plan.package || plan.id}` },
          { status: 400 }
        );
      }

      if (isRecurring) {
        items.push({ price: stripePriceId, quantity: item.quantity });
      } else {
        oneTimeItems.push({ price: stripePriceId, quantity: item.quantity });
      }
    }

    console.log('[Subscription] Recurring items:', items.length);
    console.log('[Subscription] One-time items:', oneTimeItems.length);

    // 4. Create subscription for recurring items
    let subscription = null;
    let clientSecret = null;
    let paymentIntent = null;

    if (items.length > 0) {
      // Create subscription with send_invoice collection method
      // This prevents Stripe from creating automatic payment attempts
      subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: items,
        collection_method: 'send_invoice',
        days_until_due: 0,
        payment_settings: { 
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice'],
        metadata: {
          organization_id: organizationId,
          item_count: items.length,
          item_ids: basketItems
            .filter((item: any) => item.plan.type === 'recurring')
            .map((item: any) => item.plan.id)
            .join(','),
        },
      });

      console.log('[Subscription] Created subscription:', subscription.id);
      console.log('[Subscription] Subscription status:', subscription.status);

      let invoice = subscription.latest_invoice as any;
      
      console.log('[Subscription] Latest invoice:', invoice?.id);
      
      // Invoice should be expanded, if not retrieve it
      if (typeof invoice === 'string') {
        console.log('[Subscription] Invoice not expanded, retrieving:', invoice);
        invoice = await stripe.invoices.retrieve(invoice);
      }
      
      console.log('[Subscription] Invoice status:', invoice?.status);
      console.log('[Subscription] Invoice amount_due:', invoice?.amount_due);

      // With collection_method: 'send_invoice', no automatic payment_intent is created
      // Create our own PaymentIntent to collect payment
      if (invoice?.amount_due > 0) {
        console.log('[Subscription] Creating PaymentIntent for manual payment collection');
        
        paymentIntent = await stripe.paymentIntents.create({
          amount: invoice.amount_due,
          currency: invoice.currency,
          customer: customer.id,
          // DO NOT use setup_future_usage - it auto-attaches PM and triggers auto-charge
          // We'll manually attach PM after settling invoice in finalize endpoint
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            organization_id: organizationId,
            subscription_id: subscription.id,
            invoice_id: invoice.id,
          },
          description: `Subscription payment for ${subscription.id}`,
        });
        
        clientSecret = paymentIntent.client_secret;
        console.log('[Subscription] Created PaymentIntent:', paymentIntent.id);
      } else {
        console.error('[Subscription] No amount due on invoice');
        throw new Error('Cannot process subscription payment - no amount due');
      }

      // Save subscription to database
      try {
        const insertData: any = {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customer.id,
          customer_email: customerEmail,
          status: subscription.status,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
        };

        // Only add period dates if they exist (incomplete subscriptions may not have them yet)
        const subData: any = subscription as any;
        if (subData.current_period_start) {
          insertData.current_period_start = new Date(subData.current_period_start * 1000).toISOString();
        }
        if (subData.current_period_end) {
          insertData.current_period_end = new Date(subData.current_period_end * 1000).toISOString();
        }

        await supabase.from('subscriptions').insert(insertData);
        console.log('[Subscription] Saved to database');
      } catch (dbError: any) {
        console.error('[Subscription] Database error:', dbError);
        // Don't fail the request if database save fails
      }
    }

    // 5. Handle one-time items with invoice (TODO: implement properly)
    // For now, we'll skip one-time items in subscription flow
    // They should use regular payment intent flow instead

    if (!clientSecret) {
      console.error('[Subscription] Failed to obtain client secret', {
        hasSubscription: !!subscription,
        subscriptionId: subscription?.id,
        subscriptionStatus: subscription?.status,
        itemsCount: items.length,
      });
      return NextResponse.json({ 
        error: 'Failed to create payment intent',
        details: {
          subscriptionCreated: !!subscription,
          subscriptionId: subscription?.id,
          message: 'Payment intent client secret not available. Check Stripe subscription setup.',
        }
      }, { status: 500 });
    }

    console.log('[Subscription] Returning success response');
    return NextResponse.json({
      subscriptionId: subscription?.id || null,
      customerId: customer.id,
      clientSecret: clientSecret,
      paymentIntentId: paymentIntent?.id || null,
      status: subscription?.status || 'incomplete',
      hasRecurring: items.length > 0,
      hasOneTime: oneTimeItems.length > 0,
    });
  } catch (error: any) {
    console.error('[Subscription] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create subscription' },
      { status: 500 }
    );
  }
}