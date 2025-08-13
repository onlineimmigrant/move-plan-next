import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const type = searchParams.get('type'); // 'data', 'products', or 'plans'
    const productId = searchParams.get('productId'); // Optional product filter

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Handle pricing plans request
    if (type === 'plans') {
      console.log('Fetching pricing plans for organization:', organizationId, 'product:', productId);

      let query = supabase
        .from('pricingplan')
        .select(`
          id,
          price,
          currency,
          currency_symbol,
          recurring_interval,
          recurring_interval_count,
          monthly_price_calculated,
          package,
          description,
          is_active,
          is_promotion,
          promotion_percent,
          promotion_price,
          annual_size_discount,
          digital_asset_access,
          grants_permanent_ownership,
          order,
          slug,
          product_id,
          organization_id,
          type,
          attrs,
          product!product_id(id, product_name, slug)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('order', { ascending: true });

      // Filter by product if provided
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data: plans, error } = await query;

      if (error) {
        console.error('Error fetching pricing plans:', error);
        return NextResponse.json(
          { error: 'Failed to fetch pricing plans', details: error },
          { status: 500 }
        );
      }

      // Convert prices from cents to dollars (divide by 100)
      const processedPlans = plans?.map(plan => ({
        ...plan,
        price: plan.price ? plan.price / 100 : plan.price,
        monthly_price_calculated: plan.monthly_price_calculated ? plan.monthly_price_calculated / 100 : plan.monthly_price_calculated,
        promotion_price: plan.promotion_price ? plan.promotion_price / 100 : plan.promotion_price,
      })) || [];

      console.log('Successfully fetched pricing plans:', processedPlans);
      return NextResponse.json(processedPlans);
    }

    // Handle products request
    if (type === 'products') {
      console.log('Fetching pricing comparison products for organization:', organizationId);

      const { data: products, error } = await supabase
        .from('product')
        .select(`
          id,
          product_name,
          price_manual,
          currency_manual,
          currency_manual_symbol,
          background_color,
          slug,
          organization_id
        `)
        .eq('organization_id', organizationId)
        .eq('is_displayed', true)
        .eq('is_in_pricingplan_comparison', true)
        .order('id', { ascending: true });

      if (error) {
        console.error('Error fetching pricing comparison products:', error);
        return NextResponse.json(
          { error: 'Failed to fetch pricing comparison products', details: error },
          { status: 500 }
        );
      }

      console.log('Successfully fetched pricing comparison products:', products);
      return NextResponse.json(products || []);
    }

    // Handle comparison data request (default)
    console.log('Fetching pricing comparison for organization:', organizationId);

    const { data, error } = await supabase
      .from('pricingplan_comparison')
      .select('*')
      .eq('organization_id', organizationId)
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching pricing comparison:', error);
      return NextResponse.json(
        { error: 'Failed to fetch pricing comparison', details: error.message },
        { status: 500 }
      );
    }

    console.log('Successfully fetched pricing comparison:', data);
    return NextResponse.json(data);
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
