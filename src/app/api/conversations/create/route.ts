import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Lazy initialization of Twilio client
let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient) {
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error('Twilio conversations feature not configured. Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN.');
    }

    if (!twilioAccountSid.startsWith('AC')) {
      throw new Error('Invalid TWILIO_ACCOUNT_SID format. Must start with AC.');
    }

    twilioClient = twilio(twilioAccountSid, twilioAuthToken);
  }
  return twilioClient;
}

export async function POST(request: Request) {
  try {
    const { ticket_id, organization_id, customer_phone } = await request.json();

    if (!ticket_id || !organization_id || !customer_phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Twilio client (throws if not configured)
    let client;
    try {
      client = getTwilioClient();
    } catch (error: any) {
      console.error('Twilio not configured:', error.message);
      return NextResponse.json({ 
        error: 'Conversations feature not available',
        details: 'Twilio integration not configured for this organization'
      }, { status: 503 });
    }

    // Create Twilio conversation
    const conversation = await client.conversations.v1.conversations.create({
      friendlyName: `Ticket ${ticket_id}`,
    });

    // Add customer as participant using identity
    // Note: Ensure customer_phone is in E.164 format (e.g., +12025550123)
    const participant = await client.conversations.v1
      .conversations(conversation.sid)
      .participants.create({
        identity: customer_phone, // Use phone number as identity
      });

    // Update ticket with conversation ID
    const { error: updateError } = await supabase
      .from('tickets')
      .update({ conversation_id: conversation.sid })
      .eq('id', ticket_id)
      .eq('organization_id', organization_id);

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
    }

    return NextResponse.json({ conversation_id: conversation.sid, participant_sid: participant.sid }, { status: 200 });
  } catch (error: any) {
    console.error('Error creating Twilio conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}