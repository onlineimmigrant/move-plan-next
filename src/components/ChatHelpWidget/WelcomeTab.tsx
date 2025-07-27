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
    <div className="h-full overflow-y-auto">
      <div className="p-8 space-y-10 mx-auto max-w-4xl">
        {/* Welcome Header - Enhanced Apple Style */}
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-thin text-gray-900 tracking-tight leading-tight">
            {t.howCanWeHelp}
          </h1>
          <p className="text-xl text-gray-500 font-light max-w-lg mx-auto leading-relaxed">
            {t.searchKnowledgeBase}
          </p>
        </div>

        {/* Search Bar - Enhanced Apple Style */}
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t.searchForHelp}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-14 pr-6 py-5 bg-gray-50 border-0 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all duration-300 text-lg font-normal shadow-sm hover:bg-gray-100"
          />
        </div>

        {/* Search Results */}
        {hasSearchResults && (
          <div className="space-y-8 max-w-3xl mx-auto">
            {/* FAQs Results */}
            {filteredFAQs.length > 0 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{t.frequentlyAskedQuestions}</h2>
                <div className="space-y-4">
                  {filteredFAQs.slice(0, 3).map((faq: FAQ) => (
                    <div
                      key={faq.id}
                      className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-400"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full text-left flex items-center justify-between"
                      >
                        <span className="text-gray-900 font-medium text-lg leading-relaxed pr-6">{faq.question}</span>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-400 ${expandedFAQ === faq.id ? 'bg-sky-500 rotate-45 shadow-md' : 'bg-gray-100 hover:bg-gray-200'}`}>
                          <span className={`text-xl font-thin ${expandedFAQ === faq.id ? 'text-white' : 'text-gray-600'}`}>+</span>
                        </div>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <p className="text-gray-600 font-normal leading-relaxed text-base">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Results */}
            {filteredArticles.length > 0 && (
              <div className="space-y-5">
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{t.articles}</h2>
                <div className="space-y-4">
                  {filteredArticles.slice(0, 3).map((article: Article) => (
                    <button
                      key={article.id}
                      onClick={() => onShowKnowledgeBase?.()}
                      className="w-full p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-400 text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                            <span className="bg-gray-100 px-2 py-1 rounded-full font-medium text-xs">{article.subsection}</span>
                            <span className="font-medium text-xs">{article.readTime} {t.minRead}</span>
                          </div>
                          <h3 className="text-gray-900 font-semibold text-xl mb-3 group-hover:text-sky-600 transition-colors leading-tight">{article.title}</h3>
                          <p className="text-gray-600 line-clamp-2 leading-relaxed text-base">{article.description}</p>
                        </div>
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center ml-6 flex-shrink-0 group-hover:bg-sky-50 transition-colors">
                          <DocumentTextIcon className="h-6 w-6 text-gray-400 group-hover:text-sky-500 transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredFAQs.length === 0 && filteredArticles.length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-xl font-light">
                  {t.noResultsFound} "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        )}

        {/* Quick Actions - Enhanced Apple Style Cards */}
        {!hasSearchResults && (
          <div className={`gap-6 max-w-4xl mx-auto ${
            size === 'initial' 
              ? 'grid grid-cols-1' 
              : size === 'half' 
                ? 'grid grid-cols-1 sm:grid-cols-2' 
                : 'grid grid-cols-1 sm:grid-cols-2'
          }`}>
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.03] hover:border-gray-200 transition-all duration-400 text-left group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-full opacity-40 -mr-12 -mt-12 group-hover:opacity-60 transition-opacity duration-400"></div>
                <div className="relative">
                  <div className="flex items-start space-x-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:from-sky-50 group-hover:to-sky-100 transition-all duration-400 shadow-sm">
                      <action.icon className="h-7 w-7 text-gray-600 group-hover:text-sky-500 transition-colors duration-400" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-gray-900 font-semibold text-xl mb-3 group-hover:text-sky-600 transition-colors duration-400 leading-tight">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 font-normal leading-relaxed text-base">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Popular Articles - Enhanced Apple Style */}
        {!searchQuery.trim() && articles.length > 0 && (
          <div className="pt-10 border-t border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-3xl font-semibold text-gray-900 mb-8 tracking-tight">{t.popularArticles}</h2>
            <div className={`gap-6 ${
              size === 'initial' 
                ? 'space-y-6' 
                : size === 'half' 
                  ? 'grid grid-cols-1 sm:grid-cols-2' 
                  : 'grid grid-cols-1 sm:grid-cols-2'
            }`}>
              {articles.slice(0, size === 'initial' ? 3 : size === 'half' ? 4 : 8).map((article: Article) => (
                <button
                  key={article.id}
                  onClick={() => onShowKnowledgeBase?.()}
                  className="w-full p-6 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg hover:scale-[1.02] hover:border-gray-200 transition-all duration-400 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                        <span className="bg-gray-100 px-2 py-1 rounded-full font-medium text-xs">{article.subsection}</span>
                        <span className="font-medium text-xs">{article.readTime} {t.minRead}</span>
                        <span>•</span>
                        <span className="font-medium text-xs">{t.by} {article.author_name}</span>
                      </div>
                      <h4 className="text-gray-900 font-semibold text-lg mb-3 group-hover:text-sky-600 transition-colors leading-tight">{article.title}</h4>
                      <p className="text-gray-600 line-clamp-2 leading-relaxed text-base">{article.description}</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center ml-6 flex-shrink-0 group-hover:bg-sky-50 transition-colors">
                      <DocumentTextIcon className="h-6 w-6 text-gray-400 group-hover:text-sky-500 transition-colors" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bottom padding for scrolling */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
