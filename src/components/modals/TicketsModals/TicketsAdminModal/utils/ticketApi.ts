/**
 * Ticket API Service
 * All database and API interactions for the Tickets Admin Modal
 */

import { supabase } from '@/lib/supabase';
import { processTicketResponses } from '../../shared/utils/responseHelpers';
import type {
  Ticket,
  TicketResponse,
  TicketNote,
  TicketTag,
  Avatar,
  PredefinedResponse,
} from '../types';
import { getCurrentISOString } from './ticketHelpers';

// ============================================================================
// FETCH FUNCTIONS - Data retrieval operations
// ============================================================================

/**
 * Fetch tickets with pagination and filtering
 */
export async function fetchTickets(params: {
  loadMore?: boolean;
  currentTickets: Ticket[];
  ticketsPerPage: number;
  organizationId?: string;
}) {
  const { loadMore = false, currentTickets, ticketsPerPage, organizationId } = params;
  
  try {
    const startIndex = loadMore ? currentTickets.length : 0;
    const fetchCount = ticketsPerPage * 3; // Fetch 60 tickets to cover all statuses
    
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('tickets')
      .select(`
        id, 
        subject, 
        status, 
        customer_id, 
        created_at, 
        message, 
        preferred_contact_method, 
        email, 
        full_name, 
        assigned_to, 
        priority, 
        ticket_responses(
          id,
          ticket_id,
          user_id,
          message,
          is_admin,
          avatar_id,
          is_read,
          read_at,
          created_at,
          ticket_attachments(*)
        ),
        ticket_tag_assignments(
          ticket_id,
          tag_id,
          ticket_tags(*)
        )
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .range(startIndex, startIndex + fetchCount - 1);

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError.message || ticketsError);
      throw ticketsError;
    }

    // Process tickets to flatten tags
    const processedTickets = (ticketsData || []).map((ticket: any) => {
      const ticketTags: TicketTag[] = [];
      if (ticket.ticket_tag_assignments) {
        ticket.ticket_tag_assignments.forEach((assignment: any) => {
          if (assignment.ticket_tags) {
            ticketTags.push(assignment.ticket_tags);
          }
        });
      }

      // Process responses to flatten attachments
      const processedResponses = processTicketResponses(ticket.ticket_responses || []);

      return {
        ...ticket,
        ticket_responses: processedResponses,
        tags: ticketTags
      };
    });

    return {
      tickets: processedTickets,
      hasMore: ticketsData && ticketsData.length === fetchCount
    };
  } catch (err) {
    console.error('Error in fetchTickets:', err);
    throw err;
  }
}

/**
 * Fetch admin avatars for the organization
 */
export async function fetchAvatars(organizationId?: string) {
  try {
    const { data: avatarsData, error: avatarsError } = await supabase
      .from('ticket_avatars')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true });

    if (avatarsError) {
      console.error('Error fetching avatars:', avatarsError.message || avatarsError);
      throw avatarsError;
    }

    return avatarsData || [];
  } catch (err) {
    console.error('Unexpected error fetching avatars:', err);
    throw err;
  }
}

/**
 * Fetch admin users for the organization
 */
export async function fetchAdminUsers(organizationId?: string) {
  try {
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .eq('organization_id', organizationId)
      .eq('role', 'admin')
      .order('full_name', { ascending: true });

    if (usersError) {
      console.error('Error fetching admin users:', usersError.message || usersError);
      return [];
    }

    return usersData || [];
  } catch (err) {
    console.error('Unexpected error fetching admin users:', err);
    return [];
  }
}

/**
 * Fetch current user information
 */
export async function fetchCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Error fetching current user:', authError?.message || authError);
      return null;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, organization_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError.message || profileError);
      return null;
    }

    return profileData;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}

/**
 * Fetch available tags for the organization
 */
export async function fetchTags(organizationId?: string) {
  try {
    const { data: tagsData, error: tagsError } = await supabase
      .from('ticket_tags')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name', { ascending: true });

    if (tagsError) {
      console.error('Error fetching tags:', tagsError.message || tagsError);
      return [];
    }

    return tagsData || [];
  } catch (err) {
    console.error('Unexpected error fetching tags:', err);
    return [];
  }
}

/**
 * Fetch predefined responses (optional feature)
 */
export async function fetchPredefinedResponses(organizationId?: string) {
  try {
    const { data: responsesData, error: responsesError } = await supabase
      .from('predefined_responses')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (responsesError) {
      console.error('Error fetching predefined responses:', responsesError.message || responsesError);
      throw responsesError;
    }

    return responsesData || [];
  } catch (err) {
    console.error('Unexpected error fetching predefined responses:', err);
    throw err;
  }
}

/**
 * Fetch internal notes for a ticket
 */
export async function fetchInternalNotes(ticketId: string) {
  try {
    const { data: notesData, error: notesError } = await supabase
      .from('ticket_notes')
      .select(`
        *
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: false });

    if (notesError) {
      console.error('Error fetching internal notes:', notesError.message || notesError);
      throw notesError;
    }

    // Fetch admin details for each note
    if (notesData && notesData.length > 0) {
      const adminIds = [...new Set(notesData.map(note => note.admin_id))];
      
      // Fetch profiles or user metadata
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', adminIds);

      // Map admin details to notes
      const notesWithAdminDetails = notesData.map(note => {
        const profile = profiles?.find(p => p.id === note.admin_id);
        return {
          ...note,
          admin_email: profile?.email,
          admin_full_name: profile?.full_name
        };
      });

      return notesWithAdminDetails;
    }

    return notesData || [];
  } catch (err) {
    console.error('Unexpected error fetching internal notes:', err);
    throw err;
  }
}

/**
 * Fetch tickets that have pinned notes
 */
export async function fetchTicketsWithPinnedNotes(organizationId?: string) {
  try {
    const { data: pinnedNotesData, error: pinnedError } = await supabase
      .from('ticket_notes')
      .select('ticket_id, tickets!inner(organization_id)')
      .eq('is_pinned', true)
      .eq('tickets.organization_id', organizationId);

    if (pinnedError) {
      console.error('Error fetching pinned notes:', pinnedError.message || pinnedError);
      return [];
    }

    const ticketIds = pinnedNotesData?.map(note => note.ticket_id) || [];
    return [...new Set(ticketIds)]; // Return unique ticket IDs
  } catch (err) {
    console.error('Unexpected error fetching pinned notes:', err);
    return [];
  }
}

/**
 * Fetch note counts for tickets
 */
export async function fetchTicketNoteCounts(organizationId?: string) {
  try {
    const { data: noteCountsData, error: noteCountsError } = await supabase
      .from('ticket_notes')
      .select('ticket_id, tickets!inner(organization_id)')
      .eq('tickets.organization_id', organizationId);

    if (noteCountsError) {
      console.error('Error fetching note counts:', noteCountsError.message || noteCountsError);
      return {};
    }

    // Count notes per ticket
    const counts: Record<string, number> = {};
    noteCountsData?.forEach(note => {
      counts[note.ticket_id] = (counts[note.ticket_id] || 0) + 1;
    });

    return counts;
  } catch (err) {
    console.error('Unexpected error fetching note counts:', err);
    return {};
  }
}

/**
 * Refresh a single ticket's data
 */
export async function refreshSelectedTicket(ticketId: string) {
  try {
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name, assigned_to, priority')
      .eq('id', ticketId)
      .single();
    
    if (ticketError) {
      console.error('❌ Error fetching ticket:', ticketError.message || ticketError);
      throw ticketError;
    }
    
    // Fetch responses separately with proper ordering and attachments
    const { data: responsesData, error: responsesError } = await supabase
      .from('ticket_responses')
      .select(`
        *,
        ticket_attachments(*)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (responsesError) {
      console.error('❌ Error fetching responses:', responsesError.message || responsesError);
      throw responsesError;
    }
    
    // Process responses to flatten attachments
    const processedResponses = processTicketResponses(responsesData || []);
    
    // Fetch tags for this ticket
    const { data: tagAssignments, error: tagError } = await supabase
      .from('ticket_tag_assignments')
      .select(`
        ticket_id,
        tag_id,
        ticket_tags (*)
      `)
      .eq('ticket_id', ticketId);

    const ticketTags: TicketTag[] = [];
    if (!tagError && tagAssignments) {
      tagAssignments.forEach((assignment: any) => {
        if (assignment.ticket_tags) {
          ticketTags.push(assignment.ticket_tags);
        }
      });
    }
    
    return {
      ...ticketData,
      ticket_responses: processedResponses,
      tags: ticketTags
    };
  } catch (err) {
    console.error('❌ Error refreshing selected ticket:', err);
    throw err;
  }
}

// ============================================================================
// MUTATION FUNCTIONS - Data modification operations
// ============================================================================

/**
 * Mark customer messages as read
 */
export async function markMessagesAsRead(ticketId: string) {
  try {
    const response = await fetch('/api/tickets/mark-read', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ticketId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark messages as read');
    }

    return true;
  } catch (err) {
    console.error('Error marking messages as read:', err);
    throw err;
  }
}

/**
 * Update ticket status
 */
export async function updateTicketStatus(params: {
  ticketId: string;
  newStatus: string;
  userId: string;
  organizationId: string;
}) {
  const { ticketId, newStatus, userId, organizationId } = params;
  
  try {
    const response = await fetch('/api/tickets/status', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: ticketId,        // ← Fixed: API expects snake_case
        status: newStatus,           // ← Fixed: API expects 'status'
        user_id: userId,             // ← Fixed: API expects snake_case
        organization_id: organizationId  // ← Fixed: API expects snake_case
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update status');
    }

    return await response.json();
  } catch (err) {
    console.error('Error updating ticket status:', err);
    throw err;
  }
}

/**
 * Assign ticket to admin user
 */
export async function assignTicket(ticketId: string, adminId: string | null, organizationId: string) {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/tickets/assign', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        assigned_to: adminId,
        organization_id: organizationId,
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to assign ticket');
    }

    return await response.json();
  } catch (err) {
    console.error('Error assigning ticket:', err);
    throw err;
  }
}

/**
 * Update ticket priority
 */
/**
 * Update ticket priority
 */
export async function updateTicketPriority(ticketId: string, priority: string | null, organizationId: string) {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const response = await fetch('/api/tickets/priority', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticket_id: ticketId,
        priority: priority,
        organization_id: organizationId,
        user_id: user.id,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update priority');
    }

    return await response.json();
  } catch (err) {
    console.error('Error updating ticket priority:', err);
    throw err;
  }
}

/**
 * Add tag to ticket
 */
export async function addTagToTicket(ticketId: string, tagId: string) {
  try {
    const { error } = await supabase
      .from('ticket_tag_assignments')
      .insert({ ticket_id: ticketId, tag_id: tagId });

    if (error) {
      console.error('Error adding tag:', error.message || error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error adding tag:', err);
    throw err;
  }
}

/**
 * Remove tag from ticket
 */
export async function removeTagFromTicket(ticketId: string, tagId: string) {
  try {
    const { error } = await supabase
      .from('ticket_tag_assignments')
      .delete()
      .eq('ticket_id', ticketId)
      .eq('tag_id', tagId);

    if (error) {
      console.error('Error removing tag:', error.message || error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error removing tag:', err);
    throw err;
  }
}

/**
 * Send admin response to ticket
 */
export async function sendAdminResponse(params: {
  ticketId: string;
  message: string;
  avatarId: string;
  userId: string;
  attachmentData?: Array<{ path: string; name: string; type: string; size: number }>;
}) {
  const { ticketId, message, avatarId, userId, attachmentData = [] } = params;
  
  try {
    // Insert response
    const { data: responseData, error: responseError } = await supabase
      .from('ticket_responses')
      .insert({
        ticket_id: ticketId,
        message,
        is_admin: true,
        avatar_id: avatarId,
        user_id: userId,
        is_read: true,
        read_at: getCurrentISOString(),
        created_at: getCurrentISOString()
      })
      .select()
      .single();

    if (responseError) {
      console.error('Error inserting response:', responseError.message || responseError);
      throw responseError;
    }

    // Insert attachments if any
    if (attachmentData.length > 0 && responseData) {
      const attachments = attachmentData.map(fileData => ({
        response_id: responseData.id,
        ticket_id: ticketId,
        file_path: fileData.path,
        file_name: fileData.name,
        file_size: fileData.size,
        file_type: fileData.type,
        uploaded_by: userId
      }));

      const { error: attachmentError } = await supabase
        .from('ticket_attachments')
        .insert(attachments);

      if (attachmentError) {
        console.error('Error inserting attachments:', attachmentError.message || attachmentError);
      }
    }

    // Update ticket's updated_at timestamp
    await supabase
      .from('tickets')
      .update({ updated_at: getCurrentISOString() })
      .eq('id', ticketId);

    // Fetch the response with attachments to return complete data
    const { data: completeResponse, error: fetchError } = await supabase
      .from('ticket_responses')
      .select(`
        *,
        attachments:ticket_attachments(*)
      `)
      .eq('id', responseData.id)
      .single();

    if (fetchError) {
      console.error('Error fetching response with attachments:', fetchError.message || fetchError);
      return responseData; // Return original data if fetch fails
    }

    return completeResponse;
  } catch (err) {
    console.error('Error sending admin response:', err);
    throw err;
  }
}

/**
 * Save or update internal note
 */
export async function saveInternalNote(params: {
  noteId?: string;
  ticketId: string;
  note: string;
  isPinned: boolean;
  userId: string;
  organizationId?: string;
}) {
  const { noteId, ticketId, note, isPinned, userId, organizationId } = params;
  
  try {
    if (noteId) {
      // Update existing note
      const { error } = await supabase
        .from('ticket_notes')
        .update({ 
          note_text: note, 
          is_pinned: isPinned,
          updated_at: getCurrentISOString()
        })
        .eq('id', noteId);

      if (error) {
        console.error('Error updating note:', error.message || error);
        throw error;
      }
    } else {
      // Create new note
      const { error } = await supabase
        .from('ticket_notes')
        .insert({
          ticket_id: ticketId,
          note_text: note,
          is_pinned: isPinned,
          admin_id: userId,
          created_at: getCurrentISOString()
        });

      if (error) {
        console.error('Error creating note:', error.message || error);
        throw error;
      }
    }

    return true;
  } catch (err) {
    console.error('Unexpected error saving note:', err);
    throw err;
  }
}

/**
 * Delete internal note
 */
export async function deleteInternalNote(noteId: string) {
  try {
    const { error } = await supabase
      .from('ticket_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Error deleting note:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting note:', err);
    throw err;
  }
}

/**
 * Toggle note pin status
 */
export async function toggleNotePin(noteId: string, isPinned: boolean) {
  try {
    const { error } = await supabase
      .from('ticket_notes')
      .update({ 
        is_pinned: !isPinned,
        updated_at: getCurrentISOString()
      })
      .eq('id', noteId);

    if (error) {
      console.error('Error toggling note pin:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error toggling note pin:', err);
    throw err;
  }
}

/**
 * Delete ticket response
 */
export async function deleteTicketResponse(responseId: string) {
  try {
    const { error } = await supabase
      .from('ticket_responses')
      .delete()
      .eq('id', responseId);

    if (error) {
      console.error('Error deleting response:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error deleting response:', err);
    throw err;
  }
}

// ============================================================================
// REALTIME FUNCTIONS - Subscription and channel management
// ============================================================================

/**
 * Setup realtime subscription for tickets and responses
 */
export function setupRealtimeSubscription(callbacks: {
  onTicketChange: () => void;
  onResponseChange: () => void;
  onNoteChange: () => void;
}) {
  const { onTicketChange, onResponseChange, onNoteChange } = callbacks;
  
  try {
    const channel = supabase
      .channel('tickets-admin-channel', {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets'
        },
        (payload) => {
          console.log('✅ Realtime: Ticket change', payload);
          onTicketChange();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_responses'
        },
        (payload) => {
          console.log('✅ Realtime: Response change', payload);
          onResponseChange();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'ticket_notes'
        },
        (payload) => {
          console.log('✅ Realtime: Note change', payload);
          onNoteChange();
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('⏱️ Realtime subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('🔌 Realtime channel closed');
        } else {
          console.log('📡 Realtime subscription status:', status);
        }
      });

    return channel;
  } catch (err) {
    console.error('Error setting up realtime subscription:', err);
    throw err;
  }
}

// ============================================================================
// ATTACHMENT FUNCTIONS - File handling
// ============================================================================

/**
 * Load attachment URLs for image previews
 */
export async function loadAttachmentUrls(responses: any[]) {
  const attachmentsToLoad: { responseId: string; attachmentId: string; fileName: string }[] = [];
  
  responses.forEach(response => {
    if (response.attachments) {
      response.attachments.forEach((attachment: any) => {
        if (attachment.file_url && attachment.file_url.startsWith('ticket-attachments/')) {
          attachmentsToLoad.push({
            responseId: response.id,
            attachmentId: attachment.id,
            fileName: attachment.file_url
          });
        }
      });
    }
  });

  const urlMap: Record<string, string> = {};

  for (const attachment of attachmentsToLoad) {
    try {
      const { data } = await supabase.storage
        .from('ticket-attachments')
        .createSignedUrl(attachment.fileName.replace('ticket-attachments/', ''), 3600);
      
      if (data?.signedUrl) {
        urlMap[attachment.attachmentId] = data.signedUrl;
      }
    } catch (err) {
      console.error('Error loading attachment URL:', err);
    }
  }

  return urlMap;
}
