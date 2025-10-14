import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * DELETE /api/submenu-items/[id]
 * Delete a submenu item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    console.log('[API Submenu Item] Deleting submenu item:', id);

    // Delete submenu item
    const { error } = await supabase
      .from('website_submenuitem')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[API Submenu Item] Error deleting submenu item:', error);
      throw error;
    }

    console.log('[API Submenu Item] Successfully deleted submenu item');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API Submenu Item] Failed to delete submenu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete submenu item' },
      { status: 500 }
    );
  }
}
