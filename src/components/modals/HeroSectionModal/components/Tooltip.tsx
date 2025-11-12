/**
 * Tooltip Component
 * 
 * Reusable tooltip with optional fixed positioning
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string;
  useFixedPosition?: boolean;
  children?: React.ReactNode;
}

export function Tooltip({
  content,
  useFixedPosition = false,
  children
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useFixedPosition && containerRef.current) {
      const updatePosition = () => {
        const rect = containerRef.current!.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 8,
          left: rect.left + rect.width / 2 + window.scrollX
        });
      };

      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [useFixedPosition]);

  const tooltipContent = (
    <div
      ref={containerRef}
      className={`pointer-events-none transition-opacity ${
        useFixedPosition 
          ? 'fixed z-[9999]' 
          : 'absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50'
      } ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={useFixedPosition ? { 
        top: position.top, 
        left: position.left, 
        transform: 'translateX(-50%)' 
      } : undefined}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <div className="relative">
        {/* Arrow */}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2">
          <div className="w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-600 transform rotate-45" />
        </div>
        {/* Content */}
        <div className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 px-3 py-2 whitespace-normal w-64">
          {content}
        </div>
      </div>
    </div>
  );

  if (useFixedPosition && typeof window !== 'undefined') {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        {createPortal(tooltipContent, document.body)}
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {tooltipContent}
    </div>
  );
}
