// /app/types/hero_data.ts
export interface HeroData {
  id?: string;
  organization_id: string;
  name?: string;
  title: string;
  description: string;
  image?: string | null;
  button?: string;
  animation_element?: string;
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