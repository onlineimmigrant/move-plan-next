'use client';

import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { UnifiedMenuDropdownProps } from './types';
import { UnifiedMenuItem } from './UnifiedMenuItem';
import { getAnimationClasses } from './utils/positioning';
import { getMenuItemsBySection } from './config/menuItems';

/**
 * UnifiedMenuDropdown Component
 * 
 * Dropdown panel containing menu items
 * Uses glass morphism styling to match MeetingsBookingModal
 */
export function UnifiedMenuDropdown({
  items,
  position,
  selectedIndex,
  hoveredIndex,
  onItemClick,
  onHover,
  onClose,
}: UnifiedMenuDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Group items by section
  const { top: topItems, bottom: bottomItems } = getMenuItemsBySection(items);

  // Auto-focus first item when opened
  useEffect(() => {
    if (dropdownRef.current) {
      dropdownRef.current.focus();
    }
  }, []);

  // Handle click outside (for non-mobile)
  useEffect(() => {
    if (isMobile) return; // Mobile uses backdrop

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay adding listener to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobile, onClose]);

  const animationClasses = getAnimationClasses(position.direction, isMobile);

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-[9999] animate-in fade-in duration-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClose();
          }}
          onTouchStart={(e) => e.preventDefault()}
          aria-hidden="true"
        />
      )}

      {/* Menu Container */}
      <div
        ref={dropdownRef}
        className={`
          z-[10000]
          bg-white/30 dark:bg-gray-900/30
          backdrop-blur-2xl
          border border-white/20 dark:border-gray-700/20
          shadow-2xl
          rounded-xl
          outline-none focus:outline-none
          ${animationClasses}
        `}
        style={position.style}
        role="menu"
        aria-label="Unified menu"
        tabIndex={-1}
        onMouseDown={(e) => e.preventDefault()}
      >
        {/* Menu Items Container */}
        <div className={isMobile ? 'max-h-[70vh] overflow-y-auto p-3' : 'p-2'}>
          {/* Regular items (not in bottom row) */}
          {items.slice(0, -2).map((item, index) => (
            <UnifiedMenuItem
              key={item.id}
              item={item}
              isSelected={selectedIndex === index}
              isHovered={hoveredIndex === index}
              onClick={() => onItemClick(item)}
              onHover={() => onHover(index)}
              onLeave={() => onHover(null)}
              isInBottomRow={false}
            />
          ))}
          
          {/* Divider before bottom row */}
          {items.length >= 2 && (
            <div className="border-t border-white/10 dark:border-gray-700/10 my-1" />
          )}
          
          {/* Bottom row - 2 items side by side */}
          {items.length >= 2 && (
            <div className="flex w-full gap-2">
              <UnifiedMenuItem
                key={items[items.length - 2].id}
                item={items[items.length - 2]}
                isSelected={selectedIndex === items.length - 2}
                isHovered={hoveredIndex === items.length - 2}
                onClick={() => onItemClick(items[items.length - 2])}
                onHover={() => onHover(items.length - 2)}
                onLeave={() => onHover(null)}
                isInBottomRow={true}
                positionInBottomRow="left"
              />
              <UnifiedMenuItem
                key={items[items.length - 1].id}
                item={items[items.length - 1]}
                isSelected={selectedIndex === items.length - 1}
                isHovered={hoveredIndex === items.length - 1}
                onClick={() => onItemClick(items[items.length - 1])}
                onHover={() => onHover(items.length - 1)}
                onLeave={() => onHover(null)}
                isInBottomRow={true}
                positionInBottomRow="right"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
