/**
 * Pure helper functions for ticket display and formatting
 * These functions have no side effects and can be easily tested
 */

import React from 'react';
import type { Ticket, TicketResponse, Avatar } from '../types';

/**
 * Check if a ticket is waiting for an admin response
 */
export function isWaitingForResponse(ticket: Ticket): boolean {
  if (ticket.status === 'closed') return false;
  if (ticket.ticket_responses.length === 0) return true;
  const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
  return !latestResponse.is_admin;
}

/**
 * Get count of unread customer messages in a ticket
 */
export function getUnreadCount(ticket: Ticket): number {
  return ticket.ticket_responses.filter(r => !r.is_admin && !r.is_read).length;
}

/**
 * Get CSS classes for priority badge
 */
export function getPriorityBadgeClass(priority: string | undefined | null): string {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'low':
      return 'bg-green-100 text-green-700 border-green-200';
    default:
      return 'bg-gray-100 text-gray-500 border-gray-200';
  }
}

/**
 * Get display label for priority
 */
export function getPriorityLabel(priority: string | undefined | null): string {
  if (!priority) return 'Low';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Get CSS classes for status badge
 */
export function getStatusBadgeClass(status: string): string {
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
}

/**
 * Get initials from a name
 */
export function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Split text into parts for highlighting search terms
 * Returns array of text parts and whether each should be highlighted
 */
export function getHighlightedParts(
  text: string | undefined | null,
  query: string
): Array<{ text: string; highlight: boolean }> {
  if (!text || !query) {
    return text ? [{ text, highlight: false }] : [];
  }

  const escapedQuery = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return parts.map((part) => ({
    text: part,
    highlight: part.toLowerCase() === query.toLowerCase(),
  }));
}

/**
 * Format a date relative to now (e.g., "2 hours ago", "Yesterday")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return then.toLocaleDateString();
}

/**
 * Get the latest response from a ticket
 */
export function getLatestResponse(ticket: Ticket): TicketResponse | null {
  if (ticket.ticket_responses.length === 0) return null;
  return ticket.ticket_responses[ticket.ticket_responses.length - 1];
}

/**
 * Check if a ticket has any unread messages
 */
export function hasUnreadMessages(ticket: Ticket): boolean {
  return getUnreadCount(ticket) > 0;
}

/**
 * Get a truncated preview of the latest message
 */
export function getMessagePreview(ticket: Ticket, maxLength: number = 100): string {
  const latestResponse = getLatestResponse(ticket);
  const text = latestResponse ? latestResponse.message : ticket.message;
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format a date as full locale string (date + time)
 */
export function formatFullDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString();
}

/**
 * Format a date as time only (HH:MM)
 */
export function formatTimeOnly(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get current timestamp as ISO string
 */
export function getCurrentISOString(): string {
  return new Date().toISOString();
}

/**
 * Format a date for internal notes display
 */
export function formatNoteDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Get avatar from response
 */
export function getAvatarForResponse(
  response: TicketResponse,
  avatars: Avatar[]
): Avatar | null {
  if (!response.is_admin) return null;
  return avatars.find((a) => a.id === response.avatar_id) || avatars[0];
}

/**
 * Get avatar classes based on admin status
 */
export function getAvatarClasses(isAdmin: boolean): string {
  return isAdmin 
    ? 'bg-blue-600 text-white' 
    : 'bg-slate-400 text-white';
}

/**
 * Get container classes based on widget size
 * Updated with glass morphism and dark mode support matching MeetingsModals
 */
export function getContainerClasses(size: 'initial' | 'half' | 'fullscreen'): string {
  const baseClasses = 'fixed bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl border border-white/20 shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden';
  
  switch (size) {
    case 'initial':
      return `${baseClasses} bottom-8 right-4 w-[400px] h-[750px] rounded-2xl`;
    case 'half':
      return `${baseClasses} bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-screen md:h-5/6 md:bottom-4 md:right-4 md:rounded-2xl`;
    case 'fullscreen':
      return `${baseClasses} inset-0 w-full h-full rounded-2xl md:rounded-3xl`;
    default:
      return baseClasses;
  }
}

/**
 * Get text color class from badge class (for inline text display)
 */
export function getStatusTextClass(status: string): string {
  return getStatusBadgeClass(status)
    .replace('bg-', 'text-')
    .replace('text-white', 'text-blue-700');
}

/**
 * Get priority text color class from badge class
 */
export function getPriorityTextClass(priority: string | undefined | null): string {
  return getPriorityBadgeClass(priority).replace('bg-', 'text-');
}

/**
 * Get display name for a person (with fallback)
 */
export function getDisplayName(fullName: string | null, fallback: string = 'Anonymous'): string {
  return fullName || fallback;
}

/**
 * Get display name for an avatar
 */
export function getAvatarDisplayName(avatar: Avatar | null): string {
  return avatar?.full_name || avatar?.title || 'Admin';
}

/**
 * Highlight search text in a string (React component)
 */
export function highlightText(text: string | undefined | null, query: string): React.ReactElement {
  const parts = getHighlightedParts(text, query);
  if (parts.length === 0) return <>{text || ''}</>;

  return (
    <>
      {parts.map((part, index) =>
        part.highlight ? (
          <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
            {part.text}
          </mark>
        ) : (
          part.text
        )
      )}
    </>
  );
}

/**
 * Render an avatar component
 */
export function renderAvatar(avatar: Avatar | null, displayName: string, isAdmin: boolean): React.ReactElement {
  const name = avatar?.full_name || avatar?.title || displayName;
  const initials = getInitials(name);

  if (avatar?.image) {
    return (
      <img
        src={avatar.image}
        alt={name}
        className="w-5 h-5 rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${getAvatarClasses(isAdmin)}`}>
      {initials}
    </div>
  );
}
