import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

// Fallback logging to file
function logToFile(message: string, data: any = {}) {
  try {
    const logMessage = `[${new Date().toISOString()}] [API] ${message}: ${JSON.stringify(data, null, 2)}\n`;
    const logDir = path.join(process.cwd(), 'logs');
    const logPath = path.join(logDir, 'api.log');
    
    // Create logs directory if it doesn't exist
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
    
    writeFileSync(logPath, logMessage, { flag: 'a' });
  } catch (error) {
    console.error('[API] Failed to write to log file:', error);
  }
}

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface Task {
  name: string;
  system_message: string;
}

/**
 * Auto-extract data from user message and save to ai_model_settings
 *
 * Prefer using the current chat's model when provided (chatModel). If chatModel is not
 * provided, fall back to selecting an appropriate active model from the organization.
 * 
 * Returns extraction result with extracted data and updated settings.
 */
async function autoExtractAndSaveData(
  userId: string,
  content: string,
  existingSettings: Record<string, any>,
  modelId: number,
  modelType: 'default' | 'user',
  chatModel?: { name?: string; api_key?: string | null; endpoint?: string | null; max_tokens?: number | null }
): Promise<{ success: boolean; extracted?: Record<string, any>; updatedSettings?: Record<string, any>; summary?: string; error?: string }> {
  try {
    console.log('[AutoExtract] Starting auto-extraction for user:', userId);

    // Get user's organization for model access
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.organization_id) {
      console.error('[AutoExtract] Profile error:', profileError?.message);
      return { success: false, error: 'Profile not found' };
    }

    console.log('[AutoExtract] Organization ID:', profile.organization_id);

    // Determine model to use: prefer provided chatModel
    let model: any = null;
    if (chatModel && chatModel.name) {
      model = chatModel;
      console.log('[AutoExtract] Using chat model provided by the request:', model.name);
    } else {
      // Fallback: find a capable model in ai_models_default
      const { data: extractionModels, error: modelsError } = await supabaseService
        .from('ai_models_default')
        .select('id, name, display_name, api_key, endpoint, max_tokens')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .limit(1);

      if (modelsError || !extractionModels || extractionModels.length === 0) {
        console.error('[AutoExtract] No extraction model available:', modelsError?.message);
        return { success: false, error: 'No extraction model available' };
      }
      model = extractionModels[0];
      console.log('[AutoExtract] Fallback model selected:', model.name);
    }

    // Build extraction prompt
    const hints = [
      'Full Name', 'Education', 'Skills', 'Work Experience', 'Languages',
      'Certifications', 'Hobbies', 'Location', 'LinkedIn', 'Driving Licence'
    ];

    const systemPrompt = `Extract structured key-value pairs from the user's message.\n\nRULES:\n1. Extract only factual information\n2. Use clear keys (e.g., \"Full Name\", \"Skills\")\n3. For lists, use comma-separated values\n4. Skip unclear information\n\nEXISTING SETTINGS:\n${Object.keys(existingSettings).length > 0 ? JSON.stringify(existingSettings, null, 2) : 'None'}\n\nSUGGESTED FIELDS: ${hints.join(', ')}\n\nRESPONSE (JSON only):\n{\n  "extracted": { "Key": "value" },\n  "confidence": "high|medium|low",\n  "summary": "What was extracted"\n}`;

    const extractionMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: content }
    ];

    let extractedData: any = null;

    console.log('[AutoExtract] Using model for extraction:', model.name, 'Endpoint:', model.endpoint);

    try {
      // Use the appropriate provider interface depending on model name
      if (model.name && model.name.toLowerCase().includes('gpt')) {
        console.log('[AutoExtract] Calling GPT model for extraction');
        const openai = new OpenAI({ apiKey: model.api_key || '' });
        const response = await openai.chat.completions.create({
          model: model.name,
          messages: extractionMessages as any,
          max_tokens: model.max_tokens || 2000,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });
        const responseContent = response.choices?.[0]?.message?.content;
        extractedData = responseContent ? JSON.parse(responseContent) : null;
      } else if (model.name && model.name.toLowerCase().includes('grok')) {
        console.log('[AutoExtract] Calling Grok model for extraction');
        const response = await axios.post(
          model.endpoint || '',
          {
            model: model.name,
            messages: extractionMessages,
            max_tokens: model.max_tokens || 2000,
            temperature: 0.3,
          },
          { headers: { Authorization: `Bearer ${model.api_key}` } }
        );
        const responseContent = response.data?.choices?.[0]?.message?.content || response.data?.text;
        extractedData = responseContent ? JSON.parse(responseContent) : null;
      } else if (model.name && model.name.toLowerCase().includes('claude')) {
        console.log('[AutoExtract] Calling Claude model for extraction');
        const response = await axios.post(
          model.endpoint || '',
          { model: model.name, messages: extractionMessages, max_tokens: model.max_tokens || 2000, temperature: 0.3 },
          { headers: { 'x-api-key': model.api_key } }
        );
        const responseContent = response.data?.content?.[0]?.text;
        extractedData = responseContent ? JSON.parse(responseContent) : null;
      } else {
        console.warn('[AutoExtract] Model not supported for extraction, skipping:', model.name);
        return { success: false, error: 'Model not supported for extraction' };
      }
    } catch (aiError: any) {
      // Handle AI provider errors gracefully (don't block chat)
      console.error('[AutoExtract] AI extraction error:', aiError?.message || aiError);
      if (aiError?.response) {
        console.error('[AutoExtract] AI response status:', aiError.response.status, aiError.response.data);
      }
      return { success: false, error: aiError?.message || 'AI extraction failed' };
    }

    if (extractedData && extractedData.extracted && Object.keys(extractedData.extracted).length > 0) {
      console.log('[AutoExtract] Extracted fields:', Object.keys(extractedData.extracted));

      // Merge with existing settings
      const mergedSettings = {
        ...existingSettings,
        ...extractedData.extracted
      };

      // Save to ai_model_settings (per-model settings)
      // Check if record exists
      const { data: existingRecord, error: checkError } = await supabaseService
        .from('ai_model_settings')
        .select('id')
        .eq('user_id', userId)
        .eq('model_id', modelId)
        .eq('model_type', modelType)
        .single();

      let updateError;
      if (checkError && checkError.code === 'PGRST116') {
        // No record exists, create one
        const { error: insertError } = await supabaseService
          .from('ai_model_settings')
          .insert({
            user_id: userId,
            model_id: modelId,
            model_type: modelType,
            settings: mergedSettings
          });
        updateError = insertError;
      } else if (existingRecord) {
        // Record exists, update it
        const { error: upsertError } = await supabaseService
          .from('ai_model_settings')
          .update({ 
            settings: mergedSettings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('model_id', modelId)
          .eq('model_type', modelType);
        updateError = upsertError;
      } else {
        updateError = checkError;
      }

      if (updateError) {
        console.error('[AutoExtract] Failed to save:', updateError.message);
        return { success: false, error: `Failed to save: ${updateError.message}` };
      } else {
        console.log('[AutoExtract] Successfully extracted and saved:', Object.keys(extractedData.extracted).length, 'fields');
        return {
          success: true,
          extracted: extractedData.extracted,
          updatedSettings: mergedSettings,
          summary: extractedData.summary || `Extracted ${Object.keys(extractedData.extracted).length} fields`
        };
      }
    } else {
      console.log('[AutoExtract] No data extracted or empty result');
      return { success: false, error: 'No data extracted' };
    }
  } catch (error: any) {
    console.error('[AutoExtract] Error:', error?.message || error);
    return { success: false, error: error?.message || 'Unknown error' };
  }
}


export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const isTaskEndpoint = url.pathname === '/api/chat/tasks';
    logToFile('Request received', { url: url.pathname, isTaskEndpoint });
    console.log('[API] Request received:', { url: url.pathname, isTaskEndpoint });

    if (isTaskEndpoint) {
      return await handleTaskManagement(request);
    }

    return await handleChat(request);
  } catch (error: any) {
    logToFile('Root error', { error: error.message, stack: error.stack });
    console.error('[API] Root error:', error.message, error.stack);
    return NextResponse.json({ error: `Server error: ${error.message}` }, { status: 500 });
  }
}

async function handleChat(request: Request) {
  try {
    logToFile('Processing chat request');
    console.log('[Chat] Processing chat request');

    const { messages, useSettings, attachedFileIds } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logToFile('Invalid request', { error: 'Messages array is required' });
      console.error('[Chat] Request error: Messages array is required');
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    logToFile('Request data', { messagesCount: messages.length, hasFiles: !!attachedFileIds?.length, fileCount: attachedFileIds?.length || 0 });
    console.log('[Chat] Request data:', { messagesCount: messages.length, hasFiles: !!attachedFileIds?.length, fileCount: attachedFileIds?.length || 0 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    );

    const authHeader = request.headers.get('Authorization');
    let user;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      logToFile('Using bearer token', { token: token.slice(0, 10) + '...' });
      console.log('[Chat] Using bearer token:', token.slice(0, 10) + '...');
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      if (error || !user) {
        logToFile('Token auth error', { error: error?.message });
        console.error('[Chat] Token auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      if (error || !user) {
        logToFile('Cookie auth error', { error: error?.message });
        console.error('[Chat] Cookie auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    logToFile('Authenticated user', { userId: user.id });
    console.log('[Chat] Authenticated user ID:', user.id);

    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData) {
      logToFile('Profile error', { error: profileError?.message });
      console.error('[Chat] Profile error:', profileError?.message || 'No profile found for user:', user.id);
      const defaultOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          organization_id: defaultOrgId,
          role: 'user',
        });

      if (insertProfileError) {
        logToFile('Insert profile error', { error: insertProfileError.message });
        console.error('[Chat] Insert profile error:', insertProfileError.message);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .select('id, organization_id, role')
        .eq('id', user.id)
        .single();

      if (newProfileError || !newProfile) {
        logToFile('Retry profile error', { error: newProfileError?.message });
        console.error('[Chat] Retry profile error:', newProfileError?.message);
        return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
      }
      profile = newProfile;
    } else {
      profile = profileData;
    }

    let settings;
    const { data: settingsData, error: settingsError } = await supabase
      .from('ai_user_settings')
      .select('default_model_id, user_model_id, selected_model_type')
      .eq('user_id', user.id)
      .single();

    logToFile('Settings query result', { settings: settingsData, error: settingsError?.message });
    console.log('[Chat] Settings query result:', settingsData, 'Error:', settingsError?.message);

    if (settingsError || !settingsData) {
      logToFile('Settings error', { error: settingsError?.message });
      console.error('[Chat] Settings error:', settingsError?.message || 'No settings found for user:', user.id);
      const { data: defaultModel, error: modelError } = await supabase
        .from('ai_models_default')
        .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .eq('user_role_to_access', 'user')
        .limit(1);

      if (modelError || !defaultModel || defaultModel.length === 0) {
        logToFile('Default model error', { error: modelError?.message });
        console.error('[Chat] Default model error:', modelError?.message);
        return NextResponse.json({ error: 'No default model available. Please contact an admin.' }, { status: 400 });
      }

      const { error: insertError } = await supabase
        .from('ai_user_settings')
        .insert({
          user_id: user.id,
          default_model_id: defaultModel[0].id,
          user_model_id: null,
          selected_model_type: 'default',
        });

      if (insertError) {
        logToFile('Insert settings error', { error: insertError.message });
        console.error('[Chat] Insert settings error:', insertError.message);
        return NextResponse.json({ error: 'Failed to initialize user settings' }, { status: 500 });
      }

      settings = {
        default_model_id: defaultModel[0].id,
        user_model_id: null,
        selected_model_type: 'default',
      };
    } else {
      settings = settingsData;
    }

    let model;
    let modelId;
    let modelType = settings.selected_model_type || 'default';

    if (modelType === 'default') {
      modelId = parseInt(settings.default_model_id || '0', 10);
      if (!modelId) {
        const { data: defaultModel, error: defaultModelError } = await supabase
          .from('ai_models_default')
          .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .eq('user_role_to_access', 'user')
          .limit(1);

        logToFile('Fallback default model query', { model: defaultModel, error: defaultModelError?.message });
        console.log('[Chat] Fallback default model query result:', defaultModel, 'Error:', defaultModelError?.message);

        if (defaultModelError || !defaultModel || defaultModel.length === 0) {
          logToFile('Fallback default model error', { error: defaultModelError?.message });
          console.error('[Chat] Fallback default model error:', defaultModelError?.message);
          return NextResponse.json({ error: 'No valid default model available. Please contact an admin.' }, { status: 400 });
        }
        model = { data: defaultModel, error: defaultModelError };
        modelId = defaultModel[0].id;
        const { error: updateSettingsError } = await supabase
          .from('ai_user_settings')
          .update({
            default_model_id: modelId,
            user_model_id: null,
            selected_model_type: 'default',
          })
          .eq('user_id', user.id);
        if (updateSettingsError) {
          logToFile('Update settings error', { error: updateSettingsError.message });
          console.error('[Chat] Update settings error:', updateSettingsError.message);
        }
      } else {
        model = await supabase
          .from('ai_models_default')
          .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
          .eq('id', modelId)
          .eq('is_active', true)
          .limit(1);
      }
    } else {
      modelId = parseInt(settings.user_model_id || '0', 10);
      if (!modelId) {
        modelType = 'default';
        const { data: defaultModel, error: defaultModelError } = await supabase
          .from('ai_models_default')
          .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .eq('user_role_to_access', 'user')
          .limit(1);

        logToFile('Fallback default model query', { model: defaultModel, error: defaultModelError?.message });
        console.log('[Chat] Fallback default model query result:', defaultModel, 'Error:', defaultModelError?.message);

        if (defaultModelError || !defaultModel || defaultModel.length === 0) {
          logToFile('Fallback default model error', { error: defaultModelError?.message });
          console.error('[Chat] Fallback default model error:', defaultModelError?.message);
          return NextResponse.json({ error: 'No valid default model available. Please contact an admin.' }, { status: 400 });
        }
        model = { data: defaultModel, error: defaultModelError };
        modelId = defaultModel[0].id;
        const { error: updateSettingsError } = await supabase
          .from('ai_user_settings')
          .update({
            default_model_id: modelId,
            user_model_id: null,
            selected_model_type: 'default',
          })
          .eq('user_id', user.id);
        if (updateSettingsError) {
          logToFile('Update settings error', { error: updateSettingsError.message });
          console.error('[Chat] Update settings error:', updateSettingsError.message);
        }
      } else {
        model = await supabaseService
          .from('ai_models')
          .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
          .eq('id', modelId)
          .eq('user_id', user.id)
          .limit(1);

        logToFile('User model query result', { model: model.data, error: model.error?.message });
        console.log('[Chat] User model query result:', model.data, 'Error:', model.error?.message);

        if (!model.data || model.data.length === 0) {
          logToFile('Model not found', { modelId, userId: user.id });
          console.error('[Chat] Model not found in ai_models for ID:', modelId, 'User ID:', user.id);
          modelType = 'default';
          const { data: defaultModel, error: defaultModelError } = await supabase
            .from('ai_models_default')
            .select('id, name, display_name, api_key, endpoint, max_tokens, system_message, icon, task')
            .eq('organization_id', profile.organization_id)
            .eq('is_active', true)
            .eq('user_role_to_access', 'user')
            .limit(1);

          if (defaultModelError || !defaultModel || defaultModel.length === 0) {
            logToFile('Fallback default model error', { error: defaultModelError?.message });
            console.error('[Chat] Fallback default model error:', defaultModelError?.message);
            return NextResponse.json({ error: 'No valid default model available. Please contact an admin.' }, { status: 400 });
          }
          model = { data: defaultModel, error: defaultModelError };
          modelId = defaultModel[0].id;
          const { error: updateSettingsError } = await supabase
            .from('ai_user_settings')
            .update({
              default_model_id: modelId,
              user_model_id: null,
              selected_model_type: 'default',
            })
            .eq('user_id', user.id);
          if (updateSettingsError) {
            logToFile('Update settings error', { error: updateSettingsError.message });
            console.error('[Chat] Update settings error:', updateSettingsError.message);
          }
        }
      }
    }

    logToFile('Final model query result', { model: model.data, error: model.error?.message, modelId, modelType });
    console.log('[Chat] Final model query result:', model.data, 'Error:', model.error?.message, 'Model ID:', modelId, 'Model type:', modelType);

    if (model.error || !model.data || model.data.length === 0) {
      logToFile('Model error', { modelId, modelType, userId: user.id });
      console.error('[Chat] Model error: Model not found for user:', user.id, 'Model ID:', modelId, 'Model type:', modelType);
      return NextResponse.json({ error: 'Model not found. Please check model settings or contact support.' }, { status: 404 });
    }

    const { id, name, api_key, endpoint, max_tokens, system_message, task } = model.data[0];
    logToFile('Using model', { name, modelId: id, endpoint, modelType });
    console.log('[Chat] Using model:', name, 'Model ID:', id, 'Endpoint:', endpoint, 'Model type:', modelType);

    // Load model-specific settings from ai_model_settings
    let modelSettings: Record<string, any> = {};
    const { data: modelSettingsData, error: modelSettingsError } = await supabase
      .from('ai_model_settings')
      .select('settings')
      .eq('user_id', user.id)
      .eq('model_id', id)
      .eq('model_type', modelType)
      .single();

    if (!modelSettingsError && modelSettingsData) {
      modelSettings = modelSettingsData.settings || {};
      console.log('[Chat] Loaded model-specific settings:', Object.keys(modelSettings).length, 'keys');
    } else {
      console.log('[Chat] No model-specific settings found or error:', modelSettingsError?.message);
    }

    // Parse attached files if any
    let fileContext = '';
    if (attachedFileIds && Array.isArray(attachedFileIds) && attachedFileIds.length > 0) {
      try {
        logToFile('Parsing attached files', { fileIds: attachedFileIds });
        console.log('[Chat] Parsing attached files:', attachedFileIds);

        // Build the full URL for the parse endpoint
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const parseUrl = `${baseUrl}/api/chat/files/parse`;
        
        console.log('[Chat] Parse API URL:', parseUrl);

        const parseResponse = await fetch(parseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader || '',
          },
          body: JSON.stringify({ 
            fileIds: attachedFileIds.map((f: any) => typeof f === 'string' ? f : f.id)
          }),
        });

        if (!parseResponse.ok) {
          const errorData = await parseResponse.json();
          logToFile('Parse API error', { status: parseResponse.status, error: errorData });
          console.error('[Chat] Parse API error:', parseResponse.status, errorData);
        } else {
          const { files } = await parseResponse.json();
          logToFile('Parsed files', { fileCount: files?.length || 0 });
          console.log('[Chat] Parsed files:', files?.length || 0);

          if (files && files.length > 0) {
            const fileContextParts = files.map((file: any) => {
              const content = file.content || '[No content extracted - file may require additional libraries]';
              return `--- File: ${file.name} (${file.type}) ---\n${content}\n`;
            });
            fileContext = '\n\n📎 Attached Files:\n\n' + fileContextParts.join('\n') + '\n---\n\n';
            logToFile('File context created', { length: fileContext.length });
            console.log('[Chat] File context created, length:', fileContext.length);
          }
        }
      } catch (parseError: any) {
        logToFile('Parse error', { error: parseError.message });
        console.error('[Chat] Parse error:', parseError.message);
        // Continue without file context if parsing fails
      }
    }

    // Construct system message with model system_message, task, and modelSettings (if useSettings is true)
    let fullSystemMessage = system_message || '';
    // Check for task in messages (client may send task system_message)
    const taskMessage = messages.find((msg: Message) => msg.role === 'system' && msg.content.includes('Task:'));
    if (taskMessage) {
      fullSystemMessage += fullSystemMessage ? `\n${taskMessage.content}` : taskMessage.content;
    }
    // Append modelSettings only if useSettings is true
    if (useSettings && modelSettings && Object.keys(modelSettings).length > 0) {
      const settingsText = Object.entries(modelSettings)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');
      fullSystemMessage += fullSystemMessage ? `\n${settingsText}` : settingsText;
    }

    // Filter out any existing system messages from client to avoid duplication
    const filteredMessages = messages.filter((msg: Message) => msg.role !== 'system');
    
    // Add file context to the last user message if available
    if (fileContext && filteredMessages.length > 0) {
      const lastMessageIndex = filteredMessages.length - 1;
      filteredMessages[lastMessageIndex] = {
        ...filteredMessages[lastMessageIndex],
        content: fileContext + filteredMessages[lastMessageIndex].content,
      };
      logToFile('Added file context to message', { messageLength: filteredMessages[lastMessageIndex].content.length });
      console.log('[Chat] Added file context to last message');
    }
    
    const fullMessages: Message[] = fullSystemMessage
      ? [{ role: 'system', content: fullSystemMessage }, ...filteredMessages]
      : filteredMessages;

    // Check if this is a data extraction task
    const isDataExtractionTask = task && Array.isArray(task) && task.some((t: Task) => 
      t.name && t.name.toLowerCase().includes('data for settings') || 
      (t.system_message && t.system_message.toLowerCase().includes('extract data from the current message'))
    );

    console.log('[Chat] Data extraction task check:', {
      hasTask: !!task,
      isArray: Array.isArray(task),
      isDataExtractionTask,
      taskCount: Array.isArray(task) ? task.length : 0
    });

    let response;
    let aiResponseContent: string = '';
    let extractionResult: any = null;
    
    if (name.includes('gpt')) {
      const openai = new OpenAI({ apiKey: api_key });
      response = await openai.chat.completions.create({
        model: name,
        messages: fullMessages,
        max_tokens,
      });
      aiResponseContent = response.choices[0].message.content || '';
      
      // Auto-extract data if this is a data extraction task
      if (isDataExtractionTask && aiResponseContent && filteredMessages.length > 0) {
        try {
          extractionResult = await autoExtractAndSaveData(
            user.id,
            filteredMessages[filteredMessages.length - 1].content,
            modelSettings,
            modelId,
            modelType,
            { name, api_key, endpoint, max_tokens }
          );
          
          // Append extraction info to the response
          if (extractionResult.success && extractionResult.extracted) {
            const extractedFields = Object.entries(extractionResult.extracted)
              .map(([key, value]) => `  • ${key}: ${value}`)
              .join('\n');
            aiResponseContent += `\n\n📝 **Extracted Information:**\n${extractedFields}\n\n✅ Your profile has been updated with this information.`;
          }
        } catch (extractError: any) {
          console.error('[Chat] Auto-extraction failed:', extractError.message);
          // Don't fail the chat request if extraction fails
        }
      }
      
      return NextResponse.json({ 
        message: aiResponseContent,
        extractionResult: extractionResult?.success ? {
          extracted: extractionResult.extracted,
          updatedSettings: extractionResult.updatedSettings
        } : null
      });
    } else if (name.includes('grok')) {
      response = await axios.post(
        endpoint,
        { model: name, messages: fullMessages, max_tokens },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
      aiResponseContent = response.data.choices[0].message.content || response.data.text || '';
      
      // Auto-extract data if this is a data extraction task
      if (isDataExtractionTask && aiResponseContent && filteredMessages.length > 0) {
        try {
          console.log('[Chat] Triggering auto-extraction (Grok)');
          extractionResult = await autoExtractAndSaveData(
            user.id,
            filteredMessages[filteredMessages.length - 1].content,
            modelSettings,
            modelId,
            modelType,
            { name, api_key, endpoint, max_tokens }
          );
          
          // Append extraction info to the response
          if (extractionResult.success && extractionResult.extracted) {
            const extractedFields = Object.entries(extractionResult.extracted)
              .map(([key, value]) => `  • ${key}: ${value}`)
              .join('\n');
            aiResponseContent += `\n\n📝 **Extracted Information:**\n${extractedFields}\n\n✅ Your profile has been updated with this information.`;
          }
        } catch (extractError: any) {
          console.error('[Chat] Auto-extraction failed:', extractError.message);
        }
      }
      
      return NextResponse.json({ 
        message: aiResponseContent,
        extractionResult: extractionResult?.success ? {
          extracted: extractionResult.extracted,
          updatedSettings: extractionResult.updatedSettings
        } : null
      });
    } else if (name.includes('llama') || name.includes('mixtral')) {
      response = await axios.post(
        endpoint,
        { inputs: filteredMessages[filteredMessages.length - 1].content, parameters: { max_new_tokens: max_tokens } },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
      aiResponseContent = response.data[0].generated_text || '';
      return NextResponse.json({ message: aiResponseContent });
    } else if (name.includes('claude')) {
      response = await axios.post(
        endpoint,
        { model: name, messages: fullMessages, max_tokens },
        { headers: { 'x-api-key': api_key } }
      );
      aiResponseContent = response.data.content[0].text || '';
      
      // Auto-extract data if this is a data extraction task
      if (isDataExtractionTask && aiResponseContent && filteredMessages.length > 0) {
        try {
          console.log('[Chat] Triggering auto-extraction (Claude)');
          extractionResult = await autoExtractAndSaveData(
            user.id,
            filteredMessages[filteredMessages.length - 1].content,
            modelSettings,
            modelId,
            modelType,
            { name, api_key, endpoint, max_tokens }
          );
          
          // Append extraction info to the response
          if (extractionResult.success && extractionResult.extracted) {
            const extractedFields = Object.entries(extractionResult.extracted)
              .map(([key, value]) => `  • ${key}: ${value}`)
              .join('\n');
            aiResponseContent += `\n\n📝 **Extracted Information:**\n${extractedFields}\n\n✅ Your profile has been updated with this information.`;
          }
        } catch (extractError: any) {
          console.error('[Chat] Auto-extraction failed:', extractError.message);
        }
      }
      
      return NextResponse.json({ 
        message: aiResponseContent,
        extractionResult: extractionResult?.success ? {
          extracted: extractionResult.extracted,
          updatedSettings: extractionResult.updatedSettings
        } : null
      });
    } else if (name.includes('deepseek')) {
      response = await axios.post(
        endpoint,
        { model: name, messages: fullMessages, max_tokens },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
      return NextResponse.json({ message: response.data.choices[0].message.content });
    }

    logToFile('Unsupported model', { name });
    console.error('[Chat] Unsupported model:', name);
    return NextResponse.json({ error: 'Unsupported model' }, { status: 400 });
  } catch (error: any) {
    logToFile('Chat API error', { error: error.message, stack: error.stack });
    console.error('[Chat] Chat API error:', error.message, error.stack);
    return NextResponse.json({ error: `Error processing request: ${error.message}` }, { status: 500 });
  }
}

async function handleTaskManagement(request: Request) {
  try {
    logToFile('Processing task management request');
    console.log('[Tasks] Processing task management request');

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      logToFile('Missing environment variables', {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      console.error('[Tasks] Missing environment variables', {
        supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
      return NextResponse.json({ error: 'Server configuration error: Missing environment variables' }, { status: 500 });
    }

    const { modelId, modelType, tasks } = await request.json();
    logToFile('Task request payload', { modelId, modelType, tasks });
    console.log('[Tasks] Request payload:', { modelId, modelType, tasks });

    if (!modelId || !modelType || !Array.isArray(tasks)) {
      logToFile('Invalid request', { error: 'modelId, modelType, and tasks array are required' });
      console.error('[Tasks] Invalid request: modelId, modelType, and tasks array are required');
      return NextResponse.json({ error: 'modelId, modelType, and tasks array are required' }, { status: 400 });
    }

    // Validate tasks format
    for (const task of tasks) {
      if (!task.name || typeof task.name !== 'string' || !task.system_message || typeof task.system_message !== 'string') {
        logToFile('Invalid task format', { task });
        console.error('[Tasks] Invalid task format:', task);
        return NextResponse.json({ error: 'Each task must have a name and system_message as strings' }, { status: 400 });
      }
    }

    // Authenticate user
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logToFile('Auth error', { error: 'No valid token provided' });
      console.error('[Tasks] Auth error: No valid token provided');
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    logToFile('Using bearer token', { token: token.slice(0, 10) + '...' });
    console.log('[Tasks] Using bearer token:', token.slice(0, 10) + '...');
    const { data: { user }, error: authError } = await supabaseService.auth.getUser(token);
    if (authError || !user) {
      logToFile('Token auth error', { error: authError?.message });
      console.error('[Tasks] Token auth error:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // Fetch user profile for role-based access
    const { data: profile, error: profileError } = await supabaseService
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logToFile('Profile error', { error: profileError?.message, userId: user.id });
      console.error('[Tasks] Profile error:', profileError?.message, 'User ID:', user.id);
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
    }

    logToFile('User profile', { userId: user.id, role: profile.role, orgId: profile.organization_id });
    console.log('[Tasks] User profile:', { userId: user.id, role: profile.role, orgId: profile.organization_id });

    // Validate model and access
    const table = modelType === 'default' ? 'ai_models_default' : 'ai_models';
    let query = supabaseService
      .from(table)
      .select('id, organization_id, user_id')
      .eq('id', modelId);

    if (modelType === 'user') {
      query = query.eq('user_id', user.id);
    } else if (modelType === 'default' && profile.role !== 'admin' && profile.role !== 'superadmin') {
      logToFile('Access denied', { error: 'Only admins can modify default models', userId: user.id, modelId, modelType });
      console.error('[Tasks] Access denied: Only admins can modify default models', { userId: user.id, modelId, modelType });
      return NextResponse.json({ error: 'Only admins can modify default models' }, { status: 403 });
    }

    const { data: model, error: modelError } = await query.single();
    if (modelError || !model) {
      logToFile('Model error', { error: modelError?.message, modelId, modelType, userId: user.id });
      console.error('[Tasks] Model error:', modelError?.message, 'Model ID:', modelId, 'Model Type:', modelType, 'User ID:', user.id);
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    if (modelType === 'default' && model.organization_id !== profile.organization_id) {
      logToFile('Access denied', { error: 'Model does not belong to user’s organization', modelId, orgId: profile.organization_id });
      console.error('[Tasks] Access denied: Model does not belong to user’s organization', { modelId, orgId: profile.organization_id });
      return NextResponse.json({ error: 'Unauthorized access to model' }, { status: 403 });
    }

    // Deduplicate tasks by name
    const taskMap = new Map<string, Task>();
    tasks.forEach((task: Task) => taskMap.set(task.name, task));
    const uniqueTasks = Array.from(taskMap.values());

    // Update tasks
    const { error: updateError } = await supabaseService
      .from(table)
      .update({ task: uniqueTasks })
      .eq('id', modelId);

    if (updateError) {
      logToFile('Update tasks error', { error: updateError.message, modelId, modelType });
      console.error('[Tasks] Update tasks error:', updateError.message, 'Model ID:', modelId, 'Model Type:', modelType);
      return NextResponse.json({ error: `Failed to update tasks: ${updateError.message}` }, { status: 500 });
    }

    logToFile('Tasks updated successfully', { modelId, modelType, tasks: uniqueTasks });
    console.log('[Tasks] Tasks updated successfully:', { modelId, modelType, tasks: uniqueTasks });
    return NextResponse.json({ message: 'Tasks updated successfully', tasks: uniqueTasks }, { status: 200 });
  } catch (error: any) {
    logToFile('Task management error', { error: error.message, stack: error.stack });
    console.error('[Tasks] Task management error:', error.message, error.stack);
    return NextResponse.json({ error: `Error processing task management: ${error.message}` }, { status: 500 });
  }
}