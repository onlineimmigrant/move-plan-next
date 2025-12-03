import { NextResponse, NextRequest } from 'next/server';
import { supabase, stripe } from '@/lib/stripe-supabase';

// GET endpoint for fetching pricing plans
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    let organizationId = searchParams.get('organization_id');

    console.log('[API] GET /api/pricingplans - organizationId:', organizationId);

    if (!organizationId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const { getOrganizationId } = await import('@/lib/supabase');
      organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        console.error('[API] Organization not found for baseUrl:', baseUrl);
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      console.log('[API] Using fallback organization_id:', organizationId);
    }

    console.log('[API] Fetching pricing plans for organization_id:', organizationId);

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
      console.error('[API] Error fetching pricing plans:', error);
      return NextResponse.json({ error: `Failed to fetch pricing plans: ${error.message}` }, { status: 500 });
    }

    console.log('[API] Successfully fetched pricing plans:', data?.length || 0, 'plans');

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

    return NextResponse.json(transformed || [], {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[API] Error in GET /api/pricingplans:', error);
    return NextResponse.json({ error: `Failed to fetch pricing plans: ${error.message}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      product_id, 
      price, 
      currency, 
      is_active = true, 
      type = 'one_time', 
      recurring_interval, 
      commitment_months = 1,
      annual_size_discount = 0,
      attrs 
    } = body;

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
    } else if (recurring_interval) {
      return NextResponse.json({ error: 'recurring_interval is not allowed for one_time type' }, { status: 400 });
    }

    // Validate price
    if (!Number.isInteger(price) || price < 0) {
      return NextResponse.json({ error: 'Price must be a non-negative integer' }, { status: 400 });
    }

    // Validate commitment_months
    if (!Number.isInteger(commitment_months) || commitment_months <= 0) {
      return NextResponse.json({ error: 'commitment_months must be a positive integer' }, { status: 400 });
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
        recurring_interval_count: 1, // Always 1 for proper Stripe billing
        commitment_months,
        annual_size_discount,
        attrs,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError || !pricingPlan) {
      return NextResponse.json({ error: `Failed to create pricing plan: ${insertError?.message}` }, { status: 500 });
    }

    // Create monthly billing price in Stripe
    const monthlyPriceParams = {
      product: product.stripe_product_id,
      unit_amount: price,
      currency,
      active: is_active,
      recurring: type === 'recurring' ? { interval: recurring_interval, interval_count: 1 } : undefined,
      metadata: { 
        ...attrs, 
        billing_type: 'monthly',
        commitment_months: String(commitment_months)
      },
    };

    const monthlyStripePrice = await stripe.prices.create(monthlyPriceParams);
    console.log(`Created monthly price: ${monthlyStripePrice.id}`);

    // Create annual prepay price if discount offered and commitment >= 12 months
    let annualStripePrice = null;
    if (type === 'recurring' && annual_size_discount > 0 && commitment_months >= 12) {
      const totalMonthly = price * commitment_months;
      const annualAmount = Math.round(totalMonthly * (1 - annual_size_discount / 100));
      
      const annualPriceParams = {
        product: product.stripe_product_id,
        unit_amount: annualAmount,
        currency,
        active: is_active,
        recurring: { interval: 'year' as const, interval_count: 1 },
        metadata: {
          ...attrs,
          billing_type: 'annual_prepay',
          commitment_months: String(commitment_months),
          discount_percent: String(annual_size_discount),
          monthly_equivalent: String(price),
        },
      };
      
      annualStripePrice = await stripe.prices.create(annualPriceParams);
      console.log(`Created annual prepay price: ${annualStripePrice.id}`);
    }

    // Update the pricing plan with stripe price IDs
    const { error: updateError } = await supabase
      .from('pricingplan')
      .update({ 
        stripe_price_id: monthlyStripePrice.id,
        stripe_price_id_annual: annualStripePrice?.id || null,
        updated_at: new Date().toISOString() 
      })
      .eq('id', pricingPlan.id);

    if (updateError) {
      return NextResponse.json({ error: `Failed to update pricing plan with stripe_price_id: ${updateError.message}` }, { status: 500 });
    }

    // Set default_price if not already set
    const stripeProduct = await stripe.products.retrieve(product.stripe_product_id);
    if (!stripeProduct.default_price) {
      await stripe.products.update(product.stripe_product_id, { default_price: monthlyStripePrice.id });
    }

    return NextResponse.json({ 
      message: `Created pricing plan ${pricingPlan.id}`,
      monthlyPriceId: monthlyStripePrice.id,
      annualPriceId: annualStripePrice?.id || null,
    });
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