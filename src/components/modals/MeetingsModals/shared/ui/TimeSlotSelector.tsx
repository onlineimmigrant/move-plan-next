import React, { useState, useEffect, useRef } from 'react';
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
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
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

  // Helper to get time of day
  const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'evening' => {
    const hour = date.getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  // Time of day styling
  const timeOfDayStyles = {
    morning: {
      bg: 'from-yellow-50 to-orange-50',
      border: 'border-yellow-200',
      icon: '☀️',
      label: 'Morning',
      hoverBg: 'hover:from-yellow-100 hover:to-orange-100'
    },
    afternoon: {
      bg: 'from-blue-50 to-cyan-50',
      border: 'border-blue-200',
      icon: '🌤️',
      label: 'Afternoon',
      hoverBg: 'hover:from-blue-100 hover:to-cyan-100'
    },
    evening: {
      bg: 'from-purple-50 to-pink-50',
      border: 'border-purple-200',
      icon: '🌙',
      label: 'Evening',
      hoverBg: 'hover:from-purple-100 hover:to-pink-100'
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Get all available slots (flat array)
      const allSlots = Object.values(slotsByDate).flat().filter(slot => {
        const isPast = slot.start.getTime() < new Date().getTime();
        const isBooked = slot.available === false;
        return !isPast && !isBooked;
      });

      if (allSlots.length === 0) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, allSlots.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 4, allSlots.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 4, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < allSlots.length) {
            onSlotSelect(allSlots[focusedIndex]);
          }
          break;
        case '?':
          e.preventDefault();
          setShowKeyboardHelp(!showKeyboardHelp);
          break;
        case 'Escape':
          if (showKeyboardHelp) {
            e.preventDefault();
            setShowKeyboardHelp(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [focusedIndex, slotsByDate, onSlotSelect, showKeyboardHelp]);

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && slotRefs.current[focusedIndex]) {
      slotRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  return (
    <div className={className}>
      {/* Keyboard shortcuts help modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setShowKeyboardHelp(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
              <button
                onClick={() => setShowKeyboardHelp(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ ['--tw-ring-color' as string]: primary.base }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Navigate slots</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">Arrow Keys</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Select slot</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">Enter / Space</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Show shortcuts</span>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">?</kbd>
              </div>
            </div>
          </div>
        </div>
      )}

      {availableSlots.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <CalendarDaysIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-600">No available time slots found.</p>
          <p className="text-xs text-gray-500 mt-1">Try selecting a different date or time.</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden">
          {/* Header with title and timezone info */}
          <div 
            className="px-3 py-2 border-b"
            style={{ 
              backgroundColor: `${primary.base}`,
              borderColor: `${primary.base}`
            }}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: Clock icon + Date on mobile */}
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-white flex-shrink-0" />
                {/* Date label - shown on mobile only */}
                {Object.keys(slotsByDate).length > 0 && (() => {
                  const firstDateKey = Object.keys(slotsByDate)[0];
                  const date = new Date(firstDateKey);
                  const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                  const isTomorrow = format(date, 'yyyy-MM-dd') === format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                  
                  let dateLabel = format(date, 'EEE, MMM d');
                  if (isToday) dateLabel = 'Today';
                  else if (isTomorrow) dateLabel = 'Tomorrow';
                  
                  return (
                    <span className="sm:hidden text-sm font-semibold text-white">
                      {dateLabel}
                    </span>
                  );
                })()}
              </div>
              {/* Center: Date label - shown on desktop */}
              {Object.keys(slotsByDate).length > 0 && (() => {
                const firstDateKey = Object.keys(slotsByDate)[0];
                const date = new Date(firstDateKey);
                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                const isTomorrow = format(date, 'yyyy-MM-dd') === format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                
                let dateLabel = format(date, 'EEE, MMM d');
                if (isToday) dateLabel = 'Today';
                else if (isTomorrow) dateLabel = 'Tomorrow';
                
                return (
                  <span className="hidden sm:block text-sm font-semibold text-white">
                    {dateLabel}
                  </span>
                );
              })()}
              {/* Right: Timezone info */}
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

          {/* Time slots by date - Full height to show all slots */}
          <div className="flex-1 overflow-y-auto">
            {Object.entries(slotsByDate).map(([dateKey, dateSlots]) => {
              // Group slots by time of day
              const slotsByTimeOfDay = {
                morning: dateSlots.filter(s => getTimeOfDay(s.start) === 'morning'),
                afternoon: dateSlots.filter(s => getTimeOfDay(s.start) === 'afternoon'),
                evening: dateSlots.filter(s => getTimeOfDay(s.start) === 'evening')
              };

              let globalIndex = 0; // Track global index for keyboard navigation

              return (
                <div key={dateKey} className="border-b border-gray-100 last:border-b-0">
                  {/* Render each time of day section */}
                  {(['morning', 'afternoon', 'evening'] as const).map(timeOfDay => {
                    const slots = slotsByTimeOfDay[timeOfDay];
                    if (slots.length === 0) return null;

                    const styles = timeOfDayStyles[timeOfDay];
                    const availableCount = slots.filter(s => {
                      const isPast = s.start.getTime() < new Date().getTime();
                      const isBooked = s.available === false;
                      return !isPast && !isBooked;
                    }).length;

                    return (
                      <div key={timeOfDay} className="p-3 sm:p-4">
                        {/* Section header */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg sm:text-xl">{styles.icon}</span>
                          <h3 className="text-sm font-semibold text-gray-700">{styles.label}</h3>
                        </div>

                        {/* Time slots grid */}
                        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5 md:gap-3">
                          {slots.map((slot, index) => {
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
                                  className="px-3 py-3 sm:px-3 sm:py-2.5 min-h-[44px] sm:min-h-[40px] text-center bg-gray-100 border-2 border-gray-200 rounded-lg text-gray-400 cursor-not-allowed"
                                  title="This time slot is already booked"
                                >
                                  <span className="text-xs sm:text-sm font-medium line-through">
                                    {timeFormat24 ? format(slot.start, 'HH:mm') : format(slot.start, 'h:mm a')}
                                  </span>
                                </div>
                              );
                            }

                            const slotIndex = globalIndex++;
                            const isFocused = slotIndex === focusedIndex;

                            // Render available slots as clickable buttons
                            return (
                              <button
                                key={index}
                                ref={(el) => { slotRefs.current[slotIndex] = el; }}
                                type="button"
                                onClick={() => onSlotSelect(slot)}
                                className={`
                                  relative overflow-hidden
                                  px-3 py-3 sm:px-3 sm:py-2.5 
                                  min-h-[44px] sm:min-h-[40px]
                                  text-center border-2 rounded-lg 
                                  transition-all duration-200
                                  focus-visible:outline-none 
                                  focus-visible:ring-2 
                                  focus-visible:ring-offset-2
                                  ${isSelected
                                    ? 'text-white shadow-lg scale-105'
                                    : `bg-gradient-to-br ${styles.bg} ${styles.border} text-gray-700 ${styles.hoverBg} hover:scale-105 hover:shadow-md active:scale-95`
                                  }
                                `}
                                style={isSelected ? {
                                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                                  borderColor: primary.base,
                                  boxShadow: `0 4px 12px ${primary.base}40`,
                                  ['--tw-ring-color' as string]: primary.base
                                } : {
                                  ['--tw-ring-color' as string]: primary.base
                                }}
                                aria-label={`Select ${format(slot.start, timeFormat24 ? 'HH:mm' : 'h:mm a')} time slot. ${styles.label} time.`}
                                aria-pressed={isSelected}
                                role="radio"
                                aria-checked={isSelected}
                                tabIndex={isFocused ? 0 : -1}
                              >
                                <span className="text-xs sm:text-sm font-semibold">
                                  {timeFormat24 ? format(slot.start, 'HH:mm') : format(slot.start, 'h:mm a')}
                                </span>
                                {/* Next available indicator */}
                                {index === 0 && !isSelected && (
                                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white animate-pulse" title="Next available" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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