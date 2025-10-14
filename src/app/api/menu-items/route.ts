import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/menu-items
 * Fetch menu items for header or footer
 * Query params:
 *   - organization_id (required)
 *   - is_displayed (optional) - filter for header menus
 *   - is_displayed_on_footer (optional) - filter for footer menus
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');
    const isDisplayed = searchParams.get('is_displayed');
    const isDisplayedOnFooter = searchParams.get('is_displayed_on_footer');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      );
    }

    console.log('[API Menu Items] Fetching menu items:', {
      organizationId,
      isDisplayed,
      isDisplayedOnFooter
    });

    // Build query
    let query = supabase
      .from('website_menuitem')
      .select(`
        *,
        website_submenuitem (
          id,
          menu_item_id,
          name,
          name_translation,
          url_name,
          order,
          is_displayed,
          description,
          description_translation,
          image,
          organization_id
        )
      `)
      .eq('organization_id', organizationId)
      .order('order', { ascending: true });

    // Apply filters
    if (isDisplayed === 'true') {
      query = query.eq('is_displayed', true);
    }

    if (isDisplayedOnFooter === 'true') {
      query = query.eq('is_displayed_on_footer', true);
    }

    const { data: menuItems, error } = await query;

    if (error) {
      console.error('[API Menu Items] Error fetching menu items:', error);
      throw error;
    }

    console.log('[API Menu Items] Successfully fetched', menuItems?.length || 0, 'menu items');
    console.log('[API Menu Items] First menu item with submenus:', {
      id: menuItems?.[0]?.id,
      display_name: menuItems?.[0]?.display_name,
      has_website_submenuitem: !!menuItems?.[0]?.website_submenuitem,
      submenu_count: menuItems?.[0]?.website_submenuitem?.length || 0,
      submenu_data: menuItems?.[0]?.website_submenuitem
    });

    // Sort submenus by order
    const sortedMenuItems = menuItems?.map(item => {
      const sortedSubmenus = item.website_submenuitem?.sort((a: any, b: any) => a.order - b.order) || [];
      console.log(`[API Menu Items] Menu "${item.display_name}" has ${sortedSubmenus.length} submenus`);
      return {
        ...item,
        website_submenuitem: sortedSubmenus
      };
    });

    return NextResponse.json({
      menu_items: sortedMenuItems || [],
      count: sortedMenuItems?.length || 0
    });
  } catch (error) {
    console.error('[API Menu Items] Failed to fetch menu items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/menu-items
 * Create a new menu item
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      organization_id,
      display_name,
      url_name,
      is_displayed = true,
      is_displayed_on_footer = false,
      menu_items_are_text,
      react_icon_id,
      order
    } = body;

    if (!organization_id || !display_name || !url_name) {
      return NextResponse.json(
        { error: 'organization_id, display_name, and url_name are required' },
        { status: 400 }
      );
    }

    console.log('[API Menu Items] Creating menu item:', { display_name, url_name });

    // Get next order if not provided
    let finalOrder = order;
    if (finalOrder === undefined || finalOrder === null) {
      const { data: existingItems } = await supabase
        .from('website_menuitem')
        .select('order')
        .eq('organization_id', organization_id)
        .order('order', { ascending: false })
        .limit(1);

      finalOrder = existingItems && existingItems.length > 0 
        ? (existingItems[0].order || 0) + 10 
        : 0;
    }

    const { data, error } = await supabase
      .from('website_menuitem')
      .insert({
        organization_id,
        display_name,
        url_name,
        is_displayed,
        is_displayed_on_footer,
        menu_items_are_text,
        react_icon_id,
        order: finalOrder
      })
      .select(`
        *,
        website_submenuitem (*)
      `)
      .single();

    if (error) {
      console.error('[API Menu Items] Error creating menu item:', error);
      throw error;
    }

    console.log('[API Menu Items] Successfully created menu item:', data.id);

    return NextResponse.json({ menu_item: data }, { status: 201 });
  } catch (error) {
    console.error('[API Menu Items] Failed to create menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}
