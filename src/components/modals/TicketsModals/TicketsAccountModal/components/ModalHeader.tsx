/**
 * ModalHeader Component
 * Header section with navigation, resize, and close buttons
 */

import React from 'react';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import type { WidgetSize, Avatar, Ticket } from '../../shared/types';
import { renderAvatar } from '../../shared/utils';

interface ModalHeaderProps {
  selectedTicket: Ticket | null;
  size: WidgetSize;
  avatars: Avatar[];
  totalUnreadCount?: number;
  onBack: () => void;
  onToggleSize: () => void;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  selectedTicket,
  size,
  avatars,
  totalUnreadCount = 0,
  onBack,
  onToggleSize,
  onClose,
}) => {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-white/80 to-blue-50/80 dark:from-gray-900/80 dark:to-blue-900/20 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 rounded-t-2xl shadow-sm">
      <div className="flex items-center gap-2">
        {selectedTicket && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
            aria-label="Back to list"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <button
          onClick={onToggleSize}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
        >
          {size === 'fullscreen' ? (
            <ArrowsPointingInIcon className="h-4 w-4" />
          ) : (
            <ArrowsPointingOutIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      
      {/* Title - Show "Ticket" with admin avatars */}
      <div className="flex-1 flex items-center justify-center mx-4 gap-3">
        {selectedTicket ? (
          <>
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ticket</span>
            {/* Show stacked admin avatars */}
            <div className="flex items-center -space-x-2">
              {(() => {
                // Get unique admin avatars from responses
                const seenAvatarIds = new Set<string>();
                const adminAvatars = selectedTicket.ticket_responses
                  .filter(r => r.is_admin && r.avatar_id)
                  .map(r => avatars.find(a => a.id === r.avatar_id))
                  .filter((avatar): avatar is Avatar => {
                    if (!avatar || seenAvatarIds.has(avatar.id)) {
                      return false;
                    }
                    seenAvatarIds.add(avatar.id);
                    return true;
                  })
                  .reverse(); // Most recent first
                
                return adminAvatars.length > 0 ? (
                  adminAvatars.map((avatar) => (
                    <Tooltip key={avatar.id} content={avatar.full_name || avatar.title || 'Admin'}>
                      <div className="relative">
                        {renderAvatar(avatar, avatar.full_name || avatar.title || 'Admin', true)}
                      </div>
                    </Tooltip>
                  ))
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-[9px] text-slate-500 dark:text-slate-400">?</span>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Support Tickets</h2>
            {totalUnreadCount > 0 && (
              <span 
                className="flex items-center justify-center min-w-[22px] h-5 px-2 text-xs font-semibold text-white bg-red-500 rounded-full"
                aria-label={`${totalUnreadCount} total unread message${totalUnreadCount === 1 ? '' : 's'}`}
              >
                {totalUnreadCount}
              </span>
            )}
          </div>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
