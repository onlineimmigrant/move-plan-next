// components/ChatHelpWidget/ArticlesTab.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { MagnifyingGlassIcon, DocumentTextIcon, ClockIcon, TagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useArticles } from './hooks/useArticles';
import { useSettings } from '@/context/SettingsContext';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { Article } from './hooks/useArticles';

interface ArticlesTabProps {
  size: WidgetSize;
  showBackButton?: boolean;
  onBack?: () => void;
  onBackToHelpCenter?: () => void;
}

export default function ArticlesTab({ size, showBackButton, onBack, onBackToHelpCenter }: ArticlesTabProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const articleSlug = searchParams.get('article');
  const manuallyCleared = useRef(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const { articles, loading, loadingMore, error, hasMore, total, loadMore, categoryCounts } = useArticles();
  const { settings } = useSettings();
  const { t } = useHelpCenterTranslations();

  const siteName = settings?.site || t.general;
  const categories = [t.all, ...Array.from(new Set(articles.map(article => article.subsection || t.general)))];
  
  // Calculate article count per category using total counts from API
  const getCategoryCount = (category: string) => {
    if (category === t.all) {
      // Sum all category counts or use total
      const totalFromCounts = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);
      return totalFromCounts || total || articles.length;
    }
    // Use the count from API if available, otherwise count loaded articles
    return categoryCounts[category] || articles.filter(article => (article.subsection || t.general) === category).length;
  };

  // Load article from URL parameter (only if not manually cleared)
  useEffect(() => {
    if (articleSlug && articles.length > 0 && !manuallyCleared.current) {
      const article = articles.find(a => a.slug === articleSlug);
      if (article && article.slug !== selectedArticle?.slug) {
        setSelectedArticle(article);
      }
    } else if (!articleSlug && selectedArticle) {
      // Clear selection when articleSlug is removed from URL
      setSelectedArticle(null);
    }
    // Reset the flag when articleSlug changes to allow deep linking to work
    if (!articleSlug) {
      manuallyCleared.current = false;
    }
  }, [articleSlug, articles, selectedArticle]);

  useEffect(() => {
    let filtered = articles;

    if (selectedCategory !== t.all) {
      filtered = filtered.filter(article => (article.subsection || t.general) === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.subsection?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles, t.all, t.general]);

  if (selectedArticle) {
    return (
      <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
        <div className="p-8 space-y-8">
          {/* Tab Navigation Badges */}
          <div className="flex justify-center gap-3 pb-4">
            <button
              onClick={() => router.push('/help-center?tab=faq')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.faqs}</span>
              <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => router.push('/help-center?tab=articles')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 border border-sky-600 rounded-2xl shadow-md hover:opacity-90 transition-opacity duration-300"
            >
              <span className="text-lg font-semibold text-white">{t.articles}</span>
            </button>
          </div>
          
          {/* Article Header */}
          <div className="space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="bg-sky-50 text-sky-600 px-2 py-1 rounded-full font-medium text-xs">
                  <TagIcon className="h-3 w-3 inline mr-1" />
                  {selectedArticle.subsection || t.general}
                </span>
                <span className="bg-gray-50 px-2 py-1 rounded-full font-medium text-xs">
                  <ClockIcon className="h-3 w-3 inline mr-1" />
                  {selectedArticle.readTime} {t.minRead}
                </span>
              </div>
              <h1 className="text-4xl font-thin text-gray-900 tracking-tight leading-tight">{selectedArticle.title}</h1>
              <p className="text-xl text-gray-500 font-light leading-relaxed">{selectedArticle.description}</p>
            </div>
          </div>

          {/* Article Content */}
          <div className="bg-white rounded-3xl p-8">
            <div 
              className="prose prose-lg max-w-none font-light text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ 
                __html: DOMPurify.sanitize(selectedArticle.content, {
                  ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'br', 'div', 'span', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'pre', 'code'],
                  ALLOWED_ATTR: ['class', 'href', 'target', 'src', 'alt', 'title', 'id']
                })
              }}
            />

            {/* Article Meta */}
            <div className="mt-8 pt-6">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="font-medium">{t.by} {selectedArticle.author_name || siteName}</span>
                <span className="font-medium">{new Date(selectedArticle.created_on).toLocaleDateString()}</span>
              </div>
              
              {/* Category Tag */}
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium">
                  #{selectedArticle.subsection || t.general}
                </span>
              </div>
            </div>
          </div>
          
          {/* Bottom padding for scrolling */}
          <div className="h-8"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="p-8 space-y-8">
        {/* Tab Navigation Badges */}
        <div className="flex justify-center gap-3 pb-4">
          <button
            onClick={() => router.push('/help-center?tab=faq')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.faqs}</span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 border border-sky-600 rounded-2xl shadow-md cursor-default"
          >
            <span className="text-lg font-semibold text-white">{t.articles}</span>
          </button>
        </div>

        {/* Header - Only show when NOT viewing a specific article */}
        {!selectedArticle && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchArticles}
                className="block w-full pl-14 pr-6 py-5 bg-gray-50 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white transition-all duration-150 ease-out text-lg font-normal hover:bg-gray-100"
              />
            </div>

            {/* Category Filter - Scrollable Row */}
            <div className="overflow-x-auto scrollbar-hide py-2">
              <div className="flex gap-3 min-w-max px-4">
                {categories.map((category) => {
                  const count = getCategoryCount(category);
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-150 ease-out whitespace-nowrap flex items-center gap-2 ${
                        selectedCategory === category
                          ? 'bg-sky-500 text-white hover:bg-sky-600 scale-105'
                          : 'bg-white text-gray-600 hover:bg-sky-50 hover:text-sky-600 border border-gray-200 hover:border-sky-200 hover:scale-105'
                      }`}
                    >
                      <span>{category}</span>
                      <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold ${
                        selectedCategory === category
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <p className="text-gray-500 text-xl font-light">{t.loadingContent}</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-red-500 text-2xl font-thin">!</span>
              </div>
              <p className="text-red-500 text-xl font-light">{t.errorLoadingContent}</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <DocumentTextIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl font-light">{t.noArticlesFound}</p>
            </div>
          ) : (
            <>
              <div className={`gap-6 ${
                size === 'initial' 
                  ? 'space-y-6' 
                  : size === 'half' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
                {filteredArticles.map((article) => (
                  <button
                    key={`${article.slug}-${article.id}`}
                    onClick={() => {
                      setSelectedArticle(article);
                      router.push(`/help-center?tab=articles&article=${article.slug}`);
                    }}
                    className="w-full p-6 bg-white rounded-3xl hover:scale-[1.02] transition-all duration-300 ease-out text-left group relative overflow-hidden"
                  >
                    <div>
                      <h3 className="text-gray-900 font-semibold text-lg mb-2 group-hover:text-sky-600 transition-colors leading-tight">{article.title}</h3>
                      {/* Description - only visible on hover */}
                      <div className="max-h-0 opacity-0 group-hover:max-h-24 group-hover:opacity-100 transition-all duration-300 ease-out overflow-hidden">
                        <p className="text-gray-600 line-clamp-3 leading-relaxed text-sm pt-2">{article.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && !searchQuery && !loading && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-4 bg-white text-gray-700 rounded-full font-medium hover:bg-sky-50 hover:text-sky-600 border-2 border-gray-200 hover:border-sky-300 transition-all duration-150 ease-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        Loading...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Load More Articles
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {articles.length} / {total}
                        </span>
                      </span>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Bottom padding for scrolling */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
