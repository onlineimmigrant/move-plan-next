/**
 * Pure functions for filtering tickets
 * These functions have no side effects and can be easily tested
 */

import type { Ticket, TicketFilters, AdvancedFilters, AssignmentFilter, TicketPriority } from '../types';

/**
 * Filter tickets by search query (searches subject, message, email, name)
 */
export function filterTicketsBySearch(tickets: Ticket[], searchQuery: string): Ticket[] {
  if (!searchQuery.trim()) {
    return tickets;
  }

  const query = searchQuery.toLowerCase().trim();

  return tickets.filter((ticket) => {
    const searchableText = [
      ticket.subject,
      ticket.message,
      ticket.email,
      ticket.full_name || '',
      ticket.id,
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(query);
  });
}

/**
 * Filter tickets by status
 */
export function filterTicketsByStatus(tickets: Ticket[], status: string): Ticket[] {
  if (status === 'all') {
    return tickets;
  }

  return tickets.filter((ticket) => ticket.status === status);
}

/**
 * Filter tickets by priority
 */
export function filterTicketsByPriority(tickets: Ticket[], priority: TicketPriority): Ticket[] {
  if (priority === 'all') {
    return tickets;
  }

  return tickets.filter((ticket) => ticket.priority === priority);
}

/**
 * Filter tickets by assignment
 */
export function filterTicketsByAssignment(
  tickets: Ticket[],
  assignmentFilter: AssignmentFilter,
  currentUserId: string | null
): Ticket[] {
  if (assignmentFilter === 'all') {
    return tickets;
  }

  if (assignmentFilter === 'my') {
    return tickets.filter((ticket) => ticket.assigned_to === currentUserId);
  }

  if (assignmentFilter === 'unassigned') {
    return tickets.filter((ticket) => !ticket.assigned_to);
  }

  return tickets;
}

/**
 * Filter tickets by tag
 */
export function filterTicketsByTag(tickets: Ticket[], tagFilter: string): Ticket[] {
  if (tagFilter === 'all') {
    return tickets;
  }

  return tickets.filter((ticket) => {
    return ticket.tags?.some((tag) => tag.id === tagFilter);
  });
}

/**
 * Filter tickets by date range
 */
export function filterTicketsByDateRange(
  tickets: Ticket[],
  startDate: string,
  endDate: string
): Ticket[] {
  if (!startDate && !endDate) {
    return tickets;
  }

  return tickets.filter((ticket) => {
    const ticketDate = new Date(ticket.created_at);

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include entire end date
      return ticketDate >= start && ticketDate <= end;
    }

    if (startDate) {
      const start = new Date(startDate);
      return ticketDate >= start;
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return ticketDate <= end;
    }

    return true;
  });
}

/**
 * Filter tickets by multiple statuses (advanced filter)
 */
export function filterTicketsByMultipleStatuses(
  tickets: Ticket[],
  statuses: string[]
): Ticket[] {
  if (statuses.length === 0) {
    return tickets;
  }

  return tickets.filter((ticket) => statuses.includes(ticket.status));
}

/**
 * Filter tickets by multiple priorities (advanced filter)
 */
export function filterTicketsByMultiplePriorities(
  tickets: Ticket[],
  priorities: string[]
): Ticket[] {
  if (priorities.length === 0) {
    return tickets;
  }

  return tickets.filter((ticket) => {
    return ticket.priority && priorities.includes(ticket.priority);
  });
}

/**
 * Filter tickets by multiple tags (advanced filter)
 */
export function filterTicketsByMultipleTags(tickets: Ticket[], tagIds: string[]): Ticket[] {
  if (tagIds.length === 0) {
    return tickets;
  }

  return tickets.filter((ticket) => {
    return ticket.tags?.some((tag) => tagIds.includes(tag.id));
  });
}

/**
 * Filter tickets by multiple assignees (advanced filter)
 */
export function filterTicketsByMultipleAssignees(
  tickets: Ticket[],
  assigneeIds: string[]
): Ticket[] {
  if (assigneeIds.length === 0) {
    return tickets;
  }

  return tickets.filter((ticket) => {
    // Support 'unassigned' as a special value
    if (assigneeIds.includes('unassigned')) {
      if (!ticket.assigned_to) return true;
    }
    return ticket.assigned_to && assigneeIds.includes(ticket.assigned_to);
  });
}

/**
 * Apply advanced filters with AND/OR logic
 */
export function applyAdvancedFilters(
  tickets: Ticket[],
  advancedFilters: AdvancedFilters
): Ticket[] {
  if (!advancedFilters.showAdvancedFilters) {
    return tickets;
  }

  const {
    dateRangeStart,
    dateRangeEnd,
    multiSelectStatuses,
    multiSelectPriorities,
    multiSelectTags,
    multiSelectAssignees,
    filterLogic,
  } = advancedFilters;

  // If no advanced filters are active, return all tickets
  const hasActiveFilters =
    dateRangeStart ||
    dateRangeEnd ||
    multiSelectStatuses.length > 0 ||
    multiSelectPriorities.length > 0 ||
    multiSelectTags.length > 0 ||
    multiSelectAssignees.length > 0;

  if (!hasActiveFilters) {
    return tickets;
  }

  if (filterLogic === 'OR') {
    // OR logic: ticket passes if it matches ANY filter
    return tickets.filter((ticket) => {
      const matchesDate =
        (dateRangeStart || dateRangeEnd) &&
        filterTicketsByDateRange([ticket], dateRangeStart, dateRangeEnd).length > 0;

      const matchesStatus =
        multiSelectStatuses.length > 0 &&
        filterTicketsByMultipleStatuses([ticket], multiSelectStatuses).length > 0;

      const matchesPriority =
        multiSelectPriorities.length > 0 &&
        filterTicketsByMultiplePriorities([ticket], multiSelectPriorities).length > 0;

      const matchesTags =
        multiSelectTags.length > 0 &&
        filterTicketsByMultipleTags([ticket], multiSelectTags).length > 0;

      const matchesAssignees =
        multiSelectAssignees.length > 0 &&
        filterTicketsByMultipleAssignees([ticket], multiSelectAssignees).length > 0;

      return (
        matchesDate || matchesStatus || matchesPriority || matchesTags || matchesAssignees
      );
    });
  } else {
    // AND logic: ticket must pass ALL active filters
    let filtered = tickets;

    if (dateRangeStart || dateRangeEnd) {
      filtered = filterTicketsByDateRange(filtered, dateRangeStart, dateRangeEnd);
    }

    if (multiSelectStatuses.length > 0) {
      filtered = filterTicketsByMultipleStatuses(filtered, multiSelectStatuses);
    }

    if (multiSelectPriorities.length > 0) {
      filtered = filterTicketsByMultiplePriorities(filtered, multiSelectPriorities);
    }

    if (multiSelectTags.length > 0) {
      filtered = filterTicketsByMultipleTags(filtered, multiSelectTags);
    }

    if (multiSelectAssignees.length > 0) {
      filtered = filterTicketsByMultipleAssignees(filtered, multiSelectAssignees);
    }

    return filtered;
  }
}

/**
 * Apply all filters to tickets
 */
export function applyAllFilters(
  tickets: Ticket[],
  filters: TicketFilters,
  advancedFilters: AdvancedFilters,
  currentUserId: string | null
): Ticket[] {
  let filtered = tickets;

  // Apply search filter
  filtered = filterTicketsBySearch(filtered, filters.searchQuery);

  // Apply status filter (unless using advanced multi-select)
  if (advancedFilters.multiSelectStatuses.length === 0) {
    filtered = filterTicketsByStatus(filtered, filters.activeTab);
  }

  // Apply priority filter (unless using advanced multi-select)
  if (advancedFilters.multiSelectPriorities.length === 0) {
    filtered = filterTicketsByPriority(filtered, filters.priorityFilter);
  }

  // Apply assignment filter (unless using advanced multi-select)
  if (advancedFilters.multiSelectAssignees.length === 0) {
    filtered = filterTicketsByAssignment(filtered, filters.assignmentFilter, currentUserId);
  }

  // Apply tag filter (unless using advanced multi-select)
  if (advancedFilters.multiSelectTags.length === 0) {
    filtered = filterTicketsByTag(filtered, filters.tagFilter);
  }

  // Apply advanced filters
  filtered = applyAdvancedFilters(filtered, advancedFilters);

  return filtered;
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(
  filters: TicketFilters,
  advancedFilters: AdvancedFilters
): boolean {
  return (
    filters.searchQuery.trim() !== '' ||
    filters.activeTab !== 'all' ||
    filters.priorityFilter !== 'all' ||
    filters.assignmentFilter !== 'all' ||
    filters.tagFilter !== 'all' ||
    advancedFilters.showAdvancedFilters
  );
}
