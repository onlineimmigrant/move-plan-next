import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Utility function to validate the request (optional, for security)
const verifyRequest = (request: Request) => {
  // In a production app, you should verify the request origin or use a secret token
  // For simplicity, we'll skip this for now, but you can add authentication
  return true;
};

export async function POST(request: Request) {
  try {
    if (!verifyRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    console.log('Received Realtime event:', payload);

    const { table, eventType, new: newData } = payload;

    // Handle updates to stripe_products
    if (table === 'stripe_products' && eventType === 'UPDATE') {
      console.log(`Processing update for stripe_products:`, newData);

      const { id, name, active, description, default_price, attrs } = newData;

      // Update the product in Stripe
      const updateParams: Stripe.ProductUpdateParams = {
        name,
        active,
        description: description || undefined,
        default_price: default_price || undefined,
        metadata: attrs || undefined,
      };

      console.log(`Updating Stripe product ${id} with params:`, updateParams);

      const updatedProduct = await stripe.products.update(id, updateParams);

      console.log(`Successfully updated Stripe product ${id}:`, updatedProduct);
      return NextResponse.json({ message: `Updated Stripe product ${id}` });
    }

    // Handle updates to stripe_prices
    if (table === 'stripe_prices' && eventType === 'UPDATE') {
      console.log(`Processing update for stripe_prices:`, newData);

      const { id, active, unit_amount, currency, metadata } = newData;

      // Update the price in Stripe
      const updateParams: Stripe.PriceUpdateParams = {
        active,
        metadata: metadata || undefined,
      };

      console.log(`Updating Stripe price ${id} with params:`, updateParams);

      const updatedPrice = await stripe.prices.update(id, updateParams);

      console.log(`Successfully updated Stripe price ${id}:`, updatedPrice);

      // Note: Stripe does not allow updating unit_amount or currency directly
      // To change these, you must create a new price and update the default_price on the product
      if (unit_amount || currency) {
        console.warn(`unit_amount or currency changed for price ${id}. You must create a new price in Stripe and update the product's default_price.`);
        // Optionally, implement logic to create a new price and update the product
      }

      return NextResponse.json({ message: `Updated Stripe price ${id}` });
    }

    return NextResponse.json({ message: 'Event processed or ignored' });
  } catch (error: any) {
    console.error('Error syncing to Stripe:', error.message, 'Stack:', error.stack);
    return NextResponse.json({ error: 'Failed to sync to Stripe' }, { status: 500 });
  }
}