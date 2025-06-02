// /app/types/template_section.ts
export interface TemplateSection {
  id: string;
  section_title: string;
  section_title_color?: string;
  section_title_size?: string;
  section_title_weight?: string;
  section_description?: string;
  section_description_color?: string;
  section_description_size?: string;
  section_description_weight?: string;
  metric_title_color?: string;
  metric_title_size?: string;
  metric_title_weight?: string;
  metric_description_color?: string;
  metric_description_size?: string;
  metric_description_weight?: string;
  background_color?: string;
  font_family?: string;
  grid_columns?: number;
  is_full_width?: boolean;
  is_section_title_aligned_center?: boolean;
  is_section_title_aligned_right?: boolean;
  is_image_bottom?: boolean;
  image_metrics_height?: string;
  order?: number;
  url_page?: string;
  organization_id?: string | null;
  website_metric: any[];
}