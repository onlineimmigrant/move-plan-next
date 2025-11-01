'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TOCItem {
  level: number;
  text: string;
  id: string;
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
  is_numbered: boolean;
  articles: Article[];
}

interface DocumentSetNavigationProps {
  currentSlug: string;
  docSet: string;
  organizationId: string;
  isDocSetType?: boolean;
}

const DocumentSetNavigation: React.FC<DocumentSetNavigationProps> = ({
  currentSlug,
  docSet,
  organizationId,
  isDocSetType = false,
}) => {
  const [setData, setSetData] = useState<DocumentSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMasterTOC, setShowMasterTOC] = useState(isDocSetType);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const themeColors = useThemeColors();

  useEffect(() => {
    const fetchDocumentSet = async () => {
      try {
        // Use relative URL - works in all environments
        const url = `/api/document-sets/${docSet}?organization_id=${organizationId}`;
        
        console.log('[DocumentSetNavigation] Fetching document set:', { docSet, organizationId, url, fullUrl: window?.location?.href });
        
        const response = await fetch(url);

        console.log('[DocumentSetNavigation] Response received:', { status: response.status, ok: response.ok });

        if (response.ok) {
          const data = await response.json();
          console.log('[DocumentSetNavigation] Successfully fetched document set:', data);
          setSetData(data);
        } else {
          console.error('[DocumentSetNavigation] Failed to fetch document set:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('[DocumentSetNavigation] Error response:', errorText);
        }
      } catch (error) {
        console.error('[DocumentSetNavigation] Error fetching document set:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (docSet && organizationId) {
      console.log('[DocumentSetNavigation] Conditions met, fetching...', { docSet, organizationId });
      fetchDocumentSet();
    } else {
      console.warn('[DocumentSetNavigation] Missing required params:', { docSet, organizationId });
      setIsLoading(false);
    }
  }, [docSet, organizationId]);

  const toggleArticle = (slug: string) => {
    setExpandedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  if (isLoading || !setData) {
    return null;
  }

  const currentIndex = setData.articles.findIndex(article => article.slug === currentSlug);
  const previousArticle = currentIndex > 0 ? setData.articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < setData.articles.length - 1 ? setData.articles[currentIndex + 1] : null;

  return (
    <div className="mt-16">
      {/* Master TOC Section */}
      <div className="mb-8">
        <button
          onClick={() => setShowMasterTOC(!showMasterTOC)}
          className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
        >
          <div className="flex items-center gap-3">
            <BookOpenIcon 
              className="w-5 h-5"
              style={{ color: themeColors.cssVars.primary.base }}
            />
            <div className="text-left">
              <h3 className="text-base font-semibold text-gray-900">{setData.title}</h3>
              <p className="text-sm text-gray-500">
                {setData.articles.length} {setData.articles.length === 1 ? 'article' : 'articles'}
              </p>
            </div>
          </div>
          <ChevronDownIcon 
            className={`w-5 h-5 text-gray-400 transition-transform ${showMasterTOC ? 'rotate-180' : ''}`}
          />
        </button>

        {showMasterTOC && (
          <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg space-y-2">
            {setData.articles.map((article, index) => {
              const isCurrentArticle = article.slug === currentSlug;
              const isExpanded = expandedArticles.has(article.slug);
              const hasH2Headings = article.toc.some(item => item.level === 2);

              return (
                <div key={article.id} className="space-y-1">
                  <div className="flex items-start gap-2">
                    {hasH2Headings && (
                      <button
                        onClick={() => toggleArticle(article.slug)}
                        className="flex-shrink-0 mt-1.5 p-0.5 hover:bg-gray-100 rounded transition-colors"
                      >
                        <ChevronRightIcon 
                          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                    )}
                    {!hasH2Headings && <div className="w-4 flex-shrink-0"></div>}

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

                    <Link
                      href={`/${article.slug}`}
                      className={`flex-1 min-w-0 py-2 px-3 rounded-lg transition-all relative overflow-hidden ${
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

                  {isExpanded && hasH2Headings && (
                    <div className="ml-8 space-y-0.5">
                      {article.toc
                        .filter(item => item.level === 2)
                        .map((tocItem, tocIndex) => (
                          <Link
                            key={tocIndex}
                            href={`/${article.slug}#${tocItem.id}`}
                            className="block py-1 px-3 rounded-md text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                          >
                            {tocItem.text}
                          </Link>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Previous/Next Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previousArticle ? (
          <Link
            href={`/${previousArticle.slug}`}
            className="group flex items-center gap-3 p-4 rounded-lg bg-white hover:bg-gray-50 transition-all w-full"
          >
            <div 
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 10%, transparent)`,
                color: themeColors.cssVars.primary.base
              }}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Prev
              </p>
              <p 
                className="font-semibold text-gray-700 truncate transition-colors"
                style={{ color: 'inherit' }}
              >
                <span 
                  className="group-hover:text-current transition-colors"
                  style={{ '--hover-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = themeColors.cssVars.primary.base;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '';
                  }}
                >
                  {previousArticle.title}
                </span>
              </p>
            </div>
          </Link>
        ) : (
          <div className="hidden md:block" />
        )}

        {nextArticle && (
          <Link
            href={`/${nextArticle.slug}`}
            className="group flex items-center gap-3 p-4 rounded-lg bg-white hover:bg-gray-50 transition-all w-full"
          >
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Next
              </p>
              <p 
                className="font-semibold text-gray-700 truncate transition-colors"
                style={{ color: 'inherit' }}
              >
                <span 
                  className="group-hover:text-current transition-colors"
                  style={{ '--hover-color': themeColors.cssVars.primary.base } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = themeColors.cssVars.primary.base;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '';
                  }}
                >
                  {nextArticle.title}
                </span>
              </p>
            </div>
            <div 
              className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              style={{ 
                backgroundColor: `color-mix(in srgb, ${themeColors.cssVars.primary.base} 10%, transparent)`,
                color: themeColors.cssVars.primary.base
              }}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
};

export default DocumentSetNavigation;
