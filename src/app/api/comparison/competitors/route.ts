import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List competitors for an organization
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('comparison_competitor')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ competitors: data || [] });
  } catch (error: any) {
    console.error('Error fetching competitors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

// POST - Create a new competitor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, name, logo_url, website_url, data, notes } = body;

    if (!organization_id || !name) {
      return NextResponse.json(
        { error: 'organization_id and name are required' },
        { status: 400 }
      );
    }

    const competitorData = {
      organization_id,
      name,
      logo_url: logo_url || null,
      website_url: website_url || null,
      data: data || { plans: [], features: [] },
      notes: notes || null,
      data_source: 'manual',
      is_active: true,
    };

    const { data: created, error } = await supabase
      .from('comparison_competitor')
      .insert([competitorData])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ competitor: created }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating competitor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create competitor' },
      { status: 500 }
    );
  }
}

// PUT - Update existing competitor
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, logo_url, website_url, data, notes } = body;

    console.log('PUT /api/comparison/competitors - Received body:', JSON.stringify(body, null, 2));

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (website_url !== undefined) updates.website_url = website_url;
    if (data !== undefined) {
      updates.data = data;
      console.log('Updating data field:', JSON.stringify(data, null, 2));
    }
    if (notes !== undefined) updates.notes = notes;

    console.log('Performing update with:', JSON.stringify(updates, null, 2));

    const { data: updated, error } = await supabase
      .from('comparison_competitor')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }

    console.log('Successfully updated competitor:', updated.id);
    return NextResponse.json({ competitor: updated });
  } catch (error: any) {
    console.error('Error updating competitor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update competitor' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete (set is_active to false)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('comparison_competitor')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting competitor:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete competitor' },
      { status: 500 }
    );
  }
}
