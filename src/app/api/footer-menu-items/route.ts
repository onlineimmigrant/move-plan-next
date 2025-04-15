import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerClient';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('menu_items')
      .select('id, url_name, display_name, is_displayed_on_footer');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}