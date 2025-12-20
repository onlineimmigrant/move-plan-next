// src/app/api/forms/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Simple in-memory rate limiter (for production, use Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // submissions per window
const WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

// Zod schema for basic submission structure
const submissionSchema = z.object({
  answers: z.record(z.union([z.string(), z.array(z.string())])),
  completionTimeSeconds: z.number().optional(),
});

// Helper to validate answer based on question type
function validateAnswer(answer: any, question: any): boolean {
  if (!question.required && (!answer || answer === '')) return true; // Optional and empty is ok

  switch (question.type) {
    case 'text':
    case 'textarea':
    case 'email':
    case 'tel':
    case 'url':
      return typeof answer === 'string' && answer.trim().length > 0;
    case 'number':
      return typeof answer === 'number' || (typeof answer === 'string' && !isNaN(Number(answer)));
    case 'date':
      return typeof answer === 'string' && !isNaN(Date.parse(answer));
    case 'yesno':
      const yesnoOptions = question.options && question.options.length > 0 ? question.options : ['Yes', 'No'];
      return typeof answer === 'string' && yesnoOptions.includes(answer);
    case 'multiple':
    case 'dropdown':
      return typeof answer === 'string' && question.options?.includes(answer);
    case 'checkbox':
      let selectedOptions: string[];
      if (Array.isArray(answer)) {
        selectedOptions = answer;
      } else if (typeof answer === 'string') {
        selectedOptions = answer.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else {
        return false;
      }
      return selectedOptions.length > 0 && selectedOptions.every(opt => question.options?.includes(opt));
    case 'rating':
      return typeof answer === 'number' && answer >= 1 && answer <= 5;
    case 'file':
      // For now, assume string (URL), add file validation later
      return typeof answer === 'string';
    default:
      return false;
  }
}

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

    // Parse and validate request body
    const body = await request.json();
    const validationResult = submissionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: 'Invalid submission data structure', details: validationResult.error.issues }, { status: 400 });
    }
    const { answers, completionTimeSeconds } = validationResult.data;

    // Fetch form questions for validation
    const { data: questions, error: questionsError } = await supabase
      .from('form_questions_complete')
      .select('id, type, required, options')
      .eq('form_id', formId);

    if (questionsError) {
      console.error('Error fetching questions:', questionsError);
      return NextResponse.json({ error: 'Failed to validate form' }, { status: 500 });
    }

    // Validate each answer against its question
    for (const question of questions || []) {
      const answer = answers[question.id];
      if (!validateAnswer(answer, question)) {
        return NextResponse.json({ 
          error: `Invalid answer for question: ${question.id}`, 
          details: `Expected type: ${question.type}, required: ${question.required}` 
        }, { status: 400 });
      }
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || null;
    const referrer = request.headers.get('referer') || null;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                      request.headers.get('x-real-ip') || 
                      'unknown';

    // Rate limiting
    if (!checkRateLimit(ipAddress)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

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
