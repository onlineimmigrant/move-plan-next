// src/app/api/forms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;

    // Get form with questions
    const { data: form, error } = await supabase
      .from('forms')
      .select(`
        id,
        title,
        description,
        settings,
        organization_id,
        published,
        created_at,
        updated_at
      `)
      .eq('id', formId)
      .is('deleted_at', null)
      .single();

    if (error || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Get questions separately
    const { data: questions, error: questionsError } = await supabase
      .from('form_questions')
      .select('*')
      .eq('form_id', formId)
      .order('order_index', { ascending: true });

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
    }

    return NextResponse.json({
      success: true,
      form: {
        ...form,
        questions: questions || []
      }
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/forms/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    
    // Verify form exists
    const { data: form } = await supabase
      .from('forms')
      .select('organization_id')
      .eq('id', formId)
      .is('deleted_at', null)
      .single();

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const { title, description, settings, published, questions } = body;

    // Update form
    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (settings !== undefined) updateData.settings = settings;
    if (published !== undefined) updateData.published = published;

    const { data: updatedForm, error: updateError } = await supabase
      .from('forms')
      .update(updateData)
      .eq('id', formId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating form:', updateError);
      return NextResponse.json({ error: 'Failed to update form', details: updateError.message }, { status: 500 });
    }

    // Update questions if provided
    if (questions && Array.isArray(questions)) {
      // Get existing questions from database
      const { data: existingQuestions } = await supabase
        .from('form_questions')
        .select('id')
        .eq('form_id', formId);

      const existingIds = new Set(existingQuestions?.map(q => q.id) || []);
      const incomingIds = new Set(questions.filter(q => q.id && !q.id.startsWith('q_')).map(q => q.id));

      // Delete questions that are no longer present
      const idsToDelete = [...existingIds].filter(id => !incomingIds.has(id));
      if (idsToDelete.length > 0) {
        await supabase
          .from('form_questions')
          .delete()
          .in('id', idsToDelete);
      }

      // Upsert questions (update existing, insert new)
      for (let index = 0; index < questions.length; index++) {
        const q = questions[index];
        const questionData = {
          form_id: formId,
          type: q.type,
          label: q.label,
          description: q.description || null,
          placeholder: q.placeholder || null,
          required: q.required || false,
          options: q.options || [],
          logic_show_if: q.logic_show_if || null,
          logic_value: q.logic_value || null,
          validation: q.validation || {},
          order_index: index,
        };

        // If question has a real database ID (UUID), update it
        if (q.id && !q.id.startsWith('q_')) {
          await supabase
            .from('form_questions')
            .update(questionData)
            .eq('id', q.id);
        } else {
          // Insert new question
          await supabase
            .from('form_questions')
            .insert(questionData);
        }
      }
    }

    return NextResponse.json({ success: true, form: updatedForm }, { status: 200 });
  } catch (error: any) {
    console.error('Error in PATCH /api/forms/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;
    
    // Verify form exists
    const { data: form } = await supabase
      .from('forms')
      .select('organization_id')
      .eq('id', formId)
      .is('deleted_at', null)
      .single();

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('forms')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', formId);

    if (deleteError) {
      console.error('Error deleting form:', deleteError);
      return NextResponse.json({ error: 'Failed to delete form', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/forms/[id]:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
