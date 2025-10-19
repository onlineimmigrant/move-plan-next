import React from 'react';
import type { Ticket } from '../../shared/types';
import { isWaitingForResponse } from '../utils';

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
    <div className="flex-1 overflow-y-auto bg-slate-50">
      {isLoadingTickets ? (
        <div className="p-4 space-y-2">
          {[1, 2, 3].map((n) => (
            <div key={n} className="w-full p-4 bg-white border border-slate-200 rounded-xl animate-pulse">
              <div className="flex items-start justify-between mb-2">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-5 bg-slate-200 rounded-full w-16"></div>
              </div>
              <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="flex items-center justify-between mt-3">
                <div className="h-3 bg-slate-200 rounded w-24"></div>
                <div className="h-3 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-400">
          <p>No {activeTab} tickets</p>
        </div>
      ) : (
        <div className="p-4 space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onTicketSelect(ticket)}
              className="w-full p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-slate-900 text-sm">{ticket.subject}</h3>
                {isWaitingForResponse(ticket) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {new Date(ticket.created_at).toLocaleDateString()}
              </p>
            </button>
          ))}
          
          {/* Load More Button */}
          {hasMoreTickets[activeTab] && (
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="w-full p-3 mt-4 text-sm text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingMore ? 'Loading...' : 'Load More Tickets'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
