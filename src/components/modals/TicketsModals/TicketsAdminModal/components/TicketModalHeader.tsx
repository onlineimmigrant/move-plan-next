import React from 'react';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { Popover, Transition } from '@headlessui/react';
import { X, BarChart3, Zap } from 'lucide-react';
import Tooltip from '@/components/Tooltip';
import { Ticket, Avatar, TicketTag } from '../types';
import {
  formatFullDate,
  getStatusTextClass,
  getPriorityTextClass,
  getPriorityLabel,
  getDisplayName,
  getAvatarDisplayName,
  getInitials,
  getAvatarClasses,
} from '../utils/ticketHelpers';

type WidgetSize = 'initial' | 'half' | 'fullscreen';

interface TicketModalHeaderProps {
  selectedTicket: Ticket | null;
  size: WidgetSize;
  searchQuery: string;
  avatars: Avatar[];
  availableTags: TicketTag[];
  totalUnreadCount?: number;
  onClose: () => void;
  onBack: () => void;
  onToggleSize: () => void;
  onShowAnalytics: () => void;
  onShowAssignmentRules: () => void;
  onRemoveTag: (ticketId: string, tagId: string) => void;
  onAssignTag: (ticketId: string, tagId: string) => void;
  onCopyToClipboard: (text: string, label: string) => void;
  highlightText: (text: string | undefined | null, query: string) => React.ReactNode;
}

export default function TicketModalHeader({
  selectedTicket,
  size,
  searchQuery,
  avatars,
  availableTags,
  totalUnreadCount = 0,
  onClose,
  onBack,
  onToggleSize,
  onShowAnalytics,
  onShowAssignmentRules,
  onRemoveTag,
  onAssignTag,
  onCopyToClipboard,
  highlightText,
}: TicketModalHeaderProps) {
  // Helper function to render avatar
  const renderAvatar = (avatar: Avatar | null, displayName: string, isAdmin: boolean) => {
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
  };

  return (
    <div 
      className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/20 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 rounded-t-2xl shadow-sm modal-drag-handle"
      role="banner"
      aria-label="Modal header"
    >
      {/* Left Actions */}
      <div className="flex items-center gap-2" role="group" aria-label="Navigation controls">
        {selectedTicket && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            aria-label="Back to ticket list"
            title="Back to ticket list"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <button
          onClick={onToggleSize}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          aria-label={size === 'fullscreen' ? 'Exit fullscreen' : size === 'half' ? 'Enter fullscreen' : 'Expand to half screen'}
          title={size === 'fullscreen' ? 'Exit fullscreen' : size === 'half' ? 'Enter fullscreen' : 'Expand to half screen'}
        >
          {size === 'fullscreen' ? (
            <ArrowsPointingInIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={onShowAnalytics}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
          aria-label="View analytics dashboard"
          title="View Analytics"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onShowAssignmentRules}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          aria-label="Manage assignment rules and automation"
          title="Assignment Rules & Automation"
        >
          <Zap className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      
      {/* Center Title - Show "Ticket" with tooltip and admin avatars */}
      <div className="flex-1 flex items-center justify-center mx-4 gap-3" role="region" aria-label="Ticket information">
        {selectedTicket ? (
          <>
            <Popover className="relative">
              <Popover.Button className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded px-2 py-1">
                Ticket
              </Popover.Button>
              <Transition
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 p-3 z-[10002]">
                  <div className="space-y-2">
                    {/* Ticket ID */}
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 dark:hover:bg-gray-700/50 group">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Ticket ID:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-700 dark:text-slate-200">{selectedTicket.id}</span>
                        <button
                          onClick={() => onCopyToClipboard(selectedTicket.id, 'Ticket ID copied!')}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-gray-600 rounded transition-opacity"
                          title="Copy ID"
                        >
                          <svg className="h-3 w-3 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Subject */}
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                      <span className="text-xs text-slate-500">Subject:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700 truncate max-w-[180px]">
                          {searchQuery ? highlightText(selectedTicket.subject, searchQuery) : selectedTicket.subject}
                        </span>
                        <button
                          onClick={() => onCopyToClipboard(selectedTicket.subject, 'Subject copied!')}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                          title="Copy subject"
                        >
                          <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                      <span className="text-xs text-slate-500">Status:</span>
                      <span className={`text-xs font-medium ${getStatusTextClass(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    
                    {/* Priority */}
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                      <span className="text-xs text-slate-500">Priority:</span>
                      <span className={`text-xs font-medium ${getPriorityTextClass(selectedTicket.priority)}`}>
                        {getPriorityLabel(selectedTicket.priority)}
                      </span>
                    </div>
                    
                    {/* Tags */}
                    <div className="py-1.5 px-2 rounded hover:bg-slate-50 group">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs text-slate-500 mt-1">Tags:</span>
                        <div className="flex-1 flex flex-wrap gap-1 justify-end">
                          {selectedTicket.tags && selectedTicket.tags.length > 0 ? (
                            selectedTicket.tags.map(tag => (
                              <span 
                                key={tag.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer hover:opacity-80"
                                style={{
                                  backgroundColor: `${tag.color}15`,
                                  borderColor: `${tag.color}40`,
                                  color: tag.color
                                }}
                                onClick={() => onRemoveTag(selectedTicket.id, tag.id)}
                                title="Click to remove tag"
                              >
                                {searchQuery ? highlightText(tag.name, searchQuery) : tag.name}
                                <X className="h-3 w-3" />
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">No tags</span>
                          )}
                          {/* Add Tag Dropdown */}
                          {availableTags.length > 0 && (
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  onAssignTag(selectedTicket.id, e.target.value);
                                  e.target.value = ''; // Reset selection
                                }
                              }}
                              className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                              value=""
                            >
                              <option value="">+ Add Tag</option>
                              {availableTags
                                .filter(tag => !selectedTicket.tags?.some(t => t.id === tag.id))
                                .map(tag => (
                                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                                ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Created */}
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                      <span className="text-xs text-slate-500">Created:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700">{formatFullDate(selectedTicket.created_at)}</span>
                        <button
                          onClick={() => onCopyToClipboard(formatFullDate(selectedTicket.created_at), 'Date copied!')}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                          title="Copy date"
                        >
                          <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    {/* Customer */}
                    <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                      <span className="text-xs text-slate-500">Customer:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-700">{getDisplayName(selectedTicket.full_name || null)}</span>
                        {selectedTicket.full_name && (
                          <button
                            onClick={() => onCopyToClipboard(getDisplayName(selectedTicket.full_name || null, ''), 'Name copied!')}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                            title="Copy name"
                          >
                            <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Email */}
                    {selectedTicket.email && (
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                        <span className="text-xs text-slate-500">Email:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-700 truncate max-w-[180px]">{selectedTicket.email}</span>
                          <button
                            onClick={() => onCopyToClipboard(selectedTicket.email, 'Email copied!')}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                            title="Copy email"
                          >
                            <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </Popover.Panel>
              </Transition>
            </Popover>
            
            {/* Show stacked admin avatars */}
            <div className="flex items-center -space-x-2">
              {(() => {
                // Get unique admin avatars from responses
                const adminAvatars = selectedTicket.ticket_responses
                  .filter(r => r.is_admin && r.avatar_id)
                  .map(r => {
                    const avatar = avatars.find(a => a.id === r.avatar_id);
                    return avatar;
                  })
                  .filter((avatar): avatar is Avatar => 
                    avatar !== undefined
                  )
                  .filter((avatar, index, self) => 
                    self.findIndex(a => a.id === avatar.id) === index
                  )
                  .reverse(); // Most recent first
                
                return adminAvatars.length > 0 ? (
                  adminAvatars.map((avatar) => (
                    <Tooltip key={avatar.id} content={getAvatarDisplayName(avatar)}>
                      <div className="relative ring-2 ring-white rounded-full">
                        {renderAvatar(avatar, getAvatarDisplayName(avatar), true)}
                      </div>
                    </Tooltip>
                  ))
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">?</span>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200" id="modal-title">Support Tickets</h2>
            {totalUnreadCount > 0 && (
              <span 
                className="flex items-center justify-center min-w-[22px] h-5 px-2 text-xs font-semibold text-white bg-blue-500 rounded-full"
                aria-label={`${totalUnreadCount} total unread message${totalUnreadCount === 1 ? '' : 's'}`}
              >
                {totalUnreadCount}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Right Actions - Close Button */}
      <button
        onClick={onClose}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
        aria-label="Close modal"
        title="Close (Esc)"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
