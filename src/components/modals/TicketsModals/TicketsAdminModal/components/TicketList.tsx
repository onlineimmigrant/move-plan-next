/**
 * TicketList Component
 * Displays a list of tickets with loading states and empty states
 */

import React from 'react';
import { TicketListItem } from './TicketListItem';
import type { Ticket, AdminUser } from '../types';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId?: string | null;
  isLoading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  adminUsers: AdminUser[];
  searchQuery?: string;
  assignmentFilter?: string;
  priorityFilter?: string;
  tagFilter?: string;
  ticketsWithPinnedNotes: Set<string>;
  ticketNoteCounts: Map<string, number>;
  getUnreadCount: (ticket: Ticket) => number;
  isWaitingForResponse: (ticket: Ticket) => boolean;
  onTicketSelect: (ticket: Ticket) => void;
  onLoadMore: () => void;
  onAssignTicket?: (ticketId: string, adminId: string | null) => Promise<void>;
  onPriorityChange?: (ticketId: string, priority: string | null) => Promise<void>;
  onStatusChange?: (ticketId: string, status: string) => Promise<void>;
  isAssigning?: boolean;
  isChangingPriority?: boolean;
  isChangingStatus?: boolean;
}

export function TicketList({
  tickets,
  selectedTicketId,
  isLoading,
  hasMore,
  loadingMore,
  adminUsers,
  searchQuery = '',
  assignmentFilter = 'all',
  priorityFilter = 'all',
  tagFilter = 'all',
  ticketsWithPinnedNotes,
  ticketNoteCounts,
  getUnreadCount,
  isWaitingForResponse,
  onTicketSelect,
  onLoadMore,
  onAssignTicket,
  onPriorityChange,
  onStatusChange,
  isAssigning = false,
  isChangingPriority = false,
  isChangingStatus = false,
}: TicketListProps) {
  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                <div className="h-5 bg-slate-200 rounded-full w-16"></div>
              </div>
            </div>
            <div className="h-3 bg-slate-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (tickets.length === 0) {
    const hasActiveFilters = searchQuery || assignmentFilter !== 'all' || priorityFilter !== 'all' || tagFilter !== 'all';
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
        <svg 
          className="h-16 w-16 mb-4 text-slate-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <p className="text-lg font-medium mb-1">No tickets found</p>
        {hasActiveFilters && (
          <p className="text-sm text-slate-500">Try adjusting your filters to see more results</p>
        )}
      </div>
    );
  }

  // Ticket list
  return (
    <div className="p-4 space-y-2">
      {tickets.map((ticket) => (
        <TicketListItem
          key={ticket.id}
          ticket={ticket}
          isSelected={ticket.id === selectedTicketId}
          unreadCount={getUnreadCount(ticket)}
          hasPinnedNotes={ticketsWithPinnedNotes.has(ticket.id)}
          noteCount={ticketNoteCounts.get(ticket.id) || 0}
          isWaitingForResponse={isWaitingForResponse(ticket)}
          adminUsers={adminUsers}
          searchQuery={searchQuery}
          onClick={onTicketSelect}
          onAssignTicket={onAssignTicket}
          onPriorityChange={onPriorityChange}
          onStatusChange={onStatusChange}
          isAssigning={isAssigning}
          isChangingPriority={isChangingPriority}
          isChangingStatus={isChangingStatus}
        />
      ))}
      
      {/* Load More Button */}
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full p-3 mt-4 text-sm text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingMore ? 'Loading...' : 'Load More Tickets'}
        </button>
      )}
    </div>
  );
}
