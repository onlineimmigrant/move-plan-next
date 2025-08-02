import React, { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';

interface DisclosureSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  sectionKey: string;
  hasChanges: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const DisclosureSection: React.FC<DisclosureSectionProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  sectionKey,
  hasChanges,
  onSave,
  onCancel
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const handleToggle = () => {
    setIsOpen(prev => !prev);
  };

  return (
    <div className={`group bg-white/95 backdrop-blur-sm rounded-xl border transition-all duration-300 ${
      isOpen 
        ? 'border-sky-200/60 shadow-lg shadow-sky-100/30 ring-1 ring-sky-100/50' 
        : 'border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-300/60'
    }`}>
      <button 
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between p-4 text-left transition-all duration-300 rounded-xl ${
          isOpen 
            ? 'bg-gradient-to-r from-sky-50/40 to-blue-50/20' 
            : 'hover:bg-gray-50/40'
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
        <div className="px-4 pb-5 space-y-5">
          <div className="h-px bg-gradient-to-r from-transparent via-sky-200/60 to-transparent opacity-60" />
          <div>{children}</div>
          {hasChanges && (
            <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200/60">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex justify-center rounded-lg border border-gray-300/60 bg-white/80 px-4 py-2 text-xs font-light text-gray-600 shadow-sm hover:bg-gray-50/80 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 backdrop-blur-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="inline-flex justify-center rounded-lg border border-transparent bg-sky-500 px-4 py-2 text-xs font-light text-white shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200"
              >
                Save Section
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
