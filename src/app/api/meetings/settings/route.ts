// API Route: Get Meeting Settings
// GET /api/meetings/settings?organization_id=xxx
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Fetch organization meeting settings
    const { data: settings, error } = await supabase
      .from('organization_meeting_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching meeting settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch meeting settings' },
        { status: 500 }
      );
    }

    // Return default settings if none exist
    const defaultSettings = {
      slot_duration_minutes: 30,
      business_hours_start: '09:00:00',
      business_hours_end: '17:00:00',
      available_days: [1, 2, 3, 4, 5], // Mon-Fri
      min_booking_notice_hours: 2,
      max_booking_days_ahead: 90,
      default_buffer_minutes: 0,
      default_timezone: 'UTC',
      auto_confirm_bookings: true,
      is_24_hours: true, // Default to 24-hour time format for admins
    };

    return NextResponse.json(
      settings || defaultSettings
    );
  } catch (error) {
    console.error('Error in meeting settings API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { organization_id, id, created_at, ...settingsData } = body;

    if (!organization_id) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    // Filter out undefined/null values and ensure correct types
    const cleanSettings: any = {
      organization_id,
      updated_at: new Date().toISOString(),
    };

    // Only include fields that are actually set
    if (settingsData.slot_duration_minutes !== undefined) {
      cleanSettings.slot_duration_minutes = settingsData.slot_duration_minutes;
    }
    if (settingsData.business_hours_start !== undefined) {
      cleanSettings.business_hours_start = settingsData.business_hours_start;
    }
    if (settingsData.business_hours_end !== undefined) {
      cleanSettings.business_hours_end = settingsData.business_hours_end;
    }
    if (settingsData.available_days !== undefined) {
      cleanSettings.available_days = settingsData.available_days;
    }
    if (settingsData.min_booking_notice_hours !== undefined) {
      cleanSettings.min_booking_notice_hours = settingsData.min_booking_notice_hours;
    }
    if (settingsData.max_booking_days_ahead !== undefined) {
      cleanSettings.max_booking_days_ahead = settingsData.max_booking_days_ahead;
    }
    if (settingsData.default_buffer_minutes !== undefined) {
      cleanSettings.default_buffer_minutes = settingsData.default_buffer_minutes;
    }
    if (settingsData.default_timezone !== undefined) {
      cleanSettings.default_timezone = settingsData.default_timezone;
    }
    if (settingsData.auto_confirm_bookings !== undefined) {
      cleanSettings.auto_confirm_bookings = settingsData.auto_confirm_bookings;
    }
    if (settingsData.is_24_hours !== undefined) {
      cleanSettings.is_24_hours = settingsData.is_24_hours;
    }

    // Upsert settings
    const { data, error } = await supabase
      .from('organization_meeting_settings')
      .upsert(cleanSettings, {
        onConflict: 'organization_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating meeting settings:', error);
      return NextResponse.json(
        { error: 'Failed to update meeting settings', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: data,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error in meeting settings update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
