import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { Settings } from '@/types/settings';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const organizationId = await getOrganizationId(baseUrl);
  try {
    const { data, error } = await supabase
      .from('product')
      .select('id, product_name, product_description, product_tax_code, is_displayed, attrs, links_to_image, organisation_id')
      .eq('organization_id', organizationId);;

    if (error) {
      return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
  }
}