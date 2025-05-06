import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, supabase } from '@/lib/stripe-supabase';

const verifyRequest = (request: Request) => {
  const authHeader = request.headers.get('Authorization');
  const expectedToken = `Bearer ${process.env.SYNC_API_SECRET}`;
  const isValid = authHeader === expectedToken;
  if (!isValid) {
    console.error('Authentication failed: Invalid or missing Authorization header', { authHeader });
  }
  return isValid;
};

// Validate image URLs
function validateImageUrls(urls: any): string[] | undefined {
  console.log('Validating image URLs:', urls);

  if (!urls || !Array.isArray(urls)) {
    console.warn('links_to_image is not an array or is null/undefined:', urls);
    return undefined;
  }

  const validUrls = urls.filter((url: any) => {
    if (typeof url !== 'string') {
      console.warn('Invalid URL type (not a string):', url);
      return false;
    }
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      console.warn('Invalid image URL:', url);
      return false;
    }
  });

  return validUrls.length > 0 ? validUrls : undefined;
}

export async function POST(request: Request) {
  try {
    // Verify authentication
    if (!verifyRequest(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse payload
    let payload;
    try {
      payload = await request.json();
      console.log('Received Supabase sync event:', JSON.stringify(payload, null, 2));
    } catch (error: any) {
      console.error('Failed to parse request body:', error.message);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate payload structure
    const { table, eventType, new: newData, old: oldData } = payload;
    if (!table || !eventType) {
      console.error('Invalid payload structure:', { table, eventType });
      return NextResponse.json({ error: 'Missing table or eventType in payload' }, { status: 400 });
    }

    // Handle INSERT in product
    if (table === 'product' && eventType === 'INSERT') {
      if (!newData?.id || !newData?.product_name) {
        console.error('Invalid product INSERT payload:', newData);
        return NextResponse.json({ error: 'Missing id or product_name in newData' }, { status: 400 });
      }

      const { id, product_name, is_displayed, product_description, links_to_image, attrs } = newData;

      const createParams: Stripe.ProductCreateParams = {
        name: product_name,
        active: is_displayed ?? true,
        description: product_description || undefined,
        images: validateImageUrls(links_to_image),
        metadata: attrs || undefined,
      };

      console.log('Creating Stripe product:', createParams);
      const stripeProduct = await stripe.products.create(createParams);

      const { error: updateError } = await supabase
        .from('product')
        .update({ stripe_product_id: stripeProduct.id })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to update product with stripe_product_id:', updateError);
        throw new Error(`Failed to update product: ${updateError.message}`);
      }

      console.log(`Created Stripe product ${stripeProduct.id} for product ${id}`);
      return NextResponse.json({ message: `Created Stripe product ${stripeProduct.id}` });
    }

    // Handle UPDATE in product
    if (table === 'product' && eventType === 'UPDATE') {
      if (!newData?.id || !newData?.product_name) {
        console.error('Invalid product UPDATE payload:', newData);
        return NextResponse.json({ error: 'Missing id or product_name in newData' }, { status: 400 });
      }

      const { id, stripe_product_id, product_name, is_displayed, product_description, links_to_image, attrs } = newData;

      if (!stripe_product_id) {
        console.log(`Product ${id} lacks stripe_product_id, creating new`);
        const createParams: Stripe.ProductCreateParams = {
          name: product_name,
          active: is_displayed ?? true,
          description: product_description || undefined,
          images: validateImageUrls(links_to_image),
          metadata: attrs || undefined,
        };

        const stripeProduct = await stripe.products.create(createParams);

        const { error: updateError } = await supabase
          .from('product')
          .update({ stripe_product_id: stripeProduct.id })
          .eq('id', id);

        if (updateError) {
          console.error('Failed to update product with stripe_product_id:', updateError);
          throw new Error(`Failed to update product: ${updateError.message}`);
        }

        console.log(`Created Stripe product ${stripeProduct.id} for product ${id}`);
        return NextResponse.json({ message: `Created Stripe product ${stripeProduct.id}` });
      }

      if (
        oldData?.product_name === newData.product_name &&
        oldData?.is_displayed === newData.is_displayed &&
        oldData?.product_description === newData.product_description &&
        JSON.stringify(oldData?.links_to_image || []) === JSON.stringify(newData.links_to_image || []) &&
        JSON.stringify(oldData?.attrs || {}) === JSON.stringify(newData.attrs || {})
      ) {
        console.log(`No changes for product ${id}, skipping`);
        return NextResponse.json({ message: 'No changes to sync' });
      }

      const updateParams: Stripe.ProductUpdateParams = {
        name: product_name,
        active: is_displayed ?? true,
        description: product_description || undefined,
        images: validateImageUrls(links_to_image),
        metadata: attrs || undefined,
      };

      console.log('Updating Stripe product:', updateParams);
      await stripe.products.update(stripe_product_id, updateParams);

      console.log(`Updated Stripe product ${stripe_product_id}`);
      return NextResponse.json({ message: `Updated Stripe product ${stripe_product_id}` });
    }

    // Handle DELETE in product
    if (table === 'product' && eventType === 'DELETE') {
      if (!oldData?.id) {
        console.error('Invalid product DELETE payload:', oldData);
        return NextResponse.json({ error: 'Missing id in oldData' }, { status: 400 });
      }

      const { id, stripe_product_id } = oldData;

      if (!stripe_product_id) {
        console.log(`Product ${id} lacks stripe_product_id, nothing to delete`);
        return NextResponse.json({ message: 'Nothing to delete in Stripe' });
      }

      console.log('Deleting Stripe product:', stripe_product_id);
      try {
        await stripe.products.del(stripe_product_id);
        console.log(`Deleted Stripe product ${stripe_product_id}`);
      } catch (error: any) {
        if (error.statusCode === 404) {
          console.log(`Product ${stripe_product_id} already deleted in Stripe`);
        } else {
          console.error('Failed to delete Stripe product:', error.message);
          throw error;
        }
      }

      return NextResponse.json({ message: `Deleted Stripe product ${stripe_product_id}` });
    }

    // Handle INSERT in pricingplan
    if (table === 'pricingplan' && eventType === 'INSERT') {
      if (!newData?.id || !newData?.product_id || !newData?.price || !newData?.currency || !newData?.type) {
        console.error('Invalid pricingplan INSERT payload:', newData);
        return NextResponse.json({ error: 'Missing required fields in newData' }, { status: 400 });
      }

      const { id, product_id, price, currency, is_active, type, recurring_interval, recurring_interval_count, attrs } = newData;

      const { data: product, error: productError } = await supabase
        .from('product')
        .select('stripe_product_id')
        .eq('id', product_id)
        .single();

      if (productError || !product || !product.stripe_product_id) {
        console.error('Product not found or not synced:', { product_id, productError });
        return NextResponse.json({ error: 'Product not found or not synced with Stripe' }, { status: 400 });
      }

      const createParams: Stripe.PriceCreateParams = {
        product: product.stripe_product_id,
        unit_amount: price,
        currency,
        active: is_active ?? true,
        recurring: type === 'recurring' ? { interval: recurring_interval, interval_count: recurring_interval_count || 1 } : undefined,
        metadata: attrs || undefined,
      };

      console.log('Creating Stripe price:', createParams);
      const stripePrice = await stripe.prices.create(createParams);

      // Update Supabase with the new stripe_price_id
      const { error: updateError } = await supabase
        .from('pricingplan')
        .update({ stripe_price_id: stripePrice.id })
        .eq('id', id);

      if (updateError) {
        console.error('Failed to update pricingplan with stripe_price_id:', updateError);
        throw new Error(`Failed to update pricingplan: ${updateError.message}`);
      }

      // Set default_price if not already set
      const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
      if (!stripeProduct.default_price) {
        await stripe.products.update(product.stripe_product_id, { default_price: stripePrice.id });
        console.log(`Set default_price ${stripePrice.id} for product ${product.stripe_product_id}`);
      }

      console.log(`Created Stripe price ${stripePrice.id} for pricingplan ${id}`);
      return NextResponse.json({ message: `Created Stripe price ${stripePrice.id}` });
    }

    // Handle UPDATE in pricingplan
    if (table === 'pricingplan' && eventType === 'UPDATE') {
      if (!newData?.id || !newData?.product_id || !newData?.price || !newData?.currency || !newData?.type) {
        console.error('Invalid pricingplan UPDATE payload:', newData);
        return NextResponse.json({ error: 'Missing required fields in newData' }, { status: 400 });
      }

      const { id, stripe_price_id, product_id, price, currency, is_active, type, recurring_interval, recurring_interval_count, attrs } = newData;
      const { stripe_price_id: oldStripePriceId } = oldData;

      // Skip if the only change is the stripe_price_id (likely from a previous sync)
      if (
        oldData?.price === newData.price &&
        oldData?.currency === newData.currency &&
        oldData?.is_active === newData.is_active &&
        oldData?.type === newData.type &&
        oldData?.recurring_interval === newData.recurring_interval &&
        oldData?.recurring_interval_count === newData.recurring_interval_count &&
        JSON.stringify(oldData?.attrs || {}) === JSON.stringify(newData.attrs || {}) &&
        oldStripePriceId !== stripe_price_id // The only change is stripe_price_id
      ) {
        console.log(`Only stripe_price_id changed for pricingplan ${id}, likely from sync, skipping`);
        return NextResponse.json({ message: 'No meaningful changes to sync' });
      }

      // If there's no stripe_price_id, create a new price
      if (!stripe_price_id) {
        console.log(`Pricingplan ${id} lacks stripe_price_id, creating new`);
        const { data: product, error: productError } = await supabase
          .from('product')
          .select('stripe_product_id')
          .eq('id', product_id)
          .single();

        if (productError || !product || !product.stripe_product_id) {
          console.error('Product not found or not synced:', { product_id, productError });
          return NextResponse.json({ error: 'Product not found or not synced with Stripe' }, { status: 400 });
        }

        const createParams: Stripe.PriceCreateParams = {
          product: product.stripe_product_id,
          unit_amount: price,
          currency,
          active: is_active ?? true,
          recurring: type === 'recurring' ? { interval: recurring_interval, interval_count: recurring_interval_count || 1 } : undefined,
          metadata: attrs || undefined,
        };

        console.log('Creating Stripe price:', createParams);
        const stripePrice = await stripe.prices.create(createParams);

        const { error: updateError } = await supabase
          .from('pricingplan')
          .update({ stripe_price_id: stripePrice.id })
          .eq('id', id);

        if (updateError) {
          console.error('Failed to update pricingplan with stripe_price_id:', updateError);
          throw new Error(`Failed to update pricingplan: ${updateError.message}`);
        }

        console.log(`Created Stripe price ${stripePrice.id} for pricingplan ${id}`);
        return NextResponse.json({ message: `Created Stripe price ${stripePrice.id}` });
      }

      // Check for meaningful changes (excluding stripe_price_id)
      if (
        oldData?.price === newData.price &&
        oldData?.currency === newData.currency &&
        oldData?.is_active === newData.is_active &&
        oldData?.type === newData.type &&
        oldData?.recurring_interval === newData.recurring_interval &&
        oldData?.recurring_interval_count === newData.recurring_interval_count &&
        JSON.stringify(oldData?.attrs || {}) === JSON.stringify(newData.attrs || {})
      ) {
        console.log(`No meaningful changes for pricingplan ${id}, skipping`);
        return NextResponse.json({ message: 'No meaningful changes to sync' });
      }

      // If price or currency changed, create a new price
      if (oldData?.price !== newData.price || oldData?.currency !== newData.currency) {
        console.log('Price or currency changed, creating new price');
        const { data: product, error: productError } = await supabase
          .from('product')
          .select('stripe_product_id')
          .eq('id', product_id)
          .single();

        if (productError || !product || !product.stripe_product_id) {
          console.error('Product not found or not synced:', { product_id, productError });
          return NextResponse.json({ error: 'Product not found or not synced with Stripe' }, { status: 400 });
        }

        const newPriceParams: Stripe.PriceCreateParams = {
          product: product.stripe_product_id,
          unit_amount: price,
          currency,
          active: is_active ?? true,
          recurring: type === 'recurring' ? { interval: recurring_interval, interval_count: recurring_interval_count || 1 } : undefined,
          metadata: attrs || undefined,
        };

        console.log('Creating new Stripe price:', newPriceParams);
        const newStripePrice = await stripe.prices.create(newPriceParams);

        const { error: updateError } = await supabase
          .from('pricingplan')
          .update({ stripe_price_id: newStripePrice.id })
          .eq('id', id);

        if (updateError) {
          console.error('Failed to update pricingplan with new stripe_price_id:', updateError);
          throw new Error(`Failed to update pricingplan: ${updateError.message}`);
        }

        // Deactivate the old price
        await stripe.prices.update(stripe_price_id, { active: false });
        console.log(`Deactivated old price ${stripe_price_id}`);

        // Update default_price if necessary
        const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
        if (stripeProduct.default_price === stripe_price_id) {
          await stripe.products.update(product.stripe_product_id, { default_price: newStripePrice.id });
          console.log(`Updated default_price to ${newStripePrice.id} for product ${product.stripe_product_id}`);
        }

        console.log(`Created new Stripe price ${newStripePrice.id} for pricingplan ${id}`);
        return NextResponse.json({ message: `Created new Stripe price ${newStripePrice.id}` });
      }

      // For other changes (e.g., is_active, metadata), update the existing price
      const updateParams: Stripe.PriceUpdateParams = {
        active: is_active ?? true,
        metadata: attrs || undefined,
      };

      console.log('Updating Stripe price:', updateParams);
      await stripe.prices.update(stripe_price_id, updateParams);

      console.log(`Updated Stripe price ${stripe_price_id}`);
      return NextResponse.json({ message: `Updated Stripe price ${stripe_price_id}` });
    }

    // Handle DELETE in pricingplan
    if (table === 'pricingplan' && eventType === 'DELETE') {
      if (!oldData?.id) {
        console.error('Invalid pricingplan DELETE payload:', oldData);
        return NextResponse.json({ error: 'Missing id in oldData' }, { status: 400 });
      }

      const { id, stripe_price_id } = oldData;

      if (!stripe_price_id) {
        console.log(`Pricingplan ${id} lacks stripe_price_id, nothing to deactivate`);
        return NextResponse.json({ message: 'Nothing to deactivate in Stripe' });
      }

      console.log('Deactivating Stripe price:', stripe_price_id);
      try {
        await stripe.prices.update(stripe_price_id, { active: false });
        console.log(`Deactivated Stripe price ${stripe_price_id}`);
      } catch (error: any) {
        if (error.statusCode === 404) {
          console.log(`Price ${stripe_price_id} already deleted in Stripe`);
        } else {
          console.error('Failed to deactivate Stripe price:', error.message);
          throw error;
        }
      }

      return NextResponse.json({ message: `Deactivated Stripe price ${stripe_price_id}` });
    }

    console.log('Event ignored, no matching handler:', { table, eventType });
    return NextResponse.json({ message: 'Event processed or ignored' });
  } catch (error: any) {
    console.error('Sync API error:', error.message, 'Stack:', error.stack);
    return NextResponse.json({ error: `Failed to sync to Stripe: ${error.message}` }, { status: 500 });
  }
}