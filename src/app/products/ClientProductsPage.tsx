// /app/products/ClientProductsPage.tsx
'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react'; // Added useRef
import { MagnifyingGlassIcon, ArrowRightIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import CategoriesBar from '@/components/product/CategoriesBar';
import IconButton from '@/ui/IconButton';
import FeedbackAccordion from '@/components/FeedbackAccordion';

type Product = {
  id: number;
  slug?: string;
  organization_id: string;
  is_displayed: boolean;
  product_name: string | null;
  product_sub_type_id: number; // Removed duplicate
  product_sub_type_additional_id: number;
  order: number;
  price_manual?: string | null;
  currency_manual_symbol?: string | null;
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

export default function ClientProductsPage({
  initialProducts,
  initialSubTypes,
  initialError,
  isAdmin = true, // Temporarily true for testing, adjust later
}: {
  initialProducts: Product[];
  initialSubTypes: ProductSubType[];
  initialError: string | null;
  isAdmin?: boolean;
}) {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubType, setActiveSubType] = useState<ProductSubType | null>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(8);
  const [error, setError] = useState<string | null>(initialError);
  const [isFixed, setIsFixed] = useState(false);
  const [searchHeight, setSearchHeight] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let result = initialProducts;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((product) => {
        const product_name = product.product_name ?? '';
        return product_name.toLowerCase().includes(query);
      });
    }

    if (activeSubType) {
      result = result.filter(
        (p) =>
          p.product_sub_type_id === activeSubType!.id ||
          p.product_sub_type_additional_id === activeSubType!.id
      );
    }

    result = result.sort((a, b) => a.order - b.order);
    setFilteredProducts(result);
    setVisibleItemsCount(8);
  }, [searchQuery, activeSubType, initialProducts]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 30; // Fix after 30px
      console.log('ScrollY:', scrollY, 'IsFixed:', scrollY > threshold); // Debug
      setIsFixed(scrollY > threshold);
    };

    const measureSearchHeight = () => {
      if (searchRef.current) {
        const height = searchRef.current.offsetHeight;
        console.log('Search Height:', height); // Debug
        setSearchHeight(height);
      } else {
        console.log('Search Ref Not Found, Using Fallback Height');
        setSearchHeight(60); // Fallback
      }
    };

    measureSearchHeight();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', measureSearchHeight);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', measureSearchHeight);
    };
  }, []);

  useEffect(() => {
    if (isFixed && searchQuery && productsRef.current && window.innerWidth < 640) {
      const rect = productsRef.current.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const searchBottom = 30 + searchHeight; // top-[80px] + searchHeight
      const targetScroll = scrollTop + rect.top - searchBottom - 16; // 16px buffer
      console.log('Scrolling to:', targetScroll); // Debug
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [searchQuery, isFixed, searchHeight]);

  function handleCategoryChange(subType: ProductSubType | null) {
    setActiveSubType(subType);
  }

  function loadMoreItems() {
    setVisibleItemsCount((prev) => prev + 8);
  }

  if (error)
    return (
      <div className="py-32 text-center text-red-500">
        <div>{error}</div>
      </div>
    );

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 relative">
            <div className="relative group">
              <h1 className="text-center text-xl font-bold text-gray-900 tracking-wide mb-6 sm:mb-0">
                Products
                          <span className="absolute bottom-4 sm:-bottom-2 left-1/2 sm:left-1/3 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
              </h1>
              {isAdmin && (
                <div className="absolute -top-8 left-0 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Link href="/admin/products/create">
                    <IconButton
                      onClick={() => undefined}
                      icon={PlusIcon}
                      tooltip="Create New Product"
                    />
                  </Link>
                  <Link href="/admin/products/">
                    <IconButton
                      onClick={() => undefined}
                      icon={PencilIcon}
                      tooltip="Edit Products"
                    />
                  </Link>
                </div>
              )}
            </div>
            <div
              ref={searchRef}
              className={`${
                isFixed
                  ? 'fixed top-[80px] z-52 w-[calc(100%-2rem)] mx-auto px-4 py-2 sm:px-0 sm:py-0 sm:w-80 sm:left-1/2 sm:-translate-x-1/2 sm:top-[15px] backdrop-blur-sm bg-white/80 sm:backdrop-blur-none sm:bg-transparent rounded-xl sm:rounded-none '
                  : 'relative w-full sm:w-80 px-4 sm:px-0'
              } transition-all duration-200`}
            >
              <span className="absolute inset-y-0 left-2 sm:left-0 flex items-center pl-6 sm:pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-base font-light border bg-white border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>
        {isFixed && <div style={{ height: searchHeight ? `${searchHeight}px` : '60px' }} className="sm:hidden" />}
        <div className={`mb-6 ${isFixed && searchQuery ? 'hidden sm:block' : ''}`}>
          <CategoriesBar
            productSubTypes={initialSubTypes}
            onCategoryChange={handleCategoryChange}
            activeSubTypeName={activeSubType ? activeSubType.name : null}
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div
            ref={productsRef}
            className="text-center py-16 text-gray-500 max-w-7xl mx-auto"
          >
            {searchQuery ? `No products found matching "${searchQuery}"` : 'No products available'}
          </div>
        ) : (
          <div
            ref={productsRef}
            className="sm:px-0 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 max-w-7xl mx-auto"
          >
            {filteredProducts.slice(0, visibleItemsCount).map((product) => (
              <Link
                key={product.id}
                href={product.slug ? `/products/${product.slug}` : '#'}
                className="group"
              >
                <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
                  {product.links_to_image && product.links_to_image.trim() !== '' && (
                    <div className="p-2 sm:p-0 w-1/2 h-1/2 sm:w-full sm:h-auto flex-shrink-0">
                      <img
                        src={product.links_to_image}
                        alt={product.product_name ?? 'Product image'}
                        className="w-full rounded-t-lg h-auto object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', product.links_to_image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="p-4 flex flex-col flex-grow">
                    <h2 className="tracking-tight text-sm sm:text-lg line-clamp-1 font-semibold text-gray-900 mb-3 group-hover:text-sky-400">
                      {product.product_name ?? 'Unnamed Product'}
                    </h2>
                  </div>
                  <div className="px-4 py-2 flex justify-between">
                    <span className="text-gray-500 text-sm sm:text-base">From</span>
                    <div className="font-bold tracking-wider text-sm sm:text-base text-gray-700">
                      <span>{product.currency_manual_symbol ?? ''}</span>
                      <span>{product.price_manual ?? ''}</span>
                    </div>
                  </div>
                  <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-transparent flex-shrink-0 flex justify-end relative">
                    <span className="text-sky-400 transition-all duration-300  group ">
                      <ArrowRightIcon className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {filteredProducts.length > visibleItemsCount && (
          <div className="flex justify-end px-4 mt-8 max-w-7xl mx-auto">
            <button
              type="button"
              onClick={loadMoreItems}
              className="text-gray-500 font-medium hover:text-sky-400"
            >
              Load more...
            </button>
          </div>
        )}

        <FeedbackAccordion type="all_products" />
      </div>
    </div>
  );
}