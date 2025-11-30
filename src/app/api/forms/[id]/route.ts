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

    // Get questions separately using the complete view that merges library + overrides
    const { data: questions, error: questionsError } = await supabase
      .from('form_questions_complete')
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
        
        // Extract simple logic fields from validation.logic if present
        let logicShowIf = q.logic_show_if || null;
        let logicValue = q.logic_value || null;
        
        // If question has complex logic in validation.logic, extract first rule for simple fields
        if (q.validation?.logic?.rules?.length > 0) {
          const firstRule = q.validation.logic.rules[0];
          logicShowIf = firstRule.leftQuestionId || null;
          logicValue = firstRule.value || null;
        }
        
        // Prepare question data with new library structure
        const questionData: any = {
          id: q.id, // now client supplies stable UUID
          form_id: formId,
          question_library_id: q.question_library_id || null, // Link to library if provided
          required: q.required || false,
          logic_show_if: logicShowIf,
          logic_value: logicValue,
          order_index: index,
        };
        
        // If not linked to library, store all data in overrides (custom question)
        // If linked to library, only store overrides if different from library defaults
        if (!q.question_library_id) {
          // Custom question - store all data in overrides INCLUDING type
          questionData.type_override = q.type; // Store the type for custom questions
          questionData.label_override = q.label;
          questionData.description_override = q.description || null;
          questionData.placeholder_override = q.placeholder || null;
          questionData.options_override = q.options || [];
          questionData.validation_override = q.validation || {}; // This includes validation.logic
        } else {
          // Library-linked question - only store overrides if provided
          if (q.type_override !== undefined) questionData.type_override = q.type_override;
          if (q.label_override !== undefined) questionData.label_override = q.label_override;
          if (q.description_override !== undefined) questionData.description_override = q.description_override;
          if (q.placeholder_override !== undefined) questionData.placeholder_override = q.placeholder_override;
          if (q.options_override !== undefined) questionData.options_override = q.options_override;
          if (q.validation_override !== undefined) questionData.validation_override = q.validation_override;
        }

        await supabase
          .from('form_questions')
          .upsert(questionData, { onConflict: 'id' });
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
