import { NextResponse } from 'next/server';
import { supabase } from '@/lib/stripe-supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('product')
      .select('id, product_name, product_description, product_tax_code, is_displayed, attrs, links_to_image');

    if (error) {
      return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
  }
}