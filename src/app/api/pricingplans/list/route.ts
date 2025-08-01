import { NextResponse } from 'next/server';
import { supabase } from '@/lib/stripe-supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('pricingplan')
      .select('*, product(product_name, links_to_image)');

    if (error) {
      return NextResponse.json({ error: `Failed to fetch pricing plans: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch pricing plans: ${error.message}` }, { status: 500 });
  }
}