export type BannerPosition = 'top' | 'bottom' | 'left' | 'right';
export type BannerOpenState = 'full' | 'left-half' | 'right-half' | 'top-half' | 'bottom-half';
export type BannerType = 'permanent' | 'closed';

export interface BannerContent {
  text: string;
  link?: { url: string; label: string; isExternal?: boolean };
  icon?: string; // URL to image
  customContent?: string; // Raw HTML with TailwindCSS classes
}

export interface Banner {
  id: string;
  position: BannerPosition;
  type: BannerType;
  content: BannerContent;
  openState?: BannerOpenState; // Optional, only if banner can be opened
  isOpen?: boolean; // Controlled by context
  isDismissed?: boolean; // For closed banners
  pagePath?: string; // Optional, from Supabase schema
}