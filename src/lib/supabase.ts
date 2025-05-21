import { createClient } from '@supabase/supabase-js';
import { Banner, BannerOpenState, BannerPosition, BannerType } from '../components/banners/types';

// Define the raw banner type returned by Supabase
interface RawBanner {
  id: string;
  position: string;
  type: string;
  content: {
    text: string;
    link?: { url: string; label: string; isExternal?: boolean };
    icon?: string;
    customContent?: string;
    banner_background?: string;
    banner_content_style?: string;
  };
  open_state: string;
  landing_content?: string;
  page_paths: string[] | null; // Explicitly type page_paths
  is_active: boolean;
  start_at: string;
  end_at?: string | null;
  priority: number;
  target_audience: string[];
  dismissal_duration?: string;
}

// Parse interval string to milliseconds
const parseIntervalToMs = (interval: string | undefined): number => {
  if (!interval) return 60 * 1000; // Default: 1 minute
  const match = interval.match(/^(\d+)\s*(minute|minutes|hour|hours|day|days|month|months|year|years)$/i);
  if (!match) return 60 * 1000; // Fallback: 1 minute
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 'minute':
    case 'minutes':
      return value * 60 * 1000;
    case 'hour':
    case 'hours':
      return value * 60 * 60 * 1000;
    case 'day':
    case 'days':
      return value * 24 * 60 * 60 * 1000;
    case 'month':
    case 'months':
      return value * 30 * 24 * 60 * 60 * 1000; // Approximate
    case 'year':
    case 'years':
      return value * 365 * 24 * 60 * 60 * 1000; // Approximate
    default:
      return 60 * 1000; // Fallback
  }
};

// Match path against pattern (e.g., /product/*)
const matchesPathPattern = (path: string, pattern: string): boolean => {
  // Normalize paths: remove query parameters and trailing slashes
  const normalizedPath = path.split('?')[0].replace(/\/+$/, '');
  const normalizedPattern = pattern.replace(/\/+$/, '');
  if (!normalizedPattern.endsWith('/*')) {
    console.log(`Exact match check: path=${normalizedPath}, pattern=${normalizedPattern}, result=${normalizedPath === normalizedPattern}`);
    return normalizedPath === normalizedPattern;
  }
  const prefix = normalizedPattern.slice(0, -2); // Remove '/*'
  const result = normalizedPath === prefix || normalizedPath.startsWith(prefix + '/');
  console.log(`Wildcard match check: path=${normalizedPath}, pattern=${normalizedPattern}, prefix=${prefix}, result=${result}`);
  return result;
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch user profile
export async function fetchUserProfile(userId?: string) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('user_status, last_login_at')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
}

// Fetch banners
export async function fetchBanners(pagePath?: string, userId?: string): Promise<Banner[]> {
  const profile = await fetchUserProfile(userId);
  const userStatus = profile?.user_status || 'anonymous';
  const isReturning = profile?.last_login_at && new Date(profile.last_login_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'returning' : null;

  const targetAudiences = [userStatus];
  if (isReturning) targetAudiences.push('returning');

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('banners')
    .select('id, position, type, content, open_state, landing_content, page_paths, is_active, start_at, end_at, priority, target_audience, dismissal_duration')
    .eq('is_active', true)
    .lte('start_at', now)
    .or(`end_at.is.null,end_at.gte.${now}`)
    .overlaps('target_audience', targetAudiences)
    .order('priority', { ascending: true });

  if (error) {
    console.error('Error fetching banners:', error);
    return [];
  }

  console.log('Fetched banners:', data);

  const dismissedIds = await fetchDismissedBanners(userId);

  // Filter banners by page_paths (including wildcard matching)
  const filteredBanners = (data as RawBanner[]).filter((banner) => {
    if (!pagePath || !banner.page_paths) {
      console.log(`Banner ${banner.id} included: pagePath=${pagePath}, banner.page_paths=${banner.page_paths} (NULL means all pages)`);
      return true; // NULL page_paths means all pages
    }
    const matches = banner.page_paths.some((path: string) => matchesPathPattern(pagePath, path));
    console.log(`Banner ${banner.id} path match: pagePath=${pagePath}, banner.page_paths=${banner.page_paths}, matches=${matches}`);
    return matches;
  });

  console.log('Filtered banners:', filteredBanners);

  return filteredBanners.map((banner) => ({
    id: banner.id,
    position: banner.position as BannerPosition,
    type: banner.type as BannerType,
    content: {
      text: banner.content.text,
      link: banner.content.link
        ? {
            url: banner.content.link.url,
            label: banner.content.link.label,
            isExternal: banner.content.link.isExternal,
          }
        : undefined,
      icon: banner.content.icon,
      customContent: banner.content.customContent,
      banner_background: banner.content.banner_background,
      banner_content_style: banner.content.banner_content_style,
    },
    openState: banner.open_state as BannerOpenState,
    landing_content: banner.landing_content,
    page_paths: banner.page_paths,
    isDismissed: dismissedIds.includes(banner.id),
    dismissal_duration: banner.dismissal_duration,
  }));
}

// Fetch dismissed banners
export async function fetchDismissedBanners(userId?: string): Promise<string[]> {
  const now = new Date().toISOString();
  const query = supabase
    .from('banner_dismissals')
    .select('banner_id')
    .or(userId ? `user_id.eq.${userId},is_global.eq.true` : 'is_global.eq.true')
    .gte('expires_at', now);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching dismissed banners:', error);
    return [];
  }

  return data.map((dismissal) => dismissal.banner_id);
}

// Dismiss a banner
export async function dismissBanner(bannerId: string, userId: string | null, dismissalDuration: string | undefined) {
  const expiresAt = new Date(Date.now() + parseIntervalToMs(dismissalDuration));
  const { error } = await supabase.from('banner_dismissals').insert({
    banner_id: bannerId,
    user_id: userId,
    is_global: userId === null,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Error dismissing banner:', error);
  }
}