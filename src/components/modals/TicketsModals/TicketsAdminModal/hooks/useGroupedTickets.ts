'use client';

import { useMemo } from 'react';
import type { Ticket } from '../types';
import {
  filterTicketsByStatus,
  applyAllFilters,
} from '../utils/ticketFiltering';
import { sortTickets } from '../utils/ticketSorting';

interface UseGroupedTicketsParams {
  tickets: Ticket[];
  statuses: string[];
  debouncedSearchQuery: string;
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  assignmentFilter: 'all' | 'my' | 'unassigned';
  tagFilter: string;
  sortBy: 'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated';
  showAdvancedFilters: boolean;
  dateRangeStart: string;
  dateRangeEnd: string;
  multiSelectStatuses: string[];
  multiSelectPriorities: string[];
  multiSelectTags: string[];
  multiSelectAssignees: string[];
  filterLogic: 'AND' | 'OR';
  currentUserId: string;
}

export function useGroupedTickets({
  tickets,
  statuses,
  debouncedSearchQuery,
  priorityFilter,
  assignmentFilter,
  tagFilter,
  sortBy,
  showAdvancedFilters,
  dateRangeStart,
  dateRangeEnd,
  multiSelectStatuses,
  multiSelectPriorities,
  multiSelectTags,
  multiSelectAssignees,
  filterLogic,
  currentUserId,
}: UseGroupedTicketsParams): Record<string, Ticket[]> {
  return useMemo(() => {
    return statuses.reduce(
      (acc, status) => {
        // Start with all tickets or filter by status
        let filteredTickets = status === 'all' ? tickets : filterTicketsByStatus(tickets, status);
        
        // Apply all filters using Phase 1 utilities
        const filters = {
          searchQuery: debouncedSearchQuery,
          activeTab: status as any, // status comes from statuses array which matches TicketStatus
          priorityFilter,
          assignmentFilter,
          tagFilter,
          sortBy,
        };

        const advancedFilters = {
          showAdvancedFilters,
          dateRangeStart,
          dateRangeEnd,
          multiSelectStatuses,
          multiSelectPriorities,
          multiSelectTags,
          multiSelectAssignees,
          filterLogic,
        };

        filteredTickets = applyAllFilters(filteredTickets, filters, advancedFilters, currentUserId);
        
        // Apply sorting using Phase 1 utility
        filteredTickets = sortTickets(filteredTickets, sortBy);
        
        return {
          ...acc,
          [status]: filteredTickets,
        };
      },
      {} as Record<string, Ticket[]>
    );
  }, [
    tickets,
    statuses,
    debouncedSearchQuery,
    priorityFilter,
    assignmentFilter,
    tagFilter,
    sortBy,
    showAdvancedFilters,
    dateRangeStart,
    dateRangeEnd,
    multiSelectStatuses,
    multiSelectPriorities,
    multiSelectTags,
    multiSelectAssignees,
    filterLogic,
    currentUserId,
  ]);
}
