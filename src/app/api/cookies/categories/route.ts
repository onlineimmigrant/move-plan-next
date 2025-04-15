//src/app/api/cookies/categories/route.ts
import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerClient';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('cookie_category')
      .select('id, name, description, cookie_service(id, name, description, active)');

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Ensure data is an array, default to empty array if null
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}