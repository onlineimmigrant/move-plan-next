import React, { useRef, useEffect, useState } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';

interface WidthOption {
  name: string;
  value: string;
  preview: React.ReactNode;
  description: string;
}

const widthOptions: WidthOption[] = [
  { 
    name: 'Full Width', 
    value: 'full', 
    preview: <div className="w-full h-2 bg-blue-200 rounded"></div>,
    description: '100% container width'
  },
  { 
    name: '1/2 Width', 
    value: '1/2', 
    preview: <div className="w-1/2 h-2 bg-blue-200 rounded"></div>,
    description: '50% container width'
  },
  { 
    name: '1/3 Width', 
    value: '1/3', 
    preview: <div className="w-1/3 h-2 bg-blue-200 rounded"></div>,
    description: '33% container width'
  },
  { 
    name: '2/3 Width', 
    value: '2/3', 
    preview: <div className="w-2/3 h-2 bg-blue-200 rounded"></div>,
    description: '67% container width'
  },
  { 
    name: '1/4 Width', 
    value: '1/4', 
    preview: <div className="w-1/4 h-2 bg-blue-200 rounded"></div>,
    description: '25% container width'
  },
  { 
    name: '3/4 Width', 
    value: '3/4', 
    preview: <div className="w-3/4 h-2 bg-blue-200 rounded"></div>,
    description: '75% container width'
  }
];

interface BlockWidthSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export const BlockWidthSelect: React.FC<BlockWidthSelectProps> = ({ 
  label, 
  name, 
  value, 
  onChange 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const selectedOption = widthOptions.find(option => option.value === value) || widthOptions[0]; // Default to 'Full Width'
  
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
      className="fixed z-[99999] mt-2 rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: Math.max(buttonRect.width, 300),
      }}
    >
      <div className="py-2">
        {widthOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleChange(option.value)}
            className={`relative cursor-pointer select-none py-3 px-4 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
              option.value === value ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-16 h-10 bg-gray-50 rounded-lg p-2">
                {option.preview}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium">{option.name}</div>
                <div className="text-xs text-gray-500">{option.description}</div>
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
    <div className="space-y-1.5">
      <label className="block text-xs font-light text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full cursor-pointer rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200/60 py-3 pl-4 pr-10 text-left shadow-sm transition-all duration-300 hover:border-gray-300 hover:shadow-md hover:bg-white/70 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8 h-6 bg-gray-50 rounded p-1">
              <div className={`h-2 bg-blue-200 rounded ${
                selectedOption.value === 'full' ? 'w-full' :
                selectedOption.value === '1/2' ? 'w-1/2' :
                selectedOption.value === '1/3' ? 'w-1/3' :
                selectedOption.value === '2/3' ? 'w-2/3' :
                selectedOption.value === '1/4' ? 'w-1/4' :
                selectedOption.value === '3/4' ? 'w-3/4' : 'w-full'
              }`}></div>
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
