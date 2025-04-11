'use client';

import Link from 'next/link';
import { useState } from 'react';
import Card from '../../components/Card';
import CategoriesBar from '../../components/CategoriesBar';
import EditDeleteButton from '../../components/EditDeleteButton';

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

export default function ClientProductsPage({
  initialProducts,
  initialSubTypes,
  initialError,
}: {
  initialProducts: Product[];
  initialSubTypes: ProductSubType[];
  initialError: string | null;
}) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(4);
  const [activeSubType, setActiveSubType] = useState<ProductSubType | null>(null);
  const [error, setError] = useState<string | null>(initialError);

  function handleCategoryChange(subType: ProductSubType | null) {
    if (!subType) {
      setFilteredProducts(initialProducts);
      setActiveSubType(null);
    } else {
      setActiveSubType(subType);
      const filtered = initialProducts.filter(
        (p) => p.product_sub_type_id === subType.id
      );
      setFilteredProducts(filtered);
    }
    setVisibleItemsCount(4);
  }

  function loadMoreItems() {
    setVisibleItemsCount((prev) => prev + 4);
  }

  return (
    <div className="min-h-screen mx-auto max-w-7xl">
      <div className="px-4 flex justify-end mb-6">
        <CategoriesBar
          productSubTypes={initialSubTypes}
          onCategoryChange={handleCategoryChange}
          activeSubTypeName={activeSubType ? activeSubType.name : null}
        />
      </div>

      <div className="grid sm:grid-cols-3 bg-transparent">
        <div className="px-4 flex justify-start items-center sm:col-span-3">
          <h1 className="text-lg font-bold text-gray-800 uppercase">
            Products
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto sm:px-4 mt-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-8 justify-items-center">
          {filteredProducts.slice(0, visibleItemsCount).map((product) => (
            <div className="max-w-xl" key={product.id}>
              <Link href={`/products/${product.slug || product.id}`}>
                <Card product={product} />
              </Link>
            </div>
          ))}
        </div>

        {filteredProducts.length > visibleItemsCount && (
          <div className="flex justify-end p-4">
            <button
              onClick={loadMoreItems}
              className="text-gray-500 font-medium hover:text-gray-300"
            >
              Load more ...
            </button>
          </div>
        )}

        <EditDeleteButton href="/admin/products/" title="Edit products" />
      </div>
    </div>
  );
}