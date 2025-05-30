// app/products/page.tsx
import { supabase, getOrganizationId } from '../../lib/supabase'; // Import getOrganizationId
import ClientProductsPage from './ClientProductsPage';

type Product = {
  id: number;
  slug?: string;
  organisation_id: string;
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

async function fetchProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('product')
    .select('*')
    .eq('organization_id', organizationId) // Filter by organization_id
    .order('order', { ascending: true });

  console.log('Fetched products:', data, 'for organization_id:', organizationId);
  if (error) throw new Error('Failed to load products: ' + error.message);
  return data || [];
}

async function fetchProductSubTypes() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const organizationId = await getOrganizationId(baseUrl);
  if (!organizationId) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('product_sub_type')
    .select('*')
    .eq('organization_id', organizationId); // Filter by organization_id

  console.log('Fetched sub-types:', data, 'for organization_id:', organizationId);
  if (error) throw new Error('Failed to load product sub-types: ' + error.message);
  return data || [];
}

export default async function ProductsPage() {
  let allProducts: Product[] = [];
  let productSubTypes: ProductSubType[] = [];
  let error: string | null = null;
  const isAdmin = false; // Replace with auth logic

  try {
    allProducts = await fetchProducts();
    productSubTypes = await fetchProductSubTypes();
    // Example: const { user } = await supabase.auth.getUser(); isAdmin = user?.role === 'admin';
  } catch (err: any) {
    error = err.message;
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