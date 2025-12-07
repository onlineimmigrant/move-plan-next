import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServerSafe';

export async function GET() {
  try {
    const { data, error } = await supabaseServer
      .from('cookie_categories')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (error) {
      console.error('Error fetching cookie categories:', error);
      return NextResponse.json([]);
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in cookie categories API:', error);
    return NextResponse.json([]);
  }
}
