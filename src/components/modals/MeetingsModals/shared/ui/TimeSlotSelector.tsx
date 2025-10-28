import React from 'react';
import { format } from 'date-fns';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { TimeSlot } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TimeSlotSelectorProps {
  availableSlots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSlotSelect: (slot: TimeSlot) => void;
  timeFormat24?: boolean;
  isAdmin?: boolean;
  businessHours?: { start: string; end: string };
  timezoneInfo?: {
    abbreviation: string;
    offset: string;
    cityName: string;
  };
  errors?: Record<string, string>;
  className?: string;
}

/**
 * TimeSlotSelector - A reusable component for selecting time slots
 * Used in booking forms to display and select available time slots
 */
export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  availableSlots,
  selectedSlot,
  onSlotSelect,
  timeFormat24 = true,
  isAdmin = false,
  businessHours,
  timezoneInfo,
  errors = {},
  className = '',
}) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const defaultTimezoneInfo = {
    abbreviation: 'UTC',
    offset: '+00:00',
    cityName: 'UTC',
  };

  const tzInfo = timezoneInfo || defaultTimezoneInfo;

  // Group slots by date
  const slotsByDate = availableSlots.reduce((acc, slot) => {
    const dateKey = format(slot.start, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  return (
    <div className={className}>
      {availableSlots.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <CalendarDaysIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-600">No available time slots found.</p>
          <p className="text-xs text-gray-500 mt-1">Try selecting a different date or time.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border-0 overflow-hidden">
          {/* Header with title and timezone info */}
          <div 
            className="px-3 py-2 border-b"
            style={{ 
              backgroundColor: `${primary.base}`,
              borderColor: `${primary.base}`
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-white flex-shrink-0" />
                <span className="text-sm font-semibold text-white">
                  Select *
                </span>
              </div>
              {/* Center: Date label for first date */}
              {Object.keys(slotsByDate).length > 0 && (() => {
                const firstDateKey = Object.keys(slotsByDate)[0];
                const date = new Date(firstDateKey);
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isTomorrow = format(date, 'yyyy-MM-dd') === format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                
                let dateLabel = format(date, 'EEE, MMM d');
                if (isToday) dateLabel = 'Today';
                else if (isTomorrow) dateLabel = 'Tomorrow';
                
                return (
                  <span className="text-xs font-medium text-white/95">
                    {dateLabel}
                  </span>
                );
              })()}
              <div className="flex items-center gap-3 text-xs text-white/90 font-medium">
                <span className="truncate">
                  UTC{tzInfo.offset} • {tzInfo.cityName}
                </span>
                {isAdmin && businessHours && (
                  <span className="whitespace-nowrap">
                    Customer: {businessHours.start.slice(0, 5)} - {businessHours.end.slice(0, 5)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Time slots by date */}
          <div className="max-h-[calc(100vh-400px)] sm:max-h-96 overflow-y-auto">
            {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => {
              return (
                <div key={dateKey} className="border-b border-gray-100 last:border-b-0">
                  {/* Time slots grid */}
                  <div className="p-2 sm:p-3">
                    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-1.5 sm:gap-2">
                      {dateSlots.map((slot, index) => {
                        const isBusinessHour = slot.isBusinessHours;
                        const isSelected = selectedSlot === slot;

                        // Check slot status
                        const now = new Date();
                        const isPast = slot.start.getTime() < now.getTime();
                        const isBooked = slot.available === false;

                        // Skip past slots entirely
                        if (isPast) {
                          return null;
                        }

                        // Render booked slots as non-clickable
                        if (isBooked) {
                          return (
                            <div
                              key={index}
                              className="px-2 py-2.5 sm:px-3 sm:py-2.5 text-center bg-gray-100 border border-gray-200 rounded text-gray-400 cursor-not-allowed"
                              title="This time slot is already booked"
                            >
                              <span className="text-xs sm:text-sm font-medium line-through">
                                {timeFormat24 ? format(slot.start, 'HH:mm') : format(slot.start, 'h:mm')}
                              </span>
                            </div>
                          );
                        }

                        // Render available slots as clickable buttons
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => onSlotSelect(slot)}
                            className={`px-2 py-2.5 sm:px-3 sm:py-2.5 text-center border rounded transition-all duration-150 focus:outline-none ${
                              isSelected
                                ? 'text-white shadow-sm'
                                : isBusinessHour
                                  ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                            style={isSelected ? {
                              borderColor: primary.base,
                              backgroundColor: primary.base,
                              boxShadow: `0 0 0 2px ${primary.base}33`
                            } : undefined}
                            onFocus={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.boxShadow = `0 0 0 2px ${primary.base}33`;
                              }
                            }}
                            onBlur={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.boxShadow = '';
                              }
                            }}
                          >
                            <span className="text-xs sm:text-sm font-medium">
                              {timeFormat24 ? format(slot.start, 'HH:mm') : format(slot.start, 'h:mm')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {errors.scheduled_at && (
        <p className="mt-2 text-xs text-red-600">{errors.scheduled_at}</p>
      )}
    </div>
  );
};

// Selected slot info component
interface SelectedSlotInfoProps {
  selectedSlot: TimeSlot;
  className?: string;
}

export const SelectedSlotInfo: React.FC<SelectedSlotInfoProps> = ({
  selectedSlot,
  className = '',
}) => (
  <div className={`bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-3 shadow-lg ${className}`}>
    <h4 className="text-xs sm:text-sm font-bold text-white mb-2 flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-white/20 rounded-full">
        ✓
      </span>
      Selected Time
    </h4>
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-white">
        <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium">{format(selectedSlot.start, 'EEEE, MMMM d, yyyy')}</span>
      </div>
      <div className="flex items-center gap-2 text-white">
        <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
        <span className="text-xs sm:text-sm font-medium">
          {format(selectedSlot.start, 'h:mm a')} - {format(selectedSlot.end, 'h:mm a')}
          <span className="ml-1.5 text-white/80">
            ({Math.round((selectedSlot.end.getTime() - selectedSlot.start.getTime()) / (1000 * 60))} minutes)
          </span>
        </span>
      </div>
    </div>
  </div>
);