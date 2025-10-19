/**
 * Customer Modal Ticket Helper Functions
 * Utility functions for ticket operations in the customer modal
 */

import type { Ticket, TicketResponse, Avatar } from '../../shared/types';

/**
 * Check if a ticket is waiting for customer response
 * Returns true if the latest response is from an admin and ticket is not closed
 */
export const isWaitingForResponse = (ticket: Ticket): boolean => {
  if (ticket.status === 'closed') return false;
  if (ticket.ticket_responses.length === 0) return false;
  const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
  return latestResponse.is_admin;
};

/**
 * Get the CSS class for a ticket status badge
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case 'open':
      return 'bg-green-100 text-green-800';
    case 'in progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'closed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get the avatar object for a response
 * Returns the avatar used for an admin response, or null for customer responses
 */
export const getAvatarForResponse = (
  response: TicketResponse,
  avatars: Avatar[]
): Avatar | null => {
  if (!response.is_admin) return null;
  return avatars.find((a) => a.id === response.avatar_id) || avatars[0];
};

/**
 * Group tickets by their status
 */
export const groupTicketsByStatus = (
  tickets: Ticket[],
  statuses: string[]
): Record<string, Ticket[]> => {
  return statuses.reduce(
    (acc, status) => ({
      ...acc,
      [status]: tickets.filter((ticket) => ticket.status === status),
    }),
    {} as Record<string, Ticket[]>
  );
};
