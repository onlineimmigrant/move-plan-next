import { supabase } from './supabase';
import { Settings } from '@/types/settings';

export async function getOrganizationId(baseUrl?: string): Promise<string | null> {
  const currentUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL;
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
    primary_color: { id: 0, name: 'gray-800', hex: '#000000', img_color: '', created_at: '' },
    secondary_color: { id: 0, name: 'sky-500', hex: '#0EA5E9', img_color: '', created_at: '' },
    primary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
    secondary_font: { id: 0, name: 'default', description: '', default_type: false, created_at: '' },
    font_size_base: { id: 0, name: 'default', value: 16, description: '', created_at: '' },
    font_size_small: { id: 0, name: 'default', value: 14, description: '', created_at: '' },
    font_size_large: { id: 0, name: 'default', value: 18, description: '', created_at: '' },
    updated_at: '',
    image: '',
    organization_id: '', // Added
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
        primary_color:primary_color_id(id, name, hex, img_color, created_at),
        secondary_color:secondary_color_id(id, name, hex, img_color, created_at),
        footer_color:footer_color_id(id, name, hex, img_color, created_at),
        primary_font:primary_font_id(id, name, description, default_type, created_at),
        secondary_font:secondary_font_id(id, name, description, default_type, created_at),
        font_size_base:font_size_base_id(id, name, value, description, created_at),
        font_size_small:font_size_small_id(id, name, value, description, created_at),
        font_size_large:font_size_large_id(id, name, value, description, created_at),
        updated_at,
        image,
        organization_id
      `) // Added organization_id
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
      primary_color: data.primary_color?.[0] ?? {
        id: 0,
        name: 'gray-800',
        hex: '#000000',
        img_color: '',
        created_at: '',
      },
      secondary_color: data.secondary_color?.[0] ?? {
        id: 0,
        name: 'sky-500',
        hex: '#0EA5E9',
        img_color: '',
        created_at: '',
      },
      primary_font: data.primary_font?.[0] ?? {
        id: 0,
        name: 'default',
        description: '',
        default_type: false,
        created_at: '',
      },
      secondary_font: data.secondary_font?.[0] ?? {
        id: 0,
        name: 'default',
        description: '',
        default_type: false,
        created_at: '',
      },
      font_size_base: data.font_size_base?.[0] ?? {
        id: 0,
        name: 'default',
        value: 16,
        description: '',
        created_at: '',
      },
      font_size_small: data.font_size_small?.[0] ?? {
        id: 0,
        name: 'default',
        value: 14,
        description: '',
        created_at: '',
      },
      font_size_large: data.font_size_large?.[0] ?? {
        id: 0,
        name: 'default',
        value: 18,
        description: '',
        created_at: '',
      },
      updated_at: data.updated_at,
      image: data.image,
      organization_id: data.organization_id ?? organizationId, // Use fetched or fallback to organizationId
    };

    return settings;
  } catch (error) {
    console.error('getSettings error:', error);
    return defaultSettings;
  }
}