import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/submenu-items
 * Create a new submenu item
 * Body params:
 *   - menu_item_id (required)
 *   - organization_id (required)
 *   - name (required)
 *   - url_name (required)
 *   - order (optional, defaults to 0)
 *   - is_displayed (optional, defaults to true)
 *   - description (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      menu_item_id,
      organization_id,
      name,
      url_name,
      order = 0,
      is_displayed = true,
      description = null
    } = body;

    if (!menu_item_id || !organization_id || !name || !url_name) {
      return NextResponse.json(
        { error: 'menu_item_id, organization_id, name, and url_name are required' },
        { status: 400 }
      );
    }

    console.log('[API Submenu Items] Creating new submenu item:', {
      menu_item_id,
      organization_id,
      name,
      url_name,
      order
    });

    const { data: newSubmenuItem, error } = await supabase
      .from('website_submenuitem')
      .insert({
        menu_item_id,
        organization_id,
        name,
        url_name,
        order,
        is_displayed,
        description
      })
      .select()
      .single();

    if (error) {
      console.error('[API Submenu Items] Error creating submenu item:', error);
      throw error;
    }

    console.log('[API Submenu Items] Successfully created submenu item:', newSubmenuItem.id);

    return NextResponse.json({
      submenu_item: newSubmenuItem
    }, { status: 201 });
  } catch (error) {
    console.error('[API Submenu Items] Failed to create submenu item:', error);
    return NextResponse.json(
      { error: 'Failed to create submenu item' },
      { status: 500 }
    );
  }
}
