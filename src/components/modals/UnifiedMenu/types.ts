// UnifiedMenu Types
// Defines all interfaces and types for the unified menu system

import { ComponentType } from 'react';

/**
 * Menu direction for positioning
 * Determines where the menu appears relative to the trigger button
 */
export type MenuDirection = 'top' | 'bottom' | 'left' | 'right';

/**
 * Menu position preference
 * Where the trigger button is positioned on the screen
 */
export type MenuPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

/**
 * Menu section for organizing items
 */
export type MenuSection = 'top' | 'bottom';

/**
 * Menu item configuration
 * Defines a single menu item with its properties and permissions
 */
export interface MenuItemConfig {
  /** Unique identifier for the menu item */
  id: string;
  
  /** Display label */
  label: string;
  
  /** Optional description (shown as subtitle) */
  description?: string;
  
  /** Heroicon component for the menu item */
  icon: ComponentType<{ className?: string; style?: React.CSSProperties }>;
  
  /** Action to execute when item is clicked */
  action: () => void;
  
  // Permission Requirements
  /** Requires user to be authenticated */
  requireAuth: boolean;
  
  /** Requires admin or superadmin role */
  requireAdmin: boolean;
  
  /** Requires superadmin role specifically (not just admin) */
  requireSuperadmin?: boolean;
  
  /** Optional feature flag requirement */
  requireFeature?: string;
  
  // UI Properties
  /** Badge content (number or string) - can be a function for dynamic values */
  badge?: (() => number | string | null) | number | string | null;
  
  /** Preferred section (top or bottom of menu) */
  section?: MenuSection;
  
  /** Custom color override (uses theme primary by default) */
  color?: string;
  
  /** Hide this item even if permissions allow */
  hidden?: boolean;
}

/**
 * Calculated menu position with styles
 */
export interface CalculatedMenuPosition {
  direction: MenuDirection;
  style: React.CSSProperties;
}

/**
 * User permission context for filtering menu items
 */
export interface PermissionContext {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  organizationId: string | null;
}

/**
 * Menu state for tracking open/closed and active items
 */
export interface MenuState {
  isOpen: boolean;
  selectedIndex: number;
  hoveredIndex: number | null;
}

/**
 * Props for UnifiedMenu component
 */
export interface UnifiedMenuProps {
  /** Custom menu items (overrides defaults) */
  items?: MenuItemConfig[];
  
  /** Position of the trigger button */
  position?: MenuPosition;
  
  /** Callback when menu item is clicked */
  onItemClick?: (item: MenuItemConfig) => void;
  
  /** Show badge count on trigger button */
  showBadge?: boolean;
  
  /** Custom class for trigger button */
  className?: string;
}

/**
 * Props for UnifiedMenuButton
 */
export interface UnifiedMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  position: MenuPosition;
  badgeCount?: number | string | null;
  className?: string;
}

/**
 * Props for UnifiedMenuDropdown
 */
export interface UnifiedMenuDropdownProps {
  items: MenuItemConfig[];
  position: CalculatedMenuPosition;
  selectedIndex: number;
  hoveredIndex: number | null;
  onItemClick: (item: MenuItemConfig) => void;
  onHover: (index: number | null) => void;
  onClose: () => void;
}

/**
 * Props for UnifiedMenuItem
 */
export interface UnifiedMenuItemProps {
  item: MenuItemConfig;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  /** Is this item in the bottom row (2-item row) */
  isBottomRow?: boolean;
  /** Is this item part of bottom row */
  isInBottomRow?: boolean;
  /** Position in bottom row (left or right) */
  positionInBottomRow?: 'left' | 'right';
}
