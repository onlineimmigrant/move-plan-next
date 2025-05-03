import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { userId, stripeCustomerId } = await request.json();
    console.log('Received request to link Stripe customer:', { userId, stripeCustomerId });

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      console.error('Validation failed: Invalid user ID');
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    if (!stripeCustomerId || typeof stripeCustomerId !== 'string') {
      console.error('Validation failed: Invalid Stripe customer ID');
      return NextResponse.json(
        { error: 'Invalid Stripe customer ID' },
        { status: 400 }
      );
    }

    // Insert or update the customers table with the stripe_customer_id
    console.log('Inserting Stripe customer ID into customers table:', stripeCustomerId);
    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
      });

    if (customerError) {
      console.error('Error inserting customer into database:', customerError);
      throw new Error(`Failed to insert customer into database: ${customerError.message}`);
    }

    console.log('Inserted customer into database:', {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error linking Stripe customer:', error);
    return NextResponse.json(
      { error: 'Failed to link Stripe customer: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}