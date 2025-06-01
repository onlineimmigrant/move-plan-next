export interface Font {
  id: number;
  name: string;
  description: string | null;
  default_type: boolean;
  created_at: string;
}

export interface Color {
  id: number;
  name: string;
  hex: string;
  img_color: string | null;
  created_at: string;
}

export interface Size {
  id: number;
  name: string;
  value: number;
  description: string | null;
  created_at: string;
}

export interface Settings {
  site: string | null | undefined; // Simplified to match usage
  id: number;
  organization_id: string;
  image: string;
  menu_width: string;
  menu_items_are_text: boolean;
  footer_color: string;
}