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
  activeTab: string[];
  selectedAssignmentFilters: string[];
  selectedPriorityFilters: string[];
  selectedTagFilters: string[];
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
    selectedAssignmentFilters,
    selectedPriorityFilters,
    selectedTagFilters,
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
          // Filter tickets by active tab statuses
          let currentTickets = activeTab.length === 0
            ? tickets 
            : tickets.filter((ticket: any) => activeTab.includes(ticket.status));
          
          // Apply assignment filter - show tickets matching ANY selected assignment
          if (selectedAssignmentFilters.length > 0) {
            currentTickets = currentTickets.filter((ticket: any) => {
              return selectedAssignmentFilters.some(filter => {
                if (filter === 'my') return ticket.assigned_to === currentUserId;
                if (filter === 'unassigned') return !ticket.assigned_to;
                if (filter === 'others') return ticket.assigned_to && ticket.assigned_to !== currentUserId;
                return false;
              });
            });
          }
          
          // Apply priority filter - show tickets matching ANY selected priority
          if (selectedPriorityFilters.length > 0) {
            currentTickets = currentTickets.filter((ticket: any) => 
              selectedPriorityFilters.includes(ticket.priority)
            );
          }
          
          // Apply tag filter - check if ticket has ANY of the selected tags
          if (selectedTagFilters.length > 0) {
            currentTickets = currentTickets.filter((ticket: any) => {
              const ticketTags = ticket.tags || [];
              return ticketTags.some((tag: any) => selectedTagFilters.includes(tag.id));
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
    selectedAssignmentFilters,
    selectedPriorityFilters,
    selectedTagFilters,
    searchQuery,
    currentUserId,
    onClose,
    onSendMessage,
    onSelectTicket
  ]);
}
