// src/lib/getSettings.ts
import { supabase } from './supabase';
import { Settings } from '@/types/settings';

// Define a type for UUID to ensure type safety
type UUID = string;

// Helper function to validate UUID format (basic check for UUID v4)
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export async function getOrganizationId(reqOrBaseUrl?: { headers: { host?: string } } | string): Promise<UUID | null> {
  let currentUrl: string | undefined;

  // Determine the URL based on the input (req object, baseUrl string, or environment variable)
  if (typeof reqOrBaseUrl === 'string') {
    currentUrl = reqOrBaseUrl;
  } else if (reqOrBaseUrl && 'headers' in reqOrBaseUrl && reqOrBaseUrl.headers.host) {
    currentUrl = `https://${reqOrBaseUrl.headers.host}`;
  } else {
    currentUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }

  const isLocal = process.env.NODE_ENV === 'development';
  console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

  // If no URL is found, fallback to NEXT_PUBLIC_TENANT_ID
  if (!currentUrl) {
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No URL provided, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      return tenantId as UUID;
    }
    console.error('No URL or NEXT_PUBLIC_TENANT_ID provided');
    return null;
  }

  // Query Supabase for the organization ID based on the URL
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
    .maybeSingle();

  if (error) {
    console.error('Error fetching organization:', error, 'URL:', currentUrl);
    // Fallback to NEXT_PUBLIC_TENANT_ID if the query fails
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('Query failed, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      return tenantId as UUID;
    }
    return null;
  }

  if (!data) {
    console.error('No organization found for URL:', currentUrl);
    // Fallback to NEXT_PUBLIC_TENANT_ID if no organization is found
    const tenantId = process.env.NEXT_PUBLIC_TENANT_ID;
    if (tenantId && isValidUUID(tenantId)) {
      console.log('No organization found, falling back to NEXT_PUBLIC_TENANT_ID:', tenantId);
      return tenantId as UUID;
    }
    return null;
  }

  return data.id as UUID;
}

export async function getSettings(baseUrl?: string): Promise<Settings> {
  const defaultSettings: Settings = {
    id: 0,
    site: '',
    image: '',
    organization_id: '',
    menu_width: '',
    menu_items_are_text: false,
    footer_color: '',
  };

  // Skip Supabase query during Vercel build to avoid errors
  const isBuild = process.env.NODE_ENV === 'production' && !process.env.CI;
  if (isBuild) {
    console.log('Skipping Supabase query during build');
    return defaultSettings;
  }

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
        menu_width,
        menu_items_are_text,
        footer_color
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      console.error('Error fetching settings:', error || 'No settings found', 'organization_id:', organizationId);
      return defaultSettings;
    }

    const settings: Settings = {
      id: data.id,
      site: data.site,
      image: data.image,
      menu_width: data.menu_width,
      menu_items_are_text: data.menu_items_are_text,
      footer_color: data.footer_color,
      organization_id: data.organization_id ?? organizationId,
    };

    console.log('Settings fetched successfully:', settings);
    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return defaultSettings;
  }
}