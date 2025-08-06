// /app/types/hero_data.ts
export interface HeroData {
  id?: string;
  organization_id: string;
  name?: string;
  font_family?: string;
  h1_title: string;
  h1_title_translation?: Record<string, string>;
  h1_text_color: string;
  h1_text_color_gradient_from?: string;
  h1_text_color_gradient_to?: string;
  h1_text_color_gradient_via?: string;
  is_h1_gradient_text?: boolean;
  p_description: string;
  p_description_translation?: Record<string, string>;
  p_description_color: string;
  p_description_size?: string;
  p_description_size_mobile?: string;
  p_description_weight?: string;
  background_color?: string;
  background_color_gradient_from?: string;
  background_color_gradient_to?: string;
  background_color_gradient_via?: string;
  is_bg_gradient?: boolean;
  h1_text_size?: string;
  h1_text_size_mobile?: string;
  title_alighnement?: string;
  title_block_width?: string;
  title_block_columns?: number;
  is_image_full_page?: boolean;
  is_seo_title?: boolean;
  seo_title?: string;
  image?: string | null;
  image_first?: boolean;
  button_main_get_started?: string;
  button_explore?: string;
  animation_element?: string;
}