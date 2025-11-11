/**
 * ModalHeader Component
 * Header section with navigation, resize, and close buttons
 */

import React from 'react';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, TicketIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { useThemeColors } from '@/hooks/useThemeColors';
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
  // Check if mobile to disable drag handle
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // If no ticket selected, show simple list header matching TicketsAdminModal style
  if (!selectedTicket) {
    return (
      <div 
        className={`modal-drag-handle flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl rounded-t-2xl ${!isMobile ? 'cursor-move' : ''}`}
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
    <div className={`modal-drag-handle flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md rounded-t-2xl ${!isMobile ? 'cursor-move' : ''}`}>
      {/* Left Actions + Label */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-colors focus:outline-none focus-visible:ring-2"
          style={{
            color: 'var(--color-primary-base)',
            '--hover-color': 'color-mix(in srgb, var(--color-primary-base) 80%, black)',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--hover-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--color-primary-base)';
          }}
          aria-label="Back to ticket list"
          title="Back"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 truncate">
          Chat
        </h2>
      </div>
      
      {/* Center spacer */}
      <div className="flex-1 mx-4" aria-hidden="true" />
      
      {/* Right Actions - Admin avatars */}
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
                <div className="relative ring-2 ring-white dark:ring-gray-800 rounded-full">
                  {renderAvatar(avatar, avatar.full_name || avatar.title || 'Admin', true)}
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
};
