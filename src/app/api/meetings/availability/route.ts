import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { addDays, format, parseISO, addMinutes } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const availabilityRequestSchema = z.object({
  host_user_id: z.string(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  timezone: z.string().default('UTC'),
  duration_minutes: z.number().min(15).max(480).default(30),
});

// GET /api/meetings/availability - Get available time slots
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const hostUserId = searchParams.get('host_user_id');
    const date = searchParams.get('date');
    const timezone = searchParams.get('timezone') || 'UTC';
    const durationMinutes = parseInt(searchParams.get('duration_minutes') || '30');

    if (!hostUserId || !date) {
      return NextResponse.json({
        error: 'host_user_id and date are required'
      }, { status: 400 });
    }

    // Validate inputs
    const validatedData = availabilityRequestSchema.parse({
      host_user_id: hostUserId,
      date,
      timezone,
      duration_minutes: durationMinutes,
    });

    // Get user's availability schedules for the day of week
    const targetDate = parseISO(validatedData.date);
    const dayOfWeek = targetDate.getDay();

    const { data: schedules, error: scheduleError } = await supabase
      .from('availability_schedules')
      .select('*')
      .eq('user_id', validatedData.host_user_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (scheduleError) {
      console.error('Error fetching availability schedules:', scheduleError);
      return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        available_slots: [],
        timezone: validatedData.timezone,
        message: 'No availability scheduled for this day'
      });
    }

    // Get existing bookings for the date to check conflicts
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: bookings, error: bookingError } = await supabase
      .from('bookings')
      .select('id, title, scheduled_at, duration_minutes, status')
      .eq('host_user_id', validatedData.host_user_id)
      .neq('status', 'cancelled')
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString());

    if (bookingError) {
      console.error('Error fetching bookings:', bookingError);
      return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
    }

    // Generate available time slots
    const availableSlots: Array<{
      start: string;
      end: string;
      available: boolean;
      conflict?: any;
    }> = [];

    for (const schedule of schedules) {
      const scheduleStart = new Date(targetDate);
      const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
      scheduleStart.setHours(startHour, startMinute, 0, 0);

      const scheduleEnd = new Date(targetDate);
      const [endHour, endMinute] = schedule.end_time.split(':').map(Number);
      scheduleEnd.setHours(endHour, endMinute, 0, 0);

      // Generate slots within the schedule
      let currentSlotStart = new Date(scheduleStart);

      while (currentSlotStart < scheduleEnd) {
        const slotEnd = addMinutes(currentSlotStart, validatedData.duration_minutes);

        if (slotEnd <= scheduleEnd) {
          // Check for conflicts with existing bookings
          const hasConflict = bookings?.some(booking => {
            const bookingStart = parseISO(booking.scheduled_at);
            const bookingEnd = addMinutes(bookingStart, booking.duration_minutes);

            return (
              (currentSlotStart < bookingEnd && slotEnd > bookingStart)
            );
          });

          availableSlots.push({
            start: currentSlotStart.toISOString(),
            end: slotEnd.toISOString(),
            available: !hasConflict,
            conflict: hasConflict ? bookings?.find(booking => {
              const bookingStart = parseISO(booking.scheduled_at);
              const bookingEnd = addMinutes(bookingStart, booking.duration_minutes);
              return (currentSlotStart < bookingEnd && slotEnd > bookingStart);
            }) : undefined,
          });
        }

        // Move to next slot (15-minute intervals)
        currentSlotStart = addMinutes(currentSlotStart, 15);
      }
    }

    return NextResponse.json({
      available_slots: availableSlots,
      timezone: validatedData.timezone,
      date: validatedData.date,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in GET /api/meetings/availability:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}