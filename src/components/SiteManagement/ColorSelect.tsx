import React, { useRef, useEffect, useState } from 'react';
import { ChevronUpDownIcon, CheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { colorOptions } from './colorOptions';

interface ColorSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export const ColorSelect: React.FC<ColorSelectProps> = ({ 
  label, 
  name, 
  value, 
  onChange 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Find the selected color option based on Tailwind color value
  const selectedColor = colorOptions.find(c => c.value === value) || colorOptions.find(c => c.value === 'gray-500') || colorOptions[0];
  
  // Filter colors based on search term
  const filteredColors = colorOptions.filter(color =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      // Clear search when closing
      setSearchTerm('');
    }
  }, [isOpen]);

  const handleChange = (newValue: string) => {
    // Store Tailwind color format directly in database
    onChange(name, newValue);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      }}
    >
      {/* Search input */}
      <div className="p-3 border-b border-gray-100">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* Color options */}
      <div className="max-h-48 overflow-auto py-2">
        {filteredColors.length > 0 ? (
          filteredColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleChange(color.value)}
              className={`relative cursor-pointer select-none py-3 pl-4 pr-10 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
                color.value === value ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border border-white/60 shadow-sm ${color.color} ${
                  color.value === value ? 'ring-2 ring-sky-400 ring-offset-1' : ''
                }`}></div>
                <span className="block truncate text-sm font-light">{color.name}</span>
              </div>
              {color.value === value && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sky-600">
                  <CheckIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              )}
            </button>
          ))
        ) : (
          <div className="px-4 py-6 text-center text-sm text-gray-500">
            No colors found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>,
    document.body
  );

  return (
    <div className="modal-field-group">
      <label className="modal-label">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-pointer rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200/60 py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
        >
          <div className="flex items-center space-x-3">
            <div className={`w-5 h-5 rounded-full border border-white/60 shadow-sm ${selectedColor.color}`}></div>
            <span className="block truncate text-sm font-light text-gray-900">{selectedColor.name}</span>
          </div>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </span>
        </button>
        
        {dropdownContent}
        
        {/* Click outside handler */}
        {isOpen && (
          <div
            className="fixed inset-0 z-[99998]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    </div>
  );
};
