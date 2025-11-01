'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon, BookOpenIcon } from '@heroicons/react/24/outline';
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
  articles: Article[];
}

interface DocumentSetNavigationProps {
  currentSlug: string;
  docSet: string;
  organizationId: string;
}

const DocumentSetNavigation: React.FC<DocumentSetNavigationProps> = ({
  currentSlug,
  docSet,
  organizationId,
}) => {
  const [setData, setSetData] = useState<DocumentSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMasterTOC, setShowMasterTOC] = useState(false);
  const themeColors = useThemeColors();

  useEffect(() => {
    const fetchDocumentSet = async () => {
      try {
        // Use relative URL in production, works both in dev and prod
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${baseUrl}/api/document-sets/${docSet}?organization_id=${organizationId}`;
        
        console.log('[DocumentSetNavigation] Fetching document set:', { docSet, organizationId, url });
        
        const response = await fetch(url);

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

  if (isLoading || !setData) {
    return null;
  }

  // Find current article and its neighbors
  const currentIndex = setData.articles.findIndex(article => article.slug === currentSlug);
  const previousArticle = currentIndex > 0 ? setData.articles[currentIndex - 1] : null;
  const nextArticle = currentIndex < setData.articles.length - 1 ? setData.articles[currentIndex + 1] : null;
  const currentArticle = setData.articles[currentIndex];

  return (
    <div className="mt-16">
      {/* Master TOC Section */}
      <div className="mb-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
        <button
          onClick={() => setShowMasterTOC(!showMasterTOC)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div 
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: `${themeColors.cssVars.primary.base}15` }}
            >
              <BookOpenIcon 
                className="w-6 h-6"
                style={{ color: themeColors.cssVars.primary.base }}
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{setData.title}</h3>
              <p className="text-sm text-gray-600">
                {setData.articles.length} articles in this series
              </p>
            </div>
          </div>
          <ChevronRightIcon 
            className={`w-5 h-5 text-gray-400 transition-transform ${showMasterTOC ? 'rotate-90' : ''}`}
          />
        </button>

        {showMasterTOC && (
          <div className="mt-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
            {setData.articles.map((article, index) => (
              <div
                key={article.id}
                className={`rounded-lg border transition-all ${
                  article.slug === currentSlug
                    ? 'bg-white border-2'
                    : 'bg-white/60 border-gray-200 hover:bg-white hover:border-gray-300'
                }`}
                style={
                  article.slug === currentSlug
                    ? { borderColor: themeColors.cssVars.primary.base }
                    : {}
                }
              >
                <Link
                  href={`/${article.slug}`}
                  className="block p-4"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{ backgroundColor: themeColors.cssVars.primary.base }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 
                        className={`font-semibold mb-2 ${
                          article.slug === currentSlug ? 'text-gray-900' : 'text-gray-700'
                        }`}
                      >
                        {article.title}
                        {article.slug === currentSlug && (
                          <span 
                            className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full"
                            style={{ 
                              backgroundColor: `${themeColors.cssVars.primary.base}15`,
                              color: themeColors.cssVars.primary.base
                            }}
                          >
                            Current
                          </span>
                        )}
                      </h4>
                      {article.toc.length > 0 && (
                        <ul className="space-y-1.5 text-sm">
                          {article.toc.map((tocItem, tocIndex) => (
                            <li
                              key={tocIndex}
                              className="text-gray-600 hover:text-gray-900 transition-colors"
                              style={{ paddingLeft: `${(tocItem.level - 2) * 12}px` }}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="text-gray-400">•</span>
                                {tocItem.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Previous/Next Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {previousArticle ? (
          <Link
            href={`/${previousArticle.slug}`}
            className="group flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all"
          >
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ 
                backgroundColor: `${themeColors.cssVars.primary.base}15`,
                color: themeColors.cssVars.primary.base
              }}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Previous
              </p>
              <p 
                className="font-semibold text-gray-900 group-hover:underline truncate"
                style={{ 
                  textDecorationColor: themeColors.cssVars.primary.base 
                }}
              >
                {previousArticle.title}
              </p>
            </div>
          </Link>
        ) : (
          <div className="hidden md:block" />
        )}

        {nextArticle && (
          <Link
            href={`/${nextArticle.slug}`}
            className="group flex items-center gap-4 p-5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:shadow-md transition-all md:ml-auto"
          >
            <div className="flex-1 min-w-0 text-right">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                Next
              </p>
              <p 
                className="font-semibold text-gray-900 group-hover:underline truncate"
                style={{ 
                  textDecorationColor: themeColors.cssVars.primary.base 
                }}
              >
                {nextArticle.title}
              </p>
            </div>
            <div 
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ 
                backgroundColor: `${themeColors.cssVars.primary.base}15`,
                color: themeColors.cssVars.primary.base
              }}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </div>
          </Link>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 text-center text-sm text-gray-500">
        Article {currentIndex + 1} of {setData.articles.length} in {setData.title}
      </div>
    </div>
  );
};

export default DocumentSetNavigation;
