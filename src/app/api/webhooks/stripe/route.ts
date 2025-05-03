import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

export async function POST(request: Request) {
  try {
    console.log('Received webhook request');
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    console.log('Webhook Secret:', webhookSecret ? '[REDACTED]' : 'MISSING');

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET');
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
        amount: paymentIntent.amount / 100.0, // Convert cents to dollars
        currency: paymentIntent.currency.toUpperCase(), // Uppercase currency
        status: paymentIntent.status,
        customer: customerName, // Store the customer's name
        email: customerEmail, // Store the customer's email
      });

      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          stripe_transaction_id: paymentIntent.id,
          stripe_customer_id: customerId,
          user_id: userId,
          amount: paymentIntent.amount / 100.0, // Convert cents to dollars
          currency: paymentIntent.currency.toUpperCase(), // Uppercase currency
          status: paymentIntent.status,
          created_at: new Date(paymentIntent.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          description: paymentIntent.description || null,
          customer: customerName, // Store the customer's name
          email: customerEmail, // Store the customer's email
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
    console.error('Error handling webhook event:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
}