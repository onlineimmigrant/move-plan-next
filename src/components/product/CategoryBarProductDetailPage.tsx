'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useProductTranslations } from './useProductTranslations';

// Define types for the product
type Product = {
  id: number;
  slug?: string;
  product_name: string;
  product_sub_type_id: number;
  organization_id: string;
  [key: string]: any;
};

interface CategoryBarProductDetailPageProps {
  currentProduct: Product | null;
}

export default function CategoryBarProductDetailPage({
  currentProduct,
}: CategoryBarProductDetailPageProps) {
  const { t } = useProductTranslations();
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!currentProduct || !currentProduct.product_sub_type_id || !currentProduct.organization_id) {
        console.log('CategoryBarProductDetailPage: Missing required data', {
          hasCurrentProduct: !!currentProduct,
          hasSubTypeId: !!currentProduct?.product_sub_type_id,
          hasOrgId: !!currentProduct?.organization_id
        });
        setRelatedProducts([]);
        return;
      }

      try {
        setError(null);
        
        console.log('CategoryBarProductDetailPage: Fetching related products', {
          currentProductId: currentProduct.id,
          productSubTypeId: currentProduct.product_sub_type_id,
          organizationId: currentProduct.organization_id
        });

        const { data, error } = await supabase
          .from('product')
          .select('*')
          .eq('product_sub_type_id', currentProduct.product_sub_type_id)
          .eq('organization_id', currentProduct.organization_id)
          .neq('id', currentProduct.id);

        if (error) {
          throw new Error(error.message);
        }

        console.log('CategoryBarProductDetailPage: Found related products', {
          count: data?.length || 0,
          products: data?.map(p => ({ id: p.id, name: p.product_name, orgId: p.organization_id }))
        });

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
    <div className="flex space-x-2 overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent py-8">
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
            {t.viewSimilarProduct}
            {/* Tooltip Arrow */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900" />
          </span>
        </div>
      ))}
    </div>
  );
}