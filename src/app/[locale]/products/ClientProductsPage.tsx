'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, ArrowRightIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import CategoriesBar from '@/components/product/CategoriesBar';
import IconButton from '@/ui/IconButton';
import FeedbackAccordion from '@/components/TemplateSections/FeedbackAccordion';
import { useProductTranslations } from '@/components/product/useProductTranslations';
import UnsplashAttribution from '@/components/UnsplashAttribution';

type Product = {
  id: number;
  slug?: string;
  organization_id: string;
  is_displayed: boolean;
  product_name: string | null;
  product_sub_type_id: number;
  product_sub_type_additional_id: number;
  order: number;
  price_manual?: string | null;
  currency_manual_symbol?: string | null;
  computed_min_price?: number | null;
  computed_currency_symbol?: string | null;
  computed_stripe_price_id?: string | null;
  user_currency?: string;
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

const ClientProductsPage = memo(function ClientProductsPage({
  initialProducts,
  initialSubTypes,
  initialError,
  isAdmin = true,
  organizationType = 'services',
}: {
  initialProducts: Product[];
  initialSubTypes: ProductSubType[];
  initialError: string | null;
  isAdmin?: boolean;
  organizationType?: string;
}) {
  const { t } = useProductTranslations();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubType, setActiveSubType] = useState<ProductSubType | null>(null);
  const [visibleItemsCount, setVisibleItemsCount] = useState<number>(8);

  // Function to get page title based on organization type
  const getPageTitle = (orgType: string): string => {
    switch (orgType) {
      case 'immigration':
        return (t as any).immigrationServices || 'Immigration Services';
      case 'solicitor':
        return (t as any).legalServices || 'Legal Services';
      case 'finance':
        return (t as any).financialServices || 'Financial Services';
      case 'education':
        return (t as any).coursesEducation || 'Education & Training';
      case 'job':
        return (t as any).jobOpportunities || 'Jobs & Careers';
      case 'beauty':
        return (t as any).beautyServices || 'Beauty Services';
      case 'doctor':
        return (t as any).medicalServices || 'Medical Services';
      case 'services':
        return (t as any).ourServices || 'Our Services';
      case 'realestate':
        return (t as any).realEstate || 'Real Estate';
      case 'construction':
        return (t as any).constructionServices || 'Construction Services';
      case 'software':
        return (t as any).softwareServices || 'Software & SaaS';
      case 'marketing':
        return (t as any).marketingServices || 'Marketing & Advertising';
      case 'consulting':
        return (t as any).consultingServices || 'Consulting Services';
      case 'automotive':
        return (t as any).automotiveServices || 'Auto Services';
      case 'hospitality':
        return (t as any).hospitalityServices || 'Hotels & Tourism';
      case 'retail':
        return (t as any).retailServices || 'Retail & Online';
      case 'healthcare':
        return (t as any).healthcareServices || 'Healthcare Services';
      case 'transportation':
        return (t as any).transportationServices || 'Transport & Logistics';
      case 'technology':
        return (t as any).technologyServices || 'IT & Tech Services';
      case 'platform':
        return (t as any).platformServices || 'Business Platform Solutions';
      case 'general':
        return t.products; // Use default translation for general organizations
      default:
        return t.products; // Fallback to default translation
    }
  };
  const [error, setError] = useState<string | null>(initialError);
  const [isFixed, setIsFixed] = useState(false);
  const [searchHeight, setSearchHeight] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);

  // Initialize activeSubType based on query parameter
  useEffect(() => {
    const categoryId = searchParams.get('category');
    if (categoryId) {
      const subType = initialSubTypes.find((st) => st.id === parseInt(categoryId));
      setActiveSubType(subType || null);
    } else {
      setActiveSubType(null);
    }
  }, [searchParams, initialSubTypes]);

  // Memoized filtered products calculation
  const filteredProducts = useMemo(() => {
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
          p.product_sub_type_id === activeSubType.id ||
          p.product_sub_type_additional_id === activeSubType.id
      );
    }

    return result.sort((a, b) => a.order - b.order);
  }, [searchQuery, activeSubType, initialProducts]);

  // Update visible count when filtered products change
  useEffect(() => {
    setVisibleItemsCount(8);
  }, [filteredProducts]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 30;
      setIsFixed(scrollY > threshold);
    };

    const measureSearchHeight = () => {
      if (searchRef.current) {
        setSearchHeight(searchRef.current.offsetHeight);
      } else {
        setSearchHeight(60);
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
      const searchBottom = 30 + searchHeight;
      const targetScroll = scrollTop + rect.top - searchBottom - 16;
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [searchQuery, isFixed, searchHeight]);

  const handleCategoryChange = useCallback((subType: ProductSubType | null) => {
    setActiveSubType(subType);
  }, []);

  const loadMoreItems = useCallback(() => {
    setVisibleItemsCount((prev) => prev + 8);
  }, []);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement>, imageUrl?: string) => {
    console.error('Image failed to load:', imageUrl);
    e.currentTarget.style.display = 'none';
  }, []);

  // Error boundary fallback
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t.errorLoadingProducts}</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 relative">
            <div className="relative group">
              <h1 className="text-center text-xl font-bold text-gray-900 tracking-wide mb-6 sm:mb-0">
                {getPageTitle(organizationType)}
                <span className="absolute bottom-4 sm:-bottom-2 left-1/2 sm:left-1/3 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
              </h1>
              {isAdmin && (
                <div className="absolute -top-8 left-0 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Link href="/admin/products/create">
                    <IconButton
                      onClick={() => undefined}
                      icon={PlusIcon}
                      tooltip={t.createNewProduct}
                    />
                  </Link>
                  <Link href="/admin/products/">
                    <IconButton
                      onClick={() => undefined}
                      icon={PencilIcon}
                      tooltip={t.editProducts}
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
                placeholder={t.searchPlaceholder}
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
            {searchQuery ? `${t.noProductsFound} "${searchQuery}"` : t.noProductsAvailable}
          </div>
        ) : (
          <div
            ref={productsRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto"
          >
            {filteredProducts.slice(0, visibleItemsCount).map((product, index) => {
              const productUrl = product.slug ? `/products/${product.slug}` : '#';
              const unsplashAttr = product.attrs?.unsplash_attribution;
              const isAboveFold = index < 8; // First 8 products are above the fold
              
              return (
                <div key={product.id} className="group w-full relative">
                  <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full min-h-[320px] sm:min-h-[380px]">
                    {product.links_to_image && product.links_to_image.trim() !== '' && (
                      <div className="relative w-full h-48 sm:h-52 flex-shrink-0 overflow-hidden group/img">
                        {/* Background Link for image - accessibility */}
                        <Link
                          href={productUrl}
                          className="absolute inset-0 z-0"
                          aria-label={`View ${product.product_name ?? t.unnamedProduct}`}
                        >
                          <span className="sr-only">View product</span>
                        </Link>
                        
                        <Image
                          src={product.links_to_image}
                          alt={product.product_name ?? t.productImage}
                          fill
                          priority={isAboveFold}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                          onError={(e) => handleImageError(e, product.links_to_image || undefined)}
                        />
                        
                        {/* Unsplash Attribution */}
                        {unsplashAttr && (
                          <UnsplashAttribution
                            attribution={unsplashAttr}
                            variant="overlay"
                            position="bottom-right"
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Content Link */}
                    <Link href={productUrl} className="p-4 sm:p-6 flex flex-col flex-grow">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-sky-400 transition-colors duration-200 min-h-[3rem] sm:min-h-[3.5rem]">
                        {product.product_name ?? t.unnamedProduct}
                      </h2>
                      <div className="mt-auto">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-gray-500 text-sm sm:text-base">{t.from}</span>
                          <div className="font-bold text-base sm:text-lg text-gray-700">
                            <span>
                              {(product.computed_currency_symbol ?? product.currency_manual_symbol) ?? ''}
                            </span>
                            <span>
                              {product.computed_min_price ?? product.price_manual ?? ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <span className="text-sky-400 transition-all duration-300 group-hover:translate-x-1">
                            <ArrowRightIcon className="h-5 w-5" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filteredProducts.length > visibleItemsCount && (
          <div className="flex justify-center sm:justify-end px-4 mt-8 max-w-7xl mx-auto">
            <button
              type="button"
              onClick={loadMoreItems}
              className="px-6 py-3 text-gray-600 font-medium hover:text-sky-400 hover:bg-sky-50 rounded-lg transition-all duration-200 border border-gray-200 hover:border-sky-200"
            >
              {t.loadMoreProducts}
            </button>
          </div>
        )}

        <FeedbackAccordion type="all_products" />
      </div>
    </div>
  );
});

export default ClientProductsPage;