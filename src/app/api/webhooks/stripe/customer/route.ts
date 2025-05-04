import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, supabase, supabaseAdmin } from '@/lib/stripe-supabase';

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
    }

    let userId: string;
    let temporaryPassword: string | null = null;

    if (existingUser) {
      console.log('User already exists in auth.users with ID:', existingUser.id);
      userId = existingUser.id;
    } else {
      temporaryPassword = generateTemporaryPassword();
      console.log('Generated temporary password for new user:', temporaryPassword);

      console.log('Creating new user in auth.users with email:', email);
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
              temporaryPassword = null; // Since the user already exists, no temporary password
            } else {
              throw new Error(`Failed to create user: ${publicError.message}`);
            }
          } else {
            if (!publicUser.user) {
              console.error('Public API returned no user');
              throw new Error('Failed to create user: No user data returned');
            }
            userId = publicUser.user.id;
            console.log('Successfully created user with public API, ID:', userId);
          }
        } else {
          userId = newUser.user.id;
          console.log('Successfully created user with admin API, ID:', userId);
        }
      } catch (err: any) {
        console.error('Error creating user:', err.message, 'Stack:', err.stack);
        throw new Error(`Failed to create user: ${err.message}`);
      }
    }

    // Use upsert to create or update the profiles entry
    console.log('Upserting profiles entry for user ID:', userId);
    const profileData = {
      id: userId,
      email,
      full_name: name || email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      role: 'user',
    };

    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' });

    if (upsertError) {
      console.error('Error upserting profiles entry:', upsertError);
      throw new Error(`Failed to upsert profiles entry: ${upsertError.message}`);
    }

    console.log('Successfully upserted profiles entry for user ID:', userId);
    return { userId, temporaryPassword };
  } catch (err: any) {
    console.error('Error in getOrCreateUser:', err.message, 'Stack:', err.stack);
    throw err;
  }
};

export async function POST(request: Request) {
  try {
    console.log('Received customer webhook request');
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_CUSTOMER;
    console.log('Webhook Secret:', webhookSecret ? '[REDACTED]' : 'MISSING');

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET_CUSTOMER');
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

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error handling customer webhook event:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Customer webhook handler failed' },
      { status: 500 }
    );
  }
}