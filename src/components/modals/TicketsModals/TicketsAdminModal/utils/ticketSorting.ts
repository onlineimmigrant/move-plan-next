/**
 * Pure functions for sorting tickets
 * These functions have no side effects and can be easily tested
 */

import type { Ticket, SortBy } from '../types';

/**
 * Sort tickets by creation date (newest first)
 */
export function sortByDateNewest(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

/**
 * Sort tickets by creation date (oldest first)
 */
export function sortByDateOldest(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

/**
 * Get priority weight for sorting
 */
function getPriorityWeight(priority?: string): number {
  switch (priority) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0; // No priority set
  }
}

/**
 * Sort tickets by priority (high > medium > low > none)
 */
export function sortByPriority(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const weightA = getPriorityWeight(a.priority);
    const weightB = getPriorityWeight(b.priority);
    
    // If priorities are equal, sort by date (newest first)
    if (weightA === weightB) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    return weightB - weightA;
  });
}

/**
 * Sort tickets by number of responses (most responses first)
 */
export function sortByResponseCount(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    const countA = a.ticket_responses?.length || 0;
    const countB = b.ticket_responses?.length || 0;
    
    // If response counts are equal, sort by date (newest first)
    if (countA === countB) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    
    return countB - countA;
  });
}

/**
 * Get the last updated timestamp for a ticket
 */
function getLastUpdated(ticket: Ticket): number {
  const ticketCreated = new Date(ticket.created_at).getTime();
  
  if (!ticket.ticket_responses || ticket.ticket_responses.length === 0) {
    return ticketCreated;
  }
  
  const lastResponseTime = Math.max(
    ...ticket.ticket_responses.map((response) => 
      new Date(response.created_at).getTime()
    )
  );
  
  return Math.max(ticketCreated, lastResponseTime);
}

/**
 * Sort tickets by last updated time (most recently updated first)
 */
export function sortByRecentlyUpdated(tickets: Ticket[]): Ticket[] {
  return [...tickets].sort((a, b) => {
    return getLastUpdated(b) - getLastUpdated(a);
  });
}

/**
 * Main sort function - applies the selected sort option
 */
export function sortTickets(tickets: Ticket[], sortBy: SortBy): Ticket[] {
  switch (sortBy) {
    case 'date-newest':
      return sortByDateNewest(tickets);
    case 'date-oldest':
      return sortByDateOldest(tickets);
    case 'priority':
      return sortByPriority(tickets);
    case 'responses':
      return sortByResponseCount(tickets);
    case 'updated':
      return sortByRecentlyUpdated(tickets);
    default:
      return sortByDateNewest(tickets); // Default to newest first
  }
}

/**
 * Sort tickets with custom comparator
 */
export function sortTicketsCustom(
  tickets: Ticket[],
  compareFn: (a: Ticket, b: Ticket) => number
): Ticket[] {
  return [...tickets].sort(compareFn);
}

/**
 * Get sort label for display
 */
export function getSortLabel(sortBy: SortBy): string {
  switch (sortBy) {
    case 'date-newest':
      return 'Newest First';
    case 'date-oldest':
      return 'Oldest First';
    case 'priority':
      return 'Priority';
    case 'responses':
      return 'Most Responses';
    case 'updated':
      return 'Recently Updated';
    default:
      return 'Sort By';
  }
}
