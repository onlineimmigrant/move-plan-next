// app/api/create-payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getOrganizationId } from '@/lib/getSettings';
import { createStripeInstance } from '@/lib/stripeInstance';

export async function POST(request: Request) {
  try {
    const { amount, currency, metadata, promoCodeId, paymentIntentId, customerEmail, isCustomerUpdateOnly, organizationId: bodyOrgId } = await request.json();
    
    // Get organization ID from request or body
    const host = request.headers.get('host') || undefined;
    const organizationId = bodyOrgId || await getOrganizationId({ headers: { host } });
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    // Create Stripe instance with organization keys
    const stripe = await createStripeInstance(organizationId);
    console.log('Processing payment intent:', { amount, currency, promoCodeId, paymentIntentId, customerEmail, isCustomerUpdateOnly });

    if (!amount || !currency) {
      console.error('Missing amount or currency');
      return NextResponse.json(
        { error: 'Missing amount or currency' },
        { status: 400 }
      );
    }

    // Initialize variables
    let finalAmount = amount; // Amount in cents
    let discountPercent = 0;
    let customerId: string | null = null;

    // Create or retrieve Stripe customer if email is provided
    if (customerEmail) {
      console.log('Checking for existing Stripe customer with email:', customerEmail);
      const customers = await stripe.customers.list({
        email: customerEmail,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found existing customer:', customerId);
      } else {
        console.log('Creating new Stripe customer with email:', customerEmail);
        const customer = await stripe.customers.create({
          email: customerEmail,
          name: customerEmail,
          metadata: { supabase_user_id: 'unknown' }, // Keep as "unknown"
        });
        customerId = customer.id;
        console.log('Created new customer:', customerId, 'with email and name:', customerEmail);
      }
    }

    // If promoCodeId is provided, fetch the promotion code to get the discount
    if (promoCodeId) {
      console.log('Processing promo code:', promoCodeId);
      try {
        const promotionCode = await stripe.promotionCodes.retrieve(promoCodeId);
        if (promotionCode.active && promotionCode.coupon.valid) {
          if (promotionCode.coupon.percent_off) {
            discountPercent = promotionCode.coupon.percent_off;
            finalAmount = Math.round(amount * (1 - discountPercent / 100));
            console.log('Applied percent off discount:', discountPercent);
          } else if (promotionCode.coupon.amount_off) {
            finalAmount = Math.max(0, amount - promotionCode.coupon.amount_off);
            discountPercent = ((amount - finalAmount) / amount) * 100;
            console.log('Applied amount off discount:', discountPercent);
          }
        } else {
          console.warn('Inactive or invalid promotion code:', promoCodeId);
        }
      } catch (error: any) {
        console.error('Error retrieving promotion code:', error);
      }
    }

    // Ensure finalAmount is at least 1 cent to avoid Stripe errors
    finalAmount = Math.max(1, finalAmount);
    console.log('Final amount after discounts:', finalAmount);

    let paymentIntent;

    if (paymentIntentId) {
      // Update existing payment intent
      console.log('Updating existing payment intent:', paymentIntentId);
      paymentIntent = await stripe.paymentIntents.update(paymentIntentId, {
        amount: finalAmount,
        currency: currency.toLowerCase(),
        customer: customerId || undefined,
        metadata: {
          ...metadata,
          original_amount: amount.toString(),
          promo_code_id: promoCodeId || 'none',
          discount_percent: discountPercent.toString(),
        },
      });
    } else {
      // Create a new payment intent
      console.log('Creating new payment intent');
      paymentIntent = await stripe.paymentIntents.create({
        amount: finalAmount,
        currency: currency.toLowerCase(),
        customer: customerId || undefined,
        metadata: {
          ...metadata,
          original_amount: amount.toString(),
          promo_code_id: promoCodeId || 'none',
          discount_percent: discountPercent.toString(),
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always',
        },
      });
    }

    console.log('Payment intent processed:', {
      id: paymentIntent.id,
      originalAmount: amount,
      finalAmount,
      discountPercent,
      customerId,
    });

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      id: paymentIntent.id,
      discountedAmount: finalAmount / 100,
      discountPercent,
    });
  } catch (error: any) {
    console.error('Error processing Payment Intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process Payment Intent' },
      { status: 500 }
    );
  }
}