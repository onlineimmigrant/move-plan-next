import { createClient } from '@supabase/supabase-js';
import { Banner, BannerOpenState, BannerPosition, BannerType } from '../components/banners/types';

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
  if (!pattern.endsWith('/*')) {
    return path === pattern;
  }
  const prefix = pattern.slice(0, -2); // Remove '/*'
  return path === prefix || path.startsWith(prefix + '/');
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Fetch user profile
export async function fetchUserProfile(userId?: string) {
  if (!userId) {
    console.log('No userId provided, skipping profile fetch');
    return null;
  }

  try {
    console.log(`Fetching profile for userId: ${userId}`);
    const { data, error } = await supabase
      .from('profiles')
      .select('user_status, last_login_at')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', {
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        userId,
      });
      return null;
    }

    console.log('Profile fetched:', data);
    return data;
  } catch (err) {
    console.error('Unexpected error fetching profile:', err, { userId });
    return null;
  }
}

// Fetch banners
export async function fetchBanners(pagePath?: string, userId?: string): Promise<Banner[]> {
  try {
    console.log(`Fetching banners for pagePath: ${pagePath}, userId: ${userId}`);
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
      console.error('Error fetching banners:', {
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
      });
      return [];
    }

    console.log('Fetched banners:', data);

    const dismissedIds = await fetchDismissedBanners(userId);

    // Filter banners by page_paths (including wildcard matching)
    const filteredBanners = data.filter((banner) => {
      if (!pagePath || !banner.page_paths) return true; // NULL page_paths means all pages
      return banner.page_paths.some((path: string) => matchesPathPattern(pagePath, path));
    });

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
  } catch (err) {
    console.error('Unexpected error fetching banners:', err);
    return [];
  }
}

// Fetch dismissed banners
export async function fetchDismissedBanners(userId?: string): Promise<string[]> {
  try {
    const now = new Date().toISOString();
    const query = supabase
      .from('banner_dismissals')
      .select('banner_id')
      .or(userId ? `user_id.eq.${userId},is_global.eq.true` : 'is_global.eq.true')
      .gte('expires_at', now);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dismissed banners:', {
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
      });
      return [];
    }

    return data.map((dismissal) => dismissal.banner_id);
  } catch (err) {
    console.error('Unexpected error fetching dismissed banners:', err);
    return [];
  }
}

// Dismiss a banner
export async function dismissBanner(bannerId: string, userId: string | null, dismissalDuration: string | undefined) {
  try {
    const expiresAt = new Date(Date.now() + parseIntervalToMs(dismissalDuration));
    const { error } = await supabase.from('banner_dismissals').insert({
      banner_id: bannerId,
      user_id: userId,
      is_global: userId === null,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error('Error dismissing banner:', {
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
      });
    }
  } catch (err) {
    console.error('Unexpected error dismissing banner:', err);
  }
}