import { useEffect } from 'react';

interface TicketKeyboardShortcutsConfig {
  isOpen: boolean;
  showCloseConfirmation: boolean;
  showAvatarManagement: boolean;
  showInternalNotes: boolean;
  responseMessage: string;
  selectedTicket: any;
  selectedAvatar: any;
  isSending: boolean;
  tickets: any[];
  activeTab: string;
  assignmentFilter: string;
  priorityFilter: string;
  tagFilter: string;
  searchQuery: string;
  currentUserId: string | null;
  onClose: () => void;
  onSendMessage: () => void;
  onSelectTicket: (ticket: any) => void;
}

/**
 * Custom hook to handle keyboard shortcuts for ticket navigation and actions
 * @param config - Configuration object with all required state and handlers
 */
export function useTicketKeyboardShortcuts(config: TicketKeyboardShortcutsConfig): void {
  const {
    isOpen,
    showCloseConfirmation,
    showAvatarManagement,
    showInternalNotes,
    responseMessage,
    selectedTicket,
    selectedAvatar,
    isSending,
    tickets,
    activeTab,
    assignmentFilter,
    priorityFilter,
    tagFilter,
    searchQuery,
    currentUserId,
    onClose,
    onSendMessage,
    onSelectTicket
  } = config;

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.key === 'Escape' && !showCloseConfirmation && !showAvatarManagement) {
        onClose();
        return;
      }

      // Ctrl+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (responseMessage.trim() && selectedTicket && selectedAvatar && !isSending) {
          onSendMessage();
        }
      }

      // Arrow keys for ticket navigation (when not in input field)
      if (selectedTicket && !showInternalNotes) {
        const activeElement = document.activeElement;
        const isInInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        
        if (!isInInput && tickets.length > 0) {
          // Filter tickets by active tab
          let currentTickets = activeTab === 'all' 
            ? tickets 
            : tickets.filter((ticket: any) => ticket.status === activeTab);
          
          // Apply assignment filter
          if (assignmentFilter === 'my' && currentUserId) {
            currentTickets = currentTickets.filter((ticket: any) => ticket.assigned_to === currentUserId);
          } else if (assignmentFilter === 'unassigned') {
            currentTickets = currentTickets.filter((ticket: any) => !ticket.assigned_to);
          }
          
          // Apply priority filter
          if (priorityFilter !== 'all') {
            currentTickets = currentTickets.filter((ticket: any) => ticket.priority === priorityFilter);
          }
          
          // Apply tag filter
          if (tagFilter !== 'all') {
            currentTickets = currentTickets.filter((ticket: any) => {
              const ticketTags = ticket.tags || [];
              return ticketTags.some((tag: any) => tag.id === tagFilter);
            });
          }
          
          // Apply search filter
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            currentTickets = currentTickets.filter((ticket: any) => {
              const subject = ticket.subject?.toLowerCase() || '';
              const message = ticket.message?.toLowerCase() || '';
              const fullName = ticket.full_name?.toLowerCase() || '';
              const email = ticket.email?.toLowerCase() || '';
              return subject.includes(query) || message.includes(query) || fullName.includes(query) || email.includes(query);
            });
          }
          
          const currentIndex = currentTickets.findIndex((t: any) => t.id === selectedTicket.id);
          
          if (e.key === 'ArrowUp' && currentIndex > 0) {
            e.preventDefault();
            onSelectTicket(currentTickets[currentIndex - 1]);
          } else if (e.key === 'ArrowDown' && currentIndex < currentTickets.length - 1) {
            e.preventDefault();
            onSelectTicket(currentTickets[currentIndex + 1]);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    responseMessage,
    selectedTicket,
    selectedAvatar,
    isSending,
    showCloseConfirmation,
    showAvatarManagement,
    showInternalNotes,
    activeTab,
    tickets,
    assignmentFilter,
    priorityFilter,
    tagFilter,
    searchQuery,
    currentUserId,
    onClose,
    onSendMessage,
    onSelectTicket
  ]);
}
