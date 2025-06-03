// /app/api/products/list/route.ts
import { NextResponse } from 'next/server';
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

export async function GET() {
  const baseUrl = getBaseUrl(true);
  console.log('API /products/list baseUrl:', baseUrl);
  try {
    const organizationId = await getOrganizationId(baseUrl);
    if (!organizationId) {
      console.error('Organization not found for baseUrl:', baseUrl);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    console.log('Organization ID:', organizationId);

    const { data, error } = await supabase
      .from('product')
      .select('id, product_name, product_description, product_tax_code, is_displayed, attrs, links_to_image, organization_id')
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error fetching products:', error.message);
      return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
    }

    console.log('Fetched products:', data);
    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('Unexpected error:', error.message);
    return NextResponse.json({ error: `Failed to fetch products: ${error.message}` }, { status: 500 });
  }
}