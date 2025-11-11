import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { XMarkIcon, TicketIcon } from '@heroicons/react/24/outline';
import { Popover, Transition, Portal } from '@headlessui/react';
import { X, BarChart3, Zap } from 'lucide-react';
import Tooltip from '@/components/Tooltip';
import { Ticket, Avatar, TicketTag } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';
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

interface TicketModalHeaderProps {
  selectedTicket: Ticket | null;
  searchQuery: string;
  avatars: Avatar[];
  availableTags: TicketTag[];
  totalUnreadCount?: number;
  onClose: () => void;
  onBack: () => void;
  onShowAnalytics: () => void;
  onShowAssignmentRules: () => void;
  onRemoveTag: (ticketId: string, tagId: string) => void;
  onAssignTag: (ticketId: string, tagId: string) => void;
  onCopyToClipboard: (text: string, label: string) => void;
  highlightText: (text: string | undefined | null, query: string) => React.ReactNode;
}

export default function TicketModalHeader({
  selectedTicket,
  searchQuery,
  avatars,
  availableTags,
  totalUnreadCount = 0,
  onClose,
  onBack,
  onShowAnalytics,
  onShowAssignmentRules,
  onRemoveTag,
  onAssignTag,
  onCopyToClipboard,
  highlightText,
}: TicketModalHeaderProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const ticketButtonRef = useRef<HTMLButtonElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const panelMaxWidth = 360; // px ~ w-90
  const viewportMargin = 8; // px

  const computePanelPosition = useCallback(() => {
    if (typeof window === 'undefined' || !ticketButtonRef.current) return;
    const rect = ticketButtonRef.current.getBoundingClientRect();
    const isMobileView = window.innerWidth < 640;
    const modalEl = ticketButtonRef.current.closest('.ticket-admin-modal-root') as HTMLElement | null;
    const fallbackRect = new DOMRect(viewportMargin, 0, window.innerWidth - viewportMargin * 2, 0);
    const modalRect = modalEl ? modalEl.getBoundingClientRect() : fallbackRect;
    let width: number;
    let left: number;
    if (isMobileView) {
      // Constrain to modal width by querying nearest modal container
      const modalWidth = modalRect.width || (modalRect.right - modalRect.left);
      width = Math.max(0, modalWidth - viewportMargin * 2);
      left = modalRect.left + viewportMargin;
    } else {
      const buttonWidth = rect.width;
      const maxAllowedViewport = window.innerWidth - viewportMargin * 2;
      const maxAllowedModal = (modalRect.width || (modalRect.right - modalRect.left)) - viewportMargin * 2;
      const cap = Math.min(panelMaxWidth, maxAllowedViewport, maxAllowedModal);
      width = Math.min(Math.max(280, buttonWidth), cap);
      const idealLeft = rect.left + rect.width / 2 - width / 2;
      const minLeft = (modalRect.left || viewportMargin) + viewportMargin;
      const maxLeft = (modalRect.right || (window.innerWidth - viewportMargin)) - width - viewportMargin;
      left = Math.max(minLeft, Math.min(idealLeft, maxLeft));
    }
    const top = rect.bottom + 8; // 8px gap below trigger
    setPanelPos(prev => {
      // Avoid state updates if nothing changed to prevent unnecessary re-renders
      if (!prev || prev.top !== top || prev.left !== left || prev.width !== width) {
        return { top, left, width };
      }
      return prev;
    });
  }, [panelMaxWidth, viewportMargin]);
  
  // Helper function to render avatar
  const renderAvatar = (avatar: Avatar | null, displayName: string, isAdmin: boolean) => {
    const name = avatar?.full_name || avatar?.title || displayName;
    const initials = getInitials(name);
    
    if (avatar?.image) {
      return (
        <img
          src={avatar.image}
          alt={name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    
    return (
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold flex-shrink-0 ${getAvatarClasses(isAdmin)}`}>
        {initials}
      </div>
    );
  };

  // If no ticket selected, show simple list header matching MeetingsModals style
  if (!selectedTicket) {
    return (
      <div 
        className={`modal-drag-handle flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl ${!isMobile ? 'cursor-move' : ''}`}
        role="banner"
        aria-label="Modal header"
      >
        <div className="flex items-center gap-2 min-w-0">
          <TicketIcon 
            className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} 
            style={{ color: primary.base }} 
          />
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 dark:text-white truncate`}>
            Support
          </h2>
        </div>
        <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} flex-shrink-0`}>
          <button
            onClick={onClose}
            className="p-2 rounded-md transition-colors text-gray-700 dark:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            aria-label="Close modal"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // Show detailed header for ticket detail view
  return (
    <div 
      className={`modal-drag-handle flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-t-2xl cursor-move`}
      role="banner"
      aria-label="Modal header"
    >
      {/* Left Actions + Name (aligned like list view title) */}
  <div className="flex items-center gap-2 min-w-0" role="group" aria-label="Navigation controls">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-md text-[var(--color-primary-base)] hover:text-[var(--color-primary-hover)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]"
          aria-label="Back to ticket list"
          title="Back"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <Popover>
          {({ open }) => (
            <>
              <Popover.Button
                ref={ticketButtonRef}
                onClick={() => setTimeout(computePanelPosition, 0)}
                className="text-lg font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 rounded px-1 py-0.5 hover:text-[var(--color-primary-base)] truncate max-w-[45vw] sm:max-w-[360px]"
                style={{ '--focus-ring-color': primary.base } as React.CSSProperties}
                aria-label="View ticket meta"
              >
                {(() => {
                  const rawName = selectedTicket.full_name || null;
                  const displayName = rawName ? getDisplayName(rawName) : '';
                  const email = selectedTicket.email || '';
                  return displayName || email || 'Customer';
                })()}
              </Popover.Button>
              <Transition
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Portal>
                  <Popover.Panel
                    className="fixed bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-b-2xl shadow-xl border border-white/20 dark:border-gray-700/20 p-3 z-[11010]"
                    style={panelPos ? { top: panelPos.top, left: panelPos.left, width: panelPos.width } : undefined}
                  >
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
                      {/* (rest unchanged below) */}
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                        <span className="text-xs text-slate-500">Status:</span>
                        <span className={`text-xs font-medium ${getStatusTextClass(selectedTicket.status)}`}>{selectedTicket.status}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                        <span className="text-xs text-slate-500">Priority:</span>
                        <span className={`text-xs font-medium ${getPriorityTextClass(selectedTicket.priority)}`}>{getPriorityLabel(selectedTicket.priority)}</span>
                      </div>
                      <div className="py-1.5 px-2 rounded hover:bg-slate-50 group">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs text-slate-500 mt-1">Tags:</span>
                          <div className="flex-1 flex flex-wrap gap-1 justify-end">
                            {selectedTicket.tags && selectedTicket.tags.length > 0 ? (
                              selectedTicket.tags.map(tag => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border cursor-pointer hover:opacity-80"
                                  style={{ backgroundColor: `${tag.color}15`, borderColor: `${tag.color}40`, color: tag.color }}
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
                            {availableTags.length > 0 && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    onAssignTag(selectedTicket.id, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-[10px] px-2 py-0.5 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer"
                                value=""
                              >
                                <option value="">+ Add Tag</option>
                                {availableTags.filter(tag => !selectedTicket.tags?.some(t => t.id === tag.id)).map(tag => (
                                  <option key={tag.id} value={tag.id}>{tag.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      </div>
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
                </Portal>
              </Transition>
              {open && <ResizeRepositionWatcher onChange={computePanelPosition} />}
            </>
          )}
        </Popover>
      </div>
      
      {/* Center spacer: keep flexible center to balance layout; no duplicate title when a ticket is selected */}
      <div className="flex-1 mx-4" aria-hidden="true" />
      
      {/* Right Actions - Admin avatars */}
      <div className="flex items-center -space-x-2">
        {(() => {
          const adminAvatars = selectedTicket?.ticket_responses
            ?.filter(r => r.is_admin && r.avatar_id)
            .map(r => avatars.find(a => a.id === r.avatar_id))
            .filter((avatar): avatar is Avatar => avatar !== undefined)
            .filter((avatar, index, self) => self.findIndex(a => a.id === avatar.id) === index)
            .reverse() || [];

          return adminAvatars.length > 0 ? (
            adminAvatars.map((avatar) => (
              <Tooltip key={avatar.id} content={getAvatarDisplayName(avatar)}>
                <div className="relative ring-2 ring-white rounded-full">
                  {renderAvatar(avatar, getAvatarDisplayName(avatar), true)}
                </div>
              </Tooltip>
            ))
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center ring-2 ring-white dark:ring-gray-800">
              <span className="text-[12px] text-slate-500 dark:text-slate-400">?</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// Internal utility component: attaches resize and scroll listeners to recompute panel position
function ResizeRepositionWatcher({ onChange }: { onChange: () => void }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handle = () => onChange();
    // Run once on mount
    onChange();
    window.addEventListener('resize', handle, { passive: true });
    window.addEventListener('scroll', handle, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', handle as EventListener);
      window.removeEventListener('scroll', handle as EventListener, true);
    };
  }, [onChange]);
  return null;
}
