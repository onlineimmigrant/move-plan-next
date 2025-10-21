import fetch from 'node-fetch';

async function testVideoAPI() {
  try {
    console.log('Testing video API...');

    // First create a booking to get a valid booking ID
    const bookingResponse = await fetch('http://localhost:3000/en/api/meetings/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Video Meeting',
        scheduled_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        duration_minutes: 60,
        customer_email: 'test@example.com',
        customer_name: 'Test User',
        notes: 'Test booking for video functionality'
      })
    });

    if (!bookingResponse.ok) {
      console.log('Booking creation failed:', await bookingResponse.text());
      return;
    }

    const booking = await bookingResponse.json();
    console.log('Created booking:', booking.id);

    // Now test room creation
    const roomResponse = await fetch('http://localhost:3000/en/api/meetings/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        booking_id: booking.id
      })
    });

    if (!roomResponse.ok) {
      console.log('Room creation failed:', await roomResponse.text());
      return;
    }

    const room = await roomResponse.json();
    console.log('Created room:', room);

    // Now test token generation
    const tokenResponse = await fetch('http://localhost:3000/en/api/meetings/rooms', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        booking_id: booking.id,
        identity: 'test-user@example.com'
      })
    });

    if (!tokenResponse.ok) {
      console.log('Token generation failed:', await tokenResponse.text());
      return;
    }

    const tokenData = await tokenResponse.json();
    console.log('Generated token successfully!');
    console.log('Token length:', tokenData.token.length);
    console.log('Room name:', tokenData.room_name);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testVideoAPI();