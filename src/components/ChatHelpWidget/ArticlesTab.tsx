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
}

export default function ArticlesTab({ size, showBackButton, onBack }: ArticlesTabProps) {
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
      <div className={`h-full p-4 ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
        {/* Article Header */}
        <div className="pb-4 border-b border-gray-200 mb-4">
          <button
            onClick={() => setSelectedArticle(null)}
            className="text-sky-600 hover:text-sky-700 text-sm mb-3 flex items-center"
          >
            {t.backToArticles}
          </button>
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
            <TagIcon className="h-4 w-4" />
            <span>{selectedArticle.subsection || t.general}</span>
            <span>•</span>
            <ClockIcon className="h-4 w-4" />
            <span>{selectedArticle.readTime} {t.minRead}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">{selectedArticle.title}</h1>
          <p className="text-gray-600 text-sm">{selectedArticle.description}</p>
        </div>

        {/* Article Content */}
        <div>
          <div 
            className="prose prose-sm sm:prose lg:prose-lg max-w-none font-light text-gray-600"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(selectedArticle.content, {
                ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'br', 'div', 'span', 'ul', 'ol', 'li', 'a', 'img', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'blockquote', 'pre', 'code'],
                ALLOWED_ATTR: ['class', 'href', 'target', 'src', 'alt', 'title', 'id']
              })
            }}
          />

          {/* Article Meta */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t.by} {selectedArticle.author_name || siteName}</span>
              <span>{new Date(selectedArticle.created_on).toLocaleDateString()}</span>
            </div>
            
            {/* Category Tag */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                #{selectedArticle.subsection || t.general}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full p-4 ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Header */}
      <div className="mb-4">
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="flex items-center text-sky-600 hover:text-sky-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {t.backToWelcome}
          </button>
        )}
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          {showBackButton ? t.knowledgeBase : t.articles}
        </h2>
        
        {/* Search Bar */}
        <div className="relative mb-4 z-1">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchArticles}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Articles List */}
      <div>
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t.loadingContent}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{t.errorLoadingContent}</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">{t.noArticlesFound}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="w-full p-4 bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-sm transition-all duration-200 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                      <TagIcon className="h-3 w-3" />
                      <span>{article.subsection || t.general}</span>
                      <span>•</span>
                      <ClockIcon className="h-3 w-3" />
                      <span>{article.readTime} {t.minRead}</span>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{article.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{article.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                        #{article.subsection || t.general}
                      </span>
                      {article.author_name && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-full text-xs">
                          {t.by} {article.author_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <DocumentTextIcon className="h-5 w-5 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
