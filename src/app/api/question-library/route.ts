// src/app/api/question-library/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/getSettings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/question-library
 * Fetch all question library items for the organization
 * Query params: category, type, search
 */
export async function GET(request: NextRequest) {
  try {
    // Get organization ID
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const formId = searchParams.get('formId'); // For filtering by current form's questions

    // Build query
    let query = supabase
      .from('question_library')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    // Filter by visibility: show public questions OR questions created by current form
    if (formId) {
      // For autocomplete: show only visible_for_others=true questions
      query = query.eq('visible_for_others', true);
    }
    // If no formId, show all (for library management view)

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (type) {
      query = query.eq('type', type);
    }
    if (search) {
      query = query.or(`label.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Order by usage count (most used first) then by label
    query = query.order('usage_count', { ascending: false }).order('label', { ascending: true });

    const { data: questions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching question library:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch question library', details: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, questions: questions || [] }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/question-library:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * POST /api/question-library
 * Create a new question library item
 */
export async function POST(request: NextRequest) {
  try {
    // Get organization ID
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { type, label, description, placeholder, options, validation, tags, category, visible_for_others = true } = body;

    if (!type || !label?.trim()) {
      return NextResponse.json({ error: 'Type and label are required' }, { status: 400 });
    }

    // Create question library item
    const { data: question, error: createError } = await supabase
      .from('question_library')
      .insert({
        organization_id: organizationId,
        type,
        label: label.trim(),
        description: description?.trim() || null,
        placeholder: placeholder?.trim() || null,
        options: options || [],
        validation: validation || {},
        tags: tags || [],
        category: category || null,
        visible_for_others,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating question library item:', createError);
      return NextResponse.json({ error: 'Failed to create question', details: createError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, question }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/question-library:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
