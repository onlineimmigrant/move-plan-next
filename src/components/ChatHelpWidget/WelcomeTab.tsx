'use client';
import { useState } from 'react';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, RocketLaunchIcon, QuestionMarkCircleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useFAQs } from './hooks/useFAQs';
import { useArticles } from './hooks/useArticles';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { FAQ } from '@/types/faq';
import type { Article } from './hooks/useArticles';

interface WelcomeTabProps {
  onTabChange: (tab: 'welcome' | 'conversation' | 'ai') => void;
  size: WidgetSize;
  onShowFAQ?: () => void;
  onShowKnowledgeBase?: () => void;
  onShowLiveSupport?: () => void;
}

export default function WelcomeTab({
  onTabChange,
  size,
  onShowFAQ,
  onShowKnowledgeBase,
  onShowLiveSupport,
}: WelcomeTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const { faqs, loading: faqLoading, error: faqError } = useFAQs();
  const { articles, loading: articlesLoading, error: articlesError } = useArticles();
  const { t } = useHelpCenterTranslations();

  const loading = faqLoading || articlesLoading;
  const error = faqError || articlesError;

  const filteredFAQs = faqs.filter((faq: FAQ) =>
    (faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const filteredArticles = articles.filter((article: Article) =>
    (article.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (article.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (article.subsection?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const hasSearchResults = searchQuery.trim() && (filteredFAQs.length > 0 || filteredArticles.length > 0);

  const quickActions = [
    {
      icon: QuestionMarkCircleIcon,
      title: t.frequentlyAskedQuestions,
      description: t.findAnswersCommon,
      action: () => onShowFAQ?.(),
    },
    {
      icon: DocumentTextIcon,
      title: t.knowledgeBase,
      description: t.browseArticlesGuides,
      action: () => onShowKnowledgeBase?.(),
    },
    {
      icon: ChatBubbleLeftRightIcon,
      title: t.liveSupport,
      description: t.chatSupportTeam,
      action: () => onShowLiveSupport?.(),
    },
    {
      icon: RocketLaunchIcon,
      title: t.aiAssistant,
      description: t.getHelpAI,
      action: () => onTabChange('ai'),
    },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <p>{t.errorLoadingContent}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 mx-auto max-w-2xl">
      {/* Welcome Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {t.howCanWeHelp}
        </h2>
        <p className="text-gray-600 text-sm">
          {t.searchKnowledgeBase}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative z-10">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder={t.searchForHelp}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
        />
      </div>

      {/* Search Results */}
      {hasSearchResults && (
        <div className="space-y-4">
          {/* FAQs Results */}
          {filteredFAQs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">{t.frequentlyAskedQuestions}</h4>
              <div className="space-y-2">
                {filteredFAQs.slice(0, 3).map((faq: FAQ) => (
                  <div
                    key={faq.id}
                    className="bg-white border border-gray-200 rounded-lg p-3"
                  >
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full text-left flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800 text-sm">{faq.question}</span>
                      <span className="text-gray-400 text-lg">
                        {expandedFAQ === faq.id ? '−' : '+'}
                      </span>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Articles Results */}
          {filteredArticles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-2">{t.articles}</h4>
              <div className="space-y-2">
                {filteredArticles.slice(0, 3).map((article: Article) => (
                  <button
                    key={article.id}
                    onClick={() => onShowKnowledgeBase?.()}
                    className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-sm transition-all duration-200 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                          <span>{article.subsection}</span>
                          <span>•</span>
                          <span>{article.readTime} {t.minRead}</span>
                        </div>
                        <h5 className="font-semibold text-gray-800 mb-1">{article.title}</h5>
                        <p className="text-sm text-gray-600 line-clamp-2">{article.description}</p>
                      </div>
                      <DocumentTextIcon className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {filteredFAQs.length === 0 && filteredArticles.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              {t.noResultsFound} "{searchQuery}"
            </div>
          )}
        </div>
      )}

      {/* Quick Actions - Only show when not searching or no results */}
      {!hasSearchResults && (
        <div className={`gap-3 ${
          size === 'initial' 
            ? 'grid grid-cols-1' 
            : size === 'half' 
              ? 'grid sm:grid-cols-2' 
              : 'grid sm:grid-cols-2'
        }`}>
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-sm transition-all duration-200 text-left group"
            >
              <div className="flex items-start space-x-3">
                <action.icon className="h-6 w-6 text-sky-600 group-hover:text-sky-700 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 group-hover:text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Popular Articles - Only show when not searching */}
      {!searchQuery.trim() && articles.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <h3 className="text-lg font-medium text-gray-800 mb-4">{t.popularArticles}</h3>
          <div className={`gap-3 ${
            size === 'initial' 
              ? 'space-y-3' 
              : size === 'half' 
                ? 'grid sm:grid-cols-2' 
                : 'grid sm:grid-cols-2'
          }`}>
            {articles.slice(0, size === 'initial' ? 3 : size === 'half' ? 4 : 8).map((article: Article) => (
              <button
                key={article.id}
                onClick={() => onShowKnowledgeBase?.()}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-sky-300 hover:shadow-sm transition-all duration-200 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 mb-1">
                      <span>{article.subsection}</span>
                      <span>•</span>
                      <span>{article.readTime} {t.minRead}</span>
                      <span>•</span>
                      <span>{t.by} {article.author_name}</span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-1">{article.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{article.description}</p>
                  </div>
                  <DocumentTextIcon className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
