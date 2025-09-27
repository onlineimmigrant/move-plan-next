import React, { useState, useEffect, useRef } from 'react';
import { PlusIcon, MinusIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface SubsectionDisclosureProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string; // Optional key for persistent state
  action?: React.ReactNode; // Optional action button/element
  actionContent?: React.ReactNode; // Content to show below action button when open
  itemCount?: number; // Optional count to display in a badge
  resetKey?: number; // Optional resetKey to force re-initialization
  hasData?: boolean; // Indicates if subsection contains filled data
  isEmpty?: boolean; // Indicates if subsection is completely empty
  fieldStatuses?: Array<{ hasData: boolean; isEmpty: boolean; name: string }>; // Status of each field
  allFieldsFilled?: boolean; // True if ALL fields are completely filled
}

export const SubsectionDisclosure: React.FC<SubsectionDisclosureProps> = ({ 
  title, 
  children, 
  defaultOpen = false,
  storageKey,
  action,
  actionContent,
  itemCount,
  resetKey,
  hasData = false,
  isEmpty = false,
  fieldStatuses = [],
  allFieldsFilled = false
}) => {
  // Debug logging for itemCount
  console.log(`🔍 [SubsectionDisclosure] "${title}" - itemCount:`, itemCount, typeof itemCount);
  
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [dynamicCount, setDynamicCount] = useState<number | undefined>(itemCount);
  const subsectionRef = useRef<HTMLDivElement>(null);

  // Listen for count updates if this is Cookie Services or Consent Records subsection
  useEffect(() => {
    if (title === 'Cookie Services') {
      const handleCountUpdate = (event: CustomEvent) => {
        console.log('🔢 SubsectionDisclosure received cookieServices count update:', event.detail.count);
        setDynamicCount(event.detail.count);
      };

      window.addEventListener('cookieServicesCountUpdate', handleCountUpdate as EventListener);
      return () => {
        window.removeEventListener('cookieServicesCountUpdate', handleCountUpdate as EventListener);
      };
    } else if (title === 'Consent Records') {
      const handleCountUpdate = (event: CustomEvent) => {
        console.log('🔢 SubsectionDisclosure received consentRecords count update:', event.detail.count);
        setDynamicCount(event.detail.count);
      };

      window.addEventListener('consentRecordsCountUpdate', handleCountUpdate as EventListener);
      return () => {
        window.removeEventListener('consentRecordsCountUpdate', handleCountUpdate as EventListener);
      };
    }
  }, [title]);

  // Use dynamic count if available for Cookie Services or Consent Records, otherwise fall back to itemCount prop
  const displayCount = (title === 'Cookie Services' || title === 'Consent Records') ? dynamicCount : itemCount;

  // Load state from localStorage if storageKey is provided, or reset when resetKey changes
  useEffect(() => {
    console.log(`[SubsectionDisclosure] "${title}" - Initializing state, resetKey:`, resetKey);
    
    if (storageKey && typeof window !== 'undefined') {
      if (resetKey === 0) {
        // First load - try to load from localStorage
        const saved = localStorage.getItem(`subsection_${storageKey}`);
        if (saved !== null) {
          setIsOpen(JSON.parse(saved));
          return;
        }
      } else if (resetKey && resetKey > 0) {
        // Reset triggered - clear localStorage and force closed state
        localStorage.removeItem(`subsection_${storageKey}`);
        console.log(`[SubsectionDisclosure] "${title}" - Reset triggered, forcing closed state`);
      }
    }
    
    // Set to default (closed) state
    setIsOpen(defaultOpen);
  }, [storageKey, resetKey, defaultOpen, title]);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    
    // Save state to localStorage if storageKey is provided
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(`subsection_${storageKey}`, JSON.stringify(newState));
    }

    // Scroll to this specific subsection when opening it
    if (newState && subsectionRef.current) {
      setTimeout(() => {
        // Scroll to this specific subsection with some top margin
        subsectionRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
        
        // Add some top margin by scrolling up a bit
        setTimeout(() => {
          window.scrollBy({
            top: -8, // 8px = pt-2 (0.5rem) - smaller margin for subsections
            behavior: 'smooth'
          });
        }, 150);
      }, 100); // Small delay to allow the subsection to open first
    }
  };

  return (
    <div ref={subsectionRef} className="w-full">
      <div className="">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center justify-between w-full text-left p-3 rounded-xl transition-all duration-300 mb-4 group focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:ring-offset-1 ${
            isOpen 
              ? 'bg-sky-50 backdrop-blur-sm border border-sky-200/60 shadow-md shadow-sky-100/20 ring-1 ring-sky-100/30' 
              : 'bg-white/60 backdrop-blur-sm border border-gray-200/50 hover:bg-white/80 hover:border-gray-300/60 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <h4 className={`modal-subsection-title !mb-0 transition-colors duration-300 ${
                isOpen ? 'text-sky-800' : 'text-gray-700 group-hover:text-gray-900'
              }`}>
                {title}
              </h4>
              
              {/* Data Status Indicator */}
              {fieldStatuses.length > 0 ? (
                // Multiple icons for fields or single large icon if all filled
                allFieldsFilled ? (
                  <div className="flex items-center" title="All fields completed">
                    <div className="relative">
                      <CheckCircleIcon className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-emerald-500 drop-shadow-sm" />
                      <div className="absolute inset-0 bg-emerald-100 rounded-full opacity-20 scale-125"></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap" title={`${fieldStatuses.filter(f => f.hasData).length}/${fieldStatuses.length} fields completed`}>
                    {fieldStatuses.map((status, index) => (
                      <div key={index} title={`${status.name}: ${status.hasData ? 'Filled' : 'Empty'}`} className="relative group">
                        {status.hasData ? (
                          <div className="relative">
                            <CheckCircleIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600 drop-shadow-sm group-hover:scale-110 transition-transform duration-150" />
                            <div className="absolute inset-0 bg-emerald-100 rounded-full opacity-0 group-hover:opacity-30 scale-125 transition-opacity duration-150"></div>
                          </div>
                        ) : (
                          <div className="relative">
                            <ExclamationCircleIcon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600 drop-shadow-sm group-hover:scale-110 transition-transform duration-150" />
                            <div className="absolute inset-0 bg-amber-100 rounded-full opacity-0 group-hover:opacity-30 scale-125 transition-opacity duration-150"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )
              ) : (
                // Fallback for simple has/empty data
                <>
                  {hasData && (
                    <div className="flex items-center" title="Subsection contains data">
                      <CheckCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500 drop-shadow-sm" />
                    </div>
                  )}
                  {isEmpty && (
                    <div className="flex items-center" title="Subsection needs attention - missing data">
                      <ExclamationCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 drop-shadow-sm" />
                    </div>
                  )}
                </>
              )}
              {/* Item count badge */}
              {(() => {
                console.log(`🎯 [SubsectionDisclosure] "${title}" badge render check:`, {
                  itemCount,
                  displayCount,
                  type: typeof displayCount,
                  isNumber: typeof displayCount === 'number',
                  isValidCount: typeof displayCount === 'number' && displayCount >= 0,
                  shouldShow: typeof displayCount === 'number' && displayCount >= 0
                });
                return typeof displayCount === 'number' && displayCount >= 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full transition-colors duration-300 ${
                    isOpen 
                      ? 'bg-sky-100 text-sky-600 ring-1 ring-sky-200/40' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    {displayCount}
                  </span>
                );
              })()}
            </div>
            <div className="flex items-center gap-2">
              {/* Action button if provided */}
              {action && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="flex-shrink-0"
                >
                  {action}
                </div>
              )}
              {/* Disclosure toggle icon */}
              <div className={`flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ${
                isOpen 
                  ? 'bg-sky-100/80 text-sky-600 shadow-sm ring-1 ring-sky-200/40' 
                  : 'bg-gray-100/70 text-gray-500 group-hover:bg-gray-200/80 group-hover:text-gray-600 group-focus:bg-sky-50'
              }`}>
                {isOpen ? (
                  <MinusIcon className="h-3.5 w-3.5" />
                ) : (
                  <PlusIcon className="h-3.5 w-3.5" />
                )}
              </div>
            </div>
          </div>
        </button>
        {isOpen && (
            <div className="transition-all duration-300 bg-gray-50 rounded-lg">
                {/* Action content (e.g., Add forms) */}
                {actionContent && (
                  <div className="mb-6">
                    {actionContent}
                  </div>
                )}
                <div className="p-2 rounded-lg">
                    <div className="overflow-hidden">
                        <div className="animate-fadeIn transition-all duration-300 ease-out transform translate-y-0">
                        <div className="pb-4">
                            {children}
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
