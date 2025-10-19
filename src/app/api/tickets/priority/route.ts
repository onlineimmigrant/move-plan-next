// app/api/tickets/priority/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function PATCH(request: Request) {
  try {
    const { ticket_id, priority, organization_id, user_id } = await request.json();

    if (!ticket_id || !organization_id || !user_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate priority values (null is allowed for "no priority")
    if (priority !== null) {
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 });
      }
    }

    // Verify user via profiles table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, email')
      .eq('id', user_id)
      .eq('organization_id', organization_id)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching profile or user not found:', profileError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (profile.role !== 'admin') {
      console.error('User is not an admin:', { user_id, role: profile.role });
      return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
    }

    console.log(`User ${user_id} (Admin) attempting to update ticket ${ticket_id} priority to ${priority || 'none'}`);

    // Get the ticket's current state
    const { data: currentTicket, error: ticketFetchError } = await supabase
      .from('tickets')
      .select('priority, subject, customer_id')
      .eq('id', ticket_id)
      .eq('organization_id', organization_id)
      .single();

    if (ticketFetchError || !currentTicket) {
      console.error('Error fetching ticket:', ticketFetchError);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Update ticket priority
    const { data, error } = await supabase
      .from('tickets')
      .update({ priority: priority || null })
      .eq('id', ticket_id)
      .eq('organization_id', organization_id)
      .select();

    if (error) {
      console.error('Error updating ticket priority:', error);
      return NextResponse.json({ error: 'Failed to update ticket priority', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.error('No data returned from update');
      return NextResponse.json({ error: 'Update failed: No data returned' }, { status: 500 });
    }

    // Create activity log entry
    try {
      const oldPriority = currentTicket.priority || 'none';
      const newPriority = priority || 'none';
      
      if (oldPriority !== newPriority) {
        const activityMessage = `Priority changed from ${oldPriority} to ${newPriority}`;

        const { error: activityError } = await supabase
          .from('activity_feed')
          .insert({
            organization_id,
            user_id: user_id, // Admin who made the change
            activity_type: 'ticket_priority_change',
            activity_description: activityMessage,
            related_entity_type: 'ticket',
            related_entity_id: ticket_id,
            metadata: {
              ticket_id,
              ticket_subject: currentTicket.subject,
              old_priority: oldPriority,
              new_priority: newPriority,
              changed_by: user_id,
              changed_by_name: profile.full_name || profile.email
            }
          });

        if (activityError) {
          console.error('Error creating activity log (non-blocking):', activityError);
          // Don't fail the request if activity log fails
        }
      }
    } catch (activityError) {
      console.error('Error in activity logging (non-blocking):', activityError);
      // Don't fail the request if activity log fails
    }

    return NextResponse.json({ 
      message: 'Ticket priority updated successfully', 
      data: data[0] 
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error in /api/tickets/priority:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket priority', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
