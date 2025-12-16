// /app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';
import { supabase } from '@/lib/supabaseClient';

interface SubMenuItem {
  id: number;
  name: string;
  name_translation?: Record<string, any>;
  url_name: string;
  order: number;
  description?: string;
  description_translation?: Record<string, any>;
  is_displayed?: boolean;
  image?: string | null;
  menu_item_id?: number;
  organization_id: string | null;
}

interface ReactIcon {
  icon_name: string;
}

interface MenuItem {
  id: number;
  display_name: string;
  display_name_translation?: Record<string, any>;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  order: number;
  react_icon_id?: number;
  menu_items_are_text?: boolean;
  react_icons?: ReactIcon | ReactIcon[];
  website_submenuitem?: SubMenuItem[];
  organization_id: string | null;
  description_translation?: Record<string, any>;
}

export async function GET(request: Request) {
  // Skip Supabase query during Vercel build
  const isBuild = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_URL === undefined;
  if (isBuild) {
    console.log('Skipping Supabase query during Vercel build');
    return NextResponse.json([], { status: 200 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('baseUrl') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Fetching organizationId with baseUrl:', baseUrl);

    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    console.log('Fetched organizationId:', organizationId);

    console.log('Fetching menu items for organization_id:', organizationId);
    const { data, error } = await supabase
      .from('website_menuitem')
      .select(`
        id,
        display_name,
        display_name_translation,
        description_translation,
        url_name,
        is_displayed,
        is_displayed_on_footer,
        "order",
        react_icon_id,
        menu_items_are_text,
        organization_id,
        react_icons (icon_name),
        website_submenuitem (
          id,
          name,
          name_translation,
          order,
          url_name,
          image,
          description,
          description_translation,
          description_translation,
          is_displayed,
          menu_item_id,
          organization_id
        )
      `)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true });

    if (error) {
      console.error('Supabase error in /api/menu:', error);
      return NextResponse.json({ error: 'Failed to fetch menu items', details: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.warn('No menu items found for organization_id:', organizationId);
      return NextResponse.json([], {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate' },
      });
    }

    // Fetch submenu items separately for all menu items
    const menuItemIds = data.map(item => item.id);
    const { data: submenuData, error: submenuError } = await supabase
      .from('website_submenuitem')
      .select(`
        id,
        name,
        name_translation,
        order,
        url_name,
        description,
        description_translation,
        is_displayed,
        image,
        menu_item_id,
        organization_id
      `)
      .in('menu_item_id', menuItemIds)
      .order('order', { ascending: true });

    if (submenuError) {
      console.error('Supabase error fetching submenu items:', submenuError);
    }

    console.log('Raw menu items fetched:', JSON.stringify(data, null, 2));
    console.log('Raw submenu items fetched:', JSON.stringify(submenuData, null, 2));

    // Filter and cast data to MenuItem[]
    const filteredData: MenuItem[] = data.map((item) => {
      // Handle react_icons as either an array or single object
      let reactIcons: ReactIcon | ReactIcon[] | undefined = item.react_icons;
      let iconName: string | null = null;
      
      if (item.react_icons) {
        if (Array.isArray(item.react_icons)) {
          // If react_icons is an array, take the first item or set to undefined
          reactIcons = item.react_icons.length > 0 ? item.react_icons[0] : undefined;
          if (item.react_icons.length > 0) {
            iconName = item.react_icons[0].icon_name;
          }
        } else {
          // Single object case
          const reactIcon = item.react_icons as ReactIcon;
          iconName = reactIcon.icon_name;
        }
      }

      // Get submenu items for this menu item
      const submenuItems = submenuData 
        ? submenuData.filter((subItem: any) => 
            subItem.menu_item_id === item.id &&
            subItem.is_displayed !== false &&
            (subItem.organization_id === null || subItem.organization_id === organizationId)
          )
        : [];

      return {
        ...item,
        icon_name: iconName,
        react_icons: reactIcons,
        website_submenuitem: submenuItems,
      };
    });

    console.log('Filtered menu items:', JSON.stringify(filteredData, null, 2), 'for organization_id:', organizationId);
    return NextResponse.json(filteredData, {
      status: 200,
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }, // Temporarily disable cache for testing
    });
  } catch (error) {
    console.error('Server error in /api/menu:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}