// app/products/page.tsx
import { supabase } from '../../lib/supabaseClient';
import ClientProductsPage from './ClientProductsPage';

type Product = {
  id: number;
  slug?: string;
  product_name: string | null;
  product_sub_type_id: number;
  product_sub_type_additional_id: number;
  order: number; // Added for sorting
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
  const { data, error } = await supabase
    .from('product')
    .select('*')
    .order('order', { ascending: true }); // Sort by order ascending
  console.log('Fetched products:', data);
  if (error) throw new Error('Failed to load products: ' + error.message);
  return data || [];
}

async function fetchProductSubTypes() {
  const { data, error } = await supabase.from('product_sub_type').select('*');
  console.log('Fetched sub-types:', data);
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