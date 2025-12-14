import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

// Initialize DOMPurify with JSDOM window
const jsdom = new JSDOM('');
const DOMPurify = createDOMPurify(jsdom.window as unknown as any);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * PUT /api/email/templates/:id
 * Update and validate an email template
 * Sanitizes HTML to prevent XSS attacks
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { template_type, name, subject, body: templateBody, organization_id } = body;

    // Validation
    const errors: string[] = [];

    if (!template_type || !['transactional', 'marketing', 'notification'].includes(template_type)) {
      errors.push('Invalid template_type. Must be: transactional, marketing, or notification');
    }

    if (!name || name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (name && name.length > 255) {
      errors.push('Template name must be 255 characters or less');
    }

    if (!subject || subject.trim().length === 0) {
      errors.push('Subject line is required');
    }

    if (subject && subject.length > 500) {
      errors.push('Subject must be 500 characters or less');
    }

    if (!templateBody || templateBody.trim().length === 0) {
      errors.push('Template body is required');
    }

    if (templateBody && templateBody.length > 100000) {
      errors.push('Template body must be 100,000 characters or less');
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Sanitize HTML body
    const sanitizedBody = DOMPurify.sanitize(templateBody, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'a', 'img',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'hr'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'width', 'height',
        'style', 'class', 'id', 'target', 'rel'
      ],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    // Update template
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        template_type,
        name: name.trim(),
        subject: subject.trim(),
        body: sanitizedBody,
        updated_at: new Date().toISOString(),
      })
      .eq('id', templateId)
      .eq('organization_id', organization_id)
      .select()
      .single();

    if (error) {
      console.error('Template update error:', error);
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: data,
      sanitized: templateBody !== sanitizedBody, // Indicates if content was modified
    });

  } catch (error) {
    console.error('Template validation error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/email/templates/:id/test
 * Send a test email using the template
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const templateId = parseInt(params.id);
    if (isNaN(templateId)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { test_email, merge_data = {} } = body;

    if (!test_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(test_email)) {
      return NextResponse.json(
        { error: 'Valid test email address is required' },
        { status: 400 }
      );
    }

    // Fetch template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Replace merge fields
    let renderedBody = template.body;
    let renderedSubject = template.subject;

    Object.entries(merge_data).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      renderedBody = renderedBody.replace(regex, String(value));
      renderedSubject = renderedSubject.replace(regex, String(value));
    });

    // Send test email via the send API
    const sendResponse = await fetch(`${request.nextUrl.origin}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        organization_id: template.organization_id,
        recipients: [test_email],
        subject: `[TEST] ${renderedSubject}`,
        body: renderedBody,
      }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.json();
      throw new Error(error.error || 'Failed to send test email');
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${test_email}`,
      rendered_preview: {
        subject: renderedSubject,
        body: renderedBody.substring(0, 500) + '...', // Preview first 500 chars
      },
    });

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
