import React from 'react';
import LocalizedLink from '@/components/LocalizedLink';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';

interface BasketIconProps {
  totalItems: number;
  headerColor: string;
  headerColorHover: string;
  isMounted: boolean;
  ariaLabel: string;
}

/**
 * BasketIcon component - Shopping cart with item count badge
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const BasketIconComponent: React.FC<BasketIconProps> = ({
  totalItems,
  headerColor,
  headerColorHover,
  isMounted,
  ariaLabel,
}) => {
  if (!isMounted || totalItems === 0) return null;

  return (
    <LocalizedLink
      href="/basket"
      className="cursor-pointer relative group/basket"
      aria-label={ariaLabel}
    >
      <ShoppingCartIcon 
        className="w-6 h-6 transition-colors duration-200" 
        style={{ color: getColorValue(headerColor) }}
        onMouseEnter={(e) => { e.currentTarget.style.color = getColorValue(headerColorHover); }}
        onMouseLeave={(e) => { e.currentTarget.style.color = getColorValue(headerColor); }}
      />
      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center">
        {totalItems}
      </span>
    </LocalizedLink>
  );
};

// Memoized export to prevent unnecessary re-renders
export const BasketIcon = React.memo(BasketIconComponent, (prevProps, nextProps) => {
  // Only re-render if item count changes
  return prevProps.totalItems === nextProps.totalItems;
});
