'use client';
import { useState } from 'react';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, RocketLaunchIcon, QuestionMarkCircleIcon, UserGroupIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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
      <div className="p-8 space-y-8">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl mx-auto w-3/4"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-2xl mx-auto w-1/2"></div>
          </div>
          
          {/* Search bar skeleton */}
          <div className="h-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-3xl max-w-2xl mx-auto"></div>
          
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-start space-x-5">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-100 rounded-3xl"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-xl w-3/4"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-full"></div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
            <span className="text-red-500 text-3xl font-thin">!</span>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-red-600 font-light">{t.errorLoadingContent}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10 mx-auto max-w-4xl">
        {/* Welcome Header - Enhanced Apple Style */}
        <div className="text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl font-thin text-gray-900 tracking-tight leading-none">
            {t.howCanWeHelp}
          </h1>
          <p className="text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
            {t.searchKnowledgeBase}
          </p>
        </div>

        {/* Search Bar - Enhanced Apple Style */}
        <div className="relative max-w-2xl mx-auto group">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-white to-sky-100 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl"></div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-sky-500 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder={t.searchForHelp}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative block w-full pl-16 pr-8 py-6 bg-gray-50/80 backdrop-blur-sm border-0 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white focus:shadow-xl transition-all duration-500 text-lg font-normal shadow-sm hover:bg-gray-100/80 hover:shadow-md group-hover:shadow-lg"
            />
          </div>
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
                      className="bg-white rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 hover:scale-[1.005] transition-all duration-500 ease-out"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full text-left flex items-center justify-between group"
                      >
                        <span className="text-gray-900 font-semibold text-xl leading-relaxed pr-6 group-hover:text-sky-600 transition-colors duration-300">{faq.question}</span>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-sky-100 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                          <ChevronDownIcon 
                            className={`h-6 w-6 text-gray-500 group-hover:text-sky-600 transition-all duration-500 ${
                              expandedFAQ === faq.id ? 'rotate-180 text-sky-600' : ''
                            }`}
                          />
                        </div>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="mt-8 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-500">
                          <p className="text-gray-700 font-normal leading-relaxed text-lg">{faq.answer}</p>
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
                      className="w-full p-4 sm:p-6 lg:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 hover:scale-[1.005] transition-all duration-500 ease-out text-left group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-50/50 to-transparent rounded-full -mr-10 -mt-10 group-hover:opacity-80 transition-opacity duration-500"></div>
                      <div className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                              <span className="bg-gray-100 px-2 py-1 rounded-full font-medium text-xs">{article.subsection}</span>
                              <span className="font-medium text-xs">{article.readTime} {t.minRead}</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold text-xl mb-4 group-hover:text-sky-600 transition-colors duration-500 leading-tight">{article.title}</h3>
                            <p className="text-gray-600 line-clamp-2 leading-relaxed text-base">{article.description}</p>
                          </div>
                          <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center ml-8 flex-shrink-0 group-hover:bg-sky-50 group-hover:scale-110 transition-all duration-500">
                            <DocumentTextIcon className="h-7 w-7 text-gray-400 group-hover:text-sky-500 transition-colors duration-500" />
                          </div>
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
                className="p-4 sm:p-6 lg:p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:scale-[1.02] hover:border-gray-200 transition-all duration-500 ease-out text-left group relative overflow-hidden min-h-[160px] sm:min-h-[180px]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-50 via-sky-25 to-cyan-50 rounded-full opacity-30 -mr-16 -mt-16 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-gray-50 to-transparent rounded-full opacity-40 -ml-12 -mb-12 group-hover:opacity-60 transition-all duration-500"></div>
                <div className="relative">
                  <div className="flex items-start space-x-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-50 via-gray-25 to-gray-100 rounded-3xl flex items-center justify-center flex-shrink-0 group-hover:from-sky-50 group-hover:via-sky-25 group-hover:to-sky-100 transition-all duration-500 shadow-sm group-hover:shadow-md group-hover:scale-105">
                      <action.icon className="h-7 w-7 text-gray-600 group-hover:text-sky-500 transition-colors duration-500" />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-gray-900 font-semibold text-lg mb-3 group-hover:text-sky-600 transition-colors duration-500 leading-tight">
                        {action.title}
                      </h3>
                      <p className="text-gray-600 font-normal leading-relaxed text-sm">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Popular FAQs - New Section */}
        {!searchQuery.trim() && faqs.length > 0 && (
          <div className="pt-12 border-t border-gray-100 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">{t.frequentlyAskedQuestions}</h2>
              <p className="text-lg text-gray-500 font-light">{t.faqDescription}</p>
            </div>
            <div className="space-y-6">
              {faqs.slice(0, 5).map((faq: FAQ, index) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:scale-[1.005] transition-all duration-500 ease-out overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full px-10 py-8 flex items-center justify-between text-left hover:bg-gray-50/50 transition-all duration-300 group"
                  >
                    <span className="text-xl font-semibold text-gray-900 group-hover:text-sky-600 transition-colors duration-300 pr-8 leading-tight">
                      {faq.question}
                    </span>
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-sky-100 group-hover:scale-110 transition-all duration-300 flex-shrink-0">
                      <ChevronDownIcon 
                        className={`h-6 w-6 text-gray-500 group-hover:text-sky-600 transition-all duration-500 ${
                          expandedFAQ === faq.id ? 'rotate-180 text-sky-600' : ''
                        }`}
                      />
                    </div>
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="px-10 pb-8 animate-in slide-in-from-top-2 duration-500 ease-out">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-8"></div>
                      <p className="text-gray-700 leading-relaxed text-lg">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Articles - Enhanced Apple Style */}
        {!searchQuery.trim() && articles.length > 0 && (
          <div className="pt-12 border-t border-gray-100 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">{t.popularArticles}</h2>
              <p className="text-lg text-gray-500 font-light">{t.popularArticlesDescription}</p>
            </div>
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
                  className="w-full p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl hover:scale-[1.01] hover:border-gray-200 transition-all duration-500 ease-out text-left group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-50/50 to-transparent rounded-full -mr-10 -mt-10 group-hover:opacity-80 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                          <span className="bg-gray-100 px-2 py-1 rounded-full font-medium text-xs">{article.subsection}</span>
                          <span className="font-medium text-xs">{article.readTime} {t.minRead}</span>
                          <span>•</span>
                          <span className="font-medium text-xs">{t.by} {article.author_name}</span>
                        </div>
                        <h4 className="text-gray-900 font-semibold text-xl mb-4 group-hover:text-sky-600 transition-colors duration-500 leading-tight">{article.title}</h4>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed text-base">{article.description}</p>
                      </div>
                      <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center ml-8 flex-shrink-0 group-hover:bg-sky-50 group-hover:scale-110 transition-all duration-500">
                        <DocumentTextIcon className="h-7 w-7 text-gray-400 group-hover:text-sky-500 transition-colors duration-500" />
                      </div>
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
