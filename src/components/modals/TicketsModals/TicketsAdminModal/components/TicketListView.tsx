/**
 * TicketListView Component
 * 
 * Displays the ticket list with active filters, search statistics, and filter pills.
 * Shows when no ticket is selected in the admin modal.
 */

import React from 'react';
import { X, User } from 'lucide-react';
import { Ticket, TicketTag, AdminUser } from '../types';
import { TicketList } from './TicketList';
import { getPriorityLabel } from '../utils/ticketHelpers';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TicketListViewProps {
  // Ticket data
  tickets: Ticket[];
  groupedTickets: Record<string, Ticket[]>;
  activeTab: string[];
  
  // Filter states
  searchQuery: string;
  selectedAssignmentFilters: string[];
  selectedPriorityFilters: string[];
  selectedTagFilters: string[];
  showAdvancedFilters: boolean;
  dateRangeStart: string;
  dateRangeEnd: string;
  multiSelectStatuses: string[];
  multiSelectPriorities: string[];
  multiSelectTags: string[];
  multiSelectAssignees: string[];
  filterLogic: 'AND' | 'OR';
  
  // Data
  availableTags: TicketTag[];
  adminUsers: AdminUser[];
  ticketsWithPinnedNotes: Set<string>;
  ticketNoteCounts: Map<string, number>;
  
  // Loading states
  isLoadingTickets: boolean;
  hasMoreTickets: boolean;
  loadingMore: boolean;
  isAssigning: boolean;
  isChangingPriority: boolean;
  isChangingStatus: boolean;
  
  // Callbacks
  onTicketSelect: (ticket: Ticket) => void;
  onLoadMore: () => void;
  onClearAllFilters: () => void;
  onClearSearchQuery: () => void;
  onClearAssignmentFilter: () => void;
  onClearPriorityFilter: () => void;
  onClearTagFilter: () => void;
  onClearDateRangeStart: () => void;
  onClearDateRangeEnd: () => void;
  onRemoveStatus: (status: string) => void;
  onRemovePriority: (priority: string) => void;
  onRemoveTag: (tagId: string) => void;
  onRemoveAssignee: (assigneeId: string) => void;
  onAssignTicket: (ticketId: string, userId: string | null) => Promise<void>;
  onPriorityChange: (ticketId: string, priority: string | null) => Promise<void>;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
  
  // Utility functions
  getUnreadCount: (ticket: Ticket) => number;
  isWaitingForResponse: (ticket: Ticket) => boolean;
}

export const TicketListView: React.FC<TicketListViewProps> = ({
  tickets,
  groupedTickets,
  activeTab,
  searchQuery,
  selectedAssignmentFilters,
  selectedPriorityFilters,
  selectedTagFilters,
  showAdvancedFilters,
  dateRangeStart,
  dateRangeEnd,
  multiSelectStatuses,
  multiSelectPriorities,
  multiSelectTags,
  multiSelectAssignees,
  filterLogic,
  availableTags,
  adminUsers,
  ticketsWithPinnedNotes,
  ticketNoteCounts,
  isLoadingTickets,
  hasMoreTickets,
  loadingMore,
  isAssigning,
  isChangingPriority,
  isChangingStatus,
  onTicketSelect,
  onLoadMore,
  onClearAllFilters,
  onClearSearchQuery,
  onClearAssignmentFilter,
  onClearPriorityFilter,
  onClearTagFilter,
  onClearDateRangeStart,
  onClearDateRangeEnd,
  onRemoveStatus,
  onRemovePriority,
  onRemoveTag,
  onRemoveAssignee,
  onAssignTicket,
  onPriorityChange,
  onStatusChange,
  getUnreadCount,
  isWaitingForResponse,
}) => {
  const hasActiveFilters = selectedAssignmentFilters.length > 0;
  
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  return (
    <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20">
      {/* Active Assignment Filters Only */}
      {hasActiveFilters && (
        <div className="sticky top-0 z-10 p-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Assignment Filter Pills */}
            <div className="flex flex-wrap gap-2">
              {selectedAssignmentFilters.map(filter => (
                <span 
                  key={filter} 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: `0 2px 4px ${primary.base}30`,
                  }}
                >
                  <span>{filter === 'my' ? 'My Tickets' : filter === 'unassigned' ? 'Unassigned' : filter === 'others' ? 'Others' : filter}</span>
                  <button
                    onClick={() => onRemoveAssignee(filter)}
                    className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
            
            {/* Clear All Button */}
            <button
              onClick={onClearAllFilters}
              className="flex-shrink-0 p-2 hover:bg-slate-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}
      
      <TicketList
        tickets={
          activeTab.length === 0
            ? tickets
            : activeTab.flatMap(status => groupedTickets[status] || [])
        }
        selectedTicketId={null}
        onTicketSelect={onTicketSelect}
        searchQuery={searchQuery}
        isLoading={isLoadingTickets}
        hasMore={hasMoreTickets}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        ticketsWithPinnedNotes={ticketsWithPinnedNotes}
        ticketNoteCounts={ticketNoteCounts}
        adminUsers={adminUsers}
        getUnreadCount={getUnreadCount}
        isWaitingForResponse={isWaitingForResponse}
        selectedAssignmentFilters={selectedAssignmentFilters}
        selectedPriorityFilters={selectedPriorityFilters}
        selectedTagFilters={selectedTagFilters}
        onAssignTicket={onAssignTicket}
        onPriorityChange={onPriorityChange}
        onStatusChange={onStatusChange}
        isAssigning={isAssigning}
        isChangingPriority={isChangingPriority}
        isChangingStatus={isChangingStatus}
      />
    </div>
  );
};
