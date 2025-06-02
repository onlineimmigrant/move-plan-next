import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  order: number;
  description?: string;
  is_displayed?: boolean;
  organization_id: string | null;
}

interface ReactIcon {
  icon_name: string;
}

interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  order: number;
  image?: string;
  react_icon_id?: number;
  react_icons?: ReactIcon;
  website_submenuitem?: SubMenuItem[];
  organization_id: string | null;
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
          order,
          url_name,
          description,
          is_displayed,
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
      return NextResponse.json([], { status: 200 });
    }

    console.log('Raw menu items fetched:', JSON.stringify(data, null, 2));

    // Cast data to MenuItem[] safely
    const filteredData: MenuItem[] = ((data as unknown) as MenuItem[] || []).map((item) => ({
      ...item,
      website_submenuitem: (item.website_submenuitem || []).filter(
        (subItem) =>
          subItem.is_displayed !== false &&
          (subItem.organization_id === null || // Common subitem
           subItem.organization_id === organizationId || // Organization-specific
           subItem.organization_id === item.organization_id) // Matches parent
      ),
    }));

    console.log('Filtered menu items:', JSON.stringify(filteredData, null, 2), 'for organization_id:', organizationId);
    return NextResponse.json(filteredData, { status: 200 });
  } catch (error) {
    console.error('Server error in /api/menu:', error);
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}