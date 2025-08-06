// /app/types/hero_data.ts
export interface HeroData {
  organization_id: string;
  h1_title: string;
  h1_text_color: string;
  p_description: string;
  p_description_color: string;
  background_color: string;
  h1_text_size: string;
  h1_text_size_mobile: string;
  p_description_size: string;
  p_description_size_mobile: string;
  title_alighnement: string;
  title_block_width: string;
  title_block_columns: number;
  p_description_weight: string;
  is_h1_gradient_text: boolean;
  is_bg_gradient: boolean;
  is_image_full_page: boolean;
  is_seo_title: boolean;
  image_first: boolean;
}