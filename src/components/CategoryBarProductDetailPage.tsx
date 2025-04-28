'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

// Define types for the product
type Product = {
  id: number;
  slug?: string;
  product_name: string;
  product_sub_type_id: number;
  [key: string]: any;
};

interface CategoryBarProductDetailPageProps {
  currentProduct: Product | null;
}

export default function CategoryBarProductDetailPage({
  currentProduct,
}: CategoryBarProductDetailPageProps) {
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!currentProduct || !currentProduct.product_sub_type_id) {
        setRelatedProducts([]);
        return;
      }

      try {
        setError(null);

        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('product_sub_type_id', currentProduct.product_sub_type_id)
          .neq('id', currentProduct.id);

        if (error) {
          throw new Error(error.message);
        }

        setRelatedProducts(data || []);
      } catch (err: any) {
        console.error('Error fetching related products:', err);
        setError('Failed to load related products');
      }
    };

    fetchRelatedProducts();
  }, [currentProduct]);

  const handleProductSelect = (product: Product) => {
    console.log('Selected related product:', product);
    router.push(`/products/${product.slug}`); // Navigate to the related product's page
  };

  if (error) {
    return <div className="text-center py-2 text-red-500">{error}</div>;
  }

  if (!relatedProducts || relatedProducts.length === 0) {
    return <div className="text-center py-2 text-gray-500"></div>;
  }

  return (
    <div className="flex space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-2">
      {relatedProducts.map((product) => (
        <div key={product.id} className="relative group inline-block">
          {/* Link to the related product */}
          <Link
            href={`/products/${product.slug}`}
            onClick={() => handleProductSelect(product)}
            className="px-3 py-1 text-xs font-medium rounded transition-colors bg-gray-50 text-teal-700 hover:bg-teal-50 focus:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-300"
            aria-describedby={`tooltip-${product.id}`}
          >
            {product.product_name}
          </Link>

          {/* Tooltip */}
          <span
            id={`tooltip-${product.id}`}
            role="tooltip"
            className="absolute z-10 hidden group-hover:block group-focus-within:block top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-sm whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
          >
            View a similar product
            {/* Tooltip Arrow */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
          </span>
        </div>
      ))}
    </div>
  );
}