// app/api/menu/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase client with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Define types for the response
interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  order: number;
  image?: string;
  react_icon_id?: number;
  react_icons?: { icon_name: string };
  website_submenuitem?: SubMenuItem[];
}

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  description?: string;
}

// GET handler to fetch menu items
export async function GET() {
  try {
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
        react_icons (icon_name),
        website_submenuitem (
          id,
          name,
          url_name,
          description
        )
      `)
      .order('order', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}