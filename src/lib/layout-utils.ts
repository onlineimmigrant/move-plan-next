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

  console.log('fetchMenuItems - called with organizationId:', organizationId);
  console.log('fetchMenuItems - querying database for organizationId:', organizationId);

  try {
    // Query menu items with submenu items join using actual database field names
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
        organization_id,
        website_submenuitem(
          id,
          name,
          name_translation,
          url_name,
          order,
          description,
          description_translation,
          image,
          menu_item_id
        )
      `)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .eq('is_displayed', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('fetchMenuItems - database error:', error);
      console.log('fetchMenuItems - attempting fallback query without joins');
      
      // If the join query fails, try a fallback basic query
      const { data: basicData, error: basicError } = await supabase
        .from('website_menuitem')
        .select(`
          id,
          display_name,
          display_name_translation,
          url_name,
          is_displayed,
          is_displayed_on_footer,
          order,
          organization_id
        `)
        .eq('organization_id', organizationId)
        .eq('is_displayed', true)
        .order('order', { ascending: true });

      if (basicError) {
        console.error('fetchMenuItems - fallback query error:', basicError);
        return [];
      }

      console.log(`fetchMenuItems - fallback: fetched ${basicData?.length || 0} menu items`);
      
      // Transform basic data without submenu items
      const menuItems: MenuItem[] = basicData?.map((item: any) => ({
        id: item.id,
        display_name: item.display_name,
        url_name: item.url_name,
        is_displayed: item.is_displayed,
        is_new_window: false, // Default value since this field might not exist
        order: item.order,
        created_at: undefined, // Field doesn't exist in database
        organization_id: item.organization_id,
        icon_name: null,
        website_submenuitem: [],
        // Legacy aliases for backward compatibility
        name: item.display_name,
        url: item.url_name,
        is_visible: item.is_displayed,
        order_position: item.order,
        submenu_items: []
      })) || [];

      return menuItems;
    }

    console.log(`fetchMenuItems - fetched ${data?.length || 0} menu items with submenu data`);
    
    // Transform data to match expected interface
    const menuItems: MenuItem[] = data?.map((item: any) => ({
      id: item.id,
      display_name: item.display_name,
      url_name: item.url_name,
      is_displayed: item.is_displayed,
      is_displayed_on_footer: item.is_displayed_on_footer,
      is_new_window: false, // Default value since this field might not exist
      order: item.order,
      created_at: undefined, // Field doesn't exist in database
      organization_id: item.organization_id,
      icon_name: null, // Removed react_icons join to avoid schema conflicts
      website_submenuitem: item.website_submenuitem?.map((submenu: any) => ({
        id: submenu.id,
        name: submenu.name,
        name_translation: submenu.name_translation,
        url_name: submenu.url_name,
        description: submenu.description,
        description_translation: submenu.description_translation,
        is_displayed: true, // Default since field doesn't exist
        is_new_window: false, // Default since field doesn't exist
        order: submenu.order,
        menu_item_id: submenu.menu_item_id,
        image: submenu.image
      })) || [],
      // Legacy aliases for backward compatibility
      name: item.display_name,
      url: item.url_name,
      is_visible: item.is_displayed,
      order_position: item.order,
      submenu_items: item.website_submenuitem?.map((submenu: any) => ({
        id: submenu.id,
        name: submenu.name,
        name_translation: submenu.name_translation,
        url: submenu.url_name,
        description: submenu.description,
        description_translation: submenu.description_translation,
        is_visible: true,
        is_new_window: false,
        order_position: submenu.order,
        website_menuitem_id: submenu.menu_item_id,
        image: submenu.image
      })) || []
    })) || [];

    return menuItems;
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
