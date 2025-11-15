import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface TranslateRequest {
  tableName: string;
  field: string;
  content: string;
  sourceLanguage: string;
  targetLanguages: string[];
}

/**
 * AI Translation API Route
 * 
 * Translates content using the System Translator agent (role='translator')
 * Validates table/field against agent's task configuration
 * Returns JSONB object with translations for all target languages
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Translate] Missing authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Create Supabase client with anon key and set session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    );

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('[Translate] Auth error:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Translate] Authenticated user:', user.id);

    // Get user's organization
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('[Translate] Profile error:', profileError?.message);
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const body: TranslateRequest = await request.json();
    const { tableName, field, content, sourceLanguage, targetLanguages } = body;

    console.log('[Translate] Request:', {
      tableName,
      field,
      sourceLanguage,
      targetLanguages,
      organizationId: profile.organization_id,
    });

    // Validate request
    if (!tableName || !field || !content || !sourceLanguage || !targetLanguages?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get System Translator agent by role
    const { data: translatorAgent, error: agentError } = await supabaseService
      .from('ai_models_system')
      .select('id, name, display_name, role, task, system_message, api_key, endpoint, max_tokens')
      .eq('role', 'translator')
      .eq('is_active', true)
      .single();

    if (agentError || !translatorAgent) {
      console.error('[Translate] Translator agent not found:', agentError?.message);
      return NextResponse.json({ error: 'Translation service not available' }, { status: 503 });
    }

    console.log('[Translate] Using translator agent:', translatorAgent.name);

    // Validate table/field against task configuration
    // Task is now an array of objects: [{ table, fields, name, system_message }]
    const taskConfig = translatorAgent.task as Array<{
      table: string;
      fields: string[];
      name: string;
      system_message: string;
    }>;

    const tableTask = taskConfig.find(t => t.table === tableName);
    if (!tableTask || !tableTask.fields.includes(field)) {
      console.error('[Translate] Table/field not configured:', { tableName, field, task: taskConfig });
      return NextResponse.json({
        error: `Translation not configured for ${tableName}.${field}`,
      }, { status: 400 });
    }

    console.log('[Translate] Using task:', tableTask.name);

    // Get organization's AI settings (API key, endpoint) - optional fallback to agent settings
    const { data: orgAISettings, error: aiSettingsError } = await supabaseService
      .from('settings')
      .select('ai_api_key, ai_endpoint, ai_model_name')
      .eq('organization_id', profile.organization_id)
      .maybeSingle(); // Use maybeSingle() instead of single() to allow null results

    // Prioritize organization settings, fallback to translator agent settings
    const apiKey = orgAISettings?.ai_api_key || translatorAgent.api_key || process.env.OPENAI_API_KEY;
    const endpoint = orgAISettings?.ai_endpoint || translatorAgent.endpoint || 'https://api.openai.com/v1';
    const modelName = orgAISettings?.ai_model_name || translatorAgent.name || 'gpt-4o-mini';

    console.log('[Translate] Using credentials:', {
      source: orgAISettings?.ai_api_key ? 'organization' : 'agent/env',
      endpoint: endpoint.substring(0, 30) + '...',
      model: modelName,
    });

    if (!apiKey || !endpoint) {
      console.error('[Translate] Missing API credentials after all fallbacks');
      return NextResponse.json({ error: 'AI credentials not configured' }, { status: 500 });
    }

    // Perform translations
    const translations: Record<string, string> = {};
    const errors: string[] = [];

    for (const targetLang of targetLanguages) {
      try {
        console.log(`[Translate] Translating to ${targetLang}...`);

        // Build system message from task-specific template with placeholders replaced
        const systemMessage = tableTask.system_message
          .replace('{source_lang}', sourceLanguage)
          .replace('{target_lang}', targetLang);

        let translatedText = '';

        // Call AI provider based on endpoint
        if (endpoint.includes('anthropic.com')) {
          // Anthropic/Claude
          const anthropic = new Anthropic({ apiKey });
          const response = await anthropic.messages.create({
            model: modelName,
            max_tokens: translatorAgent.max_tokens,
            system: systemMessage,
            messages: [{ role: 'user', content }],
          });

          translatedText = response.content[0].type === 'text'
            ? response.content[0].text
            : '';
        } else {
          // OpenAI-compatible (OpenAI, X.AI, etc.)
          // Ensure endpoint doesn't have trailing path - baseURL should be just the base
          const baseURL = endpoint.replace(/\/chat\/completions$/, '').replace(/\/$/, '');
          
          const openai = new OpenAI({ 
            apiKey, 
            baseURL,
          });
          
          const response = await openai.chat.completions.create({
            model: modelName,
            max_tokens: translatorAgent.max_tokens,
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content },
            ],
          });

          translatedText = response.choices[0]?.message?.content || '';
        }

        translations[targetLang] = translatedText.trim();
        console.log(`[Translate] ✓ ${targetLang}:`, translatedText.substring(0, 50) + '...');
      } catch (error: any) {
        console.error(`[Translate] Error translating to ${targetLang}:`, error.message);
        errors.push(`${targetLang}: ${error.message}`);
      }
    }

    if (Object.keys(translations).length === 0) {
      return NextResponse.json({
        error: 'All translations failed',
        details: errors,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      translations,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('[Translate] Server error:', error.message);
    return NextResponse.json({
      error: `Translation failed: ${error.message}`,
    }, { status: 500 });
  }
}
