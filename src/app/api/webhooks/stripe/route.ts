import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationStripeKeys } from '@/lib/getStripeKeys';

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Role Key:', supabaseServiceRoleKey ? '[REDACTED]' : 'MISSING');

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

// Access the Supabase Auth admin API
const supabaseAdmin = supabase.auth.admin;

// Define the type for the RPC result
interface UserByEmail {
  id: string;
  email: string;
}

// Function to generate a random temporary password
const generateTemporaryPassword = () => {
  return Math.random().toString(36).slice(2, 10); // 8-character random password
};

// Function to create or retrieve a user and sync with profiles table
const getOrCreateUser = async (email: string, name?: string) => {
  console.log('Checking for existing user in auth.users with email:', email);

  try {
    // Check if user exists in auth.users using RPC
    console.log('Calling get_user_by_email RPC for email:', email);
    const { data: existingUser, error: rpcError } = await supabase
      .rpc('get_user_by_email', { email_input: email })
      .single() as { data: UserByEmail | null; error: any };

    if (rpcError) {
      console.error('Error calling get_user_by_email RPC:', rpcError);
      console.log('Falling back to user creation with duplicate email check');
    } else if (existingUser) {
      console.log('User already exists in auth.users with ID:', existingUser.id);
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', existingUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error checking profiles entry:', profileError);
        throw new Error(`Failed to check profiles entry: ${profileError.message}`);
      }

      if (!existingProfile) {
        console.log('Creating profiles entry for existing user ID:', existingUser.id);
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: existingUser.id,
            email,
            full_name: name || email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            role: 'user',
          });

        if (insertError) {
          console.error('Error creating profiles entry for existing user:', insertError);
          throw new Error(`Failed to create profiles entry: ${insertError.message}`);
        }
        console.log('Successfully created profiles entry for existing user ID:', existingUser.id);
      } else {
        console.log('Profiles entry already exists for user ID:', existingUser.id);
      }

      return { userId: existingUser.id, temporaryPassword: null };
    }

    const temporaryPassword = generateTemporaryPassword();
    console.log('Generated temporary password for new user:', temporaryPassword);

    console.log('Creating new user in auth.users with email:', email);
    let userId: string;
    try {
      const { data: newUser, error: userCreateError } = await supabaseAdmin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          name: name || email,
          created_via: 'stripe_customer',
        },
      });

      if (userCreateError) {
        console.error('Error creating user with admin API:', userCreateError);
        console.log('Falling back to public auth.signUp');
        const { data: publicUser, error: publicError } = await supabase.auth.signUp({
          email,
          password: temporaryPassword,
          options: {
            data: {
              name: name || email,
              created_via: 'stripe_customer',
            },
          },
        });

        if (publicError) {
          console.error('Error creating user with public API:', publicError);
          if (publicError.message.toLowerCase().includes('duplicate') || publicError.message.toLowerCase().includes('already registered')) {
            console.log('Duplicate email detected, attempting to fetch existing user');
            const { data: retryUser, error: retryError } = await supabase
              .rpc('get_user_by_email', { email_input: email })
              .single() as { data: UserByEmail | null; error: any };

            if (retryError || !retryUser) {
              throw new Error(`Failed to fetch existing user after duplicate error: ${retryError?.message || 'No user found'}`);
            }

            userId = retryUser.id;
            console.log('Found existing user after duplicate error, ID:', userId);

            const { data: existingProfile, error: profileError } = await supabase
              .from('profiles')
              .select('id')
              .eq('id', userId)
              .single();

            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error checking profiles entry:', profileError);
              throw new Error(`Failed to check profiles entry: ${profileError.message}`);
            }

            if (!existingProfile) {
              console.log('Creating profiles entry for existing user ID:', userId);
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  email,
                  full_name: name || email,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  role: 'user',
                });

              if (insertError) {
                console.error('Error creating profiles entry for existing user:', insertError);
                throw new Error(`Failed to create profiles entry: ${insertError.message}`);
              }
              console.log('Successfully created profiles entry for existing user ID:', userId);
            }

            return { userId, temporaryPassword: null };
          }
          throw new Error(`Failed to create user: ${publicError.message}`);
        }

        if (!publicUser.user) {
          console.error('Public API returned no user');
          throw new Error('Failed to create user: No user data returned');
        }

        userId = publicUser.user.id;
        console.log('Successfully created user with public API, ID:', userId);
      } else {
        userId = newUser.user.id;
        console.log('Successfully created user with admin API, ID:', userId);
      }
    } catch (err: any) {
      console.error('Error creating user:', err.message, 'Stack:', err.stack);
      throw new Error(`Failed to create user: ${err.message}`);
    }

    console.log('Creating profiles entry for new user ID:', userId);
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        full_name: name || email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: 'user',
      });

    if (profileError) {
      console.error('Error creating profiles entry:', profileError);
      throw new Error(`Failed to create profiles entry: ${profileError.message}`);
    }

    console.log('Successfully created profiles entry for user ID:', userId);
    return { userId, temporaryPassword };
  } catch (err: any) {
    console.error('Error in getOrCreateUser:', err.message, 'Stack:', err.stack);
    throw err;
  }
};

/**
 * Extract organization ID from Stripe event data
 * Tries multiple metadata paths depending on event type
 */
function extractOrganizationId(eventData: any): string | null {
  const obj = eventData?.data?.object;
  if (!obj) return null;

  // Try direct metadata
  if (obj.metadata?.organization_id) {
    return obj.metadata.organization_id;
  }

  // Try subscription metadata (for subscription events)
  if (obj.subscription?.metadata?.organization_id) {
    return obj.subscription.metadata.organization_id;
  }

  // Try customer metadata (for customer events)
  if (obj.customer?.metadata?.organization_id) {
    return obj.customer.metadata.organization_id;
  }

  // Try invoice's subscription metadata
  if (obj.subscription && typeof obj.subscription === 'string') {
    // Subscription ID only, can't extract metadata without fetching
    return null;
  }

  return null;
}

export async function POST(request: Request) {
  try {
    console.log('Received webhook request');
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    if (!signature) {
      console.error('Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Parse event data to extract organization ID (before signature verification)
    let eventData: any;
    try {
      eventData = JSON.parse(rawBody);
    } catch (err) {
      console.error('Failed to parse webhook body');
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Extract organization ID from metadata
    let organizationId = extractOrganizationId(eventData);
    console.log('[Webhook] Extracted organization_id:', organizationId);

    // Fallback: try to use default/first organization if no metadata
    // This handles Stripe objects created outside our application
    if (!organizationId) {
      console.warn('[Webhook] No organization_id in metadata - trying fallback');
      
      // Try to get default organization (you may want to customize this logic)
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id, stripe_webhook_secret, stripe_secret_key')
        .not('stripe_webhook_secret', 'is', null)
        .limit(1);
      
      if (orgError || !orgs || orgs.length === 0) {
        console.error('[Webhook] No organization found and no fallback available');
        return NextResponse.json({ 
          error: 'No organization ID in metadata. Ensure organization_id is set when creating Stripe objects.' 
        }, { status: 400 });
      }
      
      // Use first organization as fallback
      organizationId = orgs[0].id;
      console.log('[Webhook] Using fallback organization:', organizationId);
    }

    // Fetch organization-specific Stripe keys
    console.log('[Webhook] Fetching keys for organization:', organizationId);
    
    if (!organizationId) {
      console.error('[Webhook] Organization ID is null after fallback attempts');
      return NextResponse.json({ 
        error: 'Could not determine organization for this webhook event' 
      }, { status: 400 });
    }
    
    const stripeKeys = await getOrganizationStripeKeys(organizationId);
    
    if (!stripeKeys.webhookSecret) {
      console.error('[Webhook] No webhook secret configured for organization:', organizationId);
      return NextResponse.json({ 
        error: 'Webhook secret not configured for this organization' 
      }, { status: 400 });
    }

    if (!stripeKeys.secretKey) {
      console.error('[Webhook] No secret key configured for organization:', organizationId);
      return NextResponse.json({ 
        error: 'Stripe secret key not configured for this organization' 
      }, { status: 400 });
    }

    // Create organization-specific Stripe instance
    const stripe = new Stripe(stripeKeys.secretKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Verify webhook signature with organization's webhook secret
    let event: Stripe.Event;
    try {
      console.log('[Webhook] Verifying signature for organization:', organizationId);
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeKeys.webhookSecret);
      console.log('[Webhook] Signature verified successfully. Event type:', event.type, 'ID:', event.id);
    } catch (err: any) {
      console.error('[Webhook] Signature verification failed for organization:', organizationId, 'Error:', err.message);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Validation: Ensure metadata org matches extracted org (security check)
    const metadataOrgId = extractOrganizationId({ data: { object: event.data.object } });
    if (metadataOrgId && metadataOrgId !== organizationId) {
      console.warn('[Webhook] Organization ID mismatch!', { 
        extracted: organizationId, 
        metadata: metadataOrgId 
      });
    }

    // Handle the customer.created event
    if (event.type === 'customer.created') {
      console.log('Processing customer.created event:', event.data.object);
      const customer = event.data.object as Stripe.Customer;

      const customerId = customer.id;
      const customerEmail = customer.email;
      const customerName = customer.name;

      if (!customerEmail) {
        console.log('Customer has no email, skipping user creation and Supabase storage');
        return NextResponse.json({ received: true });
      }

      console.log('Customer email:', customerEmail, 'Customer name:', customerName);

      // Check if customer already exists in Supabase
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
        return NextResponse.json({ received: true });
      }

      // Create or get user
      const { userId, temporaryPassword } = await getOrCreateUser(
        customerEmail!,
        customerName ?? undefined
      );

      if (temporaryPassword) {
        console.log('Generating signup link for user');
        const { data: resetData, error: resetError } = await supabaseAdmin.generateLink({
          type: 'signup',
          email: customerEmail!,
          password: temporaryPassword,
        });

        if (resetError) {
          console.error('Error generating signup link:', resetError);
          throw new Error(`Failed to generate signup link: ${resetError.message}`);
        }

        console.log('Signup link generated:', resetData.properties.action_link);
        // TODO: Send the signup link to the user via email
      }

      console.log('Storing customer in Supabase:', {
        stripe_customer_id: customerId,
        user_id: userId,
        temporary_password: temporaryPassword,
      });

      const { data, error: insertError } = await supabase
        .from('customers')
        .insert({
          stripe_customer_id: customerId,
          user_id: userId,
          temporary_password: temporaryPassword,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase customer insert error details:', insertError);
        throw new Error(`Failed to store customer record: ${insertError.message}`);
      }

      console.log('Successfully stored customer in Supabase with ID:', data.id);
    }

    // Handle the payment_intent.succeeded event to store existing customers and transactions
    if (event.type === 'payment_intent.succeeded') {
      console.log('Processing payment_intent.succeeded event:', event.data.object);
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Check if this payment is for a subscription invoice
      const subscriptionId = paymentIntent.metadata?.subscription_id;
      const invoiceId = paymentIntent.metadata?.invoice_id;

      if (subscriptionId && invoiceId) {
        console.log('[Webhook] Payment is for subscription invoice:', invoiceId);
        try {
          const invoice = await stripe.invoices.retrieve(invoiceId);
          
          // DO NOT finalize draft invoices - this triggers automatic payment if customer has default PM
          // We can pay draft invoices directly with paid_out_of_band
          
          if ((invoice.status === 'open' || invoice.status === 'draft') && paymentIntent.payment_method) {
            console.log('[Webhook] Settling draft/open invoice with paid_out_of_band (payment already collected)');
            
            // Update invoice metadata to track the manual payment
            await stripe.invoices.update(invoiceId, {
              metadata: {
                webhook_payment_intent: paymentIntent.id,
                webhook_payment_completed: new Date().toISOString(),
              },
            });
            
            // Use paid_out_of_band to activate subscription without creating duplicate charge
            // The actual payment was already collected via the manual PaymentIntent
            await stripe.invoices.pay(invoiceId, { paid_out_of_band: true });
            console.log('[Webhook] Invoice marked paid (out-of-band) to activate subscription');
          } else {
            console.log('[Webhook] Invoice already settled, status:', invoice.status);
          }
        } catch (invoiceError: any) {
          console.error('[Webhook] Failed to settle invoice:', invoiceError.message);
        }
      }

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
        // Create or get user if customer doesn't exist
        console.log('Customer not found in Supabase, creating user and storing customer:', customerId);
        const { userId, temporaryPassword } = await getOrCreateUser(
          customer.email!,
          customer.name ?? undefined
        );

        if (temporaryPassword) {
          console.log('Generating signup link for user');
          const { data: resetData, error: resetError } = await supabaseAdmin.generateLink({
            type: 'signup',
            email: customer.email!,
            password: temporaryPassword,
          });

          if (resetError) {
            console.error('Error generating signup link:', resetError);
            throw new Error(`Failed to generate signup link: ${resetError.message}`);
          }

          console.log('Signup link generated:', resetData.properties.action_link);
          // TODO: Send the signup link to the user via email
        }

        console.log('Storing customer in Supabase from payment_intent.succeeded:', {
          stripe_customer_id: customerId,
          user_id: userId,
          temporary_password: temporaryPassword,
        });

        const { data, error: insertError } = await supabase
          .from('customers')
          .insert({
            stripe_customer_id: customerId,
            user_id: userId,
            temporary_password: temporaryPassword,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error('Supabase customer insert error details:', insertError);
          throw new Error(`Failed to store customer record: ${insertError.message}`);
        }

        console.log('Successfully stored customer in Supabase with ID:', data.id);
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

    // Handle subscription events
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      console.log(`Processing ${event.type} event:`, event.data.object);
      const subscription = event.data.object as Stripe.Subscription;
      
      // Extract organization_id from subscription metadata if available
      const subOrgId = subscription.metadata?.organization_id;
      if (!subOrgId && organizationId) {
        // Add organization_id to subscription for future events
        try {
          await stripe.subscriptions.update(subscription.id, {
            metadata: {
              ...subscription.metadata,
              organization_id: organizationId,
            },
          });
          console.log('[Webhook] Added organization_id to subscription metadata');
        } catch (updateErr: any) {
          console.warn('[Webhook] Could not update subscription metadata:', updateErr.message);
        }
      }

      const subscriptionData = {
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        // Customer may be a string ID or a DeletedCustomer; safely access email
        customer_email: typeof subscription.customer === 'string' ? null : (subscription.customer as any)?.email ?? null,
        status: subscription.status,
        current_period_start: (subscription as any)?.current_period_start ? new Date((subscription as any).current_period_start * 1000).toISOString() : null,
        current_period_end: (subscription as any)?.current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null,
        // cancel_at_period_end column doesn't exist in schema - removed
        cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      console.log('Upserting subscription into subscriptions:', subscriptionData);

      const { error: upsertError } = await supabase
        .from('subscriptions')
        .upsert(subscriptionData, { onConflict: 'stripe_subscription_id' });

      if (upsertError) {
        console.error(`Failed to upsert subscription ${subscription.id}:`, upsertError);
        throw new Error(`Failed to upsert subscription: ${upsertError.message}`);
      }

      console.log(`Successfully upserted subscription ${subscription.id} into subscriptions`);
      return NextResponse.json({ received: true });
    }

    // Handle subscription deletion
    if (event.type === 'customer.subscription.deleted') {
      console.log(`Processing customer.subscription.deleted event:`, event.data.object);
      const subscription = event.data.object as Stripe.Subscription;

      console.log(`Updating subscription ${subscription.id} status to cancelled`);

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);

      if (updateError) {
        console.error(`Failed to update subscription ${subscription.id}:`, updateError);
        throw new Error(`Failed to update subscription: ${updateError.message}`);
      }

      console.log(`Successfully updated subscription ${subscription.id} to cancelled`);
      return NextResponse.json({ received: true });
    }

    // Handle invoice payment succeeded (for subscription renewals)
    if (event.type === 'invoice.payment_succeeded') {
      console.log(`Processing invoice.payment_succeeded event:`, event.data.object);
      const invoice = event.data.object as any;

      // Log payment
      if ((invoice as any).subscription) {
        console.log('Recording successful subscription payment:', {
          invoice_id: invoice.id,
          subscription_id: (invoice as any).subscription,
          amount: invoice.amount_paid / 100.0,
        });

        // Update subscription status if needed
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', (invoice as any).subscription);

        if (updateError) {
          console.error(`Failed to update subscription status:`, updateError);
        }
      }

      return NextResponse.json({ received: true });
    }

    // Handle invoice payment failed (for subscription renewals)
    if (event.type === 'invoice.payment_failed') {
      console.log(`Processing invoice.payment_failed event:`, event.data.object);
      const invoice = event.data.object as any;

      // Update subscription status to past_due
      if ((invoice as any).subscription) {
        console.log('Marking subscription as past_due:', (invoice as any).subscription);

        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', (invoice as any).subscription);

        if (updateError) {
          console.error(`Failed to update subscription status:`, updateError);
        }
      }

      return NextResponse.json({ received: true });
    }

    // Handle product.created and product.updated events
    if (event.type === 'product.created' || event.type === 'product.updated') {
      console.log(`Processing ${event.type} event:`, event.data.object);
      const product = event.data.object as Stripe.Product;

      const productData = {
        id: product.id,
        name: product.name,
        active: product.active,
        description: product.description || null,
        created: new Date(product.created * 1000).toISOString(),
        updated: product.updated ? new Date(product.updated * 1000).toISOString() : new Date().toISOString(),
        default_price: product.default_price as string | null,
        attrs: product.metadata ? JSON.parse(JSON.stringify(product.metadata)) : {},
      };

      console.log('Upserting product into stripe_products:', productData);

      const { error: upsertError } = await supabase
        .from('stripe_products')
        .upsert(productData, { onConflict: 'id' });

      if (upsertError) {
        console.error(`Failed to upsert product ${product.id}:`, upsertError);
        throw new Error(`Failed to upsert product: ${upsertError.message}`);
      }

      console.log(`Successfully upserted product ${product.id} into stripe_products`);
      return NextResponse.json({ received: true });
    }

    // Handle price.created and price.updated events
    if (event.type === 'price.created' || event.type === 'price.updated') {
      console.log(`Processing ${event.type} event:`, event.data.object);
      const price = event.data.object as Stripe.Price;

      const priceData = {
        id: price.id,
        product_id: price.product as string,
        active: price.active,
        currency: price.currency,
        unit_amount: price.unit_amount || null,
        type: price.type,
        recurring_interval: price.recurring?.interval || null,
        recurring_interval_count: price.recurring?.interval_count || null,
        created: new Date(price.created * 1000).toISOString(),
        attrs: price.metadata ? JSON.parse(JSON.stringify(price.metadata)) : {},
      };

      console.log('Upserting price into stripe_prices:', priceData);

      const { error: upsertError } = await supabase
        .from('stripe_prices')
        .upsert(priceData, { onConflict: 'id' });

      if (upsertError) {
        console.error(`Failed to upsert price ${price.id}:`, upsertError);
        throw new Error(`Failed to upsert price: ${upsertError.message}`);
      }

      console.log(`Successfully upserted price ${price.id} into stripe_prices`);
      return NextResponse.json({ received: true });
    }

    // Handle product.deleted event
    if (event.type === 'product.deleted') {
      console.log(`Processing product.deleted event:`, event.data.object);
      const product = event.data.object as Stripe.Product;

      console.log(`Deleting product ${product.id} from stripe_products`);

      const { error: deleteError } = await supabase
        .from('stripe_products')
        .delete()
        .eq('id', product.id);

      if (deleteError) {
        console.error(`Failed to delete product ${product.id}:`, deleteError);
        throw new Error(`Failed to delete product: ${deleteError.message}`);
      }

      console.log(`Successfully deleted product ${product.id} from stripe_products`);
      return NextResponse.json({ received: true });
    }

    // Handle price.deleted event
    if (event.type === 'price.deleted') {
      console.log(`Processing price.deleted event:`, event.data.object);
      const price = event.data.object as Stripe.Price;

      console.log(`Deleting price ${price.id} from stripe_prices`);

      const { error: deleteError } = await supabase
        .from('stripe_prices')
        .delete()
        .eq('id', price.id);

      if (deleteError) {
        console.error(`Failed to delete price ${price.id}:`, deleteError);
        throw new Error(`Failed to delete price: ${deleteError.message}`);
      }

      console.log(`Successfully deleted price ${price.id} from stripe_prices`);
      return NextResponse.json({ received: true });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook event:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}