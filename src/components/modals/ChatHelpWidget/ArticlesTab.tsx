// components/ChatHelpWidget/ArticlesTab.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DOMPurify from 'dompurify';
import { DocumentTextIcon, ClockIcon, TagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useArticles } from './hooks/useArticles';
import { useSettings } from '@/context/SettingsContext';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { Article } from './hooks/useArticles';
import { useThemeColors } from '@/hooks/useThemeColors';
import { HelpCenterNavBadges } from './HelpCenterNavBadges';
import { HelpCenterSearchBar } from './HelpCenterSearchBar';

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
  const themeColors = useThemeColors();
  
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
          <HelpCenterNavBadges 
            activeTab="articles" 
            translations={{
              faqs: t.faqs,
              articles: t.articles,
              features: t.features,
              offerings: t.offerings
            }}
            onNavigate={(tab) => router.push(`/help-center?tab=${tab}`)}
          />
          
          {/* Article Header */}
          <div className="space-y-6">
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span 
                  className="px-2 py-1 rounded-full font-medium text-xs"
                  style={{
                    backgroundColor: `${themeColors.cssVars.primary.lighter}33`,
                    color: themeColors.cssVars.primary.hover
                  }}
                >
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
                <span 
                  className="px-4 py-2 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${themeColors.cssVars.primary.lighter}33`,
                    color: themeColors.cssVars.primary.hover
                  }}
                >
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
        <HelpCenterNavBadges 
          activeTab="articles"
          showAllBadge={true}
          translations={{
            all: 'All',
            faqs: t.faqs,
            articles: t.articles,
            features: t.features,
            offerings: t.offerings
          }}
          onNavigate={(tab) => {
            if (tab === 'all') {
              router.push('/help-center');
            } else {
              router.push(`/help-center?tab=${tab}`);
            }
          }}
        />

        {/* Header - Only show when NOT viewing a specific article */}
        {!selectedArticle && (
          <div className="space-y-6">
            {/* Search Bar */}
            <HelpCenterSearchBar 
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t.searchArticles}
            />

            {/* Category Filter - Centered with horizontal scrolling */}
            <div className="flex justify-center">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 max-w-full">
                {categories.map((category) => {
                  const count = getCategoryCount(category);
                  const isActive = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
                      style={{
                        backgroundColor: isActive 
                          ? themeColors.cssVars.primary.base 
                          : 'white',
                        color: isActive 
                          ? 'white' 
                          : themeColors.cssVars.primary.base,
                        border: `1px solid ${isActive ? themeColors.cssVars.primary.base : themeColors.cssVars.primary.light}40`,
                      }}
                    >
                      <span>{category}</span>
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: isActive 
                            ? 'rgba(255, 255, 255, 0.25)' 
                            : `${themeColors.cssVars.primary.lighter}60`,
                          color: isActive 
                            ? 'white' 
                            : themeColors.cssVars.primary.hover,
                        }}
                      >
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
                <div 
                  className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: `${themeColors.cssVars.primary.base} transparent transparent transparent` }}
                ></div>
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
              <div className="space-y-3">
                {filteredArticles.map((article) => (
                  <div
                    key={`${article.slug}-${article.id}`}
                    className="group relative"
                  >
                    {/* Glass layers - matching FAQView */}
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl rounded-3xl group-hover:bg-white/80 group-hover:shadow-xl transition-all duration-300 ease-out"
                      style={{
                        backdropFilter: 'blur(24px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                      }}
                    />
                    <div 
                      className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                      style={{
                        background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}30, white 20%, ${themeColors.cssVars.primary.lighter}20)`
                      }}
                    />
                    
                    <button
                      onClick={() => {
                        setSelectedArticle(article);
                        router.push(`/help-center?tab=articles&article=${article.slug}`);
                      }}
                      className="relative w-full p-6 sm:p-8 text-left group/button"
                    >
                      <h3 
                        className="text-gray-900 font-semibold text-base leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-300 ease-out"
                      >
                        {article.title}
                      </h3>
                      
                      {/* Preview on hover */}
                      <div className="text-gray-600 text-[15px] leading-relaxed mt-2 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                        {article.description}
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {hasMore && !searchQuery && !loading && (
                <div className="flex justify-center pt-8">
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    className="px-8 py-4 bg-white text-gray-700 rounded-full font-medium border-2 border-gray-200 transition-all duration-150 ease-out hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-200"
                    onMouseEnter={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}40`;
                        e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                        e.currentTarget.style.borderColor = themeColors.cssVars.primary.border;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!loadingMore) {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.color = '';
                        e.currentTarget.style.borderColor = '';
                      }
                    }}
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
