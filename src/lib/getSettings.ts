// src/lib/getSettings.ts
import { supabase } from './supabase';
import { Settings } from '@/types/settings';

export async function getOrganizationId(reqOrBaseUrl?: { headers: { host?: string } } | string): Promise<string | null> {
  let currentUrl: string | undefined;

  // Check if the argument is a req object (with headers) or a baseUrl string
  if (typeof reqOrBaseUrl === 'string') {
    currentUrl = reqOrBaseUrl;
  } else if (reqOrBaseUrl && 'headers' in reqOrBaseUrl && reqOrBaseUrl.headers.host) {
    currentUrl = `https://${reqOrBaseUrl.headers.host}`;
  } else {
    currentUrl = process.env.NEXT_PUBLIC_BASE_URL;
  }

  const isLocal = process.env.NODE_ENV === 'development';

  console.log('Fetching organization for URL:', currentUrl, 'isLocal:', isLocal);

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
    .single();

  if (error) {
    console.error('Error fetching organization:', error, 'URL:', currentUrl);
    return null;
  }

  if (!data) {
    console.error('No organization found for URL:', currentUrl);
    return null;
  }

  return data.id;
}

export async function getSettings(baseUrl?: string): Promise<Settings> {
  const defaultSettings = {
    id: 0,
    site: '',
    image: '',
    organization_id: '',
    menu_width: '',
    menu_items_are_text: false,
    footer_color: '',
  };

  const isBuild = process.env.NODE_ENV === 'production' && !process.env.CI;
  if (isBuild) {
    return defaultSettings;
  }

  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('No organization found for URL:', baseUrl);
      return defaultSettings;
    }

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
      console.error('Error fetching settings:', error);
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

    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return defaultSettings;
  }
}