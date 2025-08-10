// /app/api/menu/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';

interface SubMenuItem {
  id: number;
  name: string;
  name_translation?: Record<string, any>;
  url_name: string;
  order: number;
  description?: string;
  description_translation?: Record<string, any>;
  is_displayed?: boolean;
  website_menuitem_id?: number;
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
  image?: string;
  react_icon_id?: number;
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
        image,
        react_icon_id,
        organization_id,
        react_icons (icon_name),
        website_submenuitem (
          id,
          name,
          name_translation,
          order,
          url_name,
          description,
          description_translation,
          description_translation,
          is_displayed,
          website_menuitem_id,
          organization_id
        )
      `)
      .or(`organization_id.eq.${organizationId},organization_id.is.null`)
      .order('order', { ascending: true })
      .order('order', { ascending: true, referencedTable: 'website_submenuitem' });

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

    console.log('Raw menu items fetched:', JSON.stringify(data, null, 2));

    // Filter and cast data to MenuItem[]
    const filteredData: MenuItem[] = data.map((item) => {
      // Handle react_icons as either an array or single object
      let reactIcons: ReactIcon | ReactIcon[] | undefined = item.react_icons;
      if (Array.isArray(item.react_icons)) {
        // If react_icons is an array, take the first item or set to undefined
        reactIcons = item.react_icons.length > 0 ? item.react_icons[0] : undefined;
      }

      return {
        ...item,
        react_icons: reactIcons,
        website_submenuitem: (item.website_submenuitem || []).filter(
          (subItem: SubMenuItem) =>
            subItem.is_displayed !== false &&
            (subItem.organization_id === null || subItem.organization_id === organizationId)
        ),
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