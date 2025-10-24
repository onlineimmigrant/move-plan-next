import { supabase } from './supabase';
import { Settings } from '@/types/settings';
import { Organization } from './types';

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
  console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

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
    console.log('Using cached organization ID for URL:', currentUrl, 'ID:', organizationIdCache.get(currentUrl));
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

  console.log('Querying organization for URL:', currentUrl);
  const { data, error } = await supabase
    .from('organizations')
    .select('id, type')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
    .maybeSingle();

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

  console.log('Organization found for URL:', currentUrl, 'ID:', data.id);
  organizationIdCache.set(currentUrl, data.id);
  return data.id as UUID;
}

export async function getOrganization(reqOrBaseUrl?: { headers: { host?: string } } | string): Promise<Organization | null> {
  let currentUrl: string | undefined;

  if (typeof reqOrBaseUrl === 'string') {
    currentUrl = reqOrBaseUrl;
  } else if (reqOrBaseUrl && 'headers' in reqOrBaseUrl && reqOrBaseUrl.headers.host) {
    currentUrl = `https://${reqOrBaseUrl.headers.host}`;
  } else {
    currentUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }

  const isLocal = process.env.NODE_ENV === 'development';
  console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

  // Normalize URL: remove trailing slashes and convert to lowercase
  if (currentUrl) {
    currentUrl = currentUrl.replace(/\/+$/, '').toLowerCase();
    // Normalize https:// to http:// for localhost:3000 in development
    if (isLocal && currentUrl === 'https://localhost:3000') {
      currentUrl = 'http://localhost:3000';
      console.log('Normalized URL to:', currentUrl);
    }
  }

  if (!currentUrl) {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No URL provided, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      const { data, error } = await supabase
        .from('organizations')
        .select('id, base_url, base_url_local, type, created_at, updated_at')
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

  console.log('Querying organization for URL:', currentUrl);
  const { data, error } = await supabase
    .from('organizations')
    .select('id, base_url, base_url_local, type, created_at, updated_at')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
    .maybeSingle();

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
        .select('id, base_url, base_url_local, type, created_at, updated_at')
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
        .select('id, base_url, base_url_local, type, created_at, updated_at')
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

  console.log('Organization found for URL:', currentUrl, 'ID:', data.id, 'Type:', data.type);
  return data as Organization;
}

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

export async function getSettings(baseUrl?: string): Promise<Settings> {
  const defaultSettings = getDefaultSettings();

  // Skip Supabase query during Vercel build
  const isBuild = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_URL === undefined;
  if (isBuild) {
    console.log('Skipping Supabase query during Vercel build');
    return defaultSettings;
  }

  console.log('Environment variables:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV,
    NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
    NEXT_PUBLIC_TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID,
  });

  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('No organization found for URL:', baseUrl, 'and no valid NEXT_PUBLIC_TENANT_ID');
      return defaultSettings;
    }

    console.log('Fetching settings for organization_id:', organizationId);

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
        supported_locales
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
    };

    console.log('Settings fetched successfully:', settings);
    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return defaultSettings;
  }
}