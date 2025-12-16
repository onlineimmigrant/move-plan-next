import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { TicketTag, Ticket } from '../types';
import * as TicketAPI from '../utils/ticketApi';

interface UseTagManagementProps {
  organizationId: string;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface UseTagManagementReturn {
  availableTags: TicketTag[];
  isLoadingTags: boolean;
  fetchTags: () => Promise<void>;
  handleCreateTag: (name: string, color: string, icon?: string) => Promise<TicketTag | null>;
  handleUpdateTag: (tagId: string, updates: { name?: string; color?: string; icon?: string }) => Promise<TicketTag | null>;
  handleDeleteTag: (
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ) => Promise<void>;
  handleAssignTag: (
    ticketId: string,
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ) => Promise<void>;
  handleRemoveTag: (
    ticketId: string,
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ) => Promise<void>;
}

/**
 * Custom hook for managing ticket tags
 * Handles CRUD operations for tags and tag assignments
 */
export function useTagManagement({
  organizationId,
  onToast,
}: UseTagManagementProps): UseTagManagementReturn {
  const [availableTags, setAvailableTags] = useState<TicketTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // Fetch all available tags for the organization
  const fetchTags = useCallback(async () => {
    try {
      setIsLoadingTags(true);
      const { data, error } = await supabase
        .from('ticket_tags')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching tags:', error);
        return;
      }

      setAvailableTags(data || []);
    } catch (err) {
      console.error('Error fetching tags:', err);
    } finally {
      setIsLoadingTags(false);
    }
  }, [organizationId]);

  // Create a new tag
  const handleCreateTag = useCallback(async (
    name: string,
    color: string,
    icon?: string
  ): Promise<TicketTag | null> => {
    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .insert({
          organization_id: organizationId,
          name,
          color,
          icon
        })
        .select()
        .single();

      if (error) throw error;

      setAvailableTags(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      onToast('Tag created successfully', 'success');
      return data;
    } catch (err) {
      console.error('Error creating tag:', err);
      onToast('Failed to create tag', 'error');
      return null;
    }
  }, [organizationId, onToast]);

  // Update an existing tag
  const handleUpdateTag = useCallback(async (
    tagId: string,
    updates: { name?: string; color?: string; icon?: string }
  ): Promise<TicketTag | null> => {
    try {
      const { data, error } = await supabase
        .from('ticket_tags')
        .update(updates)
        .eq('id', tagId)
        .select()
        .single();

      if (error) throw error;

      setAvailableTags(prev => 
        prev.map(tag => tag.id === tagId ? data : tag)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      onToast('Tag updated successfully', 'success');
      return data;
    } catch (err) {
      console.error('Error updating tag:', err);
      onToast('Failed to update tag', 'error');
      return null;
    }
  }, [onToast]);

  // Delete a tag
  const handleDeleteTag = useCallback(async (
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ): Promise<void> => {
    try {
      // Delete tag assignments first (cascade should handle this, but being explicit)
      await supabase
        .from('ticket_tag_assignments')
        .delete()
        .eq('tag_id', tagId);

      // Delete the tag
      const { error } = await supabase
        .from('ticket_tags')
        .delete()
        .eq('id', tagId);

      if (error) throw error;

      setAvailableTags(prev => prev.filter(tag => tag.id !== tagId));
      
      // Remove tag from all tickets in state
      updateTickets(prev => prev.map(ticket => ({
        ...ticket,
        tags: ticket.tags?.filter(tag => tag.id !== tagId)
      })));
      
      // Remove tag from selected ticket
      updateSelectedTicket(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tags: prev.tags?.filter(tag => tag.id !== tagId)
        };
      });
      
      onToast('Tag deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting tag:', err);
      onToast('Failed to delete tag', 'error');
    }
  }, [onToast]);

  // Assign a tag to a ticket
  const handleAssignTag = useCallback(async (
    ticketId: string,
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ): Promise<void> => {
    try {
      await TicketAPI.addTagToTicket(ticketId, tagId);

      const tag = availableTags.find(t => t.id === tagId);
      if (!tag) return;

      // Update ticket in list
      updateTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, tags: [...(ticket.tags || []), tag] }
          : ticket
      ));

      // Update selected ticket
      updateSelectedTicket(prev => {
        if (!prev || prev.id !== ticketId) return prev;
        return {
          ...prev,
          tags: [...(prev.tags || []), tag]
        };
      });

      onToast('Tag added to ticket', 'success');
    } catch (err) {
      console.error('Error assigning tag:', err);
      onToast('Failed to add tag', 'error');
    }
  }, [availableTags, onToast]);

  // Remove a tag from a ticket
  const handleRemoveTag = useCallback(async (
    ticketId: string,
    tagId: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void
  ): Promise<void> => {
    try {
      await TicketAPI.removeTagFromTicket(ticketId, tagId);

      // Update ticket in list
      updateTickets(prev => prev.map(ticket =>
        ticket.id === ticketId
          ? { ...ticket, tags: ticket.tags?.filter(t => t.id !== tagId) }
          : ticket
      ));

      // Update selected ticket
      updateSelectedTicket(prev => {
        if (!prev || prev.id !== ticketId) return prev;
        return {
          ...prev,
          tags: prev.tags?.filter(t => t.id !== tagId)
        };
      });

      onToast('Tag removed from ticket', 'success');
    } catch (err) {
      console.error('Error removing tag:', err);
      onToast('Failed to remove tag', 'error');
    }
  }, [onToast]);

  return {
    availableTags,
    isLoadingTags,
    fetchTags,
    handleCreateTag,
    handleUpdateTag,
    handleDeleteTag,
    handleAssignTag,
    handleRemoveTag,
  };
}
