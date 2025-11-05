import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, settingKey, settingValue, modelId, modelType } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (!modelId || !modelType) {
      return NextResponse.json({ error: 'modelId and modelType are required' }, { status: 400 });
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
        console.error('Token auth error:', error?.message || 'No user found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Fetch current settings for this user+model combination
    const { data: modelSettingsData, error: settingsError } = await supabaseService
      .from('ai_model_settings')
      .select('settings')
      .eq('user_id', user.id)
      .eq('model_id', modelId)
      .eq('model_type', modelType)
      .single();

    let currentSettings: Record<string, any> = {};
    let isNewRecord = false;

    if (settingsError) {
      if (settingsError.code === 'PGRST116') {
        // No record exists yet, will create one
        isNewRecord = true;
      } else {
        console.error('Settings fetch error:', settingsError.message);
        return NextResponse.json({ error: 'Error fetching settings' }, { status: 500 });
      }
    } else {
      currentSettings = modelSettingsData.settings || {};
    }

    // Handle CRUD actions
    if (action === 'add' || action === 'update') {
      if (!settingKey || settingValue === undefined) {
        return NextResponse.json({ error: 'settingKey and settingValue are required' }, { status: 400 });
      }
      currentSettings[settingKey] = settingValue;
    } else if (action === 'delete') {
      if (!settingKey) {
        return NextResponse.json({ error: 'settingKey is required' }, { status: 400 });
      }
      delete currentSettings[settingKey];
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Insert or update settings in the database
    if (isNewRecord) {
      const { error: insertError } = await supabaseService
        .from('ai_model_settings')
        .insert({
          user_id: user.id,
          model_id: modelId,
          model_type: modelType,
          settings: currentSettings
        });

      if (insertError) {
        console.error('Insert settings error:', insertError.message);
        return NextResponse.json({ error: 'Failed to create settings' }, { status: 500 });
      }
    } else {
      const { error: updateError } = await supabaseService
        .from('ai_model_settings')
        .update({ 
          settings: currentSettings,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('model_id', modelId)
        .eq('model_type', modelType);

      if (updateError) {
        console.error('Update settings error:', updateError.message);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    }

    return NextResponse.json({ settings: currentSettings });
  } catch (error: any) {
    console.error('Settings API error:', error.message, error.stack);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}