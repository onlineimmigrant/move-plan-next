// MeetingTypeCards - Radio card grid for selecting meeting types
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClockIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { MeetingType } from '@/types/meetings';
import { useThemeColors } from '@/hooks/useThemeColors';
import { format } from 'date-fns';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  isBusinessHours?: boolean;
}

interface MeetingTypeCardsProps {
  meetingTypes: MeetingType[];
  selectedId: string | null;
  onSelect: (typeId: string) => void;
  error?: string;
  selectedSlot?: TimeSlot | null;
  timeFormat24?: boolean;
}

export default function MeetingTypeCards({
  meetingTypes,
  selectedId,
  onSelect,
  error,
  selectedSlot,
  timeFormat24 = true,
}: MeetingTypeCardsProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const cols = window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, meetingTypes.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + cols, meetingTypes.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - cols, 0));
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < meetingTypes.length) {
            onSelect(meetingTypes[focusedIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [focusedIndex, meetingTypes, onSelect]);

  // Focus management
  useEffect(() => {
    if (focusedIndex >= 0 && cardRefs.current[focusedIndex]) {
      cardRefs.current[focusedIndex]?.focus();
    }
  }, [focusedIndex]);

  if (meetingTypes.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-gray-50 rounded-xl border border-gray-200">
        <p className="text-sm font-medium text-gray-600">No appointment types available</p>
        <p className="text-xs text-gray-500 mt-1">Please contact support to set up appointment types</p>
      </div>
    );
  }

  return (
    <div>
      <div 
        role="radiogroup" 
        aria-labelledby="meeting-type-label"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto overflow-x-visible p-1"
      >
        {meetingTypes.map((type, index) => {
          const isSelected = selectedId === type.id;
          const isFocused = focusedIndex === index;

          return (
            <button
              key={type.id}
              ref={(el) => { cardRefs.current[index] = el; }}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${type.name}, ${type.duration_minutes} minutes. ${type.description || ''}`}
              onClick={() => onSelect(type.id)}
              tabIndex={isFocused ? 0 : -1}
              className={`
                relative p-4 min-h-[120px]
                border-2 rounded-xl
                text-left
                transition-all duration-200
                focus-visible:outline-none 
                focus-visible:ring-2 
                focus-visible:ring-offset-2
                ${isSelected
                  ? 'scale-102 shadow-lg'
                  : 'hover:scale-102 hover:shadow-md'
                }
              `}
              style={{
                borderColor: isSelected ? primary.base : error ? '#FCA5A5' : '#E5E7EB',
                backgroundColor: isSelected ? `${primary.base}0d` : error ? '#FEF2F2' : 'white',
                boxShadow: isSelected ? `0 4px 12px ${primary.base}33` : undefined,
                ['--tw-ring-color' as string]: primary.base,
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = error ? '#FCA5A5' : '#E5E7EB';
                }
              }}
            >
              {/* Header: Color dot + Name + Checkmark/Date Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {type.color && (
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: type.color }}
                      aria-hidden="true"
                    />
                  )}
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {type.name}
                  </h3>
                </div>
                {isSelected ? (
                  selectedSlot ? (
                    <div 
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs font-semibold whitespace-nowrap"
                      style={{ 
                        borderColor: primary.base,
                        color: primary.base,
                        backgroundColor: `${primary.base}15`
                      }}
                    >
                      <span>
                        {format(selectedSlot.start, timeFormat24 ? 'MMM d, HH:mm' : 'MMM d, h:mm a')}
                      </span>
                    </div>
                  ) : (
                    <CheckCircleIcon 
                      className="w-6 h-6 flex-shrink-0" 
                      style={{ color: primary.base }}
                      aria-hidden="true"
                    />
                  )
                ) : null}
              </div>

              {/* Description */}
              {type.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[40px]">
                  {type.description}
                </p>
              )}

              {/* Metadata: Duration + Buffer */}
              <div className="flex items-center gap-4 text-sm mt-auto pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                  <ClockIcon className="w-4 h-4" aria-hidden="true" />
                  <span>{type.duration_minutes} min</span>
                </div>
                {type.buffer_minutes > 0 && (
                  <span className="text-xs text-gray-500">
                    Buffer: {type.buffer_minutes} min
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs sm:text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
