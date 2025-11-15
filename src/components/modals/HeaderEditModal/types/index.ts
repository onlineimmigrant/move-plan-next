/**
 * Type definitions for HeaderEditModal
 * Shared interfaces for menu items, submenu items, and header styles
 */

export interface HeaderStyleFull {
  type: 'default' | 'transparent' | 'fixed' | 'mini' | 'ring_card_mini';
  background: string;
  color: string;
  color_hover: string;
  menu_width: '7xl' | 'full' | '6xl' | '5xl';
  menu_items_are_text: boolean;
  logo_height: 'h-8' | 'h-10' | 'h-12' | 'h-16';
  is_gradient: boolean;
  gradient?: {
    from: string;
    to: string;
    direction: string;
  };
  logo?: string | null;
  logo_position?: 'left' | 'center' | 'right';
}

export interface SubMenuItem {
  id: string;
  menu_item_id: string;
  name: string;
  name_translation?: Record<string, any>;
  url_name: string;
  description?: string;
  description_translation?: Record<string, any>;
  image?: string | null;
  order: number;
  is_displayed?: boolean;
  organization_id?: string;
}

export interface MenuItem {
  id: string;
  display_name: string;
  display_name_translation?: Record<string, any>;
  url_name: string;
  description?: string;
  description_translation?: Record<string, any>;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  menu_items_are_text: boolean;
  react_icon_id?: string;
  order: number;
  organization_id: string;
  submenu_items?: SubMenuItem[];
  website_submenuitem?: SubMenuItem[];
}
