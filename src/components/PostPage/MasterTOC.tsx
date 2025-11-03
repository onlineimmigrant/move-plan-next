'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, BookOpenIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import { debug } from '@/utils/debug';

// Global cache for document sets to avoid re-fetching
// Cache for storing document set data with version
const CACHE_VERSION = 5;
const documentSetCache = new Map<string, { version: number; data: DocumentSet }>();

interface TOCItem {
  level: number;
  text: string;
  id: string;
  children?: TOCItem[];
}

interface Article {
  id: string;
  title: string;
  slug: string;
  order: number;
  toc: TOCItem[];
}

interface DocumentSet {
  set: string;
  title: string;
  is_numbered?: boolean; // Whether to show article numbers
  articles: Article[];
}

interface MasterTOCProps {
  currentSlug: string;
  docSet: string;
  organizationId: string;
  handleScrollTo: (id: string) => void;
  currentArticleTOC?: TOCItem[]; // Client-side generated TOC for current article
}

// Helper function to build hierarchical TOC structure
const buildTOCHierarchy = (flatTOC: TOCItem[]): TOCItem[] => {
  const hierarchy: TOCItem[] = [];
  const stack: TOCItem[] = [];

  flatTOC.forEach((item) => {
    const newItem = { ...item, children: [] };

    // Find the appropriate parent
    while (stack.length > 0 && stack[stack.length - 1].level >= newItem.level) {
      stack.pop();
    }

    if (stack.length === 0) {
      // Top level item (h2)
      hierarchy.push(newItem);
    } else {
      // Nested item (h3, h4, etc.)
      const parent = stack[stack.length - 1];
      if (!parent.children) parent.children = [];
      parent.children.push(newItem);
    }

    stack.push(newItem);
  });

  return hierarchy;
};

// Helper function to check if item or its children contain the active heading
const hasActiveHeading = (item: TOCItem, activeId: string): boolean => {
  if (item.id === activeId) return true;
  if (item.children) {
    return item.children.some(child => hasActiveHeading(child, activeId));
  }
  return false;
};

// Component for individual TOC items with collapsible children
const TOCItemComponent: React.FC<{
  item: TOCItem;
  isCurrentArticle: boolean;
  articleSlug: string;
  handleScrollTo: (id: string) => void;
  level: number;
  activeHeadingId: string;
}> = ({ item, isCurrentArticle, articleSlug, handleScrollTo, level, activeHeadingId }) => {
  const hasActive = hasActiveHeading(item, activeHeadingId);
  const [isOpen, setIsOpen] = useState(hasActive);
  const themeColors = useThemeColors();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.id === activeHeadingId && isCurrentArticle;

  // Auto-expand if contains active heading
  useEffect(() => {
    if (hasActive) {
      setIsOpen(true);
    }
  }, [hasActive]);

  // Responsive padding: smaller increments on smaller screens
  // Base (mobile): 8px per level, md: 10px per level, lg: 12px, xl: 8px per level
  const basePadding = level * 8;
  const mdPadding = level * 10;
  const lgPadding = level * 12;
  const xlPadding = level * 8;

  // Create responsive padding classes
  const paddingClass = `pl-[${basePadding}px] md:pl-[${mdPadding}px] lg:pl-[${lgPadding}px] xl:pl-[${xlPadding}px]`;

  return (
    <div>
      <div className="flex items-start group">
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex-shrink-0 w-4 h-4 mr-1 mt-1.5 hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
          >
            <ChevronRightIcon
              className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
            />
          </button>
        )}
        {!hasChildren && <div className="w-5 flex-shrink-0"></div>}

        {isCurrentArticle ? (
          <button
            onClick={() => handleScrollTo(item.id)}
            className={`flex-1 text-left py-1 rounded-md text-sm transition-colors pr-3 ${
              isActive 
                ? 'font-medium' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            style={{ 
              ...(isActive ? { color: themeColors.cssVars.primary.base } : {}),
              paddingLeft: `${basePadding}px`
            }}
          >
            {item.text}
          </button>
        ) : (
          <Link
            href={`/${articleSlug}#${item.id}`}
            prefetch={true}
            className={`flex-1 block py-1 rounded-md text-sm transition-colors pr-3 ${
              isActive 
                ? 'font-medium' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            style={{ 
              ...(isActive ? { color: themeColors.cssVars.primary.base } : {}),
              paddingLeft: `${basePadding}px`
            }}
          >
            {item.text}
          </Link>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="ml-2 space-y-0.5">
          {item.children!.map((child, idx) => (
            <TOCItemComponent
              key={idx}
              item={child}
              isCurrentArticle={isCurrentArticle}
              articleSlug={articleSlug}
              handleScrollTo={handleScrollTo}
              level={level + 1}
              activeHeadingId={activeHeadingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MasterTOC: React.FC<MasterTOCProps> = ({
  currentSlug,
  docSet,
  organizationId,
  handleScrollTo,
  currentArticleTOC,
}) => {
  const [setData, setSetData] = useState<DocumentSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(() => new Set([currentSlug]));
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const themeColors = useThemeColors();
  const isFetchingRef = useRef(false);

  // Log component mount
  useEffect(() => {
    debug.log('MasterTOC', 'Component mounted with props:', { currentSlug, docSet, organizationId });
  }, []);

  // Auto-expand current article and set active heading when currentSlug changes
  useEffect(() => {
    // Always ensure current article is expanded when navigating
    setExpandedArticles(prev => {
      const next = new Set(prev);
      next.add(currentSlug);
      return next;
    });
    
    // Check for hash and set active heading
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveHeadingId(hash);
      }
    }
  }, [currentSlug]);

  // Scroll spy: Track which heading is currently in view
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      // Get all heading elements in the article
      const headings = document.querySelectorAll('h2[id], h3[id], h4[id]');
      
      if (headings.length === 0) return;

      // Find the heading that's currently most visible
      // We'll use the heading that's closest to the top of the viewport (but still visible)
      let currentHeading: Element | null = null;
      let closestDistance = Infinity;

      headings.forEach((heading) => {
        const rect = heading.getBoundingClientRect();
        // Consider headings that are in the top 40% of the viewport
        const distanceFromTop = Math.abs(rect.top - 100); // 100px offset from top
        
        if (rect.top >= -50 && rect.top <= window.innerHeight * 0.4) {
          if (distanceFromTop < closestDistance) {
            closestDistance = distanceFromTop;
            currentHeading = heading;
          }
        }
      });

      // If no heading in the upper part, use the last heading that's above the viewport
      if (!currentHeading) {
        const headingsArray = Array.from(headings);
        for (let i = headingsArray.length - 1; i >= 0; i--) {
          const rect = headingsArray[i].getBoundingClientRect();
          if (rect.top < 100) {
            currentHeading = headingsArray[i];
            break;
          }
        }
      }

      if (currentHeading && currentHeading.id) {
        setActiveHeadingId(currentHeading.id);
      }
    };

    // Add scroll listener with throttling
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // Initial check
    handleScroll();

    // Add listener
    window.addEventListener('scroll', scrollListener, { passive: true });

    return () => {
      window.removeEventListener('scroll', scrollListener);
    };
  }, [currentSlug, currentArticleTOC]);

  useEffect(() => {
    const cacheKey = `${docSet}-${organizationId}`;
    
    // Check cache first
    const cachedEntry = documentSetCache.get(cacheKey);
    if (cachedEntry && cachedEntry.version === CACHE_VERSION) {
      setSetData(cachedEntry.data);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate fetches
    if (isFetchingRef.current) {
      return;
    }

    const fetchDocumentSet = async () => {
      isFetchingRef.current = true;
      try {
        // Use relative URL - works in all environments
        const url = `/api/document-sets/${docSet}?organization_id=${organizationId}`;
        
        debug.log('MasterTOC', 'Fetching document set:', { docSet, organizationId, url, fullUrl: window?.location?.href });
        
        const response = await fetch(url);

        debug.log('MasterTOC', 'Response received:', { status: response.status, ok: response.ok });

        if (response.ok) {
          const data = await response.json();
          debug.log('MasterTOC', 'Successfully fetched document set:', data);
          // Store in cache with version
          documentSetCache.set(cacheKey, { version: CACHE_VERSION, data });
          setSetData(data);
        } else {
          debug.error('MasterTOC', 'Failed to fetch document set:', response.status, response.statusText);
          const errorText = await response.text();
          debug.error('MasterTOC', 'Error response:', errorText);
        }
      } catch (error) {
        debug.error('MasterTOC', 'Error fetching document set:', error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    if (docSet && organizationId) {
      debug.log('MasterTOC', 'Conditions met, fetching...', { docSet, organizationId });
      fetchDocumentSet();
    } else {
      debug.warn('MasterTOC', 'Missing required params:', { docSet, organizationId });
      setIsLoading(false);
    }
  }, [docSet, organizationId]);

  const toggleArticle = (slug: string) => {
    setExpandedArticles(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-100 rounded w-full"></div>
        <div className="h-4 bg-gray-100 rounded w-5/6"></div>
        <div className="h-4 bg-gray-100 rounded w-4/6"></div>
      </div>
    );
  }

  if (!setData) {
    return null;
  }

  // Filter articles based on search query
  const filteredArticles = searchQuery.trim()
    ? setData.articles.filter((article) => {
        const query = searchQuery.toLowerCase();
        // Search in article title
        if (article.title.toLowerCase().includes(query)) return true;
        // Search in TOC headings
        return article.toc.some((item) => item.text.toLowerCase().includes(query));
      })
    : setData.articles;

  return (
    <nav className="space-y-1">
      {/* Set Title Header */}
      <div className="mb-3 flex items-center gap-2">
        <BookOpenIcon 
          className="w-4 h-4 flex-shrink-0"
          style={{ color: themeColors.cssVars.primary.base }}
        />
        <h3 
          className="text-xs font-bold uppercase tracking-wide"
          style={{ color: themeColors.cssVars.primary.base }}
        >
          {setData.title}
        </h3>
        <span className="text-xs text-gray-400">
          ({setData.articles.length})
        </span>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <MagnifyingGlassIcon 
            className="h-4 w-4" 
            style={{ color: themeColors.cssVars.primary.base }}
          />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search articles..."
          className="block w-full pl-10 pr-10 py-2 text-sm rounded-lg focus:outline-none transition-all backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-0 focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600"
          style={{ color: themeColors.cssVars.primary.base }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 transition-colors"
            aria-label="Clear search"
            style={{ color: themeColors.cssVars.primary.base }}
          >
            <XMarkIcon className="h-4 w-4 hover:opacity-70" />
          </button>
        )}
      </div>

      {/* Results Count */}
      {searchQuery && (
        <div className="text-xs text-gray-500 mb-2 px-2">
          {filteredArticles.length} {filteredArticles.length === 1 ? 'result' : 'results'}
        </div>
      )}

      {/* Articles List */}
      <div className="space-y-1">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article, index) => {
          const isCurrentArticle = article.slug === currentSlug;
          const isExpanded = expandedArticles.has(article.slug);
          
          // Use client-side TOC for current article if provided, otherwise use API TOC
          const articleTOC = isCurrentArticle && currentArticleTOC ? currentArticleTOC : article.toc;
          
          // Build hierarchical TOC structure for this article
          const hierarchicalTOC = buildTOCHierarchy(articleTOC || []);

          return (
            <div key={article.id} className="space-y-1">
              {/* Article Title */}
              <div className="flex items-start gap-2 group">
                {/* Expand/Collapse Button - Always show for all articles */}
                <button
                  onClick={() => toggleArticle(article.slug)}
                  className="flex-shrink-0 mt-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                  title="Toggle table of contents"
                >
                  <ChevronRightIcon 
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Article Number Badge - Only show if is_numbered is true */}
                {setData.is_numbered && (
                  <div 
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium text-white mt-1"
                    style={{ 
                      backgroundColor: isCurrentArticle 
                        ? themeColors.cssVars.primary.base 
                        : '#d1d5db' 
                    }}
                  >
                    {index + 1}
                  </div>
                )}

                {/* Article Title Link */}
                <Link
                  href={`/${article.slug}`}
                  prefetch={true}
                  className={`flex-1 min-w-0 py-2.5 pl-2 pr-3 rounded-lg transition-all relative overflow-hidden ${
                    isCurrentArticle
                      ? 'font-semibold'
                      : 'font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  style={
                    isCurrentArticle
                      ? {
                          backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 3%, transparent)`,
                          borderColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 8%, transparent)`,
                          borderWidth: '1px',
                          borderStyle: 'solid',
                          color: themeColors.cssVars.primary.base,
                        }
                      : {}
                  }
                >
                  {isCurrentArticle && (
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-1 rounded-r-lg"
                      style={{ backgroundColor: themeColors.cssVars.primary.base }}
                    />
                  )}
                  <span className="text-sm leading-tight block relative z-10">
                    {article.title}
                  </span>
                </Link>
              </div>

              {/* Article Sub-TOC (when expanded) */}
              {isExpanded && hierarchicalTOC.length > 0 && (
                <div className={`ml-8 space-y-0.5 animate-in slide-in-from-top-1 duration-200 ${
                  isCurrentArticle ? 'pb-2' : ''
                }`}>
                  {hierarchicalTOC.map((tocItem, tocIndex) => (
                    <TOCItemComponent
                      key={tocIndex}
                      item={tocItem}
                      isCurrentArticle={isCurrentArticle}
                      articleSlug={article.slug}
                      handleScrollTo={handleScrollTo}
                      level={0}
                      activeHeadingId={activeHeadingId}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })
        ) : (
          <div className="text-sm text-gray-500 text-center py-4">
            No articles found matching "{searchQuery}"
          </div>
        )}
      </div>
    </nav>
  );
};

export default MasterTOC;
