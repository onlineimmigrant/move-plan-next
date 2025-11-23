import { NextResponse, NextRequest } from 'next/server';
import { supabase } from '@/lib/stripe-supabase';

/**
 * GET - Fetch all pricing plans for an organization
 * Query params: organization_id (required)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }

    console.log('Fetching pricing plans for organization:', organizationId);

    const { data, error } = await supabase
      .from('pricingplan')
      .select(`
        *,
        product:product_id(
          id,
          product_name,
          slug,
          links_to_image
        )
      `)
      .eq('organization_id', organizationId)
      .order('order', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Error fetching pricing plans:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform to flatten product data
    const transformed = data?.map(plan => ({
      ...plan,
      product_name: plan.product?.product_name || null,
      product_slug: plan.product?.slug || null,
      product_image: plan.product?.links_to_image || null,
    })) || [];

    console.log('Fetched pricing plans:', transformed.length);
    return NextResponse.json(transformed);
  } catch (error: any) {
    console.error('Error in GET /api/pricingplans-management:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST - Create a new pricing plan
 * Body: Partial<PricingPlan> with organization_id
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, product_id, price, currency, type, ...rest } = body;

    // Validation
    if (!organization_id) {
      return NextResponse.json({ error: 'organization_id is required' }, { status: 400 });
    }
    if (price === undefined || price === null) {
      return NextResponse.json({ error: 'price is required' }, { status: 400 });
    }
    if (!currency) {
      return NextResponse.json({ error: 'currency is required' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }
    if (type === 'recurring' && !rest.recurring_interval) {
      return NextResponse.json({ error: 'recurring_interval is required for recurring plans' }, { status: 400 });
    }

    // Get max order for the product group
    let maxOrder = 0;
    if (product_id) {
      const { data: existingPlans } = await supabase
        .from('pricingplan')
        .select('order')
        .eq('organization_id', organization_id)
        .eq('product_id', product_id)
        .order('order', { ascending: false })
        .limit(1);

      if (existingPlans && existingPlans.length > 0 && existingPlans[0].order) {
        maxOrder = existingPlans[0].order;
      }
    }

    // Set currency symbol based on currency
    const currencySymbols: Record<string, string> = {
      gbp: '£',
      usd: '$',
      eur: '€',
    };
    const currency_symbol = rest.currency_symbol || currencySymbols[currency.toLowerCase()] || currency.toUpperCase();

    const newPlan = {
      organization_id,
      product_id: product_id || null,
      price,
      currency: currency.toLowerCase(),
      currency_symbol,
      type,
      order: maxOrder + 1,
      is_active: rest.is_active !== undefined ? rest.is_active : true,
      is_promotion: rest.is_promotion || false,
      recurring_interval: rest.recurring_interval || null,
      recurring_interval_count: rest.recurring_interval_count || 0,
      description: rest.description || null,
      promotion_percent: rest.promotion_percent || null,
      promotion_price: rest.promotion_price || null,
      valid_until: rest.valid_until || null,
      package: rest.package || null,
      measure: rest.measure || 'item',
      stripe_price_id: rest.stripe_price_id || null,
      stripe_price_ids: rest.stripe_price_ids || {},
      prices_multi_currency: rest.prices_multi_currency || {},
      base_currency: rest.base_currency || 'USD',
      attrs: rest.attrs || {},
      slug: rest.slug || null,
      details: rest.details || null,
      epub_file: rest.epub_file || null,
      pdf_file: rest.pdf_file || null,
      digital_asset_access: rest.digital_asset_access || null,
      activation_duration: rest.activation_duration || null,
      grants_permanent_ownership: rest.grants_permanent_ownership || null,
      time_slot_duration: rest.time_slot_duration || null,
      amazon_books_url: rest.amazon_books_url || null,
      is_help_center: rest.is_help_center || false,
      annual_size_discount: rest.annual_size_discount || 20,
    };

    const { data, error } = await supabase
      .from('pricingplan')
      .insert([newPlan])
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Created pricing plan:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/pricingplans-management:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT - Update an existing pricing plan
 * Body: { id: string, updates: Partial<PricingPlan> }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }
    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'updates are required' }, { status: 400 });
    }

    // Validate type and recurring_interval relationship
    if (updates.type === 'recurring' && !updates.recurring_interval) {
      const { data: existing } = await supabase
        .from('pricingplan')
        .select('recurring_interval')
        .eq('id', id)
        .single();
      
      if (!existing?.recurring_interval) {
        return NextResponse.json({ error: 'recurring_interval is required for recurring plans' }, { status: 400 });
      }
    }

    // If currency changes, update currency_symbol
    if (updates.currency && !updates.currency_symbol) {
      const currencySymbols: Record<string, string> = {
        gbp: '£',
        usd: '$',
        eur: '€',
      };
      updates.currency_symbol = currencySymbols[updates.currency.toLowerCase()] || updates.currency.toUpperCase();
    }

    const { data, error } = await supabase
      .from('pricingplan')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating pricing plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Pricing plan not found' }, { status: 404 });
    }

    console.log('Updated pricing plan:', id);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in PUT /api/pricingplans-management:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE - Delete a pricing plan
 * Body: { id: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('pricingplan')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting pricing plan:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Deleted pricing plan:', id);
    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error in DELETE /api/pricingplans-management:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH - Reorder pricing plans (update order field)
 * Body: { plans: Array<{ id: string, order: number }> }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { plans } = body;

    if (!plans || !Array.isArray(plans) || plans.length === 0) {
      return NextResponse.json({ error: 'plans array is required' }, { status: 400 });
    }

    // Update each plan's order
    const updates = plans.map(plan => 
      supabase
        .from('pricingplan')
        .update({ order: plan.order })
        .eq('id', plan.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors updating plan orders:', errors);
      return NextResponse.json({ error: 'Some plans failed to update' }, { status: 500 });
    }

    console.log('Reordered pricing plans:', plans.length);
    return NextResponse.json({ success: true, updated: plans.length });
  } catch (error: any) {
    console.error('Error in PATCH /api/pricingplans-management:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
