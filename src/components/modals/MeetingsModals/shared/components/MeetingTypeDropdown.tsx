// MeetingTypeDropdown - Custom dropdown for selecting meeting types
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/outline';
import { MeetingType } from '@/types/meetings';

interface MeetingTypeDropdownProps {
  meetingTypes: MeetingType[];
  selectedId: string | null;
  onSelect: (typeId: string) => void;
  error?: string;
  placeholder?: string;
}

export default function MeetingTypeDropdown({
  meetingTypes,
  selectedId,
  onSelect,
  error,
  placeholder = 'Select a meeting type',
}: MeetingTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedType = meetingTypes.find(t => t.id === selectedId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (type: MeetingType) => {
    onSelect(type.id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Display / Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
          error 
            ? 'border-red-300 bg-red-50' 
            : isOpen 
              ? 'border-teal-500 bg-teal-50' 
              : 'border-gray-300 hover:border-teal-400 bg-white'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedType ? (
              <>
                {selectedType.color && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedType.color }}
                  />
                )}
                <span className="font-medium text-gray-900 truncate">
                  {selectedType.name}
                </span>
                <span className="text-gray-500 text-xs flex-shrink-0">
                  ({selectedType.duration_minutes} min)
                </span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {meetingTypes.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No meeting types available
            </div>
          ) : (
            <div className="py-1">
              {meetingTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleSelect(type)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                    selectedId === type.id ? 'bg-teal-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Color indicator */}
                    {type.color && (
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: type.color }}
                      />
                    )}

                    {/* Type info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium text-sm ${
                          selectedId === type.id ? 'text-teal-900' : 'text-gray-900'
                        }`}>
                          {type.name}
                        </span>
                        {selectedId === type.id && (
                          <CheckIcon className="w-4 h-4 text-teal-600 flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Description */}
                      {type.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                          {type.description}
                        </p>
                      )}

                      {/* Duration and buffer */}
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {type.duration_minutes} min
                        </span>
                        {type.buffer_minutes > 0 && (
                          <span>Buffer: {type.buffer_minutes} min</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs sm:text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
