'use client';

import React, { useRef, useEffect } from 'react';
import { VariableSizeList as List } from 'react-window';
import Link from 'next/link';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';

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

interface VirtualizedArticleListProps {
  articles: Article[];
  currentSlug: string;
  expandedArticles: Set<string>;
  toggleArticle: (slug: string) => void;
  isNumbered: boolean;
  handleScrollTo: (id: string) => void;
  currentArticleTOC?: TOCItem[];
  activeHeadingId: string;
  buildTOCHierarchy: (flatTOC: TOCItem[]) => TOCItem[];
  TOCItemComponent: React.ComponentType<any>;
}

/**
 * Virtualized Article List Component
 * 
 * Uses react-window to efficiently render large lists of articles.
 * Only renders visible items in the viewport for better performance.
 * 
 * @component
 * @param props - Component props
 * 
 * @performance
 * - Virtualizes list when 50+ items
 * - Renders only visible items
 * - Reduces DOM nodes significantly
 * - Improves scroll performance
 */
export const VirtualizedArticleList: React.FC<VirtualizedArticleListProps> = ({
  articles,
  currentSlug,
  expandedArticles,
  toggleArticle,
  isNumbered,
  handleScrollTo,
  currentArticleTOC,
  activeHeadingId,
  buildTOCHierarchy,
  TOCItemComponent,
}) => {
  const themeColors = useThemeColors();
  const listRef = useRef<List>(null);

  // Scroll to current article on mount
  useEffect(() => {
    const currentIndex = articles.findIndex(a => a.slug === currentSlug);
    if (currentIndex !== -1 && listRef.current) {
      listRef.current.scrollToItem(currentIndex, 'center');
    }
  }, [articles, currentSlug]);

  // Reset item sizes when expansion state changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [expandedArticles]);

  // Calculate item height dynamically based on expansion state
  const getItemSize = (index: number): number => {
    const article = articles[index];
    const isExpanded = expandedArticles.has(article.slug);
    const baseHeight = 60; // Base height for collapsed item
    
    if (!isExpanded) return baseHeight;
    
    // Calculate height based on TOC items
    const isCurrentArticle = article.slug === currentSlug;
    const articleTOC = isCurrentArticle && currentArticleTOC ? currentArticleTOC : article.toc;
    const tocItemCount = articleTOC?.length || 0;
    
    // Each TOC item is roughly 32px
    return baseHeight + (tocItemCount * 32);
  };

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const article = articles[index];
    const isCurrentArticle = article.slug === currentSlug;
    const isExpanded = expandedArticles.has(article.slug);
    
    // Use client-side TOC for current article if provided
    const articleTOC = isCurrentArticle && currentArticleTOC ? currentArticleTOC : article.toc;
    const hierarchicalTOC = buildTOCHierarchy(articleTOC || []);

    return (
      <div style={style} className="px-1">
        <div className="space-y-1">
          {/* Article Title */}
          <div className="flex items-start gap-2 group">
            {/* Expand/Collapse Button */}
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

            {/* Article Number Badge */}
            {isNumbered && (
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
                  ? 'font-medium'
                  : 'hover:bg-gray-50'
              }`}
              style={{
                backgroundColor: isCurrentArticle 
                  ? `${themeColors.cssVars.primary.base}10` 
                  : undefined,
                color: isCurrentArticle 
                  ? themeColors.cssVars.primary.base 
                  : undefined,
              }}
            >
              <span className="line-clamp-2 text-sm">{article.title}</span>
              {isCurrentArticle && (
                <span className="absolute left-0 top-0 bottom-0 w-1 rounded-r" 
                  style={{ backgroundColor: themeColors.cssVars.primary.base }}
                />
              )}
            </Link>
          </div>

          {/* TOC Items - Only render if expanded */}
          {isExpanded && hierarchicalTOC.length > 0 && (
            <div className="ml-6 space-y-0.5">
              {hierarchicalTOC.map((item, idx) => (
                <TOCItemComponent
                  key={`${article.slug}-${item.id || idx}`}
                  item={item}
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
      </div>
    );
  };

  // Use variable height list
  return (
    <List
      ref={listRef}
      height={600} // Fixed height for the scrollable container
      itemCount={articles.length}
      itemSize={getItemSize}
      width="100%"
      overscanCount={5} // Render 5 items above/below viewport
    >
      {Row}
    </List>
  );
};
