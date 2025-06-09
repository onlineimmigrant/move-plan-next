export interface ReactIcon {
  icon_name: string;
}

export interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  order: number;
  description?: string;
  is_displayed?: boolean;
  organization_id: string | null;
}

export interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  order: number;
  image?: string;
  react_icon_id?: number;
  react_icons?: ReactIcon | ReactIcon[] | null | undefined; // Updated to include array and null
  website_submenuitem?: SubMenuItem[] | null;
  organization_id: string | null;
}