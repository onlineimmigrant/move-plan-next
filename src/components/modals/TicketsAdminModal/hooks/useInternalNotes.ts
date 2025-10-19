import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as TicketAPI from '../utils/ticketApi';
import type { TicketNote } from '../types';

interface UseInternalNotesProps {
  organizationId: string;
  currentUserId: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface UseInternalNotesReturn {
  internalNotes: TicketNote[];
  isAddingNote: boolean;
  ticketsWithPinnedNotes: Set<string>;
  ticketNoteCounts: Map<string, number>;
  setInternalNotes: React.Dispatch<React.SetStateAction<TicketNote[]>>;
  fetchInternalNotes: (ticketId: string) => Promise<void>;
  handleAddInternalNote: (ticketId: string, noteText: string, onSuccess: () => void) => Promise<void>;
  handleTogglePinNote: (noteId: string, currentPinStatus: boolean, selectedTicketId?: string) => Promise<void>;
  handleDeleteInternalNote: (noteId: string) => Promise<void>;
  fetchTicketsWithPinnedNotes: () => Promise<void>;
  fetchTicketNoteCounts: () => Promise<void>;
}

/**
 * Custom hook for managing internal ticket notes
 * Handles CRUD operations, pinning, and note counts across tickets
 */
export const useInternalNotes = ({
  organizationId,
  currentUserId,
  onToast,
}: UseInternalNotesProps): UseInternalNotesReturn => {
  const [internalNotes, setInternalNotes] = useState<TicketNote[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [ticketsWithPinnedNotes, setTicketsWithPinnedNotes] = useState<Set<string>>(new Set());
  const [ticketNoteCounts, setTicketNoteCounts] = useState<Map<string, number>>(new Map());

  /**
   * Fetch internal notes for a specific ticket
   * Includes admin information and sorts pinned notes first
   */
  const fetchInternalNotes = useCallback(async (ticketId: string) => {
    try {
      // First get the notes
      const { data: notesData, error: notesError } = await supabase
        .from('ticket_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (notesError) {
        console.error('Error fetching internal notes:', notesError);
        return;
      }

      // Then fetch admin info for each note
      if (notesData && notesData.length > 0) {
        const adminIds = [...new Set(notesData.map(note => note.admin_id))];
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', adminIds);

        if (adminError) {
          console.error('Error fetching admin info:', adminError);
        }

        // Map admin info to notes
        const adminMap = new Map(adminData?.map(admin => [admin.id, admin]) || []);
        const notesWithAdmin = notesData.map(note => ({
          ...note,
          admin_email: adminMap.get(note.admin_id)?.email,
          admin_full_name: adminMap.get(note.admin_id)?.full_name
        }));

        // Sort: pinned notes first, then by created_at
        const sortedNotes = notesWithAdmin.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        setInternalNotes(sortedNotes);
      } else {
        setInternalNotes([]);
      }
    } catch (err) {
      console.error('Error fetching internal notes:', err);
    }
  }, []);

  /**
   * Add a new internal note to a ticket
   * @param ticketId - ID of the ticket to add note to
   * @param noteText - Content of the note
   * @param onSuccess - Callback to execute on success (e.g., clear input)
   */
  const handleAddInternalNote = useCallback(async (
    ticketId: string,
    noteText: string,
    onSuccess: () => void
  ) => {
    if (!noteText.trim() || !ticketId || !currentUserId) return;

    setIsAddingNote(true);
    try {
      await TicketAPI.saveInternalNote({
        ticketId,
        note: noteText.trim(),
        isPinned: false,
        userId: currentUserId,
        organizationId
      });

      // Refresh internal notes
      await fetchInternalNotes(ticketId);
      // Refresh ticket note counts
      await fetchTicketNoteCounts();

      onSuccess();
      onToast('Internal note added', 'success');
    } catch (err) {
      console.error('Error adding internal note:', err);
      onToast('Failed to add internal note', 'error');
    } finally {
      setIsAddingNote(false);
    }
  }, [currentUserId, organizationId, onToast, fetchInternalNotes]);

  /**
   * Toggle pin status of an internal note
   * @param noteId - ID of the note to toggle
   * @param currentPinStatus - Current pin status
   * @param selectedTicketId - Optional ticket ID for context
   */
  const handleTogglePinNote = useCallback(async (
    noteId: string,
    currentPinStatus: boolean,
    selectedTicketId?: string
  ) => {
    try {
      // Find the note to get its text
      const note = internalNotes.find(n => n.id === noteId);
      if (!note) return;

      await TicketAPI.saveInternalNote({
        noteId,
        ticketId: selectedTicketId || note.ticket_id,
        note: note.note_text,
        isPinned: !currentPinStatus,
        userId: currentUserId,
        organizationId
      });

      // Update local state
      setInternalNotes(prev =>
        prev.map(n =>
          n.id === noteId
            ? { ...n, is_pinned: !currentPinStatus }
            : n
        )
      );

      // Refresh tickets with pinned notes list
      await fetchTicketsWithPinnedNotes();

      onToast(currentPinStatus ? 'Note unpinned' : 'Note pinned to top', 'success');
    } catch (err) {
      console.error('Error toggling pin status:', err);
      onToast('Failed to update note', 'error');
    }
  }, [internalNotes, currentUserId, organizationId, onToast]);

  /**
   * Delete an internal note
   * @param noteId - ID of the note to delete
   */
  const handleDeleteInternalNote = useCallback(async (noteId: string) => {
    try {
      await TicketAPI.deleteInternalNote(noteId);

      setInternalNotes(prev => prev.filter(note => note.id !== noteId));
      // Refresh ticket note counts
      await fetchTicketNoteCounts();
      onToast('Internal note deleted', 'success');
    } catch (err) {
      console.error('Error deleting internal note:', err);
      onToast('Failed to delete internal note', 'error');
    }
  }, [onToast]);

  /**
   * Fetch list of ticket IDs that have pinned notes
   * Used to display pin indicators in ticket list
   */
  const fetchTicketsWithPinnedNotes = useCallback(async () => {
    try {
      const ticketIds = await TicketAPI.fetchTicketsWithPinnedNotes(organizationId);
      setTicketsWithPinnedNotes(new Set(ticketIds));
    } catch (err) {
      console.error('Error fetching tickets with pinned notes:', err);
    }
  }, [organizationId]);

  /**
   * Fetch note counts for all tickets
   * Used to display note count badges in ticket list
   */
  const fetchTicketNoteCounts = useCallback(async () => {
    try {
      const counts = await TicketAPI.fetchTicketNoteCounts(organizationId);
      setTicketNoteCounts(new Map(Object.entries(counts)));
    } catch (err) {
      console.error('Error fetching ticket note counts:', err);
    }
  }, [organizationId]);

  return {
    internalNotes,
    isAddingNote,
    ticketsWithPinnedNotes,
    ticketNoteCounts,
    setInternalNotes,
    fetchInternalNotes,
    handleAddInternalNote,
    handleTogglePinNote,
    handleDeleteInternalNote,
    fetchTicketsWithPinnedNotes,
    fetchTicketNoteCounts,
  };
};
