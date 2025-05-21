export type BannerPosition = 'top' | 'bottom' | 'left' | 'right';
export type BannerOpenState =
  | 'full'
  | 'left-half'
  | 'right-half'
  | 'top-half'
  | 'bottom-half'
  | 'left-30'
  | 'left-70'
  | 'right-30'
  | 'right-70'
  | 'top-30'
  | 'top-70'
  | 'bottom-30'
  | 'bottom-70'
  | 'absent';
export type BannerType = 'permanent' | 'closed';

export interface BannerContent {
  text: string;
  link?: { url: string; label: string; isExternal?: boolean };
  icon?: string; // URL to image
  customContent?: string; // Raw HTML with TailwindCSS classes
  banner_background?: string; // TailwindCSS class, e.g., 'bg-red-500'
  banner_content_style?: string; // TailwindCSS class, e.g., 'space-x-6'
}

export interface Banner {
  id: string;
  position: BannerPosition;
  type: BannerType;
  content: BannerContent;
  openState?: BannerOpenState;
  landing_content?: string; // HTML landing page content
  isOpen?: boolean;
  isDismissed?: boolean;
  page_paths?: string[] | null; // Updated to array of paths or null
  dismissal_duration?: string; // Interval string, e.g., '1 minute', '1 day'
}