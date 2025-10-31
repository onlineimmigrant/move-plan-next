'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

// Global cache for document sets to avoid re-fetching
const documentSetCache = new Map<string, DocumentSet>();

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

  const paddingLeft = level * 12;

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
            className={`flex-1 text-left py-1 px-3 rounded-md text-sm transition-colors ${
              isActive 
                ? 'font-medium' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            style={{ 
              paddingLeft: `${paddingLeft}px`,
              ...(isActive ? { color: themeColors.cssVars.primary.base } : {})
            }}
          >
            {item.text}
          </button>
        ) : (
          <Link
            href={`/${articleSlug}#${item.id}`}
            prefetch={true}
            className={`flex-1 block py-1 px-3 rounded-md text-sm transition-colors ${
              isActive 
                ? 'font-medium' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            style={{ 
              paddingLeft: `${paddingLeft}px`,
              ...(isActive ? { color: themeColors.cssVars.primary.base } : {})
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
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const themeColors = useThemeColors();
  const isFetchingRef = useRef(false);

  // Auto-expand current article and set active heading on mount
  useEffect(() => {
    // Always expand current article to show its H2 headings
    setExpandedArticles(new Set([currentSlug]));
    
    // Check for hash and set active heading
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setActiveHeadingId(hash);
      }
    }
  }, [currentSlug]);

  useEffect(() => {
    const cacheKey = `${docSet}-${organizationId}`;
    
    // Check cache first
    const cachedData = documentSetCache.get(cacheKey);
    if (cachedData) {
      setSetData(cachedData);
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
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const response = await fetch(
          `${baseUrl}/api/document-sets/${docSet}?organization_id=${organizationId}`
        );

        if (response.ok) {
          const data = await response.json();
          // Store in cache
          documentSetCache.set(cacheKey, data);
          setSetData(data);
        }
      } catch (error) {
        console.error('Error fetching document set:', error);
      } finally {
        setIsLoading(false);
        isFetchingRef.current = false;
      }
    };

    if (docSet && organizationId) {
      fetchDocumentSet();
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

      {/* Articles List */}
      <div className="space-y-1">
        {setData.articles.map((article, index) => {
          const isCurrentArticle = article.slug === currentSlug;
          const isExpanded = expandedArticles.has(article.slug);
          
          // Use client-side TOC for current article if provided, otherwise use API TOC
          const articleTOC = isCurrentArticle && currentArticleTOC ? currentArticleTOC : article.toc;
          
          // Build hierarchical TOC structure for this article
          const hierarchicalTOC = buildTOCHierarchy(articleTOC);

          return (
            <div key={article.id} className="space-y-1">
              {/* Article Title */}
              <div className="flex items-start gap-2 group">
                {/* Expand/Collapse Button */}
                {hierarchicalTOC.length > 0 && (
                  <button
                    onClick={() => toggleArticle(article.slug)}
                    className="flex-shrink-0 mt-1 p-0.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    <ChevronRightIcon 
                      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                )}
                {hierarchicalTOC.length === 0 && (
                  <div className="w-4 flex-shrink-0"></div>
                )}

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
                  className={`flex-1 min-w-0 py-2.5 px-3 rounded-lg transition-all relative overflow-hidden ${
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

              {/* Article Sub-TOC (only when expanded) - hierarchical with collapsible children */}
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
        })}
      </div>
    </nav>
  );
};

export default MasterTOC;
