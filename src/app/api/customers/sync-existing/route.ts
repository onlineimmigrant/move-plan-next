import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST() {
  try {
    console.log('Starting sync-existing process...');

    // Step 1: Fetch all user_ids from the customers table
    console.log('Fetching customer user_ids...');
    const { data: customerUserIds, error: customerError } = await supabase
      .from('customers')
      .select('user_id');

    if (customerError) {
      throw new Error(`Failed to fetch customer user_ids: ${customerError.message}`);
    }
    console.log('Fetched customer user_ids:', customerUserIds);

    // Extract the user_ids into an array
    const userIdsInCustomers = customerUserIds.map((customer) => customer.user_id);
    console.log('userIdsInCustomers:', userIdsInCustomers);

    // Step 2: Fetch profiles that are not in the customers table
    console.log('Fetching profiles...');
    let usersQuery = supabase
      .from('profiles')
      .select('id, full_name, email');

    if (userIdsInCustomers.length > 0) {
      usersQuery = usersQuery.not('id', 'in', `(${userIdsInCustomers.join(',')})`);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }
    console.log('Fetched users:', users);

    // Step 3: Process users in batches
    let syncedCount = 0;
    const batchSize = 10; // Process 10 users at a time
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(users.length / batchSize)}...`);
      
      const results = await Promise.all(
        batch.map(async (user) => {
          try {
            console.log(`Creating Stripe customer for user ${user.id}...`);
            const stripeCustomer = await stripe.customers.create({
              email: user.email,
              name: user.full_name || undefined,
              metadata: { supabase_user_id: user.id },
            });
            console.log(`Stripe customer created for user ${user.id}:`, stripeCustomer.id);

            console.log(`Inserting customer record for user ${user.id}...`);
            const { error: insertError } = await supabase
              .from('customers')
              .insert({
                user_id: user.id,
                stripe_customer_id: stripeCustomer.id,
              });

            if (insertError) {
              throw new Error(`Failed to insert customer for user ${user.id}: ${insertError.message}`);
            }
            console.log(`Customer record inserted for user ${user.id}`);
            return 1; // Success
          } catch (error) {
            console.error(`Failed to sync user ${user.id}:`, error);
            return 0; // Failure
          }
        })
      );

      // Explicitly type the accumulator as number to avoid strict 0 | 1 literal type
      const batchSyncedCount = results.reduce((sum: number, result: number) => sum + result, 0);
      syncedCount += batchSyncedCount;
      console.log(`Batch ${i / batchSize + 1} completed. Synced ${batchSyncedCount} users.`);
    }

    console.log('Sync completed successfully.');
    return NextResponse.json({
      message: `Synced ${syncedCount} users successfully`,
    });
  } catch (error) {
    console.error('Error syncing existing users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}