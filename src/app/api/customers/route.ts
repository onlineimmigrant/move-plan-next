import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function POST(req: Request) {
  const { userId } = await req.json();

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    // Fetch user email and full_name from profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found for user' }, { status: 404 });
    }

    // Check for existing customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingCustomer) {
      return NextResponse.json({
        message: 'Customer already exists',
        stripeCustomerId: existingCustomer.stripe_customer_id,
      });
    }

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: profile.email,
      name: profile.email || undefined,
      metadata: { supabase_user_id: userId },
    });

    // Insert into customers table
    const { error: insertError } = await supabase
      .from('customers')
      .insert({
        user_id: userId,
        stripe_customer_id: stripeCustomer.id,
      });

    if (insertError) {
      throw new Error('Failed to insert customer into Supabase');
    }

    return NextResponse.json({
      message: 'Customer created successfully',
      stripeCustomerId: stripeCustomer.id,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}