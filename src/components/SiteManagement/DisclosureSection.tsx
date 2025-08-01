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
    <div className={`group bg-white rounded-xl border transition-all duration-500 ${
      isOpen 
        ? 'border-sky-200 shadow-lg shadow-sky-100/20 ring-1 ring-sky-100' 
        : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
    }`}>
      <button 
        type="button"
        onClick={handleToggle}
        className={`flex w-full items-center justify-between p-3 text-left transition-all duration-300 rounded-xl ${
          isOpen 
            ? 'bg-gradient-to-r from-sky-50/50 to-blue-50/30' 
            : 'hover:bg-gray-50/50'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
            isOpen 
              ? 'bg-sky-500 shadow-sm shadow-sky-200' 
              : 'bg-gray-300 group-hover:bg-gray-400'
          }`} />
          <h3 className={`text-sm font-semibold tracking-tight transition-colors duration-300 ${
            isOpen 
              ? 'text-sky-900' 
              : 'text-gray-900 group-hover:text-gray-700'
          }`}>
            {title}
          </h3>
          {hasChanges && (
            <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Unsaved changes
            </span>
          )}
        </div>
        <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
          isOpen 
            ? 'bg-sky-100 text-sky-600' 
            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-600'
        }`}>
          <ChevronRightIcon
            className={`h-3 w-3 transition-transform duration-300 ${
              isOpen ? 'rotate-90' : ''
            }`}
          />
        </div>
      </button>
      {isOpen && (
        <div className="px-3 pb-4 space-y-4">
          <div className="h-px bg-gradient-to-r from-transparent via-sky-200 to-transparent opacity-50" />
          <div>{children}</div>
          {hasChanges && (
            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSave}
                className="inline-flex justify-center rounded-md border border-transparent bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
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
