import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { format } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const instantInviteSchema = z.object({
  meeting_type_id: z.string().uuid(),
  customer_email: z.string().email(),
  customer_name: z.string().min(1),
  title: z.string().min(1),
  duration_minutes: z.number().min(15).max(480).default(30),
  notes: z.string().optional(),
  send_email: z.boolean().default(true),
});

// POST /api/meetings/instant-invite - Create instant meeting and send invitation
export async function POST(request: NextRequest) {
  try {
    // Get and validate request body
    const body = await request.json();
    const validatedData = instantInviteSchema.parse(body);

    // Get current user from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid authorization' }, { status: 401 });
    }

    // Get user profile and organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, full_name, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Only admins can send instant invites
    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can send instant meeting invites' }, { status: 403 });
    }

    // Get meeting type details
    const { data: meetingType, error: mtError } = await supabase
      .from('meeting_types')
      .select('*')
      .eq('id', validatedData.meeting_type_id)
      .eq('organization_id', profile.organization_id)
      .single();

    if (mtError || !meetingType) {
      return NextResponse.json({ error: 'Meeting type not found' }, { status: 404 });
    }

    // Create instant booking (scheduled for now)
    const now = new Date();
    const scheduledAt = now.toISOString();

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        organization_id: profile.organization_id,
        meeting_type_id: validatedData.meeting_type_id,
        host_user_id: user.id,
        customer_email: validatedData.customer_email,
        customer_name: validatedData.customer_name,
        title: validatedData.title,
        scheduled_at: scheduledAt,
        duration_minutes: validatedData.duration_minutes,
        timezone: 'UTC',
        status: 'confirmed', // Instant meetings are auto-confirmed
        notes: validatedData.notes,
      })
      .select(`
        *,
        meeting_type:meeting_types(*)
      `)
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Send invitation email if requested
    if (validatedData.send_email) {
      try {
        const { data: settings } = await supabase
          .from('settings')
          .select('domain, site')
          .eq('organization_id', profile.organization_id)
          .single();

        if (settings) {
          // Validate BASE URL
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
          if (!baseUrl) {
            console.error('NEXT_PUBLIC_BASE_URL is not defined');
            return NextResponse.json({ 
              error: 'Server configuration error: BASE URL not defined',
              booking // Still return the booking that was created
            }, { status: 500 });
          }

          // Use localhost for development, production domain for production
          const isDevelopment = process.env.NODE_ENV === 'development' || baseUrl.includes('localhost');
          const customerFacingUrl = isDevelopment 
            ? baseUrl
            : `https://${settings.domain}`;
          
          // Link to account page with query param to open meeting modal and auto-join
          const meetingLink = `${customerFacingUrl}/account?openMeeting=${booking.id}`;
          const scheduledDate = new Date(scheduledAt);
          const meetingTime = scheduledDate.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            timeZoneName: 'short',
            timeZone: 'UTC'
          }) + ' (Join Now!)';

          console.log('Sending meeting invitation email:', {
            to: validatedData.customer_email,
            bookingId: booking.id,
            meetingLink,
          });

          const emailResponse = await fetch(`${baseUrl}/api/send-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'meeting_invitation',
              to: validatedData.customer_email,
              organization_id: profile.organization_id,
              name: validatedData.customer_name,
              emailDomainRedirection: meetingLink,
              placeholders: {
                meeting_title: validatedData.title,
                host_name: profile.full_name || 'Your host',
                meeting_time: meetingTime + ' (Join Now!)',
                duration_minutes: validatedData.duration_minutes.toString(),
                meeting_notes: validatedData.notes || '',
                meeting_notes_html: validatedData.notes 
                  ? `<div class="info-row"><span class="info-label">Notes:</span> ${validatedData.notes}</div>` 
                  : '',
              },
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Failed to send invitation email:', emailResponse.status, errorText);
          } else {
            console.log('Invitation email sent successfully');
          }
        }
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError);
        // Don't fail the whole request if email fails, booking is already created
      }
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      message: 'Instant meeting created and invitation sent'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }

    console.error('Error in POST /api/meetings/instant-invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
