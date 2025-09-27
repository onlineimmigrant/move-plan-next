import React, { useState, useEffect, useRef } from 'react';
import { ChevronRightIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
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
  hasData?: boolean; // Indicates if section contains filled data
  isEmpty?: boolean; // Indicates if section is completely empty
  subsectionStatuses?: Array<{ hasData: boolean; isEmpty: boolean; title: string }>; // Status of each subsection
  allSubsectionsFilled?: boolean; // True if ALL subsections are completely filled
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
  onToggle,
  hasData = false,
  isEmpty = false,
  subsectionStatuses = [],
  allSubsectionsFilled = false
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
        // Simple scroll to section - this works!
        sectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Add top margin with a larger offset for EditModal context
        setTimeout(() => {
          window.scrollBy({
            top: -200, // Much larger offset to ensure clear space below EditModal header
            behavior: 'smooth'
          });
        }, 150);
      }, 100);
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
          <h3 className={`modal-section-title !mb-0 transition-colors duration-300 ${
            isOpen 
              ? 'text-sky-900' 
              : 'text-gray-900 group-hover:text-gray-700'
          }`}>
            {title}
          </h3>
          
          {/* Data Status Indicator */}
          {subsectionStatuses.length > 0 ? (
            // Multiple icons for subsections
            allSubsectionsFilled ? (
              <div className="flex items-center" title="All subsections completed">
                <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 drop-shadow-sm" />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2" title={`${subsectionStatuses.filter(s => s.hasData && !s.isEmpty).length}/${subsectionStatuses.length} subsections completed`}>
                {subsectionStatuses.map((status, index) => (
                  <div key={index} title={`${status.title}: ${status.hasData && !status.isEmpty ? 'Completed' : 'Incomplete'}`}>
                    {status.hasData && !status.isEmpty ? (
                      <div className="relative">
                        <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 drop-shadow-sm" />
                      </div>
                    ) : (
                      <div className="relative">
                        <ExclamationCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 drop-shadow-sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          ) : (
            // Single section without subsections
            <>
              {hasData && (
                <div className="flex items-center" title="Section contains data">
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500 drop-shadow-sm" />
                </div>
              )}
              {isEmpty && (
                <div className="flex items-center" title="Section needs attention - missing data">
                  <ExclamationCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 drop-shadow-sm" />
                </div>
              )}
            </>
          )}
          
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
