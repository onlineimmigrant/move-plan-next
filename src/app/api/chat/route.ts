//app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseAIServerClient } from '@/lib/supabaseAI';
import OpenAI from 'openai';
import axios from 'axios';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('Request error: Messages array is required');
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const supabase = await createSupabaseAIServerClient();
    
    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    let user;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data, error } = await supabase.auth.getUser(token);
      user = data.user;
      if (error || !user) {
        console.error('Token auth error:', error?.message || 'No user found', 'Token:', token.slice(0, 10) + '...');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      if (error || !user) {
        console.error('Cookie auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Authenticated user ID:', user.id);

    // Fetch or create user profile
    let profile;
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .limit(1);

    if (profileError || !profileData || profileData.length === 0) {
      console.error('Profile error:', profileError?.message || 'No profile found for user:', user.id);
      
      const defaultOrgId = 'de0d5c21-787f-49c2-a665-7ff8e599c891';
      const { error: insertProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          organization_id: defaultOrgId,
          role: 'user',
        });

      if (insertProfileError) {
        console.error('Insert profile error:', insertProfileError.message);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      const { data: newProfile, error: newProfileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .limit(1);

      if (newProfileError || !newProfile || newProfile.length === 0) {
        console.error('Retry profile error:', newProfileError?.message);
        return NextResponse.json({ error: 'User profile not found' }, { status: 400 });
      }

      profile = newProfile[0];
    } else {
      profile = profileData[0];
    }

    // Fetch or create user settings
    let settings;
    const { data: settingsData, error: settingsError } = await supabase
      .from('ai_user_settings')
      .select('default_model_id, user_model_id, selected_model_type')
      .eq('user_id', user.id)
      .limit(1);

    console.log('Settings query result:', settingsData, 'Error:', settingsError?.message);

    if (settingsError || !settingsData || settingsData.length === 0) {
      console.error('Settings error:', settingsError?.message || 'No settings found for user:', user.id);
      
      // Log all settings for debugging
      const { data: allSettings } = await supabase
        .from('ai_user_settings')
        .select('*')
        .eq('user_id', user.id);
      console.error('All settings for user:', allSettings || 'None');

      // Find a default model
      let defaultModelQuery = supabase
        .from('ai_models_default')
        .select('id, name')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .eq('user_role_to_access', 'user')
        .limit(1);

      let { data: defaultModel, error: modelError } = await defaultModelQuery;

      console.log('Default model query result:', defaultModel, 'Error:', modelError?.message);

      if (modelError || !defaultModel || defaultModel.length === 0) {
        console.error('Default model error:', modelError?.message || 'No default model found for organization:', profile.organization_id);
        
        // Fallback to any active model
        defaultModelQuery = supabase
          .from('ai_models_default')
          .select('id, name')
          .eq('is_active', true)
          .eq('user_role_to_access', 'user')
          .limit(1);

        const fallbackResult = await defaultModelQuery;
        defaultModel = fallbackResult.data;
        modelError = fallbackResult.error;

        console.log('Fallback model query result:', defaultModel, 'Error:', modelError?.message);

        if (modelError || !defaultModel || defaultModel.length === 0) {
          console.error('Fallback model error:', modelError?.message || 'No active models available');
          const { data: allModels } = await supabase
            .from('ai_models_default')
            .select('id, name, organization_id, is_active, user_role_to_access');
          console.error('All available models:', allModels || 'None');
          return NextResponse.json({ error: 'No default model available. Please contact an admin.' }, { status: 400 });
        }
      }

      // Create default settings
      const { error: insertError } = await supabase
        .from('ai_user_settings')
        .insert({
          user_id: user.id,
          default_model_id: defaultModel[0].id,
          selected_model_type: 'default',
          organization_id: profile.organization_id,
        });

      if (insertError) {
        console.error('Insert settings error:', insertError.message);
        return NextResponse.json({ error: 'Failed to initialize user settings' }, { status: 500 });
      }

      // Retry fetching settings
      const { data: newSettings, error: newSettingsError } = await supabase
        .from('ai_user_settings')
        .select('default_model_id, user_model_id, selected_model_type')
        .eq('user_id', user.id)
        .limit(1);

      if (newSettingsError || !newSettings || newSettings.length === 0) {
        console.error('Retry settings error:', newSettingsError?.message);
        return NextResponse.json({ error: 'Failed to initialize user settings' }, { status: 500 });
      }

      settings = newSettings[0];
    } else {
      settings = settingsData[0];
    }

    // Fetch model details
    let model;
    if (settings.selected_model_type === 'default') {
      model = await supabase
        .from('ai_models_default')
        .select('name, api_key, endpoint, max_tokens, system_message, icon')
        .eq('id', settings.default_model_id)
        .limit(1);
    } else {
      model = await supabase
        .from('ai_models')
        .select('name, api_key, endpoint, max_tokens, system_message')
        .eq('id', settings.user_model_id)
        .eq('user_id', user.id)
        .limit(1);
    }

    console.log('Model query result:', model.data, 'Error:', model.error?.message);

    if (!model.data || model.data.length === 0) {
      console.error('Model error: Model not found for user:', user.id, 'Model ID:', settings.default_model_id || settings.user_model_id);
      return NextResponse.json({ error: 'Model not found' }, { status: 400 });
    }

    const { name, api_key, endpoint, max_tokens, system_message } = model.data[0];
    console.log('Using model:', name, 'Endpoint:', endpoint);

    // Prepend system message to the conversation history
    const fullMessages: Message[] = [
      { role: 'system', content: system_message },
      ...messages,
    ];

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
        { inputs: messages[messages.length - 1].content, parameters: { max_new_tokens: max_tokens } },
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

    console.error('Unsupported model:', name);
    return NextResponse.json({ error: 'Unsupported model' }, { status: 400 });
  } catch (error: any) {
    console.error('Chat API error:', error.message, error.stack);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}