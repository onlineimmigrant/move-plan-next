export type BannerOpenState =
  | 'absent'
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
  | 'bottom-70';

export type BannerPosition = 'top' | 'bottom' | 'left' | 'right';

export interface BannerContent {
  text: string;
  icon?: string;
  link?: {
    url: string;
    label: string;
    isExternal?: boolean;
  };
  customContent?: string;
  banner_background?: string;
  banner_content_style?: string;
}

export interface Banner {
  id: string;
  position: BannerPosition;
  type: 'permanent' | 'closed';
  is_enabled: boolean;
  content: BannerContent;
  landing_content?: string;
  openState?: BannerOpenState;
  dismissal_duration?: string;
  page_paths?: string[] | null;
  isOpen: boolean;
  isDismissed: boolean;
  isFixedAboveNavbar: boolean;
  is_fixed_above_navbar?: boolean; // Match Supabase column
  organization_id?: string;
  end_date_promotion?: string;
  end_date_promotion_is_displayed?: boolean;
}

// Deprecate BannerType in favor of Banner
export type BannerType = Banner;