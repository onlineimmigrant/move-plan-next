// /app/types/template_heading_section.ts
export interface TemplateHeadingSection {
  id: string;
  name: string;
  name_translation?: Record<string, string>;
  name_part_2?: string;
  name_part_3?: string;
  description_text: string;
  description_text_translation?: Record<string, string>;
  button_text?: string;
  button_text_translation?: Record<string, string>;
  url?: string;
  url_page: string;
  image?: string;
  image_first?: boolean;
  is_included_template_sections_active?: boolean;
  organization_id: string | null;
  style_variant?: 'default' | 'clean';
  text_style_variant?: 'default' | 'apple';
}