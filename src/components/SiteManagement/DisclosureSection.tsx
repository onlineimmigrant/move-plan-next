import React, { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';

interface DisclosureSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionKey: string;
  hasChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
  isOpen?: boolean;
  onToggle?: (sectionKey: string, isOpen: boolean) => void;
}

export const DisclosureSection: React.FC<DisclosureSectionProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  sectionKey,
  hasChanges,
  onSave,
  onCancel,
  isOpen: externalIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  // Use external state if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  
  const handleToggle = () => {
    const newIsOpen = !isOpen;
    
    if (onToggle) {
      // Use external state management
      onToggle(sectionKey, newIsOpen);
    } else {
      // Use internal state management
      setInternalIsOpen(newIsOpen);
    }

    // Scroll to this specific DisclosureSection when opening it
    if (newIsOpen && sectionRef.current) {
      setTimeout(() => {
        // Scroll to this specific section with some top margin
        sectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Add some top margin by scrolling up a bit
        setTimeout(() => {
          window.scrollBy({
            top: -16, // 16px = pt-4 (1rem)
            behavior: 'smooth'
          });
        }, 150);
      }, 100); // Small delay to allow the section to open first
    }
  };

  return (
    <div 
      ref={sectionRef}
      className={`group bg-white/95 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
        isOpen 
          ? 'border-sky-200/60 shadow-lg shadow-sky-100/30 ring-1 ring-sky-100/50' 
          : 'border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-300/60'
      }`}
    >
      <button 
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between p-4 text-left transition-all duration-300 rounded-t-xl ${
          isOpen 
            ? 'bg-gradient-to-r from-sky-200/40 to-blue-50/20' 
            : 'hover:bg-gray-50/40 bg-gray-100/50'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            isOpen 
              ? 'bg-sky-500 shadow-sm shadow-sky-200' 
              : 'bg-gray-300 group-hover:bg-gray-400'
          }`} />
          <h3 className={`text-sm font-light tracking-tight transition-colors duration-300 ${
            isOpen 
              ? 'text-sky-900' 
              : 'text-gray-900 group-hover:text-gray-700'
          }`}>
            {title}
          </h3>
          {hasChanges && (
            <span className="inline-flex items-center rounded-full bg-sky-100/60 px-2.5 py-0.5 text-xs font-light text-sky-700 backdrop-blur-sm border border-sky-200/40">
              Unsaved changes
            </span>
          )}
        </div>
        <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
          isOpen 
            ? 'bg-sky-100/60 text-sky-600' 
            : 'bg-gray-100/60 text-gray-500 group-hover:bg-gray-200/60 group-hover:text-gray-600'
        }`}>
          <ChevronRightIcon
            className={`h-3 w-3 transition-transform duration-300 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="border-t border-gray-200/60">
          <div className="max-h-[75vh] overflow-y-auto px-4 py-5 space-y-5">
            <div>{children}</div>
          </div>
          {hasChanges && (
            <div className="flex justify-end gap-3 px-4 py-4 border-t border-gray-200/60 bg-gray-50/30">
              <Button
                variant='outline'
                type="button"
                onClick={onCancel}
                             >
                Cancel
              </Button>
              <Button
                variant='primary'
                type="button"
                onClick={onSave}
                    >
                Save Section
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
