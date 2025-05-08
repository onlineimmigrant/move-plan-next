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

// Function to calculate end_date based on measure (day, week, month, year)
const calculateEndDate = (startDate: Date, measure: string): Date | null => {
  if (measure.toLowerCase().includes('one-time')) {
    return null; // Indefinite access for one-time products
  }

  const durationMatch = measure.toLowerCase().match(/(\d+)-(day|week|month|year)/);
  if (!durationMatch) {
    console.warn(`Unrecognized measure format: ${measure}`);
    return null; // Default to null if format is unrecognized
  }

  const [, durationStr, unit] = durationMatch;
  const duration = parseInt(durationStr, 10);
  const endDate = new Date(startDate);

  switch (unit) {
    case 'day':
      endDate.setDate(endDate.getDate() + duration);
      break;
    case 'week':
      endDate.setDate(endDate.getDate() + duration * 7); // 1 week = 7 days
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + duration);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + duration);
      break;
    default:
      console.warn(`Unsupported duration unit: ${unit}`);
      return null;
  }

  return endDate;
};

export async function POST() {
  try {
    console.log('Starting transaction sync process...');

    // Step 1: Fetch pricing plans for lookup (needed for purchases table)
    console.log('Fetching pricing plans from Supabase...');
    const { data: pricingPlansData, error: pricingPlansError } = await supabase
      .from('pricingplan')
      .select('id, measure');
    if (pricingPlansError) {
      console.error('Error fetching pricing plans:', pricingPlansError.message);
      throw new Error('Failed to fetch pricing plans');
    }
    console.log(`Fetched ${pricingPlansData.length} pricing plans`);

    const pricingPlanMap = new Map<string, any>(
      pricingPlansData.map(pp => [pp.id, pp])
    );

    // Step 2: Fetch PaymentIntents from Stripe
    console.log('Fetching PaymentIntents from Stripe...');
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      expand: ['data.payment_method'],
    });

    console.log(`Fetched ${paymentIntents.data.length} PaymentIntents from Stripe`);
    if (paymentIntents.data.length === 0) {
      console.log('No PaymentIntents found in Stripe. Ensure you have test data or live transactions.');
    }

    // Step 3: Process PaymentIntents in batches
    const batchSize = 10;
    let syncedCount = 0;
    let purchasesSyncedCount = 0;

    for (let i = 0; i < paymentIntents.data.length; i += batchSize) {
      const batch = paymentIntents.data.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(paymentIntents.data.length / batchSize)}...`);

      const results = await Promise.all(
        batch.map(async (paymentIntent) => {
          try {
            // Skip if no customer is associated
            if (!paymentIntent.customer || typeof paymentIntent.customer !== 'string') {
              console.log(`PaymentIntent ${paymentIntent.id} has no customer, skipping...`);
              return { transactionsSynced: 0, purchasesSynced: 0 };
            }

            const stripeCustomerId = paymentIntent.customer;
            console.log(`Processing PaymentIntent ${paymentIntent.id} for customer ${stripeCustomerId}`);

            // Fetch the customer details separately
            const customer = await stripe.customers.retrieve(stripeCustomerId);
            if ('deleted' in customer && customer.deleted) {
              console.log(`Customer ${stripeCustomerId} is deleted, skipping...`);
              return { transactionsSynced: 0, purchasesSynced: 0 };
            }

            const customerName = customer.name && customer.name.trim() !== '' ? customer.name : 'Unknown Customer';
            const customerEmail = customer.email && customer.email.trim() !== '' ? customer.email : 'Unknown Email';

            // Step 4: Look up the user_id from the customers table
            const { data: customerRecord, error: customerError } = await supabase
              .from('customers')
              .select('user_id')
              .eq('stripe_customer_id', stripeCustomerId)
              .single();

            if (customerError || !customerRecord) {
              console.error(`Failed to find user for customer ${stripeCustomerId}:`, customerError?.message);
              return { transactionsSynced: 0, purchasesSynced: 0 };
            }

            const userId = customerRecord.user_id;
            console.log(`Found user ${userId} for customer ${stripeCustomerId}`);

            // Step 5: Check if the transaction already exists
            const { data: existingTransaction, error: fetchError } = await supabase
              .from('transactions')
              .select('id, payment_method, refunded_date, metadata')
              .eq('stripe_transaction_id', paymentIntent.id)
              .single();

            if (fetchError && fetchError.code !== 'PGRST116') {
              console.error(`Error checking existing transaction ${paymentIntent.id}:`, fetchError);
              return { transactionsSynced: 0, purchasesSynced: 0 };
            }

            // Step 6: Extract payment method
            let paymentMethod = 'unknown';
            if (paymentIntent.payment_method) {
              console.log(`PaymentIntent ${paymentIntent.id} has payment_method ID: ${paymentIntent.payment_method}`);
              const pm = paymentIntent.payment_method as Stripe.PaymentMethod;
              paymentMethod = pm.type || 'unknown';
              console.log(`PaymentIntent ${paymentIntent.id} payment_method type: ${paymentMethod}`);
            } else {
              console.log(`PaymentIntent ${paymentIntent.id} has no payment_method`);
            }

            // Step 7: Fetch the latest charge and check for refunds
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

            // Step 8: Extract metadata
            const metadata = paymentIntent.metadata || {};
            console.log(`PaymentIntent ${paymentIntent.id} metadata:`, metadata);

            // Step 9: Prepare transaction data
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

            // Step 10: Insert or update the transaction
            let transactionsSynced = 0;
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
                  return { transactionsSynced: 0, purchasesSynced: 0 };
                }

                console.log(`Successfully updated transaction ${paymentIntent.id}`);
                transactionsSynced = 1;
              } else {
                console.log(`Transaction ${paymentIntent.id} exists, no updates needed.`);
                transactionsSynced = 0;
              }
            } else {
              console.log(`Inserting new transaction ${paymentIntent.id} with data:`, transactionData);
              const { error: insertError } = await supabase
                .from('transactions')
                .insert(transactionData);

              if (insertError) {
                console.error(`Failed to insert transaction ${paymentIntent.id}:`, insertError);
                return { transactionsSynced: 0, purchasesSynced: 0 };
              }

              console.log(`Successfully inserted transaction ${paymentIntent.id}`);
              transactionsSynced = 1;
            }

            // Step 11: Populate the purchases table
            let purchasesSynced = 0;
            if (metadata.items) {
              try {
                const items: { id: string; product_name: string; package: string; measure: string }[] = JSON.parse(
                  metadata.items
                );
                console.log(`Processing ${items.length} items for transaction ${paymentIntent.id}`);

                for (const item of items) {
                  const pricingPlan = pricingPlanMap.get(item.id);
                  if (!pricingPlan) {
                    console.warn(`Pricing plan not found for item_id: ${item.id} in transaction ${paymentIntent.id}`);
                    continue;
                  }

                  const startDate = new Date(paymentIntent.created * 1000);
                  const endDate = calculateEndDate(startDate, pricingPlan.measure);

                  // Check if the purchase record already exists
                  const { data: existingPurchase, error: fetchPurchaseError } = await supabase
                    .from('purchases')
                    .select('id')
                    .eq('purchased_item_id', item.id)
                    .eq('profiles_id', userId)
                    .eq('transaction_id', paymentIntent.id)
                    .single();

                  if (fetchPurchaseError && fetchPurchaseError.code !== 'PGRST116') {
                    console.error(`Error checking existing purchase for item ${item.id}:`, fetchPurchaseError);
                    continue;
                  }

                  if (existingPurchase) {
                    console.log(`Purchase for item ${item.id} in transaction ${paymentIntent.id} already exists, skipping...`);
                    continue;
                  }

                  // Insert into purchases table
                  const { error: purchaseError } = await supabase
                    .from('purchases')
                    .insert({
                      purchased_item_id: item.id,
                      profiles_id: userId,
                      transaction_id: paymentIntent.id,
                      start_date: startDate.toISOString(),
                      end_date: endDate ? endDate.toISOString() : null,
                      is_active: true,
                    });

                  if (purchaseError) {
                    console.error(`Failed to insert purchase for item ${item.id} in transaction ${paymentIntent.id}:`, purchaseError.message);
                    continue;
                  }

                  console.log(`Successfully inserted purchase for item ${item.id} in transaction ${paymentIntent.id}`);
                  purchasesSynced += 1;
                }
              } catch (parseError) {
                console.error(`Error parsing items for transaction ${paymentIntent.id}:`, parseError);
              }
            } else {
              console.log(`No items found in metadata for transaction ${paymentIntent.id}`);
            }

            return { transactionsSynced, purchasesSynced };
          } catch (error) {
            console.error(`Error processing PaymentIntent ${paymentIntent.id}:`, error);
            return { transactionsSynced: 0, purchasesSynced: 0 };
          }
        })
      );

      const batchTransactionsSynced = results.reduce((sum: number, result: { transactionsSynced: number }) => sum + result.transactionsSynced, 0);
      const batchPurchasesSynced = results.reduce((sum: number, result: { purchasesSynced: number }) => sum + result.purchasesSynced, 0);
      syncedCount += batchTransactionsSynced;
      purchasesSyncedCount += batchPurchasesSynced;
      console.log(
        `Batch ${i / batchSize + 1} completed. Synced ${batchTransactionsSynced} transactions and ${batchPurchasesSynced} purchases.`
      );
    }

    console.log('Transaction and purchase sync completed successfully.');
    return NextResponse.json({
      message: `Synced ${syncedCount} transactions and ${purchasesSyncedCount} purchases successfully`,
    });
  } catch (error: any) {
    console.error('Error syncing transactions:', error.message, 'Stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}