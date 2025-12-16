// /app/api/products/list/route.ts
import { NextResponse } from 'next/server';
import { getOrganizationId } from '@/lib/supabase';
import { supabase } from '@/lib/supabaseClient';
import { getBaseUrl } from '@/lib/utils';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
      .select(`
        id, 
        product_name, 
        product_description, 
        product_tax_code, 
        is_displayed, 
        attrs, 
        links_to_image,
        links_to_video,
        author,
        author_2,
        isbn,
        slug,
        sku,
        metadescription_for_page,
        background_color,
        order,
        amazon_books_url,
        compare_link_url,
        details,
        organization_id
      `)
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