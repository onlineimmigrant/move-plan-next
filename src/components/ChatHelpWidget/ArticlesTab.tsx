// components/ChatHelpWidget/ArticlesTab.tsx
'use client';
import { useState, useEffect } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const { articles, loading, error } = useArticles();
  const { settings } = useSettings();
  const { t } = useHelpCenterTranslations();

  const siteName = settings?.site || t.general;
  const categories = [t.all, ...Array.from(new Set(articles.map(article => article.subsection || t.general)))];

  useEffect(() => {
    let filtered = articles;

    if (selectedCategory !== t.all) {
      filtered = filtered.filter(article => (article.subsection || t.general) === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(article =>
        article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles, t.all, t.general]);

  if (selectedArticle) {
    return (
      <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
        <div className="p-8 space-y-8">
          {/* Article Header */}
          <div className="space-y-6">
            <button
              onClick={() => setSelectedArticle(null)}
              className="flex items-center text-sky-500 hover:text-sky-600 hover:bg-sky-50 px-3 py-2 rounded-full transition-all duration-300 ease-out hover:scale-105"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              <span className="font-light">{t.backToArticles}</span>
            </button>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="bg-sky-50 text-sky-600 px-2 py-1 rounded-full font-medium border border-sky-100 text-xs">
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
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
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
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span className="font-medium">{t.by} {selectedArticle.author_name || siteName}</span>
                <span className="font-medium">{new Date(selectedArticle.created_on).toLocaleDateString()}</span>
              </div>
              
              {/* Category Tag */}
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-sky-50 text-sky-600 rounded-full text-sm font-medium border border-sky-100">
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
        {/* Header */}
        <div className="space-y-6">
          {(showBackButton && onBack) || onBackToHelpCenter ? (
            <button
              onClick={showBackButton && onBack ? onBack : onBackToHelpCenter}
              className="flex items-center text-sky-500 hover:text-sky-600 hover:bg-sky-50 px-3 py-2 rounded-full transition-all duration-300 ease-out hover:scale-105"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              <span className="font-light">{t.backToHelpCenter}</span>
            </button>
          ) : null}
          
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">
              {showBackButton ? t.knowledgeBase : t.articles}
            </h2>
          </div>
          
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
              className="block w-full pl-14 pr-6 py-5 bg-gray-50 border-0 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all duration-300 text-lg font-normal shadow-sm hover:bg-gray-100"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-sky-500 text-white shadow-md hover:bg-sky-600 scale-105'
                    : 'bg-white text-gray-600 hover:bg-sky-50 hover:text-sky-600 border border-gray-200 hover:border-sky-200 hover:scale-105'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        <div className="max-w-4xl mx-auto">
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
            <div className={`gap-6 ${
              size === 'initial' 
                ? 'space-y-6' 
                : size === 'half' 
                  ? 'grid grid-cols-1 sm:grid-cols-2' 
                  : 'grid grid-cols-1 sm:grid-cols-2'
            }`}>
              {filteredArticles.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="w-full p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] hover:border-gray-200 transition-all duration-400 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                        <span className="bg-sky-50 text-sky-600 px-2 py-1 rounded-full font-medium border border-sky-100 text-xs">
                          <TagIcon className="h-3 w-3 inline mr-1" />
                          {article.subsection || t.general}
                        </span>
                        <span className="bg-gray-50 px-2 py-1 rounded-full font-medium text-xs">
                          <ClockIcon className="h-3 w-3 inline mr-1" />
                          {article.readTime} {t.minRead}
                        </span>
                      </div>
                      <h3 className="text-gray-900 font-semibold text-lg mb-3 group-hover:text-sky-600 transition-colors leading-tight">{article.title}</h3>
                      <p className="text-gray-600 line-clamp-2 leading-relaxed text-base">{article.description}</p>
                      
                      {article.author_name && (
                        <div className="mt-3 text-xs text-gray-500 font-medium">
                          {t.by} {article.author_name}
                        </div>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center ml-6 flex-shrink-0 group-hover:bg-sky-50 transition-colors">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Bottom padding for scrolling */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
