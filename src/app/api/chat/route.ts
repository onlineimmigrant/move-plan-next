import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import axios from 'axios';
import { writeFileSync } from 'fs';
import path from 'path';

// Fallback logging to file
function logToFile(message: string, data: any = {}) {
  try {
    const logMessage = `[${new Date().toISOString()}] [API] ${message}: ${JSON.stringify(data, null, 2)}\n`;
    const logPath = path.join(process.cwd(), 'logs', 'api.log');
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

    const { messages, useSettings } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      logToFile('Invalid request', { error: 'Messages array is required' });
      console.error('[Chat] Request error: Messages array is required');
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

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
      .select('default_model_id, user_model_id, selected_model_type, default_settings')
      .eq('user_id', user.id)
      .single();

    logToFile('Settings query result', { settings: settingsData, error: settingsError?.message });
    console.log('[Chat] Settings query result:', settingsData, 'Error:', settingsError?.message);

    if (settingsError || !settingsData) {
      logToFile('Settings error', { error: settingsError?.message });
      console.error('[Chat] Settings error:', settingsError?.message || 'No settings found for user:', user.id);
      const { data: defaultModel, error: modelError } = await supabase
        .from('ai_models_default')
        .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
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
          default_settings: {},
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
        default_settings: {},
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
          .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
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
            default_settings: settings.default_settings || {},
          })
          .eq('user_id', user.id);
        if (updateSettingsError) {
          logToFile('Update settings error', { error: updateSettingsError.message });
          console.error('[Chat] Update settings error:', updateSettingsError.message);
        }
      } else {
        model = await supabase
          .from('ai_models_default')
          .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
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
          .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
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
            default_settings: settings.default_settings || {},
          })
          .eq('user_id', user.id);
        if (updateSettingsError) {
          logToFile('Update settings error', { error: updateSettingsError.message });
          console.error('[Chat] Update settings error:', updateSettingsError.message);
        }
      } else {
        model = await supabaseService
          .from('ai_models')
          .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
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
            .select('id, name, api_key, endpoint, max_tokens, system_message, icon, task')
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
              default_settings: settings.default_settings || {},
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

    // Construct system message with model system_message, task, and default_settings (if useSettings is true)
    let fullSystemMessage = system_message || '';
    // Check for task in messages (client may send task system_message)
    const taskMessage = messages.find((msg: Message) => msg.role === 'system' && msg.content.includes('Task:'));
    if (taskMessage) {
      fullSystemMessage += fullSystemMessage ? `\n${taskMessage.content}` : taskMessage.content;
    }
    // Append default_settings only if useSettings is true
    if (useSettings && settings.default_settings && Object.keys(settings.default_settings).length > 0) {
      const settingsText = Object.entries(settings.default_settings)
        .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n');
      fullSystemMessage += fullSystemMessage ? `\n${settingsText}` : settingsText;
    }

    // Filter out any existing system messages from client to avoid duplication
    const filteredMessages = messages.filter((msg: Message) => msg.role !== 'system');
    const fullMessages: Message[] = fullSystemMessage
      ? [{ role: 'system', content: fullSystemMessage }, ...filteredMessages]
      : filteredMessages;

    let response;
    if (name.includes('gpt')) {
      const openai = new OpenAI({ apiKey: api_key });
      response = await openai.chat.completions.create({
        model: name,
        messages: fullMessages,
        max_tokens,
      });
      return NextResponse.json({ message: response.choices[0].message.content });
    } else if (name.includes('grok')) {
      response = await axios.post(
        endpoint,
        { model: name, messages: fullMessages, max_tokens },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
      return NextResponse.json({ message: response.data.choices[0].message.content || response.data.text });
    } else if (name.includes('llama') || name.includes('mixtral')) {
      response = await axios.post(
        endpoint,
        { inputs: filteredMessages[filteredMessages.length - 1].content, parameters: { max_new_tokens: max_tokens } },
        { headers: { Authorization: `Bearer ${api_key}` } }
      );
      return NextResponse.json({ message: response.data[0].generated_text });
    } else if (name.includes('claude')) {
      response = await axios.post(
        endpoint,
        { model: name, messages: fullMessages, max_tokens },
        { headers: { 'x-api-key': api_key } }
      );
      return NextResponse.json({ message: response.data.content[0].text });
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
    } else if (modelType === 'default' && profile.role !== 'admin') {
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