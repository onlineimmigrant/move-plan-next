/**
 * Type definitions for FooterEditModal
 * Extracted from FooterEditModal.backup.tsx for better organization and reusability
 */

/**
 * Represents a submenu item nested under a menu item
 */
export interface SubMenuItem {
  id: string;
  menu_item_id: string;
  name: string;
  url_name: string;
  description?: string;
  order: number;
  is_displayed?: boolean;
  image?: string | null;
}

/**
 * Represents a top-level menu item with optional submenu items
 */
export interface MenuItem {
  id: string;
  display_name: string;
  url_name: string;
  description?: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  menu_items_are_text: boolean;
  react_icon_id?: string;
  order: number;
  organization_id: string;
  submenu_items?: SubMenuItem[];
  website_submenuitem?: SubMenuItem[]; // Database field name
}

/**
 * Props for the main FooterEditModal component
 */
export interface FooterEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onSave: (updatedItems: MenuItem[]) => Promise<void>;
  organizationId: string;
}

/**
 * Form data structure for footer configuration
 */
export interface FooterFormData {
  menuItems: MenuItem[];
  footerText?: string;
  copyrightText?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

/**
 * Props for sortable menu item card component
 */
export interface MenuItemCardProps {
  item: MenuItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, field: 'display_name' | 'description' | 'url_name', value: string) => void;
  onSubmenuEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onSubmenuToggle: (menuItemId: string, submenuId: string) => void;
  onSubmenuDelete: (menuItemId: string, submenuId: string) => void;
  onAddSubmenu: (menuItemId: string, name: string) => void;
  onSubmenuReorder: (menuItemId: string, submenuItems: SubMenuItem[]) => void;
}

/**
 * Props for submenu list component
 */
export interface SubmenuListProps {
  menuItemId: string;
  submenuItems: SubMenuItem[];
  onSubmenuEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onSubmenuToggle: (menuItemId: string, submenuId: string) => void;
  onSubmenuDelete: (menuItemId: string, submenuId: string) => void;
  onSubmenuReorder: (menuItemId: string, submenuItems: SubMenuItem[]) => void;
}

/**
 * Delete confirmation state
 */
export interface DeleteConfirmation {
  isOpen: boolean;
  type: 'menu' | 'submenu' | null;
  itemId: string | null;
  itemName: string;
  parentId?: string;
}
