import React from 'react';
import type { Ticket } from '../../shared/types';
import { isWaitingForResponse } from '../utils';

/**
 * Get count of unread admin messages for customer
 * (Messages from admin that customer hasn't read yet)
 */
function getUnreadCount(ticket: Ticket): number {
  return ticket.ticket_responses.filter(r => r.is_admin && !r.is_read).length;
}

interface TicketListProps {
  tickets: Ticket[];
  activeTab: string;
  isLoadingTickets: boolean;
  loadingMore: boolean;
  hasMoreTickets: Record<string, boolean>;
  onTicketSelect: (ticket: Ticket) => void;
  onLoadMore: () => void;
}

export default function TicketList({
  tickets,
  activeTab,
  isLoadingTickets,
  loadingMore,
  hasMoreTickets,
  onTicketSelect,
  onLoadMore,
}: TicketListProps) {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
      {isLoadingTickets ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="w-full p-4 backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 rounded-xl animate-pulse">
              <div className="flex items-start justify-between mb-2">
                <div className="h-4 bg-slate-200 dark:bg-gray-700 rounded w-2/3"></div>
                <div className="h-5 bg-slate-200 dark:bg-gray-700 rounded-full w-16"></div>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-full mb-1"></div>
              <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="flex items-center justify-between mt-3">
                <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-24"></div>
                <div className="h-3 bg-slate-200 dark:bg-gray-700 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
          <p>No {activeTab} tickets</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {tickets.map((ticket) => {
            const unreadCount = getUnreadCount(ticket);
            const hasUnread = unreadCount > 0;
            
            // Get last message for preview with prefix and time
            let lastMessage = '';
            let messagePrefix = '';
            let messageTime = '';
            
            if (ticket.ticket_responses && ticket.ticket_responses.length > 0) {
              const lastResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
              lastMessage = lastResponse.message;
              messagePrefix = lastResponse.is_admin ? '' : 'You: '; // Customer sees "You:" for their own messages
              
              // Format time
              const msgDate = new Date(lastResponse.created_at);
              const now = new Date();
              const isToday = msgDate.toDateString() === now.toDateString();
              
              if (isToday) {
                messageTime = msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              } else {
                messageTime = msgDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
                              msgDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              }
            } else {
              lastMessage = ticket.message;
              messageTime = new Date(ticket.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            }
            
            return (
              <button
                key={ticket.id}
                onClick={() => onTicketSelect(ticket)}
                className="w-full p-4 text-left backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] hover:shadow-md"
                style={{
                  '--hover-border': 'color-mix(in srgb, var(--color-primary-base) 40%, transparent)',
                  '--hover-bg': 'color-mix(in srgb, var(--color-primary-base) 5%, rgb(255 255 255 / 0.6))',
                } as React.CSSProperties}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--hover-border)';
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 flex items-center gap-2">
                    <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{ticket.subject}</h3>
                    {hasUnread && (
                      <span 
                        className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold text-white bg-red-500 dark:bg-red-600 rounded-full shadow-sm"
                        aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
                      >
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {isWaitingForResponse(ticket) && (
                    <span className="w-2 h-2 bg-red-500 dark:bg-red-600 rounded-full animate-pulse shadow-sm"></span>
                  )}
                </div>
                {lastMessage && (
                  <div className="flex items-center gap-1 mb-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex-1">
                      {messagePrefix && <span className="font-medium">{messagePrefix}</span>}
                      {lastMessage}
                    </p>
                    {messageTime && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                        {messageTime}
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </button>
            );
          })}
          
          {/* Load More Button */}
          {hasMoreTickets[activeTab] && (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="w-full p-3 mt-4 text-sm font-medium backdrop-blur-md bg-white/50 dark:bg-gray-800/50 border border-white/30 dark:border-gray-700/30 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              style={{
                color: 'var(--color-primary-base)',
                '--hover-border': 'color-mix(in srgb, var(--color-primary-base) 40%, transparent)',
                '--hover-bg': 'color-mix(in srgb, var(--color-primary-base) 8%, rgb(255 255 255 / 0.6))',
              } as React.CSSProperties}
              onMouseEnter={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.borderColor = 'var(--hover-border)';
                  e.currentTarget.style.backgroundColor = 'var(--hover-bg)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loadingMore) {
                  e.currentTarget.style.borderColor = '';
                  e.currentTarget.style.backgroundColor = '';
                }
              }}
            >
              {loadingMore ? 'Loading...' : 'Load More Tickets'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
