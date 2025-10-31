import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/email-templates/[id]
 * Get a single email template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const { data, error } = await supabase
      .from('email_template')
      .select(`
        *,
        created_by_profile:profiles!email_template_created_by_fkey(full_name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching email template:', error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/email-templates/[id]
 * Update an email template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Remove fields that shouldn't be updated
    delete body.id;
    delete body.created_at;
    delete body.created_by;
    delete body.is_default; // Defaults can't be changed via API

    const { data, error } = await supabase
      .from('email_template')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating email template:', error);
      throw error;
    }

    console.log('Successfully updated email template:', id);
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('Error in PUT /api/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to update template', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/email-templates/[id]
 * Delete an email template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if it's a default template (can't be deleted)
    const { data: template } = await supabase
      .from('email_template')
      .select('is_default')
      .eq('id', id)
      .single();

    if (template?.is_default) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('email_template')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting email template:', error);
      throw error;
    }

    console.log('Successfully deleted email template:', id);
    return NextResponse.json({ success: true, message: 'Template deleted' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in DELETE /api/email-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Failed to delete template', details: error.message },
      { status: 500 }
    );
  }
}
