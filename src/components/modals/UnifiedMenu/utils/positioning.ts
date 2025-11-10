// Menu Positioning Utilities
// Smart viewport-aware positioning for the menu dropdown

import { MenuDirection, CalculatedMenuPosition } from '../types';

/**
 * Calculate the optimal menu position based on available viewport space
 * 
 * @param buttonRect - Bounding rectangle of the trigger button
 * @param menuWidth - Expected menu width (default 160px for desktop, 50% for mobile)
 * @param menuHeight - Expected menu height (auto-calculated based on content)
 * @returns Calculated position with direction and styles
 */
export function calculateMenuPosition(
  buttonRect: DOMRect,
  menuWidth: number = 160,
  menuHeight: number = 400
): CalculatedMenuPosition {
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const padding = 16; // Minimum padding from viewport edges

  // Calculate available space in each direction
  const space = {
    top: buttonRect.top - padding,
    bottom: viewport.height - buttonRect.bottom - padding,
    left: buttonRect.left - padding,
    right: viewport.width - buttonRect.right - padding,
  };

  // Determine optimal direction
  let direction: MenuDirection;
  
  // On mobile (< 768px), prefer top/bottom
  const isMobile = viewport.width < 768;
  
  if (isMobile) {
    // Mobile: prefer bottom, fallback to top
    if (space.bottom >= menuHeight || space.bottom > space.top) {
      direction = 'bottom';
    } else {
      direction = 'top';
    }
  } else {
    // Desktop: check all directions, prefer top/bottom
    if (space.top >= menuHeight) {
      direction = 'top';
    } else if (space.bottom >= menuHeight) {
      direction = 'bottom';
    } else if (space.left >= menuWidth) {
      direction = 'left';
    } else if (space.right >= menuWidth) {
      direction = 'right';
    } else {
      // Fallback: use direction with most space
      const maxSpace = Math.max(space.top, space.bottom, space.left, space.right);
      if (maxSpace === space.top) direction = 'top';
      else if (maxSpace === space.bottom) direction = 'bottom';
      else if (maxSpace === space.left) direction = 'left';
      else direction = 'right';
    }
  }

  // Calculate styles based on direction
  const style = calculateStylesForDirection(direction, buttonRect, menuWidth, menuHeight, viewport);

  return { direction, style };
}

/**
 * Calculate CSS styles for the menu based on direction
 */
function calculateStylesForDirection(
  direction: MenuDirection,
  buttonRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
  viewport: { width: number; height: number }
): React.CSSProperties {
  const isMobile = viewport.width < 768;
  
  // On mobile, use 50% width aligned to right with space from bottom
  if (isMobile) {
    return {
      position: 'fixed',
      bottom: '80px', // Space from bottom (matching button height + padding)
      right: '16px', // Align to right with padding
      width: '50%',
      maxHeight: '60vh',
      overflowY: 'auto',
    };
  }

  // Desktop positioning - fixed 200px width for stability
  const style: React.CSSProperties = {
    position: 'fixed',
    width: '200px',
    minWidth: '200px',
    maxWidth: '200px',
  };

  switch (direction) {
    case 'top':
      style.bottom = `${viewport.height - buttonRect.top + 8}px`;
      style.right = `${viewport.width - buttonRect.right}px`;
      break;

    case 'bottom':
      style.top = `${buttonRect.bottom + 8}px`;
      style.right = `${viewport.width - buttonRect.right}px`;
      break;

    case 'left':
      style.right = `${viewport.width - buttonRect.left + 8}px`;
      style.top = `${buttonRect.top}px`;
      break;

    case 'right':
      style.left = `${buttonRect.right + 8}px`;
      style.top = `${buttonRect.top}px`;
      break;
  }

  return style;
}

/**
 * Get animation classes based on menu direction
 */
export function getAnimationClasses(direction: MenuDirection, isMobile: boolean): string {
  if (isMobile) {
    return 'animate-in fade-in slide-in-from-right-4 duration-200';
  }

  switch (direction) {
    case 'top':
      return 'animate-in fade-in slide-in-from-bottom-4 duration-200';
    case 'bottom':
      return 'animate-in fade-in slide-in-from-top-4 duration-200';
    case 'left':
      return 'animate-in fade-in slide-in-from-right-4 duration-200';
    case 'right':
      return 'animate-in fade-in slide-in-from-left-4 duration-200';
    default:
      return 'animate-in fade-in duration-200';
  }
}

/**
 * Calculate button position styles based on position preference
 */
export function getButtonPositionStyles(position: string): React.CSSProperties {
  const baseZ = 9998; // Same as existing floating buttons

  switch (position) {
    case 'bottom-right':
      return {
        position: 'fixed',
        bottom: '1rem',
        right: '1.5rem',
        zIndex: baseZ,
      };

    case 'bottom-left':
      return {
        position: 'fixed',
        bottom: '1rem',
        left: '1.5rem',
        zIndex: baseZ,
      };

    case 'top-right':
      return {
        position: 'fixed',
        top: '1rem',
        right: '1.5rem',
        zIndex: baseZ,
      };

    case 'top-left':
      return {
        position: 'fixed',
        top: '1rem',
        left: '1.5rem',
        zIndex: baseZ,
      };

    default:
      return {
        position: 'fixed',
        bottom: '1rem',
        right: '1.5rem',
        zIndex: baseZ,
      };
  }
}
