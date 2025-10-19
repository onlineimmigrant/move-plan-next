import React from 'react';
import { XMarkIcon, ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import { BarChart3, Zap } from 'lucide-react';
import { Ticket, Avatar, TicketTag } from '../types';
import { getDisplayName, getAvatarDisplayName, renderAvatar } from '../utils/ticketHelpers';
import { TicketDetailsPopover } from './TicketDetailsPopover';

interface ModalHeaderProps {
  selectedTicket: Ticket | null;
  size: 'initial' | 'half' | 'fullscreen';
  searchQuery: string;
  availableTags: TicketTag[];
  avatars: Avatar[];
  onBackToList: () => void;
  onToggleSize: () => void;
  onShowAnalytics: () => void;
  onShowAssignmentRules: () => void;
  onClose: () => void;
  onAssignTag: (ticketId: string, tagId: string) => void;
  onRemoveTag: (ticketId: string, tagId: string) => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  selectedTicket,
  size,
  searchQuery,
  availableTags,
  avatars,
  onBackToList,
  onToggleSize,
  onShowAnalytics,
  onShowAssignmentRules,
  onClose,
  onAssignTag,
  onRemoveTag,
  onToast,
}) => {
  return (
    <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-2xl shadow-sm">
      <div className="flex items-center gap-2">
        {selectedTicket && (
          <button
            onClick={onBackToList}
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
        <button
          onClick={onShowAnalytics}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200"
          title="View Analytics"
        >
          <BarChart3 className="h-4 w-4" />
        </button>
        <button
          onClick={onShowAssignmentRules}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          title="Assignment Rules & Automation"
        >
          <Zap className="h-4 w-4" />
        </button>
      </div>

      {/* Title - Show "Ticket" with tooltip and admin avatars */}
      <div className="flex-1 flex items-center justify-center mx-4 gap-3">
        {selectedTicket ? (
          <>
            <TicketDetailsPopover
              selectedTicket={selectedTicket}
              searchQuery={searchQuery}
              availableTags={availableTags}
              onAssignTag={onAssignTag}
              onRemoveTag={onRemoveTag}
              onToast={onToast}
            />

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
                    <div key={avatar.id} className="relative ring-2 ring-white rounded-full">
                      {renderAvatar(avatar, getAvatarDisplayName(avatar), true)}
                    </div>
                  ))
                ) : (
                  <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center ring-2 ring-white">
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