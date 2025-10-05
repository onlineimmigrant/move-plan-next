import { NextResponse, NextRequest } from 'next/server';
import { supabase, stripe } from '@/lib/stripe-supabase';

// GET endpoint for fetching pricing plans
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const { getOrganizationId } = await import('@/lib/supabase');
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('Organization not found for baseUrl:', baseUrl);
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      console.log('Using fallback organization_id:', organizationId);
    }

    console.log('Fetching pricing plans for organization_id:', organizationId);

    const { data, error } = await supabase
      .from('pricingplan')
      .select(`
        *,
        product!product_id(
          id,
          product_name,
          slug,
          links_to_image
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching pricing plans:', error);
      return NextResponse.json({ error: `Failed to fetch pricing plans: ${error.message}` }, { status: 500 });
    }

    console.log('Fetched pricing plans:', data?.length || 0, 'plans');

    // Transform data to flatten product info
    const transformed = data?.map(plan => {
      // Handle both array and object format for product relation
      const productData = Array.isArray(plan.product) ? plan.product[0] : plan.product;
      
      return {
        ...plan,
        product_name: productData?.product_name,
        product_slug: productData?.slug,
        links_to_image: productData?.links_to_image,
      };
    });

    return NextResponse.json(transformed || []);
  } catch (error: any) {
    console.error('Error in GET /api/pricingplans:', error);
    return NextResponse.json({ error: `Failed to fetch pricing plans: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, price, currency, is_active = true, type = 'one_time', recurring_interval, recurring_interval_count, attrs } = body;

    // Validate required fields
    if (!product_id || price === undefined || !currency) {
      return NextResponse.json({ error: 'Missing required fields: product_id, price, currency' }, { status: 400 });
    }

    // Validate type
    if (!['one_time', 'recurring'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type: must be "one_time" or "recurring"' }, { status: 400 });
    }

    // Validate recurring fields
    if (type === 'recurring') {
      if (!recurring_interval || !['day', 'week', 'month', 'year'].includes(recurring_interval)) {
        return NextResponse.json({ error: 'Invalid or missing recurring_interval: must be "day", "week", "month", or "year"' }, { status: 400 });
      }
      if (recurring_interval_count && (!Number.isInteger(recurring_interval_count) || recurring_interval_count <= 0)) {
        return NextResponse.json({ error: 'recurring_interval_count must be a positive integer' }, { status: 400 });
      }
    } else if (recurring_interval || recurring_interval_count) {
      return NextResponse.json({ error: 'recurring_interval and recurring_interval_count are not allowed for one_time type' }, { status: 400 });
    }

    // Validate price
    if (!Number.isInteger(price) || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative integer' }, { status: 400 });
    }

    // Fetch the associated product
    const { data: product, error: productError } = await supabase
      .from('product')
      .select('id, stripe_product_id')
      .eq('id', product_id)
      .single();

    if (productError || !product || !product.stripe_product_id) {
      return NextResponse.json({ error: 'Product not found or not synced with Stripe' }, { status: 400 });
    }

    // Insert the pricing plan into Supabase
    const { data: pricingPlan, error: insertError } = await supabase
      .from('pricingplan')
      .insert({
        product_id,
        price,
        currency,
        is_active,
        type,
        recurring_interval: type === 'recurring' ? recurring_interval : null,
        recurring_interval_count: type === 'recurring' && recurring_interval_count ? recurring_interval_count : null,
        attrs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !pricingPlan) {
      return NextResponse.json({ error: `Failed to create pricing plan: ${insertError?.message}` }, { status: 500 });
    }

    // Create the price in Stripe
    const createParams = {
      product: product.stripe_product_id,
      unit_amount: price,
      currency,
      active: is_active,
      recurring: type === 'recurring' ? { interval: recurring_interval, interval_count: recurring_interval_count || 1 } : undefined,
      metadata: attrs || undefined,
    };

    const stripePrice = await stripe.prices.create(createParams);

    // Update the pricing plan with the stripe_price_id
    const { error: updateError } = await supabase
      .from('pricingplan')
      .update({ stripe_price_id: stripePrice.id, updated_at: new Date().toISOString() })
      .eq('id', pricingPlan.id);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update pricing plan with stripe_price_id: ${updateError.message}` }, { status: 500 });
    }

    // Set default_price if not already set
    const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
    if (!stripeProduct.default_price) {
      await stripe.products.update(product.stripe_product_id, { default_price: stripePrice.id });
    }

    return NextResponse.json({ message: `Created pricing plan ${pricingPlan.id} and Stripe price ${stripePrice.id}` });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to create pricing plan: ${error.message}` }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { pricingPlanId, updates } = body;

    if (!pricingPlanId || !updates) {
      return NextResponse.json({ error: 'Missing pricingPlanId or updates' }, { status: 400 });
    }

    const { product_id, price, currency, is_active, type, recurring_interval, recurring_interval_count, attrs } = updates;

    // Validate type
    if (type && !['one_time', 'recurring'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type: must be "one_time" or "recurring"' }, { status: 400 });
    }

    // Validate recurring fields
    if (type === 'recurring') {
      if (recurring_interval && !['day', 'week', 'month', 'year'].includes(recurring_interval)) {
        return NextResponse.json({ error: 'Invalid recurring_interval: must be "day", "week", "month", or "year"' }, { status: 400 });
      }
      if (recurring_interval_count && (!Number.isInteger(recurring_interval_count) || recurring_interval_count <= 0)) {
        return NextResponse.json({ error: 'recurring_interval_count must be a positive integer' }, { status: 400 });
      }
    } else if ((type === 'one_time' || !type) && (recurring_interval || recurring_interval_count)) {
      return NextResponse.json({ error: 'recurring_interval and recurring_interval_count are not allowed for one_time type' }, { status: 400 });
    }

    // Validate price
    if (price !== undefined && (!Number.isInteger(price) || price < 0)) {
      return NextResponse.json({ error: 'Price must be a non-negative integer' }, { status: 400 });
    }

    // Fetch the existing pricing plan
    const { data: pricingPlan, error: fetchError } = await supabase
      .from('pricingplan')
      .select('*, product(stripe_product_id)')
      .eq('id', pricingPlanId)
      .single();

    if (fetchError || !pricingPlan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    if (!pricingPlan.product?.stripe_product_id) {
      return NextResponse.json({ error: 'Associated product not synced with Stripe' }, { status: 400 });
    }

    // Update the pricing plan in Supabase
    const updateData = {
      product_id: product_id || pricingPlan.product_id,
      price: price !== undefined ? price : pricingPlan.price,
      currency: currency || pricingPlan.currency,
      is_active: is_active !== undefined ? is_active : pricingPlan.is_active,
      type: type || pricingPlan.type,
      recurring_interval: type === 'recurring' ? (recurring_interval || pricingPlan.recurring_interval) : null,
      recurring_interval_count: type === 'recurring' ? (recurring_interval_count !== undefined ? recurring_interval_count : pricingPlan.recurring_interval_count) : null,
      attrs: attrs !== undefined ? attrs : pricingPlan.attrs,
      updated_at: new Date().toISOString(),
    };

    const { data: updatedPlan, error: updateError } = await supabase
      .from('pricingplan')
      .update(updateData)
      .eq('id', pricingPlanId)
      .select()
      .single();

    if (updateError || !updatedPlan) {
      return NextResponse.json({ error: `Failed to update pricing plan: ${updateError?.message}` }, { status: 500 });
    }

    // If price, currency, type, or recurring fields changed, create a new price in Stripe
    if (
      price !== undefined ||
      currency !== undefined ||
      type !== undefined ||
      recurring_interval !== undefined ||
      recurring_interval_count !== undefined
    ) {
      const createParams = {
        product: pricingPlan.product.stripe_product_id,
        unit_amount: updatedPlan.price,
        currency: updatedPlan.currency,
        active: updatedPlan.is_active,
        recurring: updatedPlan.type === 'recurring' ? { interval: updatedPlan.recurring_interval, interval_count: updatedPlan.recurring_interval_count || 1 } : undefined,
        metadata: updatedPlan.attrs || undefined,
      };

      const newStripePrice = await stripe.prices.create(createParams);

      // Deactivate the old price if it exists
      if (pricingPlan.stripe_price_id) {
        try {
          await stripe.prices.update(pricingPlan.stripe_price_id, { active: false });
        } catch (error: any) {
          if (error.statusCode !== 404) throw error;
        }
      }

      // Update the pricing plan with the new stripe_price_id
      const { error: priceUpdateError } = await supabase
        .from('pricingplan')
        .update({ stripe_price_id: newStripePrice.id, updated_at: new Date().toISOString() })
        .eq('id', pricingPlanId);

      if (priceUpdateError) {
        return NextResponse.json({ error: `Failed to update stripe_price_id: ${priceUpdateError.message}` }, { status: 500 });
      }

      // Update default_price if necessary
      const stripeProduct = await stripe.products.retrieve(pricingPlan.product.stripe_product_id);
      if (stripeProduct.default_price === pricingPlan.stripe_price_id) {
        await stripe.products.update(pricingPlan.product.stripe_product_id, { default_price: newStripePrice.id });
      }

      return NextResponse.json({ message: `Updated pricing plan ${pricingPlanId} with new Stripe price ${newStripePrice.id}` });
    }

    // For other changes (e.g., is_active, attrs), update the existing price
    if (pricingPlan.stripe_price_id) {
      const updateParams = {
        active: updatedPlan.is_active,
        metadata: updatedPlan.attrs || undefined,
      };

      await stripe.prices.update(pricingPlan.stripe_price_id, updateParams);
      return NextResponse.json({ message: `Updated Stripe price ${pricingPlan.stripe_price_id} for pricing plan ${pricingPlanId}` });
    }

    return NextResponse.json({ message: `Updated pricing plan ${pricingPlanId}` });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to update pricing plan: ${error.message}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { pricingPlanId } = body;

    if (!pricingPlanId) {
      return NextResponse.json({ error: 'Missing pricingPlanId' }, { status: 400 });
    }

    // Fetch the pricing plan to get the stripe_price_id
    const { data: pricingPlan, error: fetchError } = await supabase
      .from('pricingplan')
      .select('stripe_price_id')
      .eq('id', pricingPlanId)
      .single();

    if (fetchError || !pricingPlan) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    // Deactivate the price in Stripe if it exists
    if (pricingPlan.stripe_price_id) {
      try {
        await stripe.prices.update(pricingPlan.stripe_price_id, { active: false });
      } catch (error: any) {
        if (error.statusCode !== 404) throw error;
      }
    }

    // Delete the pricing plan from Supabase
    const { error: deleteError } = await supabase
      .from('pricingplan')
      .delete()
      .eq('id', pricingPlanId);

    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete pricing plan: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ message: `Deleted pricing plan ${pricingPlanId}` });
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to delete pricing plan: ${error.message}` }, { status: 500 });
  }
}