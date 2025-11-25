// app/api/posts/[id]/media/[itemId]/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// DELETE - Remove a media item
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string; itemId: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const params = await context.params;
    const itemId = parseInt(params.itemId);

    const { error } = await supabase
      .from('post_media')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting post media:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
