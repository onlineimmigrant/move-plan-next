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
      limit: 100,
      expand: ['data.payment_method'],
    });

    console.log(`Fetched ${paymentIntents.data.length} PaymentIntents from Stripe`);
    if (paymentIntents.data.length === 0) {
      console.log('No PaymentIntents found in Stripe. Ensure you have test data or live transactions.');
    }

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
            if ('deleted' in customer && customer.deleted) {
              console.log(`Customer ${stripeCustomerId} is deleted, skipping...`);
              return 0;
            }

            const customerName = customer.name && customer.name.trim() !== '' ? customer.name : 'Unknown Customer';
            const customerEmail = customer.email && customer.email.trim() !== '' ? customer.email : 'Unknown Email';

            // Step 3: Look up the user_id from the customers table
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
              .select('id, payment_method, refunded_date, metadata')
              .eq('stripe_transaction_id', paymentIntent.id)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error(`Error checking existing transaction ${paymentIntent.id}:`, fetchError);
              return 0;
            }

            // Step 5: Extract payment method
            let paymentMethod = 'unknown';
            if (paymentIntent.payment_method) {
              console.log(`PaymentIntent ${paymentIntent.id} has payment_method ID: ${paymentIntent.payment_method}`);
              const pm = paymentIntent.payment_method as Stripe.PaymentMethod;
              paymentMethod = pm.type || 'unknown';
              console.log(`PaymentIntent ${paymentIntent.id} payment_method type: ${paymentMethod}`);
            } else {
              console.log(`PaymentIntent ${paymentIntent.id} has no payment_method`);
            }

            // Step 6: Fetch the latest charge and check for refunds
            let refundedDate: string | null = null;
            if (paymentIntent.latest_charge) {
              const chargeId = paymentIntent.latest_charge as string;
              console.log(`Fetching charge ${chargeId} for PaymentIntent ${paymentIntent.id}...`);
              const charge = await stripe.charges.retrieve(chargeId);

              // Fetch refunds associated with the charge
              const refunds = await stripe.refunds.list({
                charge: chargeId,
                limit: 1, // Get the most recent refund
              });

              if (refunds.data.length > 0) {
                const latestRefund = refunds.data[0];
                refundedDate = new Date(latestRefund.created * 1000).toISOString();
                console.log(`PaymentIntent ${paymentIntent.id} has a refund - refunded_date: ${refundedDate}`);
              } else {
                console.log(`PaymentIntent ${paymentIntent.id} has no refunds`);
              }
            } else {
              console.log(`PaymentIntent ${paymentIntent.id} has no latest_charge`);
            }

            // Step 7: Extract metadata
            const metadata = paymentIntent.metadata || {};
            console.log(`PaymentIntent ${paymentIntent.id} metadata:`, metadata);

            // Step 8: Prepare transaction data
            const transactionData = {
              stripe_transaction_id: paymentIntent.id,
              stripe_customer_id: stripeCustomerId,
              user_id: userId,
              amount: paymentIntent.amount / 100.0,
              currency: paymentIntent.currency.toUpperCase(),
              status: paymentIntent.status,
              created_at: new Date(paymentIntent.created * 1000).toISOString(),
              updated_at: new Date().toISOString(),
              description: paymentIntent.description || null,
              customer: customerName,
              email: customerEmail,
              payment_method: paymentMethod,
              refunded_date: refundedDate,
              metadata: metadata,
            };

            // Step 9: Insert or update the transaction
            if (existingTransaction) {
              const needsUpdate =
                existingTransaction.payment_method !== paymentMethod ||
                existingTransaction.refunded_date !== refundedDate ||
                JSON.stringify(existingTransaction.metadata) !== JSON.stringify(metadata);

              if (needsUpdate) {
                console.log(`Transaction ${paymentIntent.id} exists, updating fields...`);
                const { error: updateError } = await supabase
                  .from('transactions')
                  .update({
                    payment_method: paymentMethod,
                    refunded_date: refundedDate,
                    metadata: metadata,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('stripe_transaction_id', paymentIntent.id);

                if (updateError) {
                  console.error(`Failed to update transaction ${paymentIntent.id}:`, updateError);
                  return 0;
                }

                console.log(`Successfully updated transaction ${paymentIntent.id}`);
                return 1;
              } else {
                console.log(`Transaction ${paymentIntent.id} exists, no updates needed.`);
                return 0;
              }
            } else {
              console.log(`Inserting new transaction ${paymentIntent.id} with data:`, transactionData);
              const { error: insertError } = await supabase
                .from('transactions')
                .insert(transactionData);

              if (insertError) {
                console.error(`Failed to insert transaction ${paymentIntent.id}:`, insertError);
                return 0;
              }

              console.log(`Successfully inserted transaction ${paymentIntent.id}`);
              return 1;
            }
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