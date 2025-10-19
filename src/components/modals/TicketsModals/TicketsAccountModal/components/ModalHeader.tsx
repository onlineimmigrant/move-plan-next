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
  onBack: () => void;
  onToggleSize: () => void;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  selectedTicket,
  size,
  avatars,
  onBack,
  onToggleSize,
  onClose,
}) => {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-2xl shadow-sm">
      <div className="flex items-center gap-2">
        {selectedTicket && (
          <button
            onClick={onBack}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            aria-label="Back to list"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        <button
          onClick={onToggleSize}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
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
            <span className="text-sm font-semibold text-slate-700">Ticket</span>
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
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                    <span className="text-[9px] text-slate-500">?</span>
                  </div>
                );
              })()}
            </div>
          </>
        ) : (
          <h2 className="text-sm font-semibold text-slate-700">Support Tickets</h2>
        )}
      </div>
      
      <button
        onClick={onClose}
        className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
