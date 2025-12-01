'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { useProductTranslations } from './useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const themeColors = useThemeColors();
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
        
        // console.log('CategoryBarProductDetailPage: Fetching related products', {
        //   currentProductId: currentProduct.id,
        //   productSubTypeId: currentProduct.product_sub_type_id,
        //   organizationId: currentProduct.organization_id
        // });

        const { data, error } = await supabase
          .from('product')
          .select('id, slug, product_name, product_sub_type_id, organization_id, links_to_image, product_media(image_url, thumbnail_url)')
          .eq('product_sub_type_id', currentProduct.product_sub_type_id)
          .eq('organization_id', currentProduct.organization_id)
          .neq('id', currentProduct.id)
          .limit(3);

        if (error) {
          throw new Error(error.message);
        }

        // console.log('CategoryBarProductDetailPage: Found related products', {
        //   count: data?.length || 0,
        //   products: data?.map(p => ({ id: p.id, name: p.product_name, orgId: p.organization_id }))
        // });

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
    return null;
  }

  return (
    <div className="relative">
      {/* Section Header */}
      <div className="mb-4 px-4 md:px-0">
        <h3 className="text-lg font-semibold text-gray-900">
          Related
        </h3>
      </div>

      {/* Cards - Horizontal scroll for both mobile and desktop */}
      <div className="flex gap-6 overflow-x-auto py-4 px-4 md:px-0 snap-x snap-mandatory"
           style={{ scrollbarWidth: 'thin' }}>
        {relatedProducts.slice(0, 3).map((product) => {
          // Get first image from product_media or fallback to links_to_image
          const firstMedia = product.product_media?.[0];
          const imageUrl = firstMedia?.thumbnail_url || firstMedia?.image_url || product.links_to_image;

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              onClick={() => handleProductSelect(product)}
              className="group relative bg-white/60 backdrop-blur-sm border border-white/40 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 flex-shrink-0 w-40 md:w-48 snap-start"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.product_name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      if (img.naturalHeight > img.naturalWidth) {
                        img.classList.remove('object-cover');
                        img.classList.add('object-contain');
                      }
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Product Name */}
              <div className="p-3">
                <h3 className={`text-sm font-medium text-gray-900 line-clamp-1 truncate group-hover:text-${themeColors.primary.text} transition-colors`}>
                  {product.product_name}
                </h3>
              </div>

              {/* Hover Indicator */}
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                <svg className={`w-4 h-4 text-${themeColors.primary.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}