'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import { MagnifyingGlassIcon, ArrowRightIcon, PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import CategoriesBar from '@/components/product/CategoriesBar';
import IconButton from '@/ui/IconButton';
import FeedbackAccordion from '@/components/TemplateSections/FeedbackAccordion';
import { useProductTranslations } from '@/components/product/useProductTranslations';
import UnsplashAttribution from '@/components/UnsplashAttribution';
import { useThemeColors } from '@/hooks/useThemeColors';

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
  const themeColors = useThemeColors();
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
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);

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

  // Debounce search query
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentProductSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Generate autocomplete suggestions
  useEffect(() => {
    if (searchQuery.length > 0) {
      const suggestions = initialProducts
        .filter(p => p.product_name?.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
        .map(p => p.product_name || '')
        .filter(name => name.toLowerCase() !== searchQuery.toLowerCase());
      setAutocompleteSuggestions(suggestions);
    } else {
      setAutocompleteSuggestions([]);
    }
  }, [searchQuery, initialProducts]);

  // Save to recent searches
  const saveRecentSearch = useCallback((query: string) => {
    if (query.trim()) {
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentProductSearches', JSON.stringify(updated));
    }
  }, [recentSearches]);

  // Keyboard navigation for autocomplete
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const suggestions = searchQuery ? autocompleteSuggestions : recentSearches;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        e.preventDefault();
        setSearchQuery(suggestions[activeIndex]);
        saveRecentSearch(suggestions[activeIndex]);
        setShowAutocomplete(false);
        setActiveIndex(-1);
      } else if (searchQuery) {
        saveRecentSearch(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false);
      setActiveIndex(-1);
    }
  }, [activeIndex, autocompleteSuggestions, recentSearches, searchQuery, saveRecentSearch]);

  // Memoized filtered products calculation
  const filteredProducts = useMemo(() => {
    let result = initialProducts;

    if (debouncedQuery) {
      const query = debouncedQuery.toLowerCase();
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
  }, [debouncedQuery, activeSubType, initialProducts]);

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

  // Instrument initial mount relative to hero CTA click
  useEffect(() => {
    try {
      const clickEntries = performance.getEntriesByName('hero-cta-click');
      if (clickEntries && clickEntries.length) {
        const clickTime = clickEntries[clickEntries.length - 1].startTime;
        const now = performance.now();
        const delta = (now - clickTime).toFixed(0);
        console.log(`[Perf] Products page mounted ~${delta}ms after hero CTA click`);
        performance.mark('products-page-mounted');
        performance.measure('hero-cta-to-products-mounted', 'hero-cta-click', 'products-page-mounted');
      }
    } catch {}
  }, []);

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-24">
        <div className="">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 relative">
            <div className="relative group">
              <h1 className="text-center text-xl font-bold text-gray-900 tracking-wide mb-6 sm:mb-0">
                {getPageTitle(organizationType)}
                <span className={`absolute bottom-4 sm:-bottom-2 left-1/2 sm:left-1/3 -translate-x-1/2 w-16 h-1 bg-${themeColors.primary.bg} rounded-full`} />
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
              {/* Search Icon */}
              <span className="absolute inset-y-0 left-2 sm:left-0 flex items-center pl-6 sm:pl-3 pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </span>
              
              {/* Search Input */}
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                }}
                onFocus={(e) => {
                  setShowAutocomplete(true);
                  setActiveIndex(-1);
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeColors.cssVars.primary.base}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.boxShadow = '';
                  setTimeout(() => {
                    setShowAutocomplete(false);
                    setActiveIndex(-1);
                  }, 200);
                }}
                onKeyDown={handleKeyDown}
                className="w-full pl-10 pr-24 py-3.5 text-base border bg-white border-gray-100 rounded-xl focus:outline-none focus:border-transparent transition-all duration-200"
                style={{
                  '--tw-ring-color': themeColors.cssVars.primary.base,
                } as React.CSSProperties}
              />
              
              {/* Right Side Icons */}
              <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4">
                {/* Loading Spinner */}
                {isSearching && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600" />
                )}
                
                {/* Clear Button */}
                {searchQuery && !isSearching && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                    aria-label="Clear search"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-500" />
                  </button>
                )}
                
                {/* Keyboard Shortcut Hint */}
                <span className="hidden xl:flex items-center gap-0.5 px-2.5 py-1 text-xs text-gray-500 font-medium bg-gray-100 rounded-md">
                  <kbd>⌘</kbd><kbd>K</kbd>
                </span>
              </div>
              
              {/* Autocomplete Dropdown */}
              {showAutocomplete && (autocompleteSuggestions.length > 0 || recentSearches.length > 0) && (
                <div 
                  id="search-autocomplete"
                  role="listbox"
                  className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto"
                >
                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Recent</div>
                      {recentSearches.map((search, idx) => (
                        <button
                          key={idx}
                          id={`search-suggestion-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onClick={() => {
                            setSearchQuery(search);
                            setShowAutocomplete(false);
                            setActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 flex items-center gap-2 transition-colors ${
                            activeIndex === idx ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                          style={activeIndex === idx ? { backgroundColor: `${themeColors.cssVars.primary.base}15` } : {}}
                        >
                          <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                          {search}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Autocomplete Suggestions */}
                  {searchQuery && autocompleteSuggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-3 py-2">Suggestions</div>
                      {autocompleteSuggestions.map((name, idx) => (
                        <button
                          key={idx}
                          id={`search-suggestion-${idx}`}
                          role="option"
                          aria-selected={activeIndex === idx}
                          onClick={() => {
                            setSearchQuery(name);
                            saveRecentSearch(name);
                            setShowAutocomplete(false);
                            setActiveIndex(-1);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg text-sm text-gray-700 transition-colors ${
                            activeIndex === idx ? 'bg-gray-100' : 'hover:bg-gray-50'
                          }`}
                          style={activeIndex === idx ? { backgroundColor: `${themeColors.cssVars.primary.base}15` } : {}}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Search Tips */}
                  {!searchQuery && recentSearches.length === 0 && (
                    <div className="p-4 text-center text-sm text-gray-500">
                      <p className="font-medium mb-1">Search tips:</p>
                      <p className="text-xs">Try searching by product name or category</p>
                    </div>
                  )}
                </div>
              )}
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
              const isFirst = index === 0; // Only first gets priority
              
              return (
                <div key={product.id} className="group w-full relative">
                  <Link href={productUrl} prefetch className="block"
                    onClick={() => {
                      try {
                        performance.mark('PerfProdDetail-click');
                        const ts = performance.now().toFixed(0);
                        console.log(`[PerfProdDetail] click at ${ts}ms product ${product.id}`);
                      } catch {}
                    }}
                  >
                    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
                      {product.links_to_image && product.links_to_image.trim() !== '' && (
                        <div className="relative w-full aspect-square flex-shrink-0 bg-gray-100 overflow-hidden flex items-center justify-center group/img">
                          <Image
                            src={product.links_to_image}
                            alt={product.product_name ?? t.productImage}
                            fill
                            priority={isFirst}
                            loading={isFirst ? 'eager' : 'lazy'}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                            onError={(e) => handleImageError(e, product.links_to_image || undefined)}
                          />
                        </div>
                      )}
                      
                      {/* Content */}
                      <div className="p-4 sm:p-6 flex flex-col flex-grow">
                        <h2 className={`text-base sm:text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-${themeColors.primary.textHover} transition-colors duration-200 min-h-[3rem] sm:min-h-[3.5rem]`}>
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
                            <span className={`text-${themeColors.primary.text} transition-all duration-300 group-hover:translate-x-1`}>
                              <ArrowRightIcon className="h-5 w-5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Unsplash Attribution - Outside Link to avoid nested <a> tags */}
                  {unsplashAttr && product.links_to_image && (
                    <div className="absolute top-0 left-0 w-full aspect-square pointer-events-none">
                      <div className="relative w-full h-full">
                        <div className="pointer-events-auto">
                          <UnsplashAttribution
                            attribution={unsplashAttr}
                            variant="overlay"
                            position="bottom-right"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
              className={`px-6 py-3 text-gray-600 font-medium hover:text-${themeColors.primary.textHover} hover:bg-${themeColors.primary.bgLighter} rounded-lg transition-all duration-200 border border-gray-200 hover:border-${themeColors.primary.border}`}
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