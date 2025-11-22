export interface HeroData {
  id?: string;
  organization_id: string;
  name?: string;
  title: string;
  description: string;
  image?: string | null;
  button?: string;
  animation_element?: string;
  // Video background fields
  is_video?: boolean;
  video_url?: string;
  video_player?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
  video_thumbnail?: string | null;
  title_style: {
    font?: string;
    color?: string;
    gradient?: { from: string; via?: string; to: string };
    size?: { desktop: string; mobile: string };
    alignment?: string;
    blockWidth?: string;
    blockColumns?: number;
  };
  description_style: {
    font?: string;
    color?: string;
    size?: { desktop: string; mobile: string };
    weight?: string;
  };
  image_style: {
    position?: string;
    fullPage?: boolean;
  };
  background_style: {
    color?: string;
    gradient?: { from: string; via?: string; to: string };
    seo_title?: string;
    column?: number;
  };
  button_style: {
    aboveDescription?: boolean;
    isVideo?: boolean;
    url?: string;
    color?: string;
    gradient?: { from: string; via?: string; to: string };
  };
  title_translation?: Record<string, string>;
  description_translation?: Record<string, string>;
  button_translation?: Record<string, string>;
}