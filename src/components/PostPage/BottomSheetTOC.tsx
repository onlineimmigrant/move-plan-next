'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

interface BottomSheetTOCProps {
  toc: TOCItem[];
  handleScrollTo: (id: string) => void;
  title?: string;
}

/**
 * Bottom Sheet TOC Component
 * Mobile-optimized TOC that slides up from bottom
 * @performance Memoized to prevent re-renders when props unchanged
 */
const BottomSheetTOCComponent: React.FC<BottomSheetTOCProps> = ({
  toc,
  handleScrollTo,
  title = 'Table of Contents',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const themeColors = useThemeColors();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show floating button after scrolling past header and track scroll direction
  useEffect(() => {
    if (!isMounted) return;

    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setIsVisible(currentScrollY > 300);
          
          // Check if scrolling up and not at the top
          if (currentScrollY < lastScrollY && currentScrollY > 100) {
            setIsScrollingUp(true);
          } else {
            setIsScrollingUp(false);
          }
          
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted, lastScrollY]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleItemClick = (id: string) => {
    handleScrollTo(id);
    setIsOpen(false);
  };

  const getIndentClass = (tagName: string) => {
    switch (tagName) {
      case 'h2':
        return 'pl-0';
      case 'h3':
        return 'pl-4';
      case 'h4':
        return 'pl-8';
      default:
        return 'pl-12';
    }
  };

  const getFontWeight = (tagName: string) => {
    return tagName === 'h2' ? 'font-semibold' : 'font-normal';
  };

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) return null;

  if (toc.length === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`lg:hidden fixed bottom-4 left-6 sm:bottom-6 sm:left-8 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full transition-all duration-300 flex items-center justify-center backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 shadow-md hover:shadow-lg border-0 focus:outline-none focus:ring-0 transform hover:scale-110 active:scale-95 group ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        } ${isScrollingUp ? 'scale-75' : 'scale-100'}`}
        aria-label="Open table of contents"
      >
        <Bars3Icon 
          className="w-6 h-6 text-gray-900 dark:text-white transition-all duration-200"
          style={{
            color: undefined,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = themeColors.cssVars.primary.base;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '';
          }}
        />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`lg:hidden fixed bottom-0 left-4 right-4 z-50 backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-t-3xl shadow-lg transition-transform duration-300 ease-out border-0 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '85vh',
        }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-4 pb-3">
          <div className="w-12 h-1.5 bg-gray-400/50 dark:bg-gray-500/50 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 mb-2 backdrop-blur-xl bg-white/30 dark:bg-gray-900/30">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 sm:h-6 rounded-full" style={{ backgroundColor: themeColors.cssVars.primary.base }} />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight">{title}</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-0"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-700/50 to-transparent" />

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          <ul className="space-y-1">
            {toc.map((item, index) => (
              <li key={`${item.tag_id}-${index}`}>
                <button
                  onClick={() => handleItemClick(item.tag_id)}
                  className={`w-full text-left py-3 px-3 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors text-sm ${getIndentClass(
                    item.tag_name
                  )} ${getFontWeight(item.tag_name)} text-gray-700 dark:text-gray-300`}
                >
                  {item.tag_text}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export const BottomSheetTOC = React.memo(BottomSheetTOCComponent);
