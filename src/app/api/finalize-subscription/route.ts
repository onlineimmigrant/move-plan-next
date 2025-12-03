// /src/app/api/finalize-subscription/route.ts
import { NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/getSettings';
import { createStripeInstance } from '@/lib/stripeInstance';

export async function POST(request: Request) {
  const host = request.headers.get('host') || undefined;
  const organizationId = await getOrganizationId({ headers: { host } });
  if (!organizationId) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }
  const stripe = await createStripeInstance(organizationId);

  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    console.log('[Finalize] Retrieving payment intent:', paymentIntentId);
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if this payment is for a subscription invoice
    const subscriptionId = paymentIntent.metadata?.subscription_id;
    const invoiceId = paymentIntent.metadata?.invoice_id;

    if (!subscriptionId || !invoiceId) {
      console.log('[Finalize] Not a subscription payment, skipping');
      return NextResponse.json({ 
        success: true, 
        message: 'Not a subscription payment' 
      });
    }

    console.log('[Finalize] Payment is for subscription invoice:', invoiceId);

    // Check payment intent status
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ 
        error: 'Payment not yet succeeded',
        status: paymentIntent.status 
      }, { status: 400 });
    }

    // Retrieve and check the invoice
    const invoice = await stripe.invoices.retrieve(invoiceId) as any;
    console.log('[Finalize] Invoice status:', invoice.status);
    console.log('[Finalize] Invoice payment_intent:', invoice.payment_intent);
    console.log('[Finalize] Our PaymentIntent:', paymentIntentId);

    // Our manual PaymentIntent succeeded
    // CRITICAL ORDER: Settle invoice FIRST, then attach payment method
    // If we attach PM first, Stripe auto-charges the open invoice before our paid_out_of_band call
    if (paymentIntent.status === 'succeeded' && paymentIntent.payment_method) {
      console.log('[Finalize] Payment succeeded, settling invoice');
      
      // STEP 1: Settle invoice BEFORE attaching payment method
      if (invoice.status === 'draft' || invoice.status === 'open') {
        const isDev = process.env.NODE_ENV !== 'production' || (host && host.includes('localhost'));
        
        if (isDev) {
          try {
            // Dev: paid_out_of_band works on draft invoices and prevents auto-charging
            await stripe.invoices.update(invoiceId, {
              metadata: {
                dev_payment_intent: paymentIntentId,
                dev_note: 'Paid via separate PaymentIntent',
              },
            });
            await stripe.invoices.pay(invoiceId, { paid_out_of_band: true });
            console.log('[Finalize] Dev: Draft invoice marked paid_out_of_band (no finalization needed)');
          } catch (payError: any) {
            console.warn('[Finalize] Invoice settlement error:', payError.message);
          }
        } else {
          // Production: webhook handles this
          console.log('[Finalize] Production: Webhook will settle invoice');
        }
      }
      
      // STEP 2: NOW attach payment method (invoice already settled, no auto-charge risk)
      try {
        await stripe.paymentMethods.attach(paymentIntent.payment_method as string, {
          customer: paymentIntent.customer as string,
        });
        console.log('[Finalize] Payment method attached');
      } catch (attachErr: any) {
        if (!attachErr.message?.includes('already been attached')) {
          console.warn('[Finalize] Attach error:', attachErr.message);
        }
      }
      
      // STEP 3: Set as default payment method for future renewals (only for compatible types)
      try {
        const pm = await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string);
        const pmType = (pm as any).type;
        const compatibleTypes = new Set(['card']);
        
        await stripe.subscriptions.update(subscriptionId, {
          default_payment_method: compatibleTypes.has(pmType) ? paymentIntent.payment_method as string : undefined,
          metadata: {
            first_payment_intent: paymentIntentId,
            first_payment_completed: new Date().toISOString(),
          },
        });
        console.log('[Finalize] Subscription updated with default payment method');
      } catch (updateErr: any) {
        console.warn('[Finalize] Could not update subscription:', updateErr.message);
      }
    }

    // Retrieve final subscription status
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    console.log('[Finalize] Final subscription status:', subscription.status);

    return NextResponse.json({
      success: true,
      subscriptionStatus: subscription.status,
      invoiceStatus: 'paid',
      message: 'Subscription payment processed',
    });
  } catch (error: any) {
    console.error('[Finalize] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to finalize subscription' },
      { status: 500 }
    );
  }
}
