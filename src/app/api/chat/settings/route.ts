import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseService = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { action, settingKey, settingValue } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
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

    // Fetch current settings
    const { data: settingsData, error: settingsError } = await supabaseService
      .from('ai_user_settings')
      .select('default_settings')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settingsData) {
      console.error('Settings fetch error:', settingsError?.message);
      return NextResponse.json({ error: 'User settings not found' }, { status: 404 });
    }

    const defaultSettings: Record<string, any> = settingsData.default_settings || {};

    // Handle CRUD actions
    if (action === 'add' || action === 'update') {
      if (!settingKey || settingValue === undefined) {
        return NextResponse.json({ error: 'settingKey and settingValue are required' }, { status: 400 });
      }
      defaultSettings[settingKey] = settingValue;
    } else if (action === 'delete') {
      if (!settingKey) {
        return NextResponse.json({ error: 'settingKey is required' }, { status: 400 });
      }
      delete defaultSettings[settingKey];
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Update settings in the database
    const { error: updateError } = await supabaseService
      .from('ai_user_settings')
      .update({ default_settings: defaultSettings })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Update settings error:', updateError.message);
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }

    return NextResponse.json({ default_settings: defaultSettings });
  } catch (error: any) {
    console.error('Settings API error:', error.message, error.stack);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}