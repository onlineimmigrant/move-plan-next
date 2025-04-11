import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const { amount, currency, metadata } = await request.json();

    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Missing amount or currency' },
        { status: 400 }
      );
    }

    // Create a Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Amount in cents
      currency: currency,
      payment_method_types: ['card'],
      metadata: metadata || {},
    });

    return NextResponse.json({ client_secret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating Payment Intent:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Payment Intent' },
      { status: 500 }
    );
  }
}