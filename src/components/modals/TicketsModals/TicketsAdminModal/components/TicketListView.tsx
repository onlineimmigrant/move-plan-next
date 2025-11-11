/**
 * TicketListView Component
 * 
 * Displays the ticket list with active filters, search statistics, and filter pills.
 * Shows when no ticket is selected in the admin modal.
 */

import React from 'react';
import { X, User } from 'lucide-react';
import { Ticket, TicketTag, AdminUser } from '../types';
import { TicketList } from './TicketList';
import { getPriorityLabel } from '../utils/ticketHelpers';

interface TicketListViewProps {
  // Ticket data
  tickets: Ticket[];
  groupedTickets: Record<string, Ticket[]>;
  activeTab: string;
  
  // Filter states
  searchQuery: string;
  assignmentFilter: 'all' | 'my' | 'unassigned';
  priorityFilter: 'all' | 'high' | 'medium' | 'low';
  selectedTagFilters: string[];
  showAdvancedFilters: boolean;
  dateRangeStart: string;
  dateRangeEnd: string;
  multiSelectStatuses: string[];
  multiSelectPriorities: string[];
  multiSelectTags: string[];
  multiSelectAssignees: string[];
  filterLogic: 'AND' | 'OR';
  
  // Data
  availableTags: TicketTag[];
  adminUsers: AdminUser[];
  ticketsWithPinnedNotes: Set<string>;
  ticketNoteCounts: Map<string, number>;
  
  // Loading states
  isLoadingTickets: boolean;
  hasMoreTickets: boolean;
  loadingMore: boolean;
  isAssigning: boolean;
  isChangingPriority: boolean;
  isChangingStatus: boolean;
  
  // Callbacks
  onTicketSelect: (ticket: Ticket) => void;
  onLoadMore: () => void;
  onClearAllFilters: () => void;
  onClearSearchQuery: () => void;
  onClearAssignmentFilter: () => void;
  onClearPriorityFilter: () => void;
  onClearTagFilter: () => void;
  onClearDateRangeStart: () => void;
  onClearDateRangeEnd: () => void;
  onRemoveStatus: (status: string) => void;
  onRemovePriority: (priority: string) => void;
  onRemoveTag: (tagId: string) => void;
  onRemoveAssignee: (assigneeId: string) => void;
  onAssignTicket: (ticketId: string, userId: string | null) => Promise<void>;
  onPriorityChange: (ticketId: string, priority: string | null) => Promise<void>;
  onStatusChange: (ticketId: string, status: string) => Promise<void>;
  
  // Utility functions
  getUnreadCount: (ticket: Ticket) => number;
  isWaitingForResponse: (ticket: Ticket) => boolean;
}

export const TicketListView: React.FC<TicketListViewProps> = ({
  tickets,
  groupedTickets,
  activeTab,
  searchQuery,
  assignmentFilter,
  priorityFilter,
  selectedTagFilters,
  showAdvancedFilters,
  dateRangeStart,
  dateRangeEnd,
  multiSelectStatuses,
  multiSelectPriorities,
  multiSelectTags,
  multiSelectAssignees,
  filterLogic,
  availableTags,
  adminUsers,
  ticketsWithPinnedNotes,
  ticketNoteCounts,
  isLoadingTickets,
  hasMoreTickets,
  loadingMore,
  isAssigning,
  isChangingPriority,
  isChangingStatus,
  onTicketSelect,
  onLoadMore,
  onClearAllFilters,
  onClearSearchQuery,
  onClearAssignmentFilter,
  onClearPriorityFilter,
  onClearTagFilter,
  onClearDateRangeStart,
  onClearDateRangeEnd,
  onRemoveStatus,
  onRemovePriority,
  onRemoveTag,
  onRemoveAssignee,
  onAssignTicket,
  onPriorityChange,
  onStatusChange,
  getUnreadCount,
  isWaitingForResponse,
}) => {
  const hasActiveFilters = searchQuery || assignmentFilter !== 'all' || priorityFilter !== 'all' || selectedTagFilters.length > 0 || showAdvancedFilters;

  return (
    <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20">
      {/* Active Filters & Search Statistics */}
      {hasActiveFilters && (
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 p-3 space-y-2">
          {/* Search Statistics */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 dark:text-slate-300">
                Showing <span className="font-semibold text-slate-900 dark:text-white">{groupedTickets[activeTab].length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{tickets.length}</span> tickets
              </span>
              {searchQuery && (
                <span className="text-slate-500 dark:text-slate-400">
                  • Searching in messages, responses, and tags
                </span>
              )}
            </div>
            <button
              onClick={onClearAllFilters}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
          
          {/* Active Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search: "{searchQuery}"
                <button
                  onClick={onClearSearchQuery}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {assignmentFilter !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                <User className="h-3 w-3" />
                {assignmentFilter === 'my' ? 'Assigned to me' : 'Unassigned'}
                <button
                  onClick={onClearAssignmentFilter}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {priorityFilter !== 'all' && (
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                priorityFilter === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                priorityFilter === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              }`}>
                Priority: {getPriorityLabel(priorityFilter)}
                <button
                  onClick={onClearPriorityFilter}
                  className={`rounded-full p-0.5 ${
                    priorityFilter === 'high' ? 'hover:bg-red-200 dark:hover:bg-red-800' :
                    priorityFilter === 'medium' ? 'hover:bg-yellow-200 dark:hover:bg-yellow-800' :
                    'hover:bg-green-200 dark:hover:bg-green-800'
                  }`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {selectedTagFilters.map(tagId => {
              const tag = availableTags.find(t => t.id === tagId);
              if (!tag) return null;
              return (
                <span 
                  key={tagId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}40`,
                    color: tag.color
                  }}
                >
                  Tag: {tag.name}
                  <button
                    onClick={() => onRemoveTag(tagId)}
                    className="rounded-full p-0.5"
                    style={{ backgroundColor: `${tag.color}20` }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              );
            })}
            
            {/* Advanced filter pills */}
            {showAdvancedFilters && (
              <>
                {dateRangeStart && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                    From: {new Date(dateRangeStart).toLocaleDateString()}
                    <button onClick={onClearDateRangeStart} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {dateRangeEnd && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium">
                    To: {new Date(dateRangeEnd).toLocaleDateString()}
                    <button onClick={onClearDateRangeEnd} className="hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                
                {multiSelectStatuses.map(status => (
                  <span key={status} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs font-medium">
                    Status: {status}
                    <button onClick={() => onRemoveStatus(status)} className="hover:bg-cyan-200 dark:hover:bg-cyan-800 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                
                {multiSelectPriorities.map(priority => (
                  <span key={priority} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                    'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  }`}>
                    Priority: {getPriorityLabel(priority)}
                    <button onClick={() => onRemovePriority(priority)} className={`rounded-full p-0.5 ${
                      priority === 'high' ? 'hover:bg-red-200 dark:hover:bg-red-800' :
                      priority === 'medium' ? 'hover:bg-yellow-200 dark:hover:bg-yellow-800' :
                      'hover:bg-green-200 dark:hover:bg-green-800'
                    }`}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                
                {multiSelectTags.map(tagId => {
                  const tag = availableTags.find(t => t.id === tagId);
                  return tag ? (
                    <span 
                      key={tagId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      style={{
                        backgroundColor: `${tag.color}15`,
                        borderColor: `${tag.color}40`,
                        color: tag.color
                      }}
                    >
                      Tag: {tag.name}
                      <button onClick={() => onRemoveTag(tagId)} className="rounded-full p-0.5" style={{ backgroundColor: `${tag.color}20` }}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
                
                {multiSelectAssignees.map(assigneeId => {
                  const user = assigneeId === 'unassigned' ? { id: 'unassigned', full_name: 'Unassigned', email: '' } : adminUsers.find(u => u.id === assigneeId);
                  return user ? (
                    <span key={assigneeId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium">
                      {assigneeId === 'unassigned' ? 'Unassigned' : (user.full_name || user.email)}
                      <button onClick={() => onRemoveAssignee(assigneeId)} className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : null;
                })}
                
                {filterLogic === 'OR' && (multiSelectStatuses.length > 0 || multiSelectPriorities.length > 0 || multiSelectTags.length > 0 || multiSelectAssignees.length > 0) && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    OR Logic (Any match)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      <TicketList
        tickets={groupedTickets[activeTab]}
        selectedTicketId={null}
        onTicketSelect={onTicketSelect}
        searchQuery={searchQuery}
        isLoading={isLoadingTickets}
        hasMore={hasMoreTickets}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        ticketsWithPinnedNotes={ticketsWithPinnedNotes}
        ticketNoteCounts={ticketNoteCounts}
        adminUsers={adminUsers}
        getUnreadCount={getUnreadCount}
        isWaitingForResponse={isWaitingForResponse}
        assignmentFilter={assignmentFilter}
        priorityFilter={priorityFilter}
        selectedTagFilters={selectedTagFilters}
        onAssignTicket={onAssignTicket}
        onPriorityChange={onPriorityChange}
        onStatusChange={onStatusChange}
        isAssigning={isAssigning}
        isChangingPriority={isChangingPriority}
        isChangingStatus={isChangingStatus}
      />
    </div>
  );
};
