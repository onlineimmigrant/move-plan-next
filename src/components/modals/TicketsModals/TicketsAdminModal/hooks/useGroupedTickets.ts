'use client';

/**
 * useGroupedTickets Hook
 * 
 * High-performance hook for filtering, sorting, and grouping tickets by status.
 * Uses useMemo to prevent unnecessary recalculations and optimize rendering.
 * 
 * @module hooks/useGroupedTickets
 * @example
 * ```typescript
 * const groupedTickets = useGroupedTickets({
 *   tickets: allTickets,
 *   statuses: ['all', 'open', 'in progress', 'closed'],
 *   debouncedSearchQuery: 'urgent',
 *   priorityFilter: 'high',
 *   assignmentFilter: 'my',
 *   tagFilter: 'all',
 *   sortBy: 'date-newest',
 *   showAdvancedFilters: false,
 *   dateRangeStart: '',
 *   dateRangeEnd: '',
 *   multiSelectStatuses: [],
 *   multiSelectPriorities: [],
 *   multiSelectTags: [],
 *   multiSelectAssignees: [],
 *   filterLogic: 'AND',
 *   currentUserId: 'user-123'
 * });
 * 
 * // Result: { all: [...], open: [...], 'in progress': [...], closed: [...] }
 * const openTickets = groupedTickets.open; // Filtered & sorted
 * ```
 */

import { useMemo } from 'react';
import type { Ticket } from '../types';
import {
  filterTicketsByStatus,
  applyAllFilters,
} from '../utils/ticketFiltering';
import { sortTickets } from '../utils/ticketSorting';

/**
 * Parameters for useGroupedTickets hook
 * 
 * @interface UseGroupedTicketsParams
 * @property {Ticket[]} tickets - Array of all tickets to process
 * @property {string[]} statuses - Status categories to group by
 * @property {string} debouncedSearchQuery - Debounced search text (300ms delay)
 * @property {'all' | 'high' | 'medium' | 'low'} priorityFilter - Priority filter
 * @property {'all' | 'my' | 'unassigned'} assignmentFilter - Assignment filter
 * @property {string} tagFilter - Tag filter ('all' or tag_id)
 * @property {string} sortBy - Sort order for tickets
 * @property {boolean} showAdvancedFilters - Whether advanced filters are active
 * @property {string} dateRangeStart - Start date for date range filter
 * @property {string} dateRangeEnd - End date for date range filter
 * @property {string[]} multiSelectStatuses - Multiple status selections
 * @property {string[]} multiSelectPriorities - Multiple priority selections
 * @property {string[]} multiSelectTags - Multiple tag selections
 * @property {string[]} multiSelectAssignees - Multiple assignee selections
 * @property {'AND' | 'OR'} filterLogic - Logic for combining filters
 * @property {string} currentUserId - Current user ID for 'my' filter
 */
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

/**
 * Groups, filters, and sorts tickets by status
 * 
 * Memoized for performance - only recalculates when dependencies change.
 * 
 * Processing Steps:
 * 1. Filter by status
 * 2. Apply basic filters (search, priority, assignment, tag)
 * 3. Apply advanced filters (if enabled)
 * 4. Sort tickets
 * 5. Group by status
 * 
 * @param {UseGroupedTicketsParams} params - Hook parameters
 * @returns {Record<string, Ticket[]>} Object with status keys and filtered/sorted ticket arrays
 */
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
