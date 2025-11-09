/**
 * TicketListItem Component
 * Displays a single ticket in the sidebar list
 * Memoized for performance optimization
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { Pin, User, ChevronDown, X } from 'lucide-react';
import type { Ticket, AdminUser } from '../types';

interface TicketListItemProps {
  ticket: Ticket;
  isSelected?: boolean;
  unreadCount: number;
  hasPinnedNotes: boolean;
  noteCount: number;
  isWaitingForResponse: boolean;
  adminUsers: AdminUser[];
  searchQuery?: string;
  onClick: (ticket: Ticket) => void;
  onAssignTicket?: (ticketId: string, adminId: string | null) => Promise<void>;
  onPriorityChange?: (ticketId: string, priority: string | null) => Promise<void>;
  onStatusChange?: (ticketId: string, status: string) => Promise<void>;
  isAssigning?: boolean;
  isChangingPriority?: boolean;
  isChangingStatus?: boolean;
}

const TicketListItemComponent = ({
  ticket,
  isSelected = false,
  unreadCount,
  hasPinnedNotes,
  noteCount,
  isWaitingForResponse,
  adminUsers,
  searchQuery = '',
  onClick,
  onAssignTicket,
  onPriorityChange,
  onStatusChange,
  isAssigning = false,
  isChangingPriority = false,
  isChangingStatus = false,
}: TicketListItemProps) => {
  // Dropdown states
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Refs for click-outside detection
  const assignDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(event.target as Node)) {
        setShowAssignDropdown(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setShowPriorityDropdown(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setShowStatusDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const statuses = ['open', 'in progress', 'closed'];
  const priorities = [
    { value: 'high', label: 'High', color: 'text-orange-700' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-700' },
    { value: 'low', label: 'Low', color: 'text-green-700' },
  ];

  /**
   * Highlight matching text in search results
   */
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 dark:bg-yellow-700 text-slate-900 dark:text-white px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  /**
   * Get priority badge styling
   */
  const getPriorityBadgeClass = (priority: string | null | undefined) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-300 text-red-700';
      case 'high':
        return 'bg-orange-50 border-orange-300 text-orange-700';
      case 'medium':
        return 'bg-yellow-50 border-yellow-300 text-yellow-700';
      case 'low':
        return 'bg-green-50 border-green-300 text-green-700';
      default:
        return 'bg-slate-50 border-slate-300 text-slate-700';
    }
  };

  /**
   * Get priority display label
   */
  const getPriorityLabel = (priority: string | null | undefined) => {
    if (!priority) return '';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  /**
   * Get assigned admin name
   */
  const getAssignedAdminName = () => {
    if (!ticket.assigned_to) return null;
    const admin = adminUsers.find(u => u.id === ticket.assigned_to);
    return admin?.full_name || admin?.email || 'Assigned';
  };

  return (
    <div
      role="listitem"
      onClick={() => onClick(ticket)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(ticket);
        }
      }}
      tabIndex={0}
      aria-label={`Ticket ${ticket.subject}, status ${ticket.status}, priority ${ticket.priority || 'none'}, ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
      className={`w-full p-4 text-left bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border rounded-xl hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 ${
        unreadCount > 0 
          ? 'border-blue-400 dark:border-blue-500 bg-blue-50/90 dark:bg-blue-900/30' 
          : isSelected 
          ? 'border-blue-500 dark:border-blue-400 shadow-md' 
          : 'border-slate-200 dark:border-gray-700'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* Title with unread badge and pin indicator */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
              {searchQuery ? highlightText(ticket.subject, searchQuery) : ticket.subject}
            </h3>
            
            {/* Unread count badge */}
            {unreadCount > 0 && (
              <span 
                className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 dark:bg-blue-600 text-white text-[10px] font-bold rounded-full"
                aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`}
              >
                {unreadCount}
              </span>
            )}
            
            {/* Pinned notes indicator */}
            {hasPinnedNotes && (
              <span title="Has pinned notes" aria-label="Has pinned notes">
                <Pin className="h-3 w-3 text-amber-600 fill-amber-600 flex-shrink-0" aria-hidden="true" />
              </span>
            )}
          </div>
          
          {/* Customer name */}
          <p className="text-xs text-slate-600 mt-1">
            {searchQuery 
              ? highlightText(ticket.full_name || 'Anonymous', searchQuery) 
              : (ticket.full_name || 'Anonymous')
            }
          </p>
          
          {/* Assignment, Priority, Tags, and Notes badges */}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {/* Assigned admin - Now clickable with dropdown */}
            <div className="relative" ref={assignDropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAssignTicket) {
                    setShowAssignDropdown(!showAssignDropdown);
                  }
                }}
                disabled={isAssigning || !onAssignTicket}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                  ticket.assigned_to
                    ? 'bg-purple-50 border-purple-300 text-purple-700 hover:bg-purple-100'
                    : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100'
                } ${onAssignTicket ? 'cursor-pointer' : 'cursor-default'} ${isAssigning ? 'opacity-50' : ''}`}
                title={onAssignTicket ? 'Click to change assignment' : undefined}
              >
                <User className="h-3 w-3" />
                <span>{ticket.assigned_to ? getAssignedAdminName() : 'Unassigned'}</span>
                {onAssignTicket && <ChevronDown className="h-3 w-3" />}
              </button>

              {/* Assignment Dropdown */}
              {showAssignDropdown && onAssignTicket && (
                <div className="absolute z-50 mt-1 w-48 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-1">
                    {/* Unassign option */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await onAssignTicket(ticket.id, null);
                        setShowAssignDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      <span>Unassigned</span>
                    </button>
                    
                    <div className="border-t border-slate-200 dark:border-gray-700 my-1"></div>
                    
                    {/* Admin users */}
                    {adminUsers.map((admin) => (
                      <button
                        key={admin.id}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onAssignTicket(ticket.id, admin.id);
                          setShowAssignDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 ${
                          ticket.assigned_to === admin.id ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <User className="h-4 w-4" />
                        <span>{admin.full_name || admin.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Priority badge - Now clickable with dropdown, only shows if priority is set */}
            {ticket.priority && (
              <div className="relative" ref={priorityDropdownRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onPriorityChange) {
                      setShowPriorityDropdown(!showPriorityDropdown);
                    }
                  }}
                  disabled={isChangingPriority || !onPriorityChange}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${getPriorityBadgeClass(ticket.priority)} ${
                    onPriorityChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                  } ${isChangingPriority ? 'opacity-50' : ''}`}
                  title={onPriorityChange ? 'Click to change priority' : undefined}
                >
                  <span className="flex items-center gap-1">
                    {getPriorityLabel(ticket.priority)}
                    {onPriorityChange && <ChevronDown className="h-3 w-3" />}
                  </span>
                </button>

                {/* Priority Dropdown */}
              {showPriorityDropdown && onPriorityChange && (
                <div className="absolute z-50 mt-1 w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg">
                  <div className="p-1">
                    {/* Priority options */}
                    {priorities.map((priority) => (
                      <button
                        key={priority.value}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onPriorityChange(ticket.id, priority.value);
                          setShowPriorityDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded ${
                          ticket.priority === priority.value ? `${priority.color} dark:text-${priority.value === 'high' ? 'red' : priority.value === 'medium' ? 'yellow' : 'green'}-300 font-medium bg-slate-50 dark:bg-gray-700/50` : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {priority.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              </div>
            )}
            
            {/* Status badge - Now clickable with dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onStatusChange) {
                    setShowStatusDropdown(!showStatusDropdown);
                  }
                }}
                disabled={isChangingStatus || !onStatusChange}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                  ticket.status === 'open' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                  ticket.status === 'in progress' ? 'bg-amber-50 border-amber-300 text-amber-700' :
                  ticket.status === 'closed' ? 'bg-green-50 border-green-300 text-green-700' :
                  'bg-slate-50 border-slate-300 text-slate-700'
                } ${
                  onStatusChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default'
                } ${isChangingStatus ? 'opacity-50' : ''}`}
                title={onStatusChange ? 'Click to change status' : undefined}
              >
                <span className="flex items-center gap-1 capitalize">
                  {ticket.status || 'Open'}
                  {onStatusChange && <ChevronDown className="h-3 w-3" />}
                </span>
              </button>

              {/* Status Dropdown */}
              {showStatusDropdown && onStatusChange && (
                <div className="absolute z-50 mt-1 w-40 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-slate-200 dark:border-gray-700 rounded-lg shadow-lg">
                  <div className="p-1">
                    {statuses.map((status) => (
                      <button
                        key={status}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await onStatusChange(ticket.id, status);
                          setShowStatusDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-700 rounded capitalize ${
                          ticket.status === status ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' : 'text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Tags */}
            {ticket.tags && ticket.tags.length > 0 && (
              <>
                {ticket.tags.slice(0, 2).map(tag => (
                  <span 
                    key={tag.id}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium border"
                    style={{
                      backgroundColor: `${tag.color}15`,
                      borderColor: `${tag.color}40`,
                      color: tag.color
                    }}
                  >
                    {searchQuery ? highlightText(tag.name, searchQuery) : tag.name}
                  </span>
                ))}
                {ticket.tags.length > 2 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-gray-700 border border-slate-300 dark:border-gray-600 text-slate-600 dark:text-slate-300">
                    +{ticket.tags.length - 2}
                  </span>
                )}
              </>
            )}
            
            {/* Note count */}
            {noteCount > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-gray-700 border border-slate-200 dark:border-gray-600">
                <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">Notes</span>
                <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-slate-200 text-[9px] font-semibold rounded-full">
                  {noteCount}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Waiting for response indicator */}
        {isWaitingForResponse && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </div>
      
      {/* Created date */}
      <p className="text-xs text-slate-500">
        {new Date(ticket.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};

// Export memoized version with custom comparison
export const TicketListItem = memo(TicketListItemComponent, (prevProps, nextProps) => {
  // Only re-render if these specific props change
  return (
    prevProps.ticket.id === nextProps.ticket.id &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.unreadCount === nextProps.unreadCount &&
    prevProps.hasPinnedNotes === nextProps.hasPinnedNotes &&
    prevProps.noteCount === nextProps.noteCount &&
    prevProps.isWaitingForResponse === nextProps.isWaitingForResponse &&
    prevProps.isAssigning === nextProps.isAssigning &&
    prevProps.isChangingPriority === nextProps.isChangingPriority &&
    prevProps.isChangingStatus === nextProps.isChangingStatus &&
    prevProps.searchQuery === nextProps.searchQuery &&
    prevProps.ticket.status === nextProps.ticket.status &&
    prevProps.ticket.priority === nextProps.ticket.priority
  );
});
