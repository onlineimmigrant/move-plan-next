import React, { useRef, useEffect, useState } from 'react';
import { ChevronUpDownIcon, CheckIcon } from '@heroicons/react/24/outline';
import { createPortal } from 'react-dom';
import { animationOptions } from './animationOptions';

interface AnimationSelectProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
}

export const AnimationSelect: React.FC<AnimationSelectProps> = ({ 
  label, 
  name, 
  value, 
  onChange 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  // Find the selected animation option
  const selectedAnimation = animationOptions.find(a => a.value === value) || animationOptions[0];
  
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
      className="fixed z-[99999] mt-2 max-h-80 overflow-auto rounded-xl bg-white/95 backdrop-blur-sm shadow-2xl py-2 text-sm focus:outline-none border border-gray-200/60"
      style={{
        top: buttonRect.bottom + window.scrollY + 8,
        left: buttonRect.left + window.scrollX,
        width: Math.max(buttonRect.width, 320), // Minimum width for descriptions
      }}
    >
      {animationOptions.map((animation) => (
        <button
          key={animation.value}
          onClick={() => handleChange(animation.value)}
          className={`relative cursor-pointer select-none py-4 pl-4 pr-10 w-full text-left transition-colors duration-200 hover:bg-sky-50/80 hover:text-sky-900 ${
            animation.value === value ? 'bg-sky-100/60 text-sky-900' : 'text-gray-900'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded-lg text-lg">
              {animation.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="block truncate text-sm font-medium">{animation.name}</div>
              <div className="block text-xs text-gray-500 mt-1 leading-relaxed">{animation.description}</div>
            </div>
          </div>
          {animation.value === value && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sky-600">
              <CheckIcon className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body
  );

  return (
    <div className="relative">
      <label className="block text-xs font-light text-gray-600 mb-1">
        {label}
      </label>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full cursor-pointer rounded-xl bg-white py-3 pl-4 pr-10 text-left shadow-sm ring-1 ring-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 hover:ring-sky-300 transition-all duration-200"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-sm">
            {selectedAnimation.icon}
          </div>
          <div className="flex-1 min-w-0">
            <span className="block truncate text-sm font-medium">{selectedAnimation.name}</span>
            <span className="block text-xs text-gray-500 truncate">{selectedAnimation.description}</span>
          </div>
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </span>
      </button>
      
      {dropdownContent}
    </div>
  );
};
