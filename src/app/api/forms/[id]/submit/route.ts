// src/app/api/forms/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: formId } = await params;

    // Verify form exists and is published
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, organization_id, published, settings')
      .eq('id', formId)
      .is('deleted_at', null)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    if (!form.published) {
      return NextResponse.json({ error: 'Form is not published' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { answers, completionTimeSeconds } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Invalid submission data' }, { status: 400 });
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      request.headers.get('x-real-ip') || 
                      null;

    // Create response (user_id and customer_id can be null for anonymous submissions)
    const { data: response, error: submitError } = await supabase
      .from('form_responses')
      .insert({
        form_id: formId,
        answers,
        user_id: null, // Anonymous submissions for now
        customer_id: null,
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer,
        completed: true,
        completion_time_seconds: completionTimeSeconds || null,
      })
      .select()
      .single();

    if (submitError) {
      console.error('Error submitting form response:', submitError);
      return NextResponse.json({ 
        error: 'Failed to submit form', 
        details: submitError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      responseId: response.id,
      message: 'Form submitted successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error in POST /api/forms/[id]/submit:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}
