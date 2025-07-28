// /app/types/template_heading_section.ts
export interface TemplateHeadingSection {
  id: string;
  name: string;
  name_part_2?: string;
  name_part_3?: string;
  description_text: string;
  button_text?: string;
  url?: string;
  url_page: string;
  image?: string;
  image_first?: boolean;
  is_included_template_sections_active?: boolean;
  organization_id: string | null;
  style_variant?: 'default' | 'minimal' | 'bold' | 'creative' | 'professional' | 'modern' | 'clean';
  text_style_variant?: 'default' | 'minimal' | 'bold' | 'creative' | 'professional' | 'modern' | 'elegant' | 'compact' | 'apple';
}