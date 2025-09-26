// /lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { getBaseUrl } from './utils';
import { Banner, BannerOpenState, BannerPosition, BannerType } from '../components/banners/types';
import { Organization } from './types';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  throw new Error('Supabase configuration incomplete');
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getOrganizationId(baseUrl?: string): Promise<string | null> {
  const isLocal = process.env.NODE_ENV === 'development';
  const currentUrl = baseUrl || getBaseUrl(true); // Use getBaseUrl for Vercel compatibility
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

  console.log('Fetching organization ID for URL:', currentUrl, 'isLocal:', isLocal, 'tenantId:', tenantId);

  // Try fetching by base_url or base_url_local
  const query = supabase
    .from('organizations')
    .select('id, type')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl);

  const { data, error } = await query.single();

  if (error || !data) {
    console.error('Error fetching organization by baseUrl:', {
      message: error?.message || 'No error message',
      code: error?.code || 'No code',
      details: error?.details || 'No details',
      hint: error?.hint || 'No hint',
      baseUrl: currentUrl,
    });

    // Fallback to tenantId if provided
    if (tenantId) {
      console.log('Attempting fallback with tenantId:', tenantId);
      const { data: tenantData, error: tenantError } = await supabase
        .from('organizations')
        .select('id, type')
        .eq('tenant_id', tenantId)
        .single();

      if (tenantError || !tenantData) {
        console.error('Error fetching organization by tenantId:', {
          message: tenantError?.message || 'No error message',
          code: tenantError?.code || 'No code',
          details: tenantError?.details || 'No details',
          hint: tenantError?.hint || 'No hint',
          tenantId,
        });
        return null;
      }

      console.log('Fetched organization ID by tenantId:', tenantData.id);
      return tenantData.id;
    }

    return null;
  }

  console.log('Fetched organization ID by baseUrl:', data.id);
  return data.id;
}

export async function getOrganizationWithType(baseUrl?: string): Promise<{ id: string; type: string } | null> {
  const isLocal = process.env.NODE_ENV === 'development';
  const currentUrl = baseUrl || getBaseUrl(true); // Use getBaseUrl for Vercel compatibility
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;

  console.log('Fetching organization with type for URL:', currentUrl, 'isLocal:', isLocal, 'tenantId:', tenantId);

  // Try fetching by base_url or base_url_local
  const query = supabase
    .from('organizations')
    .select('id, type')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl);

  const { data, error } = await query.single();

  if (error || !data) {
    console.error('Error fetching organization by baseUrl:', {
      message: error?.message || 'No error message',
      code: error?.code || 'No code',
      details: error?.details || 'No details',
      hint: error?.hint || 'No hint',
      baseUrl: currentUrl,
    });

    // Fallback to direct ID lookup with tenantId if provided
    if (tenantId && isValidUUID(tenantId)) {
      console.log('Attempting fallback with tenantId as direct ID:', tenantId);
      const { data: tenantData, error: tenantError } = await supabase
        .from('organizations')
        .select('id, type')
        .eq('id', tenantId)
        .single();

      if (tenantError || !tenantData) {
        console.error('Error fetching organization by ID:', {
          message: tenantError?.message || 'No error message',
          code: tenantError?.code || 'No code',
          details: tenantError?.details || 'No details',
          hint: tenantError?.hint || 'No hint',
          tenantId,
        });
        return null;
      }

      console.log('Fetched organization with type by ID:', tenantData.id, tenantData.type);
      return { id: tenantData.id, type: tenantData.type };
    }

    return null;
  }

  console.log('Fetched organization with type by baseUrl:', data.id, data.type);
  return { id: data.id, type: data.type };
}

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
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
  if (!pattern.endsWith('/*')) {
    return path === pattern;
  }
  const prefix = pattern.slice(0, -2); // Remove '/*'
  return path === prefix || path.startsWith(prefix + '/');
};


//fetch userProfile
// /lib/supabase.ts (updated fetchUserProfile)
export async function fetchUserProfile(userId?: string) {
  if (!userId) {
    console.log('No userId provided, skipping profile fetch');
    return null;
  }

  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      console.log('No organization found, skipping profile fetch');
      return null;
    }

    console.log('Query inputs:', {
      userId,
      organizationId,
      isUserIdValid: !!userId,
      isOrgIdValid: !!organizationId,
      timestamp: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('profiles')
      .select('user_status, role, last_login_at, organization_id') // Added role
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', {
        rawError: error,
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        userId,
        organizationId,
        query: 'SELECT user_status, role, last_login_at, organization_id FROM profiles WHERE id = :userId AND organization_id = :organizationId',
      });
      return null;
    }

    if (!data) {
      console.log(`No profile found for userId: ${userId}, organizationId: ${organizationId}`);
      return null;
    }

    console.log('Profile fetched:', data);
    return data;
  } catch (err) {
    console.error('Unexpected error fetching profile:', {
      error: err,
      userId,
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}


// Fetch banners
export async function fetchBanners(pagePath?: string, userId?: string): Promise<Banner[]> {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      console.log('No organization found, skipping banner fetch');
      return [];
    }

    console.log(`Fetching banners for pagePath: ${pagePath}, userId: ${userId}, organizationId: ${organizationId}`);
    const profile = await fetchUserProfile(userId);
    const userStatus = profile?.user_status || 'anonymous';
    const isReturning = profile?.last_login_at && new Date(profile.last_login_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'returning' : null;

    const targetAudiences = [userStatus];
    if (isReturning) targetAudiences.push('returning');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('banners')
      .select('id, position, type, content, open_state, landing_content, page_paths, is_active, start_at, end_at, priority, target_audience, dismissal_duration, is_fixed_above_navbar, end_date_promotion, end_date_promotion_is_displayed')
      .eq('is_active', true)
      .eq('organization_id', organizationId)
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
        organizationId,
      });
      return [];
    }

    console.log('Raw banners from Supabase:', JSON.stringify(data, null, 2));

    const dismissedIds = await fetchDismissedBanners(userId);

    // Filter banners by page_paths (including wildcard matching)
    const filteredBanners = data.filter((banner) => {
      if (!pagePath || !banner.page_paths) return true; // NULL page_paths means all pages
      return banner.page_paths.some((path: string) => matchesPathPattern(pagePath, path));
    });

    return filteredBanners.map((banner) => ({
      id: banner.id,
      position: banner.position as BannerPosition,
      type: banner.type as 'permanent' | 'closed',
      is_enabled: banner.is_active, // Map is_active to is_enabled
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
      dismissal_duration: banner.dismissal_duration,
      isOpen: false, // Default, managed by BannerContext
      isDismissed: dismissedIds.includes(banner.id),
      isFixedAboveNavbar: Boolean(banner.is_fixed_above_navbar ?? false),
      is_fixed_above_navbar: Boolean(banner.is_fixed_above_navbar ?? false),
      end_date_promotion: banner.end_date_promotion,
      end_date_promotion_is_displayed: Boolean(banner.end_date_promotion_is_displayed ?? false),
    }));
  } catch (err) {
    console.error('Unexpected error fetching banners:', err);
    return [];
  }
}

// Fetch dismissed banners
export async function fetchDismissedBanners(userId?: string): Promise<string[]> {
  try {
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      console.log('No organization found, skipping dismissed banners fetch');
      return [];
    }

    const now = new Date().toISOString();
    const query = supabase
      .from('banner_dismissals')
      .select('banner_id')
      .eq('organization_id', organizationId)
      .or(userId ? `user_id.eq.${userId},is_global.eq.true` : 'is_global.eq.true')
      .gte('expires_at', now);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching dismissed banners:', {
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        organizationId,
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
    const organizationId = await getOrganizationId();
    if (!organizationId) {
      console.log('No organization found, skipping banner dismissal');
      return;
    }

    const expiresAt = new Date(Date.now() + parseIntervalToMs(dismissalDuration));
    const { error } = await supabase.from('banner_dismissals').insert({
      banner_id: bannerId,
      user_id: userId,
      is_global: userId === null,
      organization_id: organizationId,
      expires_at: expiresAt.toISOString(),
    });

    if (error) {
      console.error('Error dismissing banner:', {
        message: error.message || 'No error message provided',
        code: error.code || 'No error code',
        details: error.details || 'No details',
        hint: error.hint || 'No hint',
        organizationId,
      });
    }
  } catch (err) {
    console.error('Unexpected error dismissing banner:', err);
  }
}