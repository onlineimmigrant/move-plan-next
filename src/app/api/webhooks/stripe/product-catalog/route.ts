import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, supabase } from '@/lib/stripe-supabase';

export async function POST(request: Request) {
  try {
    console.log('Received product catalog webhook request');
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_PRODUCT_CATALOG!;
    console.log('Webhook Secret:', webhookSecret ? '[REDACTED]' : 'MISSING');

    if (!webhookSecret) {
      console.error('Missing STRIPE_WEBHOOK_SECRET_PRODUCT_CATALOG');
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
    console.error('Error handling product catalog webhook event:', error.message, 'Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Product catalog webhook handler failed' },
      { status: 500 }
    );
  }
}