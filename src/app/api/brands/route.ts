import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('website_brand')
      .select('*')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching brands data:', error);
    return NextResponse.json({ error: 'Failed to fetch brands data' }, { status: 500 });
  }
}