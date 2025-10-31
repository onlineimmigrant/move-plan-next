/**
 * Placeholder Helper Component
 * Autocomplete dropdown for inserting {{placeholders}} into text fields
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { EmailIcons } from './EmailIcons';
import { TEMPLATE_PLACEHOLDERS, type TemplatePlaceholder } from '../types/emailTemplate';

interface PlaceholderHelperProps {
  value: string;
  onChange: (value: string) => void;
  onInsert?: (placeholder: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

export const PlaceholderHelper: React.FC<PlaceholderHelperProps> = ({
  value,
  onChange,
  onInsert,
  placeholder = 'Type text or use {{placeholders}}...',
  multiline = false,
  rows = 3,
  className = '',
  disabled = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter placeholders based on search
  const filteredPlaceholders = TEMPLATE_PLACEHOLDERS.filter((p) => {
    if (!searchTerm) return true;
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group placeholders by category
  const groupedPlaceholders = filteredPlaceholders.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, TemplatePlaceholder[]>);

  // Handle text change and detect {{ trigger
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const pos = e.target.selectionStart || 0;
    
    onChange(newValue);
    setCursorPosition(pos);

    // Check if user typed {{ to show dropdown
    const beforeCursor = newValue.substring(0, pos);
    const lastTwoBrackets = beforeCursor.lastIndexOf('{{');
    
    if (lastTwoBrackets !== -1) {
      const afterBrackets = beforeCursor.substring(lastTwoBrackets + 2);
      if (!afterBrackets.includes('}}')) {
        setSearchTerm(afterBrackets);
        setShowDropdown(true);
        return;
      }
    }
    
    setShowDropdown(false);
  };

  // Insert placeholder at cursor position
  const insertPlaceholder = (placeholderName: string) => {
    if (!inputRef.current) return;

    const pos = cursorPosition;
    const beforeCursor = value.substring(0, pos);
    const afterCursor = value.substring(pos);
    
    // Find the {{ trigger position
    const lastBrackets = beforeCursor.lastIndexOf('{{');
    
    let newValue: string;
    let newPos: number;
    
    if (lastBrackets !== -1) {
      // Replace from {{ to cursor
      newValue = 
        value.substring(0, lastBrackets) +
        `{{${placeholderName}}}` +
        afterCursor;
      newPos = lastBrackets + placeholderName.length + 4;
    } else {
      // Insert at cursor
      newValue = beforeCursor + `{{${placeholderName}}}` + afterCursor;
      newPos = pos + placeholderName.length + 4;
    }
    
    onChange(newValue);
    setShowDropdown(false);
    setSearchTerm('');
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);

    onInsert?.(placeholderName);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && showDropdown) {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  const inputClasses = `w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 ${className}`;

  return (
    <div className="relative">
      {/* Input/Textarea */}
      {multiline ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={inputClasses}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      )}

      {/* Helper Text */}
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-500">
          Type <code className="px-1 py-0.5 bg-gray-100 rounded text-purple-600">{'{{'}</code> to insert placeholders
        </p>
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
        >
          <EmailIcons.Code className="h-3 w-3" />
          Browse All
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-xl"
        >
          {/* Search Header */}
          {searchTerm && (
            <div className="px-3 py-2 bg-purple-50 border-b border-purple-100 text-sm text-purple-700">
              Searching for: <span className="font-semibold">"{searchTerm}"</span>
            </div>
          )}

          {/* Placeholder List */}
          {Object.keys(groupedPlaceholders).length > 0 ? (
            <div className="py-2">
              {Object.entries(groupedPlaceholders).map(([category, placeholders]) => (
                <div key={category} className="mb-2">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">
                    {category}
                  </div>
                  {placeholders.map((ph) => (
                    <button
                      key={ph.name}
                      type="button"
                      onClick={() => insertPlaceholder(ph.name)}
                      className="w-full px-3 py-2 text-left hover:bg-purple-50 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <code className="text-sm font-mono text-purple-600 group-hover:text-purple-700">
                            {`{{${ph.name}}}`}
                          </code>
                          <p className="text-xs text-gray-600 mt-0.5 truncate">
                            {ph.description}
                          </p>
                        </div>
                        <EmailIcons.Plus className="h-4 w-4 text-gray-400 group-hover:text-purple-600 flex-shrink-0 mt-0.5" />
                      </div>
                      {ph.example && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          Example: {ph.example}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-8 text-center text-sm text-gray-500">
              No placeholders found matching "{searchTerm}"
            </div>
          )}

          {/* Footer Hint */}
          <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
            <p className="text-xs text-gray-600 flex items-center gap-1">
              <EmailIcons.Info className="h-3 w-3" />
              Click to insert • Press ESC to close
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
