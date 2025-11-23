/**
 * Inventory API Routes
 * 
 * CRUD operations for inventory management
 * Linked to pricing plans
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
);

const hasEnvVars = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

const envErrorResponse = () => {
  console.error('Missing Supabase environment variables');
  return NextResponse.json(
    { error: 'Server configuration error' },
    { status: 500 }
  );
};

export const dynamic = 'force-dynamic';

// GET - Fetch inventories for an organization
export async function GET(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Fetch inventories filtered by organization_id
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching inventories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventories' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new inventory
export async function POST(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const body = await request.json();

    const {
      quantity,
      minimum_threshold,
      status,
      pricing_plan_id,
      permanent_presence,
      planned_delivery_quantity,
      earliest_planned_delivery_date,
      description,
    } = body;

    // Validate required fields
    if (!pricing_plan_id) {
      return NextResponse.json(
        { error: 'Pricing plan ID is required' },
        { status: 400 }
      );
    }

    // Verify pricing plan exists and get its organization_id
    const { data: pricingPlan, error: planError } = await supabase
      .from('pricingplan')
      .select('id, organization_id')
      .eq('id', pricing_plan_id)
      .single();

    if (planError || !pricingPlan) {
      return NextResponse.json(
        { error: 'Invalid pricing plan ID' },
        { status: 400 }
      );
    }

    // Insert inventory with organization_id from pricing plan
    const { data, error } = await supabase
      .from('inventory')
      .insert({
        quantity: quantity ?? 100,
        minimum_threshold: minimum_threshold ?? 10,
        status: status ?? 'In Stock',
        pricing_plan_id,
        organization_id: pricingPlan.organization_id,
        permanent_presence: permanent_presence ?? true,
        planned_delivery_quantity,
        earliest_planned_delivery_date,
        description,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating inventory:', error);
      return NextResponse.json(
        { error: 'Failed to create inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update inventory
export async function PUT(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const body = await request.json();

    const {
      id,
      quantity,
      minimum_threshold,
      status,
      pricing_plan_id,
      permanent_presence,
      planned_delivery_quantity,
      earliest_planned_delivery_date,
      description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};
    if (quantity !== undefined) updates.quantity = quantity;
    if (minimum_threshold !== undefined) updates.minimum_threshold = minimum_threshold;
    if (status !== undefined) updates.status = status;
    if (permanent_presence !== undefined) updates.permanent_presence = permanent_presence;
    if (planned_delivery_quantity !== undefined) updates.planned_delivery_quantity = planned_delivery_quantity;
    if (earliest_planned_delivery_date !== undefined) updates.earliest_planned_delivery_date = earliest_planned_delivery_date;
    if (description !== undefined) updates.description = description;
    
    // If pricing_plan_id is being updated, get the new organization_id
    if (pricing_plan_id !== undefined) {
      const { data: pricingPlan, error: planError } = await supabase
        .from('pricingplan')
        .select('organization_id')
        .eq('id', pricing_plan_id)
        .single();

      if (planError || !pricingPlan) {
        return NextResponse.json(
          { error: 'Invalid pricing plan ID' },
          { status: 400 }
        );
      }
      
      updates.pricing_plan_id = pricing_plan_id;
      updates.organization_id = pricingPlan.organization_id;
    }

    // Update inventory
    const { data, error } = await supabase
      .from('inventory')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating inventory:', error);
      return NextResponse.json(
        { error: 'Failed to update inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory
export async function DELETE(request: NextRequest) {
  if (!hasEnvVars) return envErrorResponse();

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting inventory:', error);
      return NextResponse.json(
        { error: 'Failed to delete inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
