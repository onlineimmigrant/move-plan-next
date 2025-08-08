import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  variant?: 'primary' | 'bottom' | 'left' | 'right' | 'info-top' | 'info-bottom' | 'info-left' | 'info-right';
}

export default function Tooltip({ content, children, variant = 'primary' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse and focus events
  const showTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const hideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100); // Small delay to allow moving to tooltip
 };

  // Keep tooltip visible when mouse is over it
  const handleTooltipMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(true);
  };

  const handleTooltipMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  // Position tooltip relative to trigger
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top: number;
      let left: number;

      switch (variant) {
        case 'primary':

          top = triggerRect.top + window.scrollY - tooltipRect.height - 8;
          left = triggerRect.left + window.scrollX;
          tooltipRef.current.style.marginTop = '2px';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'bottom':
          // Place below the trigger with 8px gap
          top = triggerRect.bottom + window.scrollY + 8;
          left = triggerRect.left + window.scrollX;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'left':
          // Place to the left of the trigger, vertically centered
          top = triggerRect.top + window.scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left + window.scrollX - tooltipRect.width - 8;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'right':
          // Place to the right of the trigger, vertically centered
          top = triggerRect.top + window.scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + window.scrollX + 8;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'info-top':
          // Place above the trigger with 8px gap
          top = triggerRect.top + window.scrollY - tooltipRect.height - 8;
          left = triggerRect.left + window.scrollX;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'info-bottom':
          // Place below the trigger with 8px gap
          top = triggerRect.bottom + window.scrollY + 8;
          left = triggerRect.left + window.scrollX;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'info-left':
          // Place to the left of the trigger, vertically centered
          top = triggerRect.top + window.scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.left + window.scrollX - tooltipRect.width - 8;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        case 'info-right':
          // Place to the right of the trigger, vertically centered
          top = triggerRect.top + window.scrollY + (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.right + window.scrollX + 8;
          tooltipRef.current.style.marginTop = '0';
          tooltipRef.current.style.marginBottom = '0';
          break;
        default:
          // Default to primary (above with mt-2)
          top = triggerRect.top + window.scrollY - tooltipRect.height - 8;
          left = triggerRect.left + window.scrollX;
          tooltipRef.current.style.marginTop = '2px';
          tooltipRef.current.style.marginBottom = '0';
      }

      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [isVisible, variant]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      hideTooltip();
    }
  };

  // Determine tooltip styles based on variant
  const isInfoVariant = variant?.startsWith('info-');
  const tooltipClasses = isInfoVariant
    ? 'fixed z-[9999] bg-white text-gray-500 text-xs font-medium rounded-md py-2 px-3 border-2 border-gray-200 max-w-xs break-words animate-fade-in overflow-y-auto max-h-60 shadow-lg'
    : 'fixed z-[9999] bg-gray-600 text-white text-sm font-light rounded-md py-1 px-2 shadow-lg max-w-xs break-words animate-fade-in';

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-describedby={isVisible ? 'tooltip' : undefined}
        className="cursor-pointer outline-none"
      >
        {children}
      </div>
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className={tooltipClasses}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {content}
          <style jsx>{`
            @keyframes fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-fade-in {
              animation: fade-in 0.2s ease-out;
            }
          `}</style>
        </div>,
        document.body
      )}
    </div>
  );
}