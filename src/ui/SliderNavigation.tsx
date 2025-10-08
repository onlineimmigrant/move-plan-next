'use client';

import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface SliderNavigationProps {
  onPrevious: () => void;
  onNext: () => void;
  currentIndex: number;
  totalItems: number;
  onDotClick?: (index: number) => void;
  showDots?: boolean;
  dotPosition?: 'center' | 'left' | 'right';
  buttonPosition?: 'bottom-right' | 'bottom-center' | 'sides' | 'top-right';
  buttonVariant?: 'default' | 'circle' | 'minimal';
  dotVariant?: 'default' | 'large';
  className?: string;
}

export const SliderNavigation: React.FC<SliderNavigationProps> = ({
  onPrevious,
  onNext,
  currentIndex,
  totalItems,
  onDotClick,
  showDots = true,
  dotPosition = 'center',
  buttonPosition = 'bottom-right',
  buttonVariant = 'default',
  dotVariant = 'default',
  className = '',
}) => {
  if (totalItems <= 1) return null;

  // Button styles based on variant
  const getButtonStyles = () => {
    switch (buttonVariant) {
      case 'circle':
        return 'w-10 h-10 rounded-full bg-white/90 shadow-lg hover:bg-white hover:scale-110 text-gray-700 hover:text-gray-900 flex items-center justify-center';
      case 'minimal':
        return 'text-gray-400/60 hover:text-gray-600/80 transition-all duration-300 ease-in-out hover:scale-125 focus:outline-none';
      default:
        return 'text-gray-400/60 hover:text-gray-600/80 transition-all duration-300 ease-in-out hover:scale-125 focus:outline-none';
    }
  };

  // Button hover effects
  const getPrevButtonHover = () => {
    return buttonVariant === 'minimal' ? 'hover:-translate-x-1' : '';
  };

  const getNextButtonHover = () => {
    return buttonVariant === 'minimal' ? 'hover:translate-x-1' : '';
  };

  // Dot styles based on variant
  const getDotStyles = (isActive: boolean) => {
    const baseStyles = 'rounded-full transition-all duration-300';
    
    if (dotVariant === 'large') {
      return `${baseStyles} ${
        isActive
          ? 'bg-gray-900 w-8 h-2.5'
          : 'bg-gray-300 hover:bg-gray-400 w-2.5 h-2.5'
      }`;
    }
    
    return `${baseStyles} ${
      isActive
        ? 'bg-gray-700 w-8 h-3'
        : 'bg-gray-300 hover:bg-gray-500 w-3 h-3'
    }`;
  };

  // Dot container positioning
  const getDotContainerStyles = () => {
    const base = 'flex gap-2';
    switch (dotPosition) {
      case 'left':
        return `${base} justify-start`;
      case 'right':
        return `${base} justify-end`;
      default:
        return `${base} justify-center`;
    }
  };

  // Button container positioning
  const getButtonContainerStyles = () => {
    switch (buttonPosition) {
      case 'bottom-center':
        return 'absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3';
      case 'sides':
        return 'absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6';
      case 'top-right':
        return 'absolute top-6 right-6 flex gap-3';
      default: // bottom-right
        return 'absolute bottom-6 right-6 flex gap-3';
    }
  };

  const buttonStyles = getButtonStyles();

  return (
    <>
      {/* Navigation Buttons */}
      <div className={`hidden md:flex ${getButtonContainerStyles()} ${className}`}>
        <button
          onClick={onPrevious}
          className={`${buttonStyles} ${getPrevButtonHover()}`}
          aria-label="Previous"
        >
          <ChevronLeftIcon className="w-7 h-7 stroke-2" />
        </button>
        <button
          onClick={onNext}
          className={`${buttonStyles} ${getNextButtonHover()}`}
          aria-label="Next"
        >
          <ChevronRightIcon className="w-7 h-7 stroke-2" />
        </button>
      </div>

      {/* Dots Navigation */}
      {showDots && (
        <div className={`mt-6 ${getDotContainerStyles()}`}>
          {Array.from({ length: totalItems }).map((_, index) => (
            <button
              key={index}
              onClick={() => onDotClick?.(index)}
              className={getDotStyles(index === currentIndex)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </>
  );
};
