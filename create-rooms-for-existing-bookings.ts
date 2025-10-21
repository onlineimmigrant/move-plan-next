import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

// Helper function to create meeting room
async function createMeetingRoom(bookingId: string, maxParticipants: number = 2) {
  try {
    // Check if room already exists
    const { data: existingRoom } = await supabase
      .from('meeting_rooms')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (existingRoom) {
      console.log(`Room already exists for booking ${bookingId}:`, existingRoom.id);
      return existingRoom;
    }

    // Create unique room name
    const roomName = `meeting-${bookingId}-${Date.now()}`;

    console.log(`Creating Twilio room for booking ${bookingId}...`);

    // Create Twilio room
    const twilioRoom = await twilioClient.video.rooms.create({
      uniqueName: roomName,
      type: 'group',
      maxParticipants: maxParticipants,
      recordParticipantsOnConnect: false,
    });

    console.log(`Twilio room created: ${twilioRoom.sid}`);

    // Store room info in database
    const { data: room, error: insertError } = await supabase
      .from('meeting_rooms')
      .insert({
        booking_id: bookingId,
        twilio_room_sid: twilioRoom.sid,
        twilio_room_name: twilioRoom.uniqueName,
        status: 'active',
        max_participants: maxParticipants,
        record_participants_on_connect: false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      // If database insert fails, try to complete the Twilio room
      try {
        await twilioClient.video.rooms(twilioRoom.sid).update({ status: 'completed' });
        console.log('Cleaned up Twilio room due to database error');
      } catch (cleanupError) {
        console.error('Failed to cleanup Twilio room:', cleanupError);
      }
      throw insertError;
    }

    console.log(`Meeting room created successfully: ${room.id}`);
    return room;
  } catch (error) {
    console.error(`Error creating meeting room for booking ${bookingId}:`, error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Checking existing bookings...');

    // Get all bookings that don't have rooms yet
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('id, title, status, scheduled_at')
      .neq('status', 'cancelled')
      .order('scheduled_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings:', error);
      return;
    }

    console.log(`Found ${bookings?.length || 0} active bookings`);

    if (!bookings || bookings.length === 0) {
      console.log('No bookings to process');
      return;
    }

    // Check which bookings already have rooms
    const bookingIds = bookings.map(b => b.id);
    const { data: existingRooms, error: roomsError } = await supabase
      .from('meeting_rooms')
      .select('booking_id')
      .in('booking_id', bookingIds);

    if (roomsError) {
      console.error('Error fetching existing rooms:', roomsError);
      return;
    }

    const roomsMap = new Set(existingRooms?.map(r => r.booking_id) || []);
    const bookingsWithoutRooms = bookings.filter(b => !roomsMap.has(b.id));

    console.log(`${bookingsWithoutRooms.length} bookings need rooms created`);

    // Create rooms for bookings that don't have them
    for (const booking of bookingsWithoutRooms) {
      try {
        await createMeetingRoom(booking.id, 2);
        console.log(`✓ Created room for booking: ${booking.title}`);
      } catch (err) {
        console.error(`✗ Failed to create room for booking: ${booking.title}`, err);
      }

      // Small delay to avoid overwhelming Twilio API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('Done processing bookings');

  } catch (error) {
    console.error('Script error:', error);
  }
}

main().catch(console.error);