import { supabase } from './supabase';
import { Settings } from '@/types/settings';

export async function getOrganizationId(req?: { headers: { host?: string } }): Promise<string | null> {
  const currentUrl = req?.headers.host
    ? `https://${req.headers.host}`
    : process.env.NEXT_PUBLIC_BASE_URL;
  const isLocal = process.env.NODE_ENV === 'development';

  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq(isLocal ? 'base_url_local' : 'base_url', currentUrl)
    .single();

  if (error) {
    console.error('Error fetching organization:', error);
    return null;
  }
  return data?.id;
}

export async function getSettings(baseUrl?: string): Promise<Settings> {
  // Default settings object with organization_id
  const defaultSettings = {
    id: 0,
    site: '',
    image: '',
    organization_id: '', 
    menu_width: '',
    menu_items_are_text: false,
    footer_color: ''
  };

  // Skip Supabase during build to avoid errors
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

    console.log('Fetched settings:', data);

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