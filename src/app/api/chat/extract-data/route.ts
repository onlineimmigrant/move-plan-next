import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface ExtractedData {
  [key: string]: string | string[];
}

interface ExtractionResult {
  extracted: ExtractedData;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

/**
 * POST /api/chat/extract-data
 * 
 * Extracts structured data from user message/document for ai_model_settings.settings
 * 
 * Request body:
 * {
 *   content: string,           // Message or document content
 *   existingSettings?: object, // Current model-specific settings
 *   extractionHints?: string[] // Optional: specific fields to extract (e.g., ["name", "skills"])
 * }
 * 
 * Response:
 * {
 *   extracted: { key: value },
 *   confidence: 'high' | 'medium' | 'low',
 *   summary: string
 * }
 */
export async function POST(request: Request) {
  try {
    const { content, existingSettings = {}, extractionHints = [] } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required and must be a string' }, { status: 400 });
    }

    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    let user;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      if (error || !user) {
        console.error('[ExtractData] Auth error:', error?.message);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    console.log('[ExtractData] Extracting data for user:', user.id);

    // Get user's organization for model access
    const { data: profile } = await supabaseService
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get a capable model for extraction (prefer GPT-4 or Grok for structured extraction)
    const { data: extractionModels } = await supabaseService
      .from('ai_models_default')
      .select('id, name, api_key, endpoint, max_tokens')
      .eq('organization_id', profile.organization_id)
      .eq('is_active', true)
      .or('name.ilike.%gpt-4%,name.ilike.%grok%,name.ilike.%claude%')
      .limit(1);

    if (!extractionModels || extractionModels.length === 0) {
      return NextResponse.json({ error: 'No extraction model available' }, { status: 503 });
    }

    const model = extractionModels[0];
    console.log('[ExtractData] Using model:', model.name);

    // Build extraction prompt
    const existingKeys = Object.keys(existingSettings);
    const hints = extractionHints.length > 0 ? extractionHints : [
      'Full Name', 'Education', 'Skills', 'Work Experience', 'Languages', 
      'Certifications', 'Hobbies', 'Location', 'Email', 'Phone', 
      'LinkedIn', 'GitHub', 'Portfolio', 'Driving Licence'
    ];

    const systemPrompt = `You are a data extraction assistant. Extract structured key-value pairs from the user's message or document.

EXTRACTION RULES:
1. Extract only factual information present in the content
2. Use clear, descriptive keys (e.g., "Full Name", "Skills", "Education")
3. For lists (skills, languages, etc.), use comma-separated values
4. Avoid extracting opinions or subjective statements
5. If information is unclear, skip it
6. Merge with existing data if relevant

EXISTING SETTINGS:
${existingKeys.length > 0 ? JSON.stringify(existingSettings, null, 2) : 'None'}

SUGGESTED FIELDS TO EXTRACT:
${hints.join(', ')}

RESPONSE FORMAT (JSON only):
{
  "extracted": {
    "Key Name": "value",
    "Skills": "Python, JavaScript, React",
    "Languages": "English, Spanish"
  },
  "confidence": "high|medium|low",
  "summary": "Brief description of what was extracted"
}

Extract data from the following content:`;

    const extractionMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: content }
    ];

    let extractionResult: ExtractionResult | null = null;

    try {
      // Call AI model for extraction
      if (model.name.includes('gpt')) {
        const openai = new OpenAI({ apiKey: model.api_key || '' });
        const response = await openai.chat.completions.create({
          model: model.name,
          messages: extractionMessages as any,
          max_tokens: 2000,
          temperature: 0.3, // Lower temperature for more consistent extraction
          response_format: { type: 'json_object' },
        });
        const content = response.choices[0].message.content;
        extractionResult = content ? JSON.parse(content) : null;
      } else if (model.name.includes('grok')) {
        const response = await axios.post(
          model.endpoint || '',
          { 
            model: model.name, 
            messages: extractionMessages, 
            max_tokens: 2000,
            temperature: 0.3,
          },
          { headers: { Authorization: `Bearer ${model.api_key}` } }
        );
        const content = response.data.choices[0].message.content;
        extractionResult = content ? JSON.parse(content) : null;
      } else if (model.name.includes('claude')) {
        const response = await axios.post(
          model.endpoint || '',
          { 
            model: model.name, 
            messages: extractionMessages, 
            max_tokens: 2000,
            temperature: 0.3,
          },
          { headers: { 'x-api-key': model.api_key } }
        );
        const content = response.data.content[0].text;
        extractionResult = content ? JSON.parse(content) : null;
      } else {
        return NextResponse.json({ error: 'Model not supported for extraction' }, { status: 400 });
      }

      if (!extractionResult || !extractionResult.extracted) {
        console.error('[ExtractData] Invalid extraction result:', extractionResult);
        return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 });
      }

      console.log('[ExtractData] Extraction successful:', {
        keysExtracted: Object.keys(extractionResult.extracted).length,
        confidence: extractionResult.confidence
      });

      return NextResponse.json(extractionResult);

    } catch (aiError: any) {
      console.error('[ExtractData] AI extraction error:', aiError.message);
      return NextResponse.json({ 
        error: 'Failed to extract data from content',
        details: aiError.message 
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[ExtractData] API error:', error.message, error.stack);
    return NextResponse.json({ error: 'Error processing extraction request' }, { status: 500 });
  }
}

/**
 * GET /api/chat/extract-data
 * 
 * Returns extraction capabilities and supported fields
 */
export async function GET(request: Request) {
  return NextResponse.json({
    supportedFields: [
      'Full Name',
      'Education',
      'Skills',
      'Work Experience',
      'Languages',
      'Certifications',
      'Hobbies',
      'Hobby',
      'Location',
      'Email',
      'Phone',
      'LinkedIn',
      'GitHub',
      'Portfolio',
      'Driving Licence',
      'Nationality',
      'Date of Birth',
      'Address',
      'Professional Summary',
      'Projects',
      'Publications',
      'Awards',
      'References',
    ],
    description: 'Extract structured user data from messages/documents for personalized AI responses',
    usage: 'POST with { content: string, existingSettings?: object, extractionHints?: string[] }',
  });
}
