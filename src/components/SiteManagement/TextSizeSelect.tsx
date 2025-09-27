import React, { useRef, useEffect, useState } from 'react';
import { ChevronUpDownIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

interface SizeOption {
  name: string;
  value: string;
  preview: string;
  fontSize: string;
}

const sizeOptions: SizeOption[] = [
  { name: 'Extra Small', value: 'text-xs', preview: 'Aa', fontSize: 'text-xs' },
  { name: 'Small', value: 'text-sm', preview: 'Aa', fontSize: 'text-sm' },
  { name: 'Base', value: 'text-base', preview: 'Aa', fontSize: 'text-base' },
  { name: 'Large', value: 'text-lg', preview: 'Aa', fontSize: 'text-lg' },
  { name: 'Extra Large', value: 'text-xl', preview: 'Aa', fontSize: 'text-xl' },
  { name: '2XL', value: 'text-2xl', preview: 'Aa', fontSize: 'text-2xl' },
  { name: '3XL', value: 'text-3xl', preview: 'Aa', fontSize: 'text-3xl' },
  { name: '4XL', value: 'text-4xl', preview: 'Aa', fontSize: 'text-4xl' },
  { name: '5XL', value: 'text-5xl', preview: 'Aa', fontSize: 'text-5xl' },
  { name: '6XL', value: 'text-6xl', preview: 'Aa', fontSize: 'text-6xl' },
  { name: '7XL', value: 'text-7xl', preview: 'Aa', fontSize: 'text-7xl' }
];

interface TextSizeSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export const TextSizeSelect: React.FC<TextSizeSelectProps> = ({ 
  label, 
  name, 
  value, 
  onChange 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const selectedOption = sizeOptions.find(option => option.value === value) || sizeOptions[2]; // Default to 'Base'
  
  const updateButtonRect = () => {
    if (buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateButtonRect();
      const handleScroll = () => updateButtonRect();
      const handleResize = () => updateButtonRect();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const handleChange = (newValue: string) => {
    onChange(name, newValue);
    setIsOpen(false);
  };

  const dropdownContent = isOpen && buttonRect && createPortal(
    <div
      className="fixed z-[99999] mt-2 max-h-80 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: Math.max(buttonRect.width, 280),
      }}
    >
      <div className="py-2">
        {sizeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={`relative cursor-pointer select-none py-3 px-4 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
              option.value === value ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-lg">
                <span className={`font-medium text-gray-700 ${option.fontSize}`} style={{ lineHeight: '1' }}>
                  {option.preview}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{option.name}</div>
                <div className="text-xs text-gray-500">{option.value}</div>
              </div>
              {option.value === value && (
                <CheckIcon className="h-5 w-5 text-sky-600" />
              )}
            </div>
          </button>
        ))}
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
            <div className="flex items-center justify-center w-6 h-6 bg-gray-50 rounded">
              <span className="text-sm font-medium text-gray-700">
                Aa
              </span>
            </div>
            <span className="block truncate text-sm font-light text-gray-900">{selectedOption.name}</span>
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
