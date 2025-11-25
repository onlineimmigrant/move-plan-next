// app/api/posts/[id]/media/reorder/route.ts
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

// PUT - Reorder media items
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const params = await context.params;
    const body = await request.json();
    const { mediaItems } = body; // Array of { id, order }

    if (!Array.isArray(mediaItems)) {
      return NextResponse.json(
        { error: 'mediaItems must be an array' },
        { status: 400 }
      );
    }

    // Update each item's order
    const updates = mediaItems.map((item) =>
      supabase
        .from('post_media')
        .update({ order: item.order })
        .eq('id', item.id)
    );

    const results = await Promise.all(updates);

    // Check for errors
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Error reordering post media:', errors);
      return NextResponse.json(
        { error: 'Failed to reorder some items' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Server error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
