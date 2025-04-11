import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';
import ClientProductsPage from './ClientProductsPage';

// Define types for products and sub-types
type Product = {
  id: number;
  slug?: string;
  product_sub_type_id: number;
  [key: string]: any;
};

type ProductSubType = {
  id: number;
  name: string;
  [key: string]: any;
};

// Fetch data on the server side
async function fetchProducts() {
  const { data, error } = await supabase.from('product').select('*'); // Updated table name to 'product'
  console.log('Fetched products:', data);
  if (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to load products: ' + error.message);
  }
  return data || [];
}

async function fetchProductSubTypes() {
  const { data, error } = await supabase.from('product_sub_type').select('*'); // Updated table name to 'product_sub_type'
  console.log('Fetched sub-types:', data);
  if (error) {
    console.error('Error fetching sub-types:', error);
    throw new Error('Failed to load product sub-types: ' + error.message);
  }
  return data || [];
}

export default async function ProductsPage() {
  let allProducts: Product[] = [];
  let productSubTypes: ProductSubType[] = [];
  let error: string | null = null;

  try {
    allProducts = await fetchProducts();
    productSubTypes = await fetchProductSubTypes();
  } catch (err: any) {
    error = err.message;
  }

  return (
    <ClientProductsPage
      initialProducts={allProducts}
      initialSubTypes={productSubTypes}
      initialError={error}
    />
  );
}