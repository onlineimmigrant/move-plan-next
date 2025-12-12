import React from 'react';
import { ClockIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';

interface AdminModalFooterProps {
  currentView: 'calendar' | 'booking' | 'manage-bookings';
  calendarView: 'month' | 'week' | 'day';
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  showTypesModal: () => void;
  showSettingsModal: () => void;
  primary: {
    base: string;
    hover: string;
  };
  isMobile: boolean;
}

/**
 * AdminModalFooter Component
 * 
 * Fixed footer with Types/Settings buttons and mobile calendar navigation
 */
export const AdminModalFooter = React.memo<AdminModalFooterProps>(({
  currentView,
  calendarView,
  currentDate,
  setCurrentDate,
  showTypesModal,
  showSettingsModal,
  primary,
  isMobile,
}) => {
  const handlePrevious = () => {
    const newDate = calendarView === 'month' 
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
      : calendarView === 'week'
      ? new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleNext = () => {
    const newDate = calendarView === 'month' 
      ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
      : calendarView === 'week'
      ? new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      : new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
    setCurrentDate(newDate);
  };

  return (
    <div className="border-t border-white/10 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-3">
      {/* Calendar Navigation - Mobile Only */}
      {isMobile && currentView === 'calendar' && (
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: `${primary.base}20`,
              color: primary.base 
            }}
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            style={{ 
              backgroundColor: `${primary.base}20`,
              color: primary.base 
            }}
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: `${primary.base}20`,
              color: primary.base 
            }}
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Types & Settings - Always Visible */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={showTypesModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            backgroundColor: `${primary.base}20`,
            color: primary.base 
          }}
          title="Manage appointment types"
        >
          <ClockIcon className="w-5 h-5" />
          {!isMobile && <span>Types</span>}
        </button>
        <button
          onClick={showSettingsModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
          style={{ 
            backgroundColor: `${primary.base}20`,
            color: primary.base 
          }}
          title="Configure appointment settings"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          {!isMobile && <span>Settings</span>}
        </button>
      </div>
    </div>
  );
});

AdminModalFooter.displayName = 'AdminModalFooter';

