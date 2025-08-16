export interface ReactIcon {
  icon_name: string;
}

export interface SubMenuItem {
  id: number;
  menu_item_id: number; // Updated field name to match database
  name: string;
  name_translation?: Record<string, string>;
  url_name: string; // Updated field name to match database
  order: number; // Updated field name to match database
  description?: string;
  description_translation?: Record<string, string>;
  is_displayed?: boolean; // Added missing property
  is_new_window?: boolean;
  image?: string | null; // Added image field for submenu item icons
  organization_id?: string | null;
}

export interface MenuItem {
  id: number;
  display_name: string; // Updated field name to match database
  display_name_translation?: Record<string, string>;
  url_name: string; // Updated field name to match database
  is_displayed: boolean; // Updated field name to match database
  is_displayed_on_footer?: boolean; // Added missing property
  is_new_window?: boolean;
  order: number; // Updated field name to match database
  created_at?: string;
  description?: string;
  description_translation?: Record<string, string>;
  icon_name?: string | null;
  react_icons?: ReactIcon | ReactIcon[] | null; // Added missing property for react icons
  website_submenuitem?: SubMenuItem[]; // Updated field name to match database
  organization_id: string | null;
  image?: string | null; // Added image field for menu item icons
  
  // Legacy aliases for backward compatibility
  name?: string;
  name_translation?: Record<string, string>;
  url?: string;
  is_visible?: boolean;
  order_position?: number;
  submenu_items?: SubMenuItem[];
}