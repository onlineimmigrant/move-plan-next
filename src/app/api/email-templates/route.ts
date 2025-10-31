import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/email-templates
 * List all email templates for an organization
 * Query params: organization_id, type, category, is_active
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organization_id = searchParams.get('organization_id');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const is_active = searchParams.get('is_active');

    // Build base query
    let query = supabase
      .from('email_template')
      .select(`
        *,
        created_by_profile:profiles!email_template_created_by_fkey(full_name, email)
      `)
      .order('updated_at', { ascending: false });

    // Filter by organization_id if provided (admin context)
    // If not provided (superadmin context), fetch all templates
    if (organization_id) {
      query = query.eq('organization_id', organization_id);
    }

    // Apply optional filters
    if (type) {
      query = query.eq('type', type);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (is_active) {
      query = query.eq('is_active', is_active === 'true');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email templates:', error);
      throw error;
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    console.error('Error in GET /api/email-templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email-templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      html_code,
      organization_id,
      type,
      subject,
      from_email_address_type,
      email_main_logo_image,
      category,
      created_by,
      is_active,
    } = body;

    // Validation
    if (!name || !html_code || !organization_id || !type || !subject) {
      return NextResponse.json(
        { error: 'Missing required fields: name, html_code, organization_id, type, subject' },
        { status: 400 }
      );
    }

    // Validate from_email_address_type
    const validFromTypes = ['transactional_email', 'marketing_email', 'transactional_email_2', 'marketing_email_2'];
    if (from_email_address_type && !validFromTypes.includes(from_email_address_type)) {
      return NextResponse.json(
        { error: 'Invalid from_email_address_type' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['transactional', 'marketing', 'system'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be: transactional, marketing, or system' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('email_template')
      .insert({
        name,
        description,
        html_code,
        organization_id,
        type,
        subject,
        from_email_address_type: from_email_address_type || 'transactional_email',
        email_main_logo_image: email_main_logo_image || null,
        category: category || 'transactional',
        is_active: is_active !== undefined ? is_active : false,
        is_default: false, // User-created templates are never defaults
        created_by,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating email template:', error);
      throw error;
    }

    console.log('Successfully created email template:', data.id);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/email-templates:', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    );
  }
}
