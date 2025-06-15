// /app/products/page.tsx
import { supabase, getOrganizationId } from '../../lib/supabase';
import { getBaseUrl } from '../../lib/utils';
import ClientProductsPage from './ClientProductsPage';

type Product = {
  id: number;
  slug?: string;
  is_displayed: boolean;
  organization_id: string;
  product_name: string | null;
  product_sub_type_id: number;
  product_sub_type_additional_id: number;
  order: number;
  price_manual?: string;
  currency_manual_symbol?: string;
  links_to_image?: string | null;
  [key: string]: any;
};

type ProductSubType = {
  id: number;
  name: string;
  display_for_products: boolean;
  title_english?: string;
  [key: string]: any;
};

async function fetchProducts(baseUrl: string) {
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    console.error('Organization not found for fetchProducts, baseUrl:', baseUrl);
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_displayed', true)
    .order('order', { ascending: true });

  console.log('Fetched products:', data, 'for organization_id:', organizationId);
  if (error) throw new Error('Failed to load products: ' + error.message);
  return data || [];
}

async function fetchProductSubTypes(baseUrl: string) {
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    console.error('Organization not found for fetchProductSubTypes, baseUrl:', baseUrl);
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('product_sub_type')
    .select('*')
    .eq('organization_id', organizationId);

  console.log('Fetched sub-types:', data, 'for organization_id:', organizationId);
  if (error) throw new Error('Failed to load product sub-types: ' + error.message);
  return data || [];
}

export default async function ProductsPage() {
  // Skip Supabase queries during Vercel static build
  const isBuild = process.env.VERCEL_ENV === 'production' && !process.env.VERCEL_URL;
  if (isBuild) {
    console.log('Skipping Supabase queries during Vercel build');
    return (
      <ClientProductsPage
        initialProducts={[]}
        initialSubTypes={[]}
        initialError={null}
        isAdmin={false}
      />
    );
  }

  // Try getBaseUrl first, fallback to NEXT_PUBLIC_BASE_URL
  let baseUrl = getBaseUrl(true);
  console.log('ProductsPage baseUrl:', baseUrl, 'VERCEL_URL:', process.env.VERCEL_URL, 'NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);

  let allProducts: Product[] = [];
  let productSubTypes: ProductSubType[] = [];
  let error: string | null = null;
  const isAdmin = false;

  try {
    allProducts = await fetchProducts(baseUrl);
    productSubTypes = await fetchProductSubTypes(baseUrl);
  } catch (err: any) {
    console.error('Error fetching data with getBaseUrl, trying NEXT_PUBLIC_BASE_URL fallback:', err.message);
    // Fallback to NEXT_PUBLIC_BASE_URL
    baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log('Falling back to baseUrl:', baseUrl);
    try {
      allProducts = await fetchProducts(baseUrl);
      productSubTypes = await fetchProductSubTypes(baseUrl);
    } catch (fallbackErr: any) {
      error = fallbackErr.message;
      console.error('Fallback failed:', fallbackErr.message);
    }
  }

  return (
    <ClientProductsPage
      initialProducts={allProducts}
      initialSubTypes={productSubTypes}
      initialError={error}
      isAdmin={isAdmin}
    />
  );
}