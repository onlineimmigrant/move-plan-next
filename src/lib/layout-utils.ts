import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';
import { getSettings } from './getSettings';
import { getLocaleFromLanguage } from './language-utils';
import { MenuItem, SubMenuItem, ReactIcon } from '@/types/menu';
import { Settings } from '@/types/settings';

export async function fetchMenuItems(organizationId: string | null): Promise<MenuItem[]> {
  if (!organizationId) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('website_menuitem')
      .select(`
        id,
        display_name,
        display_name_translation,
        url_name,
        is_displayed,
        is_displayed_on_footer,
        order,
        image,
        description,
        description_translation,
        react_icon_id,
        organization_id,
        react_icons (icon_name),
        website_submenuitem (
          id,
          name,
          name_translation,
          url_name,
          order,
          description,
          description_translation,
          is_displayed,
          organization_id
        )
      `)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true })
      .order('order', { ascending: true, referencedTable: 'website_submenuitem' });

    if (error || !data) {
      console.error('Error fetching menu items:', error);
      return [];
    }

    return data.map((item) => {
      let reactIcons: ReactIcon | null = null;
      if (item.react_icons && typeof item.react_icons === 'object' && !Array.isArray(item.react_icons)) {
        reactIcons = item.react_icons as ReactIcon;
      }

      const filteredSubItems = (item.website_submenuitem || []).filter(
        (subItem: SubMenuItem) =>
          subItem.is_displayed !== false &&
          (subItem.organization_id === null || subItem.organization_id === organizationId)
      );

      return {
        ...item,
        react_icons: reactIcons,
        website_submenuitem: filteredSubItems,
      };
    });
  } catch (error) {
    console.error('Failed to fetch menu items:', error);
    return [];
  }
}

export async function getDomain(): Promise<string> {
  const headersList = await headers();
  return headersList.get('host')
    ? `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${headersList.get('host')}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export async function getSettingsWithFallback(domain: string): Promise<Settings> {
  try {
    return await getSettings(domain);
  } catch (error) {
    console.error('[getSettingsWithFallback] Failed to fetch settings:', error);
    return await getSettings(); // Returns defaults
  }
}

export function getFaviconUrl(favicon?: string): string {
  if (!favicon) return '/images/favicon.ico';
  if (favicon.startsWith('http')) return favicon;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/favicons/${favicon}`;
}

export function getLanguageFromSettings(settings: Settings): string {
  return settings.language || 'en';
}

export function getLocaleFromSettings(settings: Settings): string {
  const language = getLanguageFromSettings(settings);
  return getLocaleFromLanguage(language);
}
