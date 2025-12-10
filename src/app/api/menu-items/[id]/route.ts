import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/menu-items/[id]
 * Fetch a single menu item by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('[API Menu Item] Fetching menu item:', id);

    const { data, error } = await supabase
      .from('website_menuitem')
      .select(`
        *,
        website_submenuitem (*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[API Menu Item] Error fetching menu item:', error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    console.log('[API Menu Item] Successfully fetched menu item');

    return NextResponse.json({ menu_item: data });
  } catch (error) {
    console.error('[API Menu Item] Failed to fetch menu item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/menu-items/[id]
 * Update a menu item or submenu item
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      display_name,
      url_name,
      is_displayed,
      is_displayed_on_footer,
      menu_items_are_text,
      react_icon_id,
      order,
      description,
      display_name_translation,
      description_translation,
      name,
      name_translation,
      menu_item_id, // If this exists, it's a submenu item
      display_as_card
    } = body;

    console.log('[API Menu Item] Updating item:', id, 'isSubmenu:', !!menu_item_id || !!name);

    // Check if this is a submenu item by seeing if it exists in website_submenuitem
    const { data: submenuCheck } = await supabase
      .from('website_submenuitem')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    const isSubmenuItem = !!submenuCheck;

    if (isSubmenuItem) {
      // Update submenu item
      console.log('[API Menu Item] Updating submenu item:', id);
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (name_translation !== undefined) updateData.name_translation = name_translation;
      if (url_name !== undefined) updateData.url_name = url_name;
      if (is_displayed !== undefined) updateData.is_displayed = is_displayed;
      if (order !== undefined) updateData.order = order;
      if (description !== undefined) updateData.description = description;
      if (description_translation !== undefined) updateData.description_translation = description_translation;
      if (menu_item_id !== undefined) updateData.menu_item_id = menu_item_id;
      if (body.image !== undefined) updateData.image = body.image;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('website_submenuitem')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[API Menu Item] Error updating submenu item:', error);
        throw error;
      }

      console.log('[API Menu Item] Successfully updated submenu item');
      return NextResponse.json({ submenu_item: data });
    } else {
      // Update menu item
      console.log('[API Menu Item] Updating menu item:', id);
      
      const updateData: any = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (display_name_translation !== undefined) updateData.display_name_translation = display_name_translation;
      if (url_name !== undefined) updateData.url_name = url_name;
      if (is_displayed !== undefined) updateData.is_displayed = is_displayed;
      if (is_displayed_on_footer !== undefined) updateData.is_displayed_on_footer = is_displayed_on_footer;
      if (menu_items_are_text !== undefined) updateData.menu_items_are_text = menu_items_are_text;
      if (react_icon_id !== undefined) updateData.react_icon_id = react_icon_id;
      if (order !== undefined) updateData.order = order;
      if (description !== undefined) updateData.description = description;
      if (description_translation !== undefined) updateData.description_translation = description_translation;
      if (display_as_card !== undefined) updateData.display_as_card = display_as_card;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('website_menuitem')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          website_submenuitem (*)
        `)
        .single();

      if (error) {
        console.error('[API Menu Item] Error updating menu item:', error);
        throw error;
      }

      console.log('[API Menu Item] Successfully updated menu item');
      return NextResponse.json({ menu_item: data });
    }
  } catch (error) {
    console.error('[API Menu Item] Failed to update item:', error);
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/menu-items/[id]
 * Delete a menu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('[API Menu Item] Deleting menu item:', id);

    // Delete menu item (submenus will cascade delete)
    const { error } = await supabase
      .from('website_menuitem')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API Menu Item] Error deleting menu item:', error);
      throw error;
    }

    console.log('[API Menu Item] Successfully deleted menu item');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Menu Item] Failed to delete menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
