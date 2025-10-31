import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * POST /api/email-templates/preview
 * Preview an email template with sample data
 * 
 * Body:
 * - template_id (optional): ID of existing template
 * - html_body (optional): HTML content to preview (if no template_id)
 * - plain_body (optional): Plain text content to preview
 * - placeholders (optional): Object with placeholder values
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { template_id, html_body, plain_body, placeholders = {} } = body;

    let htmlContent = html_body || '';
    let plainContent = plain_body || '';

    // If template_id provided, fetch the template
    if (template_id) {
      const { data: template, error } = await supabase
        .from('email_template')
        .select('html_body, plain_body')
        .eq('id', template_id)
        .single();

      if (error || !template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      htmlContent = template.html_body || '';
      plainContent = template.plain_body || '';
    }

    // If no content provided at all
    if (!htmlContent && !plainContent) {
      return NextResponse.json(
        { error: 'Either template_id or html_body/plain_body must be provided' },
        { status: 400 }
      );
    }

    // Default placeholder values for preview
    const defaultPlaceholders = {
      user_name: 'John Doe',
      user_email: 'john.doe@example.com',
      user_phone: '+1 (555) 123-4567',
      company_name: 'Move Plan',
      support_email: 'support@moveplan.com',
      current_year: new Date().getFullYear().toString(),
      ticket_id: 'TICKET-12345',
      ticket_subject: 'Sample Support Ticket',
      ticket_status: 'Open',
      meeting_title: 'Team Standup Meeting',
      meeting_date: new Date().toLocaleDateString(),
      meeting_time: '10:00 AM',
      meeting_link: 'https://meet.example.com/sample-meeting',
      verification_link: 'https://example.com/verify?token=SAMPLE_TOKEN',
      reset_link: 'https://example.com/reset-password?token=SAMPLE_TOKEN',
      ...placeholders, // Override with user-provided placeholders
    };

    // Replace placeholders in HTML content
    let previewHtml = htmlContent;
    let previewPlain = plainContent;

    Object.entries(defaultPlaceholders).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewHtml = previewHtml.replace(regex, String(value));
      previewPlain = previewPlain.replace(regex, String(value));
    });

    return NextResponse.json({
      html: previewHtml,
      plain: previewPlain,
      placeholders_used: defaultPlaceholders,
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in POST /api/email-templates/preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview', details: error.message },
      { status: 500 }
    );
  }
}
