import { supabaseServer } from '@/lib/supabaseServerClient';
import { NextRequest, NextResponse } from 'next/server';

interface Activity {
  id: string;
  type: 'booking' | 'ticket' | 'case_created' | 'case_updated';
  timestamp: string;
  title: string;
  description?: string;
  status?: string;
  metadata?: Record<string, any>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const supabase = supabaseServer;
    const { profileId } = await params;
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch all data in parallel
    const [bookingsResult, ticketsResult, casesResult] = await Promise.all([
      supabase
        .from('bookings')
        .select(`
          id,
          scheduled_at,
          duration_minutes,
          status,
          notes,
          meeting_type:meeting_types(name)
        `)
        .eq('customer_id', profileId)
        .order('scheduled_at', { ascending: false }),

      supabase
        .from('tickets')
        .select('id, subject, message, status, created_at')
        .eq('customer_id', profileId)
        .order('created_at', { ascending: false }),

      supabase
        .from('cases')
        .select('id, case_number, title, case_type, status, created_at, updated_at')
        .eq('customer_id', profileId)
        .order('created_at', { ascending: false }),
    ]);

    const activities: Activity[] = [];

    // Transform bookings
    if (bookingsResult.data) {
      bookingsResult.data.forEach((b: any) => {
        activities.push({
          id: `booking-${b.id}`,
          type: 'booking',
          timestamp: b.scheduled_at,
          title: `Appointment: ${b.meeting_type?.name || 'Meeting'}`,
          description: b.notes || `Duration: ${b.duration_minutes} minutes`,
          status: b.status,
          metadata: b,
        });
      });
    }

    // Transform tickets
    if (ticketsResult.data) {
      ticketsResult.data.forEach((t: any) => {
        activities.push({
          id: `ticket-${t.id}`,
          type: 'ticket',
          timestamp: t.created_at,
          title: `Support Ticket: ${t.subject || 'Untitled'}`,
          description: t.message,
          status: t.status,
          metadata: t,
        });
      });
    }

    // Transform cases
    if (casesResult.data) {
      casesResult.data.forEach((c: any) => {
        activities.push({
          id: `case-created-${c.id}`,
          type: 'case_created',
          timestamp: c.created_at,
          title: `Case Created: ${c.title}`,
          description: `Case #${c.case_number} - ${c.case_type}`,
          status: c.status,
          metadata: c,
        });

        // Add update activity if different from created
        if (c.updated_at && c.updated_at !== c.created_at) {
          activities.push({
            id: `case-updated-${c.id}`,
            type: 'case_updated',
            timestamp: c.updated_at,
            title: `Case Updated: ${c.title}`,
            description: `Status: ${c.status}`,
            status: c.status,
            metadata: c,
          });
        }
      });
    }

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(offset, offset + limit);

    return NextResponse.json({
      activities: paginatedActivities,
      total: activities.length,
      hasMore: offset + limit < activities.length,
    });
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity timeline', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
