import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import * as TicketAPI from '../utils/ticketApi';
import type { Ticket } from '../types';

interface UseTicketOperationsProps {
  organizationId: string;
  onToast: (message: string, type: 'success' | 'error') => void;
  onRefreshTickets: () => Promise<void>;
}

interface UseTicketOperationsReturn {
  isChangingStatus: boolean;
  isChangingPriority: boolean;
  isAssigning: boolean;
  showCloseConfirmation: boolean;
  ticketToClose: { id: string; subject: string } | null;
  setShowCloseConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
  setTicketToClose: React.Dispatch<React.SetStateAction<{ id: string; subject: string } | null>>;
  handleAssignTicket: (ticketId: string, adminId: string | null) => Promise<void>;
  handlePriorityChange: (ticketId: string, priority: string | null) => Promise<void>;
  handleStatusChange: (
    ticketId: string,
    newStatus: string,
    tickets: Ticket[],
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void,
    selectedTicketId?: string
  ) => Promise<void>;
  confirmCloseTicket: (
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void,
    selectedTicketId?: string
  ) => Promise<void>;
  cancelCloseTicket: () => void;
}

/**
 * Custom hook for managing ticket operations
 * Handles assignment, priority changes, status changes, and close confirmation
 */
export const useTicketOperations = ({
  organizationId,
  onToast,
  onRefreshTickets,
}: UseTicketOperationsProps): UseTicketOperationsReturn => {
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isChangingPriority, setIsChangingPriority] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [ticketToClose, setTicketToClose] = useState<{ id: string; subject: string } | null>(null);

  /**
   * Assign ticket to an admin user
   * @param ticketId - ID of the ticket to assign
   * @param adminId - ID of admin to assign to (null to unassign)
   */
  const handleAssignTicket = useCallback(async (ticketId: string, adminId: string | null) => {
    setIsAssigning(true);
    try {
      await TicketAPI.assignTicket(ticketId, adminId, organizationId);
      onToast(adminId ? 'Ticket assigned successfully' : 'Ticket unassigned successfully', 'success');
      // Refresh tickets after assignment
      await onRefreshTickets();
    } catch (err) {
      console.error('❌ Error assigning ticket:', err);
      onToast('Failed to assign ticket', 'error');
    } finally {
      setIsAssigning(false);
    }
  }, [organizationId, onRefreshTickets, onToast]);

  /**
   * Change ticket priority
   * @param ticketId - ID of the ticket
   * @param priority - New priority level (high, medium, low, or null)
   */
  const handlePriorityChange = useCallback(async (ticketId: string, priority: string | null) => {
    setIsChangingPriority(true);
    try {
      await TicketAPI.updateTicketPriority(ticketId, priority, organizationId);
      onToast(priority ? `Priority changed to ${priority}` : 'Priority removed', 'success');
      // Refresh tickets after priority change
      await onRefreshTickets();
    } catch (err) {
      console.error('Error changing priority:', err);
      onToast('Failed to change priority', 'error');
    } finally {
      setIsChangingPriority(false);
    }
  }, [organizationId, onRefreshTickets, onToast]);

  /**
   * Execute status change with optimistic update
   * @param ticketId - ID of the ticket
   * @param newStatus - New status
   * @param updateTickets - Function to update tickets list
   * @param updateSelectedTicket - Function to update selected ticket
   */
  const executeStatusChange = useCallback(async (
    ticketId: string,
    newStatus: string,
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void,
    selectedTicketId?: string
  ) => {
    // Optimistic update
    updateTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    if (selectedTicketId === ticketId) {
      updateSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }

    setIsChangingStatus(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        onToast('User not authenticated', 'error');
        return;
      }

      // Update status using API
      await TicketAPI.updateTicketStatus({
        ticketId,
        newStatus,
        userId: user.id,
        organizationId
      });

      onToast('Status updated successfully', 'success');
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      // Revert optimistic update on error
      await onRefreshTickets();
      onToast(error.message || 'Failed to update status', 'error');
    } finally {
      setIsChangingStatus(false);
    }
  }, [organizationId, onToast, onRefreshTickets]);

  /**
   * Handle status change with confirmation for closing tickets
   * @param ticketId - ID of the ticket
   * @param newStatus - New status
   * @param tickets - Current tickets list
   * @param updateTickets - Function to update tickets list
   * @param updateSelectedTicket - Function to update selected ticket
   * @param selectedTicketId - Currently selected ticket ID
   */
  const handleStatusChange = useCallback(async (
    ticketId: string,
    newStatus: string,
    tickets: Ticket[],
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void,
    selectedTicketId?: string
  ) => {
    // Show confirmation dialog only for closing tickets
    if (newStatus === 'closed') {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setTicketToClose({ id: ticketId, subject: ticket.subject });
        setShowCloseConfirmation(true);
        return;
      }
    }

    // For other status changes, proceed directly
    await executeStatusChange(ticketId, newStatus, updateTickets, updateSelectedTicket, selectedTicketId);
  }, [executeStatusChange]);

  /**
   * Confirm closing ticket (from confirmation dialog)
   * @param updateTickets - Function to update tickets list
   * @param updateSelectedTicket - Function to update selected ticket
   * @param selectedTicketId - Currently selected ticket ID
   */
  const confirmCloseTicket = useCallback(async (
    updateTickets: (updater: (tickets: Ticket[]) => Ticket[]) => void,
    updateSelectedTicket: (updater: (ticket: Ticket | null) => Ticket | null) => void,
    selectedTicketId?: string
  ) => {
    if (ticketToClose) {
      await executeStatusChange(
        ticketToClose.id,
        'closed',
        updateTickets,
        updateSelectedTicket,
        selectedTicketId
      );
      setShowCloseConfirmation(false);
      setTicketToClose(null);
    }
  }, [ticketToClose, executeStatusChange]);

  /**
   * Cancel closing ticket (from confirmation dialog)
   */
  const cancelCloseTicket = useCallback(() => {
    setShowCloseConfirmation(false);
    setTicketToClose(null);
  }, []);

  return {
    isChangingStatus,
    isChangingPriority,
    isAssigning,
    showCloseConfirmation,
    ticketToClose,
    setShowCloseConfirmation,
    setTicketToClose,
    handleAssignTicket,
    handlePriorityChange,
    handleStatusChange,
    confirmCloseTicket,
    cancelCloseTicket,
  };
};
