'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useThemeColors } from '@/hooks/useThemeColors';
import { debug } from '@/utils/debug';

interface RelatedArticle {
  id: string;
  slug: string;
  title: string;
  description: string;
  main_photo?: string;
}

interface RelatedArticlesProps {
  currentSlug: string;
  docSet: string;
  organizationId: string;
  maxArticles?: number;
}

/**
 * Related Articles Component
 * Shows random/related articles from the same document set in the right sidebar
 */
export const RelatedArticles: React.FC<RelatedArticlesProps> = ({
  currentSlug,
  docSet,
  organizationId,
  maxArticles = 4,
}) => {
  const [articles, setArticles] = useState<RelatedArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const themeColors = useThemeColors();

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        debug.log('RelatedArticles', 'Fetching related articles:', { docSet, currentSlug, organizationId });
        
        const url = `/api/document-sets/${docSet}?organization_id=${organizationId}`;
        const response = await fetch(url);

        if (response.ok) {
          const data = await response.json();
          debug.log('RelatedArticles', 'Fetched document set:', data);

          // Filter out current article and get random articles
          const otherArticles = data.articles
            .filter((article: any) => article.slug !== currentSlug)
            .map((article: any) => ({
              id: article.id,
              slug: article.slug,
              title: article.title,
              description: article.description || '',
              main_photo: article.main_photo,
            }));

          // Shuffle and limit
          const shuffled = otherArticles.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, maxArticles);

          debug.log('RelatedArticles', 'Selected articles:', selected.length);
          setArticles(selected);
        } else {
          debug.error('RelatedArticles', 'Failed to fetch related articles:', response.status);
        }
      } catch (error) {
        debug.error('RelatedArticles', 'Error fetching related articles:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (docSet && organizationId) {
      fetchRelatedArticles();
    } else {
      setIsLoading(false);
    }
  }, [docSet, organizationId, currentSlug, maxArticles]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:block space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: themeColors.cssVars.primary.base }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900">Related Articles</h3>
      </div>

      {/* Article Cards */}
      <div className="space-y-4">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/${article.slug}`}
            className="group block bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all overflow-hidden"
          >
            {/* Image */}
            {article.main_photo && (
              <div className="aspect-video w-full bg-gray-100 overflow-hidden">
                <img
                  src={article.main_photo}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
            )}

            {/* Content */}
            <div className="p-4">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-gray-600 transition-colors">
                {article.title}
              </h4>
              {article.description && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {article.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="pt-4 border-t border-gray-200">
        <Link
          href="/blog"
          className="text-xs font-medium hover:underline transition-colors"
          style={{ color: themeColors.cssVars.primary.base }}
        >
          View all articles →
        </Link>
      </div>
    </div>
  );
};
