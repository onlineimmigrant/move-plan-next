import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function POST() {
  try {
    console.log('Starting transaction sync process...');

    // Step 1: Fetch PaymentIntents from Stripe
    console.log('Fetching PaymentIntents from Stripe...');
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100, // Adjust based on your needs (max 100 per page)
      expand: ['data.charges'],
    });

    console.log(`Fetched ${paymentIntents.data.length} PaymentIntents from Stripe`);

    // Step 2: Process PaymentIntents in batches
    const batchSize = 10;
    let syncedCount = 0;

    for (let i = 0; i < paymentIntents.data.length; i += batchSize) {
      const batch = paymentIntents.data.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(paymentIntents.data.length / batchSize)}...`);

      const results = await Promise.all(
        batch.map(async (paymentIntent) => {
          try {
            // Skip if no customer is associated
            if (!paymentIntent.customer || typeof paymentIntent.customer !== 'string') {
              console.log(`PaymentIntent ${paymentIntent.id} has no customer, skipping...`);
              return 0;
            }

            const stripeCustomerId = paymentIntent.customer;
            console.log(`Processing PaymentIntent ${paymentIntent.id} for customer ${stripeCustomerId}`);

            // Fetch the customer details separately
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            // Check if the customer is deleted
            if ('deleted' in customer && customer.deleted) {
              console.log(`Customer ${stripeCustomerId} is deleted, skipping...`);
              return 0;
            }

            // Now TypeScript knows customer is Stripe.Customer
            const customerName = customer.name && customer.name.trim() !== '' ? customer.name : 'Unknown Customer';
            const customerEmail = customer.email && customer.email.trim() !== '' ? customer.email : 'Unknown Email';

            // Step 3: Look up the user_id from the customers table using stripe_customer_id
            const { data: customerRecord, error: customerError } = await supabase
              .from('customers')
              .select('user_id')
              .eq('stripe_customer_id', stripeCustomerId)
              .single();

            if (customerError || !customerRecord) {
              console.error(`Failed to find user for customer ${stripeCustomerId}:`, customerError?.message);
              return 0;
            }

            const userId = customerRecord.user_id;
            console.log(`Found user ${userId} for customer ${stripeCustomerId}`);

            // Step 4: Check if the transaction already exists
            const { data: existingTransaction, error: fetchError } = await supabase
              .from('transactions')
              .select('id')
              .eq('stripe_transaction_id', paymentIntent.id)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error(`Error checking existing transaction ${paymentIntent.id}:`, fetchError);
              return 0;
            }

            if (existingTransaction) {
              console.log(`Transaction ${paymentIntent.id} already exists, skipping...`);
              return 0;
            }

            // Step 5: Insert the transaction into the transactions table
            const { error: insertError } = await supabase
              .from('transactions')
              .insert({
                stripe_transaction_id: paymentIntent.id,
                stripe_customer_id: stripeCustomerId,
                user_id: userId,
                amount: paymentIntent.amount / 100.0, // Convert cents to dollars
                currency: paymentIntent.currency.toUpperCase(), // Uppercase the currency
                status: paymentIntent.status,
                created_at: new Date(paymentIntent.created * 1000).toISOString(),
                updated_at: new Date().toISOString(),
                description: paymentIntent.description || null,
                customer: customerName,
                email: customerEmail,
              });

            if (insertError) {
              console.error(`Failed to insert transaction ${paymentIntent.id}:`, insertError);
              return 0;
            }

            console.log(`Successfully inserted transaction ${paymentIntent.id}`);
            return 1;
          } catch (error) {
            console.error(`Error processing PaymentIntent ${paymentIntent.id}:`, error);
            return 0;
          }
        })
      );

      const batchSyncedCount = results.reduce((sum: number, result: number) => sum + result, 0);
      syncedCount += batchSyncedCount;
      console.log(`Batch ${i / batchSize + 1} completed. Synced ${batchSyncedCount} transactions.`);
    }

    console.log('Transaction sync completed successfully.');
    return NextResponse.json({
      message: `Synced ${syncedCount} transactions successfully`,
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error.message, 'Stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}