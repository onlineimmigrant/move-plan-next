'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ReadingProgressBarProps {
  progress: number;
  readingTime: number;
  isComplete: boolean;
}

/**
 * Reading Progress Bar Component
 * 
 * Displays reading progress indicator at bottom of viewport.
 * Shows estimated reading time and completion status.
 * Only visible when scrolling up for cleaner UX.
 * 
 * @component
 * @param {ReadingProgressBarProps} props - Component props
 * @param {number} props.progress - Reading progress percentage (0-100)
 * @param {number} props.readingTime - Estimated reading time in minutes
 * @param {boolean} props.isComplete - Whether reading is complete
 * 
 * @example
 * <ReadingProgressBar progress={45} readingTime={5} isComplete={false} />
 * 
 * @performance Fixed position, GPU-accelerated transform, smart visibility
 */
export const ReadingProgressBar: React.FC<ReadingProgressBarProps> = ({
  progress,
  readingTime,
  isComplete,
}) => {
  const themeColors = useThemeColors();
  const [showProgress, setShowProgress] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Show progress bar only when scrolling up or near bottom
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const documentHeight = document.documentElement.scrollHeight;
          const windowHeight = window.innerHeight;
          const scrollPercent = (currentScrollY / (documentHeight - windowHeight)) * 100;

          // Show when scrolling up OR in last 20% of page
          const isScrollingUp = currentScrollY < lastScrollY && currentScrollY > 100;
          const isNearBottom = scrollPercent > 80;

          setShowProgress(isScrollingUp || isNearBottom);
          setLastScrollY(currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Progress bar - Bottom positioned, visible on scroll up */}
      <div 
        className="fixed bottom-0 left-0 right-0 h-0.5 bg-gray-100 dark:bg-gray-300 z-50 transition-opacity duration-300"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Reading progress"
        style={{
          opacity: showProgress ? 1 : 0,
          pointerEvents: showProgress ? 'auto' : 'none',
        }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            backgroundColor: isComplete 
              ? themeColors.cssVars.primary.active // Darker shade for completion
              : themeColors.cssVars.primary.base,
            transform: 'translateZ(0)', // GPU acceleration
          }}
        />
      </div>

      {/* Reading time indicator - Bottom right positioned */}
      <div 
        className="fixed bottom-6 right-4 z-40 hidden lg:flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md transition-all duration-300"
        style={{
          background: isComplete
            ? `linear-gradient(135deg, ${themeColors.cssVars.primary.active}15, ${themeColors.cssVars.primary.base}10)`
            : `linear-gradient(135deg, ${themeColors.cssVars.primary.base}15, ${themeColors.cssVars.primary.light}08)`,
          border: `1px solid ${isComplete ? themeColors.cssVars.primary.active : themeColors.cssVars.primary.base}30`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        }}
      >
        {isComplete ? (
          <>
            <CheckCircleIcon 
              className="w-4 h-4" 
              style={{ color: themeColors.cssVars.primary.active }}
            />
            <span 
              className="text-xs font-semibold tracking-wide"
              style={{ color: themeColors.cssVars.primary.active }}
            >
              Complete
            </span>
          </>
        ) : (
          <>
            <ClockIcon 
              className="w-4 h-4" 
              style={{ color: themeColors.cssVars.primary.base }}
            />
            <span 
              className="text-xs font-medium tabular-nums"
              style={{ color: themeColors.cssVars.primary.base }}
            >
              {readingTime} min · {progress}%
            </span>
          </>
        )}
      </div>
    </>
  );
};
