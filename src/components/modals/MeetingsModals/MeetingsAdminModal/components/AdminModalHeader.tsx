import React from 'react';
import { CalendarIcon, ClockIcon, Cog6ToothIcon, XMarkIcon, UsersIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import type { AdminView } from '../hooks';

interface AdminModalHeaderProps {
  currentView: AdminView;
  setCurrentView: (view: AdminView) => void;
  hoveredTab: string | null;
  setHoveredTab: (tab: string | null) => void;
  showTypesModal: () => void;
  showSettingsModal: () => void;
  showInstantMeetingModal?: () => void;
  onClose: () => void;
  activeBookingCount: number;
  fetchActiveBookingCount: () => void;
  primary: {
    base: string;
    hover: string;
  };
  isMobile: boolean;
}

/**
 * AdminModalHeader component
 * 
 * Renders the header section of the admin modal including:
 * - Title with calendar icon
 * - Action buttons (Types, Settings) - only in non-booking views
 * - Close button
 * - Tab navigation (Book, Manage) - only in non-booking views
 * 
 * Has separate rendering for mobile and desktop layouts.
 */
export const AdminModalHeader = React.memo<AdminModalHeaderProps>(({
  currentView,
  setCurrentView,
  hoveredTab,
  setHoveredTab,
  showTypesModal,
  showSettingsModal,
  showInstantMeetingModal,
  onClose,
  activeBookingCount,
  fetchActiveBookingCount,
  primary,
  isMobile
}) => {
  return (
    <>
      {/* Header */}
      <div className={`${isMobile ? 'modal-drag-handle' : 'modal-drag-handle cursor-move'} flex items-center justify-between ${isMobile ? 'p-4' : 'p-6'} border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl`}>
        <div className="flex items-center gap-2 min-w-0">
          <CalendarIcon className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} flex-shrink-0`} style={{ color: primary.base }} />
          <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900 dark:text-white truncate`}>
            Appointments
          </h2>
        </div>
        
        {/* Header Actions */}
        <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} flex-shrink-0`}>
          {currentView !== 'booking' && (
            <>
              {isMobile ? (
                // Mobile: Icon-only buttons
                <>
                  <button
                    onClick={showTypesModal}
                    className="p-2 rounded-md transition-colors"
                    style={{ color: primary.base }}
                    title="Manage appointment types"
                  >
                    <ClockIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={showSettingsModal}
                    className="p-2 rounded-md transition-colors"
                    style={{ color: primary.base }}
                    title="Configure appointment settings"
                  >
                    <Cog6ToothIcon className="w-5 h-5" />
                  </button>
                </>
              ) : (
                // Desktop: Buttons with labels
                <>
                  <button
                    onClick={showTypesModal}
                    onMouseEnter={() => setHoveredTab('types')}
                    onMouseLeave={() => setHoveredTab(null)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                    style={{
                      color: hoveredTab === 'types' ? primary.hover : primary.base,
                      backgroundColor: hoveredTab === 'types' ? `${primary.base}1a` : 'transparent'
                    }}
                    title="Manage appointment types"
                  >
                    <ClockIcon className="w-4 h-4" />
                    Types
                  </button>
                  <button
                    onClick={showSettingsModal}
                    onMouseEnter={() => setHoveredTab('settings')}
                    onMouseLeave={() => setHoveredTab(null)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors"
                    style={{
                      color: hoveredTab === 'settings' ? primary.hover : primary.base,
                      backgroundColor: hoveredTab === 'settings' ? `${primary.base}1a` : 'transparent'
                    }}
                    title="Configure appointment settings"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    Settings
                  </button>
                </>
              )}
            </>
          )}
          <button
            onClick={onClose}
            className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors ${!isMobile && currentView !== 'booking' ? 'ml-2' : ''}`}
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {currentView !== 'booking' && (
        <div className={`flex items-center gap-2 ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} border-b border-white/10 ${isMobile ? 'bg-white/20 dark:bg-gray-900/20' : 'bg-white/20 dark:bg-gray-900/20'}`}>
          <button
            onClick={() => setCurrentView('calendar')}
            onMouseEnter={() => setHoveredTab('create')}
            onMouseLeave={() => setHoveredTab(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
            style={
              currentView === 'calendar'
                ? {
                    background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                    color: 'white',
                    boxShadow: hoveredTab === 'create' 
                      ? `0 4px 12px ${primary.base}40` 
                      : `0 2px 4px ${primary.base}30`
                  }
                : {
                    backgroundColor: 'transparent',
                    color: hoveredTab === 'create' ? primary.hover : primary.base,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: hoveredTab === 'create' ? `${primary.base}80` : `${primary.base}40`
                  }
            }
          >
            <CalendarIcon className="w-4 h-4" />
            Book
          </button>
          {showInstantMeetingModal && (
            <button
              onClick={showInstantMeetingModal}
              onMouseEnter={() => setHoveredTab('invite')}
              onMouseLeave={() => setHoveredTab(null)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
              style={{
                backgroundColor: 'transparent',
                color: hoveredTab === 'invite' ? primary.hover : primary.base,
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: hoveredTab === 'invite' ? `${primary.base}80` : `${primary.base}40`
              }}
            >
              <PaperAirplaneIcon className="w-4 h-4" />
              Invite
            </button>
          )}
          <button
            onClick={() => {
              setCurrentView('manage-bookings');
              fetchActiveBookingCount();
            }}
            onMouseEnter={() => setHoveredTab('manage')}
            onMouseLeave={() => setHoveredTab(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-300 shadow-sm"
            style={
              currentView === 'manage-bookings'
              ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white',
                  boxShadow: hoveredTab === 'manage' 
                    ? `0 4px 12px ${primary.base}40` 
                    : `0 2px 4px ${primary.base}30`
                }
              : {
                  backgroundColor: 'transparent',
                  color: hoveredTab === 'manage' ? primary.hover : primary.base,
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor: hoveredTab === 'manage' ? `${primary.base}80` : `${primary.base}40`
                }
            }
          >
            <UsersIcon className="w-4 h-4" />
            <span>Manage</span>
            {activeBookingCount > 0 && (
              <span 
                className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full"
                style={{
                  backgroundColor: currentView === 'manage-bookings' ? 'rgba(255, 255, 255, 0.25)' : primary.base,
                  color: 'white'
                }}
              >
                {activeBookingCount}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  );
});

AdminModalHeader.displayName = 'AdminModalHeader';
