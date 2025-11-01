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
 */
export const BottomSheetTOC: React.FC<BottomSheetTOCProps> = ({
  toc,
  handleScrollTo,
  title = 'Table of Contents',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const themeColors = useThemeColors();

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show floating button after scrolling past header
  useEffect(() => {
    if (!isMounted) return;

    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMounted]);

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
        className={`lg:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
        style={{
          backgroundColor: themeColors.cssVars.primary.base,
          color: 'white',
        }}
        aria-label="Open table of contents"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bottom Sheet */}
      <div
        className={`lg:hidden fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '85vh',
        }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          <ul className="space-y-1">
            {toc.map((item, index) => (
              <li key={`${item.tag_id}-${index}`}>
                <button
                  onClick={() => handleItemClick(item.tag_id)}
                  className={`w-full text-left py-3 px-3 rounded-lg hover:bg-gray-50 transition-colors text-sm ${getIndentClass(
                    item.tag_name
                  )} ${getFontWeight(item.tag_name)} text-gray-700`}
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
