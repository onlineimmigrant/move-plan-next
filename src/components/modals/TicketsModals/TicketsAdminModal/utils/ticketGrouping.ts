/**
 * Pure functions for grouping tickets
 * These functions have no side effects and can be easily tested
 */

import type { Ticket, GroupedTickets, TicketStatus } from '../types';

/**
 * Group tickets by their status
 */
export function groupTicketsByStatus(tickets: Ticket[]): GroupedTickets {
  const grouped: GroupedTickets = {
    all: tickets,
    open: [],
    'in progress': [],
    closed: [],
  };

  tickets.forEach((ticket) => {
    const status = ticket.status as TicketStatus;
    
    if (status === 'open') {
      grouped.open.push(ticket);
    } else if (status === 'in progress') {
      grouped['in progress'].push(ticket);
    } else if (status === 'closed') {
      grouped.closed.push(ticket);
    }
  });

  return grouped;
}

/**
 * Count tickets by status
 */
export function countTicketsByStatus(tickets: Ticket[]): Record<string, number> {
  const counts: Record<string, number> = {
    all: tickets.length,
    open: 0,
    'in progress': 0,
    closed: 0,
  };

  tickets.forEach((ticket) => {
    if (ticket.status === 'open') {
      counts.open++;
    } else if (ticket.status === 'in progress') {
      counts['in progress']++;
    } else if (ticket.status === 'closed') {
      counts.closed++;
    }
  });

  return counts;
}

/**
 * Group tickets by priority
 */
export function groupTicketsByPriority(tickets: Ticket[]): Record<string, Ticket[]> {
  const grouped: Record<string, Ticket[]> = {
    high: [],
    medium: [],
    low: [],
    none: [],
  };

  tickets.forEach((ticket) => {
    const priority = ticket.priority || 'none';
    if (!grouped[priority]) {
      grouped[priority] = [];
    }
    grouped[priority].push(ticket);
  });

  return grouped;
}

/**
 * Count tickets by priority
 */
export function countTicketsByPriority(tickets: Ticket[]): Record<string, number> {
  const counts: Record<string, number> = {
    high: 0,
    medium: 0,
    low: 0,
    none: 0,
  };

  tickets.forEach((ticket) => {
    const priority = ticket.priority || 'none';
    counts[priority] = (counts[priority] || 0) + 1;
  });

  return counts;
}

/**
 * Group tickets by assigned admin
 */
export function groupTicketsByAssignee(tickets: Ticket[]): Record<string, Ticket[]> {
  const grouped: Record<string, Ticket[]> = {
    unassigned: [],
  };

  tickets.forEach((ticket) => {
    const assignee = ticket.assigned_to || 'unassigned';
    if (!grouped[assignee]) {
      grouped[assignee] = [];
    }
    grouped[assignee].push(ticket);
  });

  return grouped;
}

/**
 * Count tickets by assignee
 */
export function countTicketsByAssignee(tickets: Ticket[]): Record<string, number> {
  const counts: Record<string, number> = {
    unassigned: 0,
  };

  tickets.forEach((ticket) => {
    const assignee = ticket.assigned_to || 'unassigned';
    counts[assignee] = (counts[assignee] || 0) + 1;
  });

  return counts;
}

/**
 * Group tickets by tag
 */
export function groupTicketsByTag(tickets: Ticket[]): Record<string, Ticket[]> {
  const grouped: Record<string, Ticket[]> = {
    untagged: [],
  };

  tickets.forEach((ticket) => {
    if (!ticket.tags || ticket.tags.length === 0) {
      grouped.untagged.push(ticket);
    } else {
      ticket.tags.forEach((tag) => {
        if (!grouped[tag.id]) {
          grouped[tag.id] = [];
        }
        grouped[tag.id].push(ticket);
      });
    }
  });

  return grouped;
}

/**
 * Count tickets by tag
 */
export function countTicketsByTag(tickets: Ticket[]): Record<string, number> {
  const counts: Record<string, number> = {
    untagged: 0,
  };

  tickets.forEach((ticket) => {
    if (!ticket.tags || ticket.tags.length === 0) {
      counts.untagged++;
    } else {
      ticket.tags.forEach((tag) => {
        counts[tag.id] = (counts[tag.id] || 0) + 1;
      });
    }
  });

  return counts;
}

/**
 * Group tickets by date range (today, yesterday, this week, this month, older)
 */
export function groupTicketsByDateRange(tickets: Ticket[]): Record<string, Ticket[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const thisWeek = new Date(today);
  thisWeek.setDate(thisWeek.getDate() - 7);
  const thisMonth = new Date(today);
  thisMonth.setDate(thisMonth.getDate() - 30);

  const grouped: Record<string, Ticket[]> = {
    today: [],
    yesterday: [],
    'this week': [],
    'this month': [],
    older: [],
  };

  tickets.forEach((ticket) => {
    const ticketDate = new Date(ticket.created_at);

    if (ticketDate >= today) {
      grouped.today.push(ticket);
    } else if (ticketDate >= yesterday) {
      grouped.yesterday.push(ticket);
    } else if (ticketDate >= thisWeek) {
      grouped['this week'].push(ticket);
    } else if (ticketDate >= thisMonth) {
      grouped['this month'].push(ticket);
    } else {
      grouped.older.push(ticket);
    }
  });

  return grouped;
}

/**
 * Get tickets with unread messages
 */
export function getTicketsWithUnreadMessages(tickets: Ticket[]): Ticket[] {
  return tickets.filter((ticket) => {
    return ticket.ticket_responses.some((response) => !response.is_read && !response.is_admin);
  });
}

/**
 * Count unread messages per ticket
 */
export function countUnreadMessagesPerTicket(ticket: Ticket): number {
  if (!ticket.ticket_responses) {
    return 0;
  }

  return ticket.ticket_responses.filter(
    (response) => !response.is_read && !response.is_admin
  ).length;
}

/**
 * Get total unread message count across all tickets
 */
export function getTotalUnreadCount(tickets: Ticket[]): number {
  return tickets.reduce((total, ticket) => {
    return total + countUnreadMessagesPerTicket(ticket);
  }, 0);
}
