// src/app/api/question-library/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrganizationId } from '@/lib/getSettings';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/question-library/[id]
 * Fetch a specific question library item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get organization ID
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get question library item
    const { data: question, error: fetchError } = await supabase
      .from('question_library')
      .select('*')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, question }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/question-library/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/question-library/[id]
 * Update a question library item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get organization ID
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify question exists and belongs to organization
    const { data: existing } = await supabase
      .from('question_library')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { type, label, description, placeholder, options, validation, tags, category, visible_for_others } = body;

    // Build update data
    const updateData: any = {};
    if (type !== undefined) updateData.type = type;
    if (label !== undefined) updateData.label = label.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (placeholder !== undefined) updateData.placeholder = placeholder?.trim() || null;
    if (options !== undefined) updateData.options = options;
    if (validation !== undefined) updateData.validation = validation;
    if (tags !== undefined) updateData.tags = tags;
    if (category !== undefined) updateData.category = category;
    if (visible_for_others !== undefined) updateData.visible_for_others = visible_for_others;

    const { data: question, error: updateError } = await supabase
      .from('question_library')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating question library item:', updateError);
      return NextResponse.json({ error: 'Failed to update question', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, question }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PATCH /api/question-library/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/question-library/[id]
 * Soft delete a question library item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get organization ID
    const host = request.headers.get('host');
    const organizationId = await getOrganizationId(host ? `https://${host}` : undefined);
    
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify question exists and belongs to organization
    const { data: existing } = await supabase
      .from('question_library')
      .select('id')
      .eq('id', id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('question_library')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting question library item:', deleteError);
      return NextResponse.json({ error: 'Failed to delete question', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/question-library/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
