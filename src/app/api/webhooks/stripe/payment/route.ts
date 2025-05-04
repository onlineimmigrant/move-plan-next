import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, supabase } from '@/lib/stripe-supabase';

export async function POST(request: Request) {
  try {
    console.log('Received payment webhook request');
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PAYMENT!;
    console.log('Webhook Secret:', webhookSecret ? '[REDACTED]' : 'MISSING');

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET_PAYMENT');
      return NextResponse.json({ error: 'Missing webhook secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      console.log('Verifying webhook signature');
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      console.log('Webhook event received:', event.type, 'with ID:', event.id);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the payment_intent.succeeded event to store existing customers and transactions
    if (event.type === 'payment_intent.succeeded') {
      console.log('Processing payment_intent.succeeded event:', event.data.object);
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      const customerId = paymentIntent.customer as string | null;
      if (!customerId) {
        console.log('Payment intent has no associated customer, skipping Supabase storage');
        return NextResponse.json({ received: true });
      }

      console.log('Retrieving customer from Stripe:', customerId);
      const customer = await stripe.customers.retrieve(customerId);
      if (!('email' in customer) || !customer.email) {
        console.log('Customer retrieval failed or customer is deleted, skipping Supabase storage');
        return NextResponse.json({ received: true });
      }

      const customerName = customer.name || 'Unknown Customer';
      const customerEmail = customer.email;

      console.log('Checking if customer exists in Supabase:', customerId);
      const { data: existingCustomer, error: fetchError } = await supabase
        .from('customers')
        .select('stripe_customer_id, user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error checking existing customer in Supabase:', fetchError);
        throw new Error(`Failed to check existing customer: ${fetchError.message}`);
      }

      if (existingCustomer) {
        console.log('Customer already exists in Supabase:', customerId);
      } else {
        console.log('Customer not found in Supabase, skipping user creation (handled by customer webhook)');
        return NextResponse.json({ received: true });
      }

      // Look up user_id from the customers table
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (customerError || !customerData) {
        console.error(`Failed to find user for customer ${customerId}:`, customerError?.message);
        return NextResponse.json({ received: true });
      }

      const userId = customerData.user_id;

      // Check if the transaction already exists
      const { data: existingTransaction, error: transactionFetchError } = await supabase
        .from('transactions')
        .select('id')
        .eq('stripe_transaction_id', paymentIntent.id)
        .single();

      if (transactionFetchError && transactionFetchError.code !== 'PGRST116') {
        console.error(`Error checking existing transaction ${paymentIntent.id}:`, transactionFetchError);
        throw new Error(`Failed to check existing transaction: ${transactionFetchError.message}`);
      }

      if (existingTransaction) {
        console.log(`Transaction ${paymentIntent.id} already exists, skipping...`);
        return NextResponse.json({ received: true });
      }

      // Insert the transaction into the transactions table
      console.log('Storing transaction in Supabase:', {
        stripe_transaction_id: paymentIntent.id,
        stripe_customer_id: customerId,
        user_id: userId,
        amount: paymentIntent.amount / 100.0,
        currency: paymentIntent.currency.toUpperCase(),
        status: paymentIntent.status,
        customer: customerName,
        email: customerEmail,
      });

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          stripe_transaction_id: paymentIntent.id,
          stripe_customer_id: customerId,
          user_id: userId,
          amount: paymentIntent.amount / 100.0,
          currency: paymentIntent.currency.toUpperCase(),
          status: paymentIntent.status,
          created_at: new Date(paymentIntent.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          description: paymentIntent.description || null,
          customer: customerName,
          email: customerEmail,
        });

      if (insertError) {
        console.error('Supabase transaction insert error details:', insertError);
        throw new Error(`Failed to store transaction record: ${insertError.message}`);
      }

      console.log(`Successfully stored transaction ${paymentIntent.id} in Supabase`);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling payment webhook event:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Payment webhook handler failed' },
      { status: 500 }
    );
  }
}