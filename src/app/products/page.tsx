// /app/products/page.tsx
import { supabase, getOrganizationId } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';
import ClientProductsPage from './ClientProductsPage';

type Product = {
  id: number;
  slug?: string;
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
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('organization_id', organizationId)
    .order('order', { ascending: true });

  if (error) throw new Error('Failed to load products: ' + error.message);
  console.log('Fetched products:', data, 'for organization_id:', organizationId);
  return data || [];
}

async function fetchProductSubTypes(baseUrl: string) {
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('product_sub_type')
    .select('*')
    .eq('organization_id', organizationId);

  if (error) throw new Error('Failed to load product sub-types: ' + error.message);
  console.log('Fetched sub-types:', data, 'for organization_id:', organizationId);
  return data || [];
}

export default async function ProductsPage() {
  const baseUrl = getBaseUrl(true); // Server-side baseUrl
  let allProducts: Product[] = [];
  let productSubTypes: ProductSubType[] = [];
  let error: string | null = null;
  const isAdmin = false; // Replace with auth logic, e.g., const { user } = await supabase.auth.getUser();

  try {
    allProducts = await fetchProducts(baseUrl);
    productSubTypes = await fetchProductSubTypes(baseUrl);
  } catch (err: any) {
    error = err.message;
  }

  return (
    <ClientProductsPage
      initialProducts={allProducts}
      initialSubTypes={productSubTypes}
      initialError={error}
      isAdmin={isAdmin}
      baseUrl={baseUrl}
    />
  );
}