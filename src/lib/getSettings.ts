import { supabase } from './supabase';
import { Settings } from '@/types/settings';
import { Organization } from './types';
import { cache } from 'react';

type UUID = string;

// Cache for organization ID to reuse successful fetches
const organizationIdCache = new Map<string, UUID>();

function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function getOrganizationId(reqOrBaseUrl?: { headers: { host?: string } } | string): Promise<UUID | null> {
  let currentUrl: string | undefined;

  if (typeof reqOrBaseUrl === 'string') {
    currentUrl = reqOrBaseUrl;
  } else if (reqOrBaseUrl && 'headers' in reqOrBaseUrl && reqOrBaseUrl.headers.host) {
    currentUrl = `https://${reqOrBaseUrl.headers.host}`;
  } else {
    currentUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }

  const isLocal = process.env.NODE_ENV === 'development';
  // console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

  // Normalize URL: remove trailing slashes and convert to lowercase
  if (currentUrl) {
    currentUrl = currentUrl.replace(/\/+$/, '').toLowerCase();
    // Normalize https:// to http:// for localhost:3000 in development
    if (isLocal && currentUrl === 'https://localhost:3000') {
      currentUrl = 'http://localhost:3000';
      console.log('Normalized URL to:', currentUrl);
    }
  }

  // Check cache first
  if (currentUrl && organizationIdCache.has(currentUrl)) {
    return organizationIdCache.get(currentUrl)!;
  }

  if (!currentUrl) {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No URL provided, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      organizationIdCache.set('no-url', tenantId);
      return tenantId as UUID;
    }
    console.error('No URL or NEXT_PUBLIC_TENANT_ID provided');
    return null;
  }

  console.log('[getOrganizationId] Querying for URL:', currentUrl, 'isLocal:', isLocal, 'will check field:', isLocal ? 'base_url_local' : 'base_url');
  
  let data: any = null;
  let error: any = null;
  
  // First try: Check if currentUrl matches any domain in the domains array
  try {
    const result = await supabase
      .from('organizations')
      .select('id, type, domains, base_url, base_url_local')
      .contains('domains', [currentUrl])
      .limit(1)
      .maybeSingle();
    data = result.data;
    error = result.error;
    console.log('[getOrganizationId] Domains query:', { hasData: !!data, error: error?.message });
  } catch (e: any) {
    // Ignore "multiple rows" errors and continue to fallback
    if (!e?.message?.includes('multiple') && !e?.message?.includes('no rows')) {
      error = e;
    }
  }
  
  // Second try: Fall back to base_url/base_url_local match if domains lookup fails
  if (!data && !error) {
    try {
      console.log('[getOrganizationId] Trying', isLocal ? 'base_url_local' : 'base_url', 'query with:', currentUrl);
      const result = await supabase
        .from('organizations')
        .select('id, type, domains, base_url, base_url_local')
        .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
        .limit(1)
        .maybeSingle();
      data = result.data;
      error = result.error;
      console.log('[getOrganizationId] Base URL query:', { hasData: !!data, error: error?.message, foundId: data?.id });
    } catch (e: any) {
      // If still failing, fall back to TENANT_ID
      if (e?.message?.includes('multiple')) {
        console.warn('Multiple organizations found for URL:', currentUrl, 'Using first match or TENANT_ID fallback');
        error = null; // Clear error to trigger TENANT_ID fallback
      } else if (!e?.message?.includes('no rows')) {
        error = e;
      }
    }
  }

  if (error) {
    console.error('Error fetching organization for URL:', currentUrl, 'Error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('Query failed, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      organizationIdCache.set(currentUrl, tenantId);
      return tenantId as UUID;
    }
    return null;
  }

  if (!data) {
    console.error('No organization found for URL:', currentUrl);
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No organization found, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      organizationIdCache.set(currentUrl, tenantId);
      return tenantId as UUID;
    }
    return null;
  }

  organizationIdCache.set(currentUrl, data.id);
  return data.id as UUID;
}

// Internal implementation
async function _getOrganizationInternal(reqOrBaseUrl?: { headers: { host?: string } } | string): Promise<Organization | null> {
  let currentUrl: string | undefined;

  if (typeof reqOrBaseUrl === 'string') {
    currentUrl = reqOrBaseUrl;
  } else if (reqOrBaseUrl && 'headers' in reqOrBaseUrl && reqOrBaseUrl.headers.host) {
    currentUrl = `https://${reqOrBaseUrl.headers.host}`;
  } else {
    currentUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }

  const isLocal = process.env.NODE_ENV === 'development';
  // console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

  // Normalize URL: remove trailing slashes and convert to lowercase
  if (currentUrl) {
    currentUrl = currentUrl.replace(/\/+$/, '').toLowerCase();
    // Normalize https:// to http:// for localhost:3000 in development
    if (isLocal && currentUrl === 'https://localhost:3000') {
      currentUrl = 'http://localhost:3000';
    }
  }

  if (!currentUrl) {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No URL provided, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      const { data, error } = await supabase
        .from('organizations')
        .select('id, base_url, base_url_local, domains, type, created_at, updated_at')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (error || !data) {
        console.error('Error fetching organization by tenantId:', error?.message);
        return null;
      }
      return data as Organization;
    }
    console.error('No URL or NEXT_PUBLIC_TENANT_ID provided');
    return null;
  }

  // console.log('Querying organization for URL:', currentUrl);
  
  // First try: Check if currentUrl matches any domain in the domains array
  let { data, error } = await supabase
    .from('organizations')
    .select('id, base_url, base_url_local, domains, type, created_at, updated_at')
    .contains('domains', [currentUrl])
    .maybeSingle();
  
  // Second try: Fall back to base_url/base_url_local match if domains lookup fails
  if (!data && !error) {
    const result = await supabase
      .from('organizations')
      .select('id, base_url, base_url_local, domains, type, created_at, updated_at')
      .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
      .maybeSingle();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error('Error fetching organization for URL:', currentUrl, 'Error:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('Query failed, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('organizations')
        .select('id, base_url, base_url_local, domains, type, created_at, updated_at')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (fallbackError || !fallbackData) {
        console.error('Error fetching organization by ID:', fallbackError?.message);
        return null;
      }
      return fallbackData as Organization;
    }
    return null;
  }

  if (!data) {
    console.error('No organization found for URL:', currentUrl);
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No organization found, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('organizations')
        .select('id, base_url, base_url_local, domains, type, created_at, updated_at')
        .eq('id', tenantId)
        .maybeSingle();
      
      if (fallbackError || !fallbackData) {
        console.error('Error fetching organization by ID:', fallbackError?.message);
        return null;
      }
      return fallbackData as Organization;
    }
    return null;
  }

  return data as Organization;
}

// Cached wrapper - deduplicates requests during SSR
export const getOrganization = cache(_getOrganizationInternal);

/**
 * Get default settings object
 * @returns Default Settings object with sensible defaults
 */
export function getDefaultSettings(): Settings {
  return {
    id: 0,
    site: 'App', // Always provide a valid string
    image: '/images/logo.svg',
    organization_id: '',
    header_style: {
      type: 'default',
      background: 'white',
      color: 'gray-700',
      color_hover: 'gray-900',
      menu_width: '7xl',
      menu_items_are_text: true
    },
    footer_style: {
      type: 'default',
      background: 'neutral-900',
      color: 'neutral-400',
      color_hover: 'white',
      menu_width: '7xl'
    },
    font_family: 'Inter',
    favicon: '/images/favicon.ico',
    seo_title: null,
    seo_description: null,
    seo_keywords: null,
    seo_og_image: null,
    seo_twitter_card: null,
    seo_structured_data: [],
    domain: '',
    billing_panel_stripe: '',
    google_tag: '',
    language: 'en', // Default language fallback
    with_language_switch: false, // Default to false
    supported_locales: null, // Will fall back to DEFAULT_SUPPORTED_LOCALES
    primary_color: 'sky', // Default primary color
    primary_shade: 600, // Default primary shade
    secondary_color: 'gray', // Default secondary color
    secondary_shade: 500, // Default secondary shade
  };
}

/**
 * Get a guaranteed site name string
 * @param settings Settings object (may contain null/undefined site)
 * @returns A valid site name string
 */
export function getSiteName(settings?: Settings): string {
  return settings?.site || 'App';
}

// Internal implementation
async function _getSettingsInternal(baseUrl?: string): Promise<Settings> {
  const defaultSettings = getDefaultSettings();

  // Skip Supabase query during Vercel build
  const isBuild = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_URL === undefined;
  if (isBuild) {
    console.log('Skipping Supabase query during Vercel build');
    return defaultSettings;
  }

  /*
  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID,
  });
  */

  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('No organization found for URL:', baseUrl, 'and no valid NEXT_PUBLIC_TENANT_ID');
      return defaultSettings;
    }

    // console.log('Fetching settings for organization_id:', organizationId);

    const { data, error } = await supabase
      .from('settings')
      .select(`
        id,
        site,
        image,
        organization_id,
        header_style,
        footer_style,
        font_family,
        favicon,
        seo_title,
        seo_description,
        seo_keywords,
        seo_og_image,
        seo_twitter_card,
        seo_structured_data,
        domain,
        billing_panel_stripe,
        google_tag,
        language,
        with_language_switch,
        supported_locales,
        primary_color,
        primary_shade,
        secondary_color,
        secondary_shade,
        legal_notice,
        transactional_email,
        marketing_email,
        transactional_email_2,
        marketing_email_2,
        ses_access_key_id,
        ses_secret_access_key,
        ses_region
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching settings:', error?.message || 'No settings found', 'organization_id:', organizationId);
      return defaultSettings;
    }

    const settings: Settings = {
      id: data.id,
      site: data.site,
      image: data.image,
      organization_id: data.organization_id ?? organizationId,
      header_style: data.header_style,
      footer_style: data.footer_style,
      font_family: data.font_family ?? 'Inter',
      favicon: data.favicon ?? null,
      seo_title: data.seo_title ?? null,
      seo_description: data.seo_description ?? null,
      seo_keywords: data.seo_keywords ?? null,
      seo_og_image: data.seo_og_image ?? null,
      seo_twitter_card: data.seo_twitter_card ?? null,
      seo_structured_data: data.seo_structured_data ?? null,
      domain: data.domain ?? null,
      billing_panel_stripe: data.billing_panel_stripe ?? null,
      google_tag: data.google_tag ?? null,
      language: data.language ?? 'en',
      with_language_switch: (data as any).with_language_switch ?? false,
      supported_locales: data.supported_locales || null,
      primary_color: data.primary_color ?? 'sky',
      primary_shade: data.primary_shade ?? 600,
      secondary_color: data.secondary_color ?? 'gray',
      secondary_shade: data.secondary_shade ?? 500,
      legal_notice: data.legal_notice ?? null,
      transactional_email: data.transactional_email ?? null,
      marketing_email: data.marketing_email ?? null,
      transactional_email_2: data.transactional_email_2 ?? null,
      marketing_email_2: data.marketing_email_2 ?? null,
      ses_access_key_id: data.ses_access_key_id ?? null,
      ses_secret_access_key: data.ses_secret_access_key ?? null,
      ses_region: data.ses_region ?? null,
    };

    // console.log('Settings fetched successfully:', settings);
    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return defaultSettings;
  }
}

// Cached wrapper - deduplicates settings requests
export const getSettings = cache(_getSettingsInternal);