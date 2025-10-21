// API Route: Get Available Time Slots
// GET /api/meetings/available-slots?organization_id=xxx&date=2025-10-20&is_admin=true
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
  isBusinessHours?: boolean; // For admins: indicates if slot is within customer business hours
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const date = searchParams.get('date');
    const isAdmin = searchParams.get('is_admin') === 'true';

    if (!organizationId || !date) {
      return NextResponse.json(
        { error: 'organization_id and date are required' },
        { status: 400 }
      );
    }

    // Fetch organization meeting settings
    const { data: settings } = await supabase
      .from('organization_meeting_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    // Use default settings if none exist
    const slotDuration = settings?.slot_duration_minutes || 30;
    
    // Business hours (for customer bookings)
    const businessStart = settings?.business_hours_start || '09:00:00';
    const businessEnd = settings?.business_hours_end || '17:00:00';
    const [businessStartHour, businessStartMin] = businessStart.split(':').map(Number);
    const [businessEndHour, businessEndMin] = businessEnd.split(':').map(Number);
    
    // Determine time range based on role
    let startHour: number, startMinute: number, endHour: number, endMinute: number;
    
    if (isAdmin) {
      // Admins ALWAYS get full 24-hour access
      startHour = 0;
      startMinute = 0;
      endHour = 23;
      endMinute = 59;
    } else {
      // Customers get business hours only
      startHour = businessStartHour;
      startMinute = businessStartMin;
      endHour = businessEndHour;
      endMinute = businessEndMin;
    }

    // Parse the selected date correctly in local timezone (not UTC)
    // date comes as "YYYY-MM-DD" string
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day); // month is 0-indexed
    
    console.log(`[API] Generating slots for date: ${date}, parsed as:`, selectedDate.toISOString());
    console.log(`[API] is_admin: ${isAdmin}, Time range: ${startHour}:${String(startMinute).padStart(2,'0')} - ${endHour}:${String(endMinute).padStart(2,'0')}`);
    
    // OPTIMIZATION: Fetch ALL bookings for the day in ONE query instead of per-slot
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const { data: dayBookings } = await supabase
      .from('bookings')
      .select('id, scheduled_at, duration_minutes')
      .eq('organization_id', organizationId)
      .not('status', 'in', '("cancelled","no_show")')
      .gte('scheduled_at', dayStart.toISOString())
      .lte('scheduled_at', dayEnd.toISOString());
    
    // Create a helper function to check if a slot conflicts with any booking
    const isSlotAvailable = (slotStart: Date, slotEnd: Date): boolean => {
      if (!dayBookings || dayBookings.length === 0) return true;
      
      return !dayBookings.some(booking => {
        const bookingStart = new Date(booking.scheduled_at);
        const bookingEnd = new Date(bookingStart);
        bookingEnd.setMinutes(bookingEnd.getMinutes() + booking.duration_minutes);
        
        // Check for overlap: slot overlaps if it starts before booking ends AND ends after booking starts
        return slotStart < bookingEnd && slotEnd > bookingStart;
      });
    };
    
    // Generate time slots
    const slots: TimeSlot[] = [];
    const now = new Date(); // Current server time for filtering past slots
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (
      currentHour < endHour || 
      (currentHour === endHour && currentMinute < endMinute)
    ) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(currentHour, currentMinute, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotDuration);
      
      // Check if slot end time exceeds configured end time
      const slotEndHour = slotEnd.getHours();
      const slotEndMinute = slotEnd.getMinutes();
      
      if (
        slotEndHour > endHour || 
        (slotEndHour === endHour && slotEndMinute > endMinute)
      ) {
        break;
      }
      
      // Check if slot is available using our optimized helper function
      const isAvailable = isSlotAvailable(slotStart, slotEnd);
      
      // Skip past time slots at the API level (defense in depth)
      if (slotStart.getTime() < now.getTime()) {
        // Move to next slot
        currentMinute += slotDuration;
        if (currentMinute >= 60) {
          currentHour += Math.floor(currentMinute / 60);
          currentMinute = currentMinute % 60;
        }
        continue; // Skip this past slot
      }
      
      // For admins: check if slot is within business hours (for visual highlighting)
      let isBusinessHours = false;
      if (isAdmin) {
        const slotStartHour = slotStart.getHours();
        const slotStartMin = slotStart.getMinutes();
        const slotEndHour = slotEnd.getHours();
        const slotEndMin = slotEnd.getMinutes();
        
        // Slot is in business hours if it starts at or after business start and ends at or before business end
        const slotStartTime = slotStartHour * 60 + slotStartMin;
        const slotEndTime = slotEndHour * 60 + slotEndMin;
        const businessStartTime = businessStartHour * 60 + businessStartMin;
        const businessEndTime = businessEndHour * 60 + businessEndMin;
        
        isBusinessHours = (
          slotStartTime >= businessStartTime &&
          slotEndTime <= businessEndTime
        );
      }
      
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        available: isAvailable,
        ...(isAdmin && { isBusinessHours }), // Only include for admins
      });
      
      // Move to next slot
      currentMinute += slotDuration;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    console.log(`[API] Generated ${slots.length} future slots for ${date}`);
    if (slots.length > 0) {
      const firstSlot = new Date(slots[0].start);
      const lastSlot = new Date(slots[slots.length - 1].start);
      console.log(`[API] First slot: ${firstSlot.toISOString()} (${firstSlot.toLocaleString()})`);
      console.log(`[API] Last slot: ${lastSlot.toISOString()} (${lastSlot.toLocaleString()})`);
    }

    return NextResponse.json({
      slots,
      settings: {
        slot_duration_minutes: slotDuration,
        start_time: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
        end_time: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
        is_admin_mode: isAdmin,
        business_hours_start: businessStart,
        business_hours_end: businessEnd,
      },
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120', // Cache for 1 minute, allow stale for 2 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
