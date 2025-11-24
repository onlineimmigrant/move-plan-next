// src/app/api/forms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/getSettings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get organization ID from request headers
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, settings, published = false } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // Create form
    const { data: form, error: createError } = await supabase
      .from('forms')
      .insert({
        organization_id: organizationId,
        title: title.trim(),
        description: description?.trim() || null,
        settings: settings || {},
        published,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating form:', createError);
      return NextResponse.json({ error: 'Failed to create form', details: createError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, form }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/forms:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get organization ID
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get all forms for organization
    const { data: forms, error: fetchError } = await supabase
      .from('forms')
      .select('id, title, description, published, created_at, updated_at')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching forms:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch forms', details: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, forms }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/forms:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
