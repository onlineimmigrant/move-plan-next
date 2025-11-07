/**
 * Custom hook for managing hover background colors
 * Provides mouse enter/leave handlers and computed background color
 * 
 * @param hoverColor - Color to use when hovering
 * @param defaultColor - Color to use when not hovering
 * @returns Object with background color and event handlers
 * 
 * @example
 * ```tsx
 * const { backgroundColor, onMouseEnter, onMouseLeave } = useHoverBackground(
 *   'rgba(59, 130, 246, 0.1)',
 *   'transparent'
 * );
 * 
 * <div
 *   style={{ backgroundColor }}
 *   onMouseEnter={onMouseEnter}
 *   onMouseLeave={onMouseLeave}
 * >
 *   Hoverable content
 * </div>
 * ```
 */

import { useState } from 'react';

export function useHoverBackground(hoverColor: string, defaultColor: string = '') {
  const [isHovered, setIsHovered] = useState(false);

  return {
    backgroundColor: isHovered ? hoverColor : defaultColor,
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };
}
