'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, RocketLaunchIcon, QuestionMarkCircleIcon, UserGroupIcon, ChevronDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import * as Icons from '@heroicons/react/24/outline';
import { MdOutlineFeaturedPlayList } from 'react-icons/md';
import { WidgetSize } from '../ChatWidget/types';
import { useFAQs } from './hooks/useFAQs';
import { useArticles } from './hooks/useArticles';
import { useFeatures } from './hooks/useFeatures';
import { usePricingPlans, type PricingPlan } from './hooks/usePricingPlans';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { FAQ } from '@/types/faq';
import type { Article } from './hooks/useArticles';
import type { Feature } from './hooks/useFeatures';
import { useThemeColors } from '@/hooks/useThemeColors';
import { HelpCenterNavBadges } from './HelpCenterNavBadges';

type HeroIconName = keyof typeof Icons;

interface WelcomeTabProps {
  onTabChange: (tab: 'welcome' | 'conversation' | 'ai') => void;
  size: WidgetSize;
  onShowFAQ?: () => void;
  onShowKnowledgeBase?: () => void;
  onShowLiveSupport?: () => void;
  onShowFeatures?: () => void;
}

export default function WelcomeTab({
  onTabChange,
  size,
  onShowFAQ,
  onShowKnowledgeBase,
  onShowLiveSupport,
  onShowFeatures,
}: WelcomeTabProps) {
  const router = useRouter();
  const themeColors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  
  // Fetch Help Center items for display (when not searching)
  const { faqs: helpCenterFAQs, loading: faqLoading, error: faqError } = useFAQs(true);
  const { articles: helpCenterArticles, loading: articlesLoading, error: articlesError } = useArticles(true);
  const { features: helpCenterFeatures, loading: featuresLoading, error: featuresError } = useFeatures(true);
  const { pricingPlans: helpCenterPricingPlans, loading: pricingPlansLoading, error: pricingPlansError } = usePricingPlans(true);
  
  // Fetch ALL items for search functionality
  const { faqs: allFAQs, loading: allFaqsLoading } = useFAQs(false);
  const { articles: allArticles, loading: allArticlesLoading } = useArticles(false);
  const { features: allFeatures, loading: allFeaturesLoading } = useFeatures(false);
  const { pricingPlans: allPricingPlans, loading: allPricingPlansLoading } = usePricingPlans(false);
  
  const { t } = useHelpCenterTranslations();

  const loading = faqLoading || articlesLoading || featuresLoading || pricingPlansLoading;
  const error = faqError || articlesError || featuresError || pricingPlansError;

  // Use ALL items for search, not just Help Center items
  const filteredFAQs = (searchQuery.trim() ? allFAQs : helpCenterFAQs).filter((faq: FAQ) =>
    !searchQuery.trim() || 
    (faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (faq.answer?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const filteredArticles = (searchQuery.trim() ? allArticles : helpCenterArticles).filter((article: Article) =>
    !searchQuery.trim() ||
    (article.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (article.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (article.subsection?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const filteredFeatures = (searchQuery.trim() ? allFeatures : helpCenterFeatures).filter((feature: Feature) =>
    !searchQuery.trim() ||
    (feature.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (feature.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (feature.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const filteredPricingPlans = (searchQuery.trim() ? allPricingPlans : helpCenterPricingPlans).filter((plan: PricingPlan) =>
    !searchQuery.trim() ||
    (plan.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (plan.package?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (plan.type?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const hasSearchResults = searchQuery.trim() && (filteredFAQs.length > 0 || filteredArticles.length > 0 || filteredFeatures.length > 0 || filteredPricingPlans.length > 0);

  const renderFeatureIcon = (iconName?: string) => {
    if (!iconName || iconName.trim() === '') {
      return <MdOutlineFeaturedPlayList className="w-5 h-5" style={{ color: themeColors.cssVars.primary.base }} />;
    }
    const IconComponent = Icons[iconName as HeroIconName];
    if (!IconComponent) {
      return <MdOutlineFeaturedPlayList className="w-5 h-5" style={{ color: themeColors.cssVars.primary.base }} />;
    }
    return <IconComponent className="w-5 h-5" style={{ color: themeColors.cssVars.primary.base }} />;
  };

  if (loading) {
    return (
      <div className="p-2 sm:p-8 space-y-8">
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
              <div key={i} className="p-8 bg-white rounded-3xl border border-gray-100">
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
      <div className="p-2 sm:p-8">
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
    <div className="min-h-full">
      <div className="p-2 sm:p-6 lg:p-8 space-y-8 sm:space-y-10 mx-auto max-w-7xl">
        {/* Tab Navigation Badges - Only show when NOT searching */}
        {!hasSearchResults && (
          <HelpCenterNavBadges
            activeTab="all"
            showAllBadge={true}
            translations={{
              all: 'All',
              faqs: t.faqs,
              articles: t.articles,
              features: t.features || 'Features',
              offerings: t.offerings
            }}
            customHandlers={{
              onAllClick: undefined, // Already on welcome/all tab
              onFAQClick: onShowFAQ,
              onArticlesClick: onShowKnowledgeBase,
              onFeaturesClick: () => router.push('/help-center?tab=features'),
              onOfferingsClick: () => router.push('/products')
            }}
          />
        )}

        {/* Search Bar - Enhanced Apple Style */}
        <div className="relative max-w-2xl mx-auto group">
          <div 
            className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl"
            style={{ 
              background: `linear-gradient(to right, ${themeColors.cssVars.primary.lighter}, white, ${themeColors.cssVars.primary.lighter})`
            }}
          ></div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon 
                className="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 transition-colors duration-300"
                style={{ 
                  ['--tw-text-opacity' as any]: '1',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                onMouseLeave={(e) => e.currentTarget.style.color = ''}
              />
            </div>
            <input
              type="text"
              placeholder={t.searchForHelp}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative block w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-slate-50/80 backdrop-blur-sm border-0 rounded-3xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-500 text-base sm:text-lg font-normal hover:bg-slate-100/80"
              style={{
                ['--tw-ring-color' as any]: `${themeColors.cssVars.primary.base}30`,
              }}
            />
          </div>
        </div>

        {/* Welcome Header - Enhanced Apple Style */}
        {!hasSearchResults && (
          <div className="text-center space-y-4">
            <h2 className="text-xl sm:text-3xl lg:text-4xl font-thin text-gray-900 tracking-tight leading-none">
              {t.howCanWeHelp}
            </h2>
            <p className="text-lg sm:text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
              {t.searchKnowledgeBase}
            </p>
          </div>
        )}

        {/* Search Results */}
        {hasSearchResults && (
          <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8">
            {(() => {
              // Count columns with results
              const columnsWithResults = [
                filteredFAQs.length > 0,
                filteredArticles.length > 0,
                filteredFeatures.length > 0,
                filteredPricingPlans.length > 0,
              ].filter(Boolean).length;

              // Dynamic grid classes based on number of columns
              const getGridClasses = () => {
                switch (columnsWithResults) {
                  case 1:
                    return 'grid grid-cols-1 max-w-2xl mx-auto';
                  case 2:
                    return 'grid grid-cols-1 lg:grid-cols-2 max-w-5xl mx-auto gap-8 lg:gap-12';
                  case 3:
                    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 lg:gap-10';
                  case 4:
                  default:
                    return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 lg:gap-10';
                }
              };

              return (
                <div className={getGridClasses()}>
                  {/* FAQs Results Column */}
                  {filteredFAQs.length > 0 && (
                <div className="space-y-5">
                  <button
                    onClick={() => onShowFAQ?.()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md text-gray-600"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}33`;
                      e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                      e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.base}80`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'white';
                      e.currentTarget.style.color = '';
                      e.currentTarget.style.borderColor = '';
                    }}
                  >
                    <span 
                      className="text-base sm:text-lg font-semibold text-slate-700 transition-colors duration-300"
                      onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                      onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    >{t.faqs}</span>
                    <span 
                      className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 transition-colors duration-300"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.light;
                        e.currentTarget.style.color = themeColors.cssVars.primary.active;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '';
                        e.currentTarget.style.color = '';
                      }}
                    >
                      {filteredFAQs.length}
                    </span>
                    <svg 
                      className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-all duration-300"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                      onMouseLeave={(e) => e.currentTarget.style.color = ''}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="space-y-4">
                    {filteredFAQs.slice(0, 3).map((faq: FAQ, index) => (
                    <div key={faq.id} className="group relative overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Enhanced glass layer with better contrast */}
                      <div 
                        className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl group-hover:shadow-slate-200/50 group-hover:scale-[1.02] pointer-events-none"
                        style={{
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}15, white 15%, rgba(248, 250, 252, 0.1))`
                        }}
                      />
                      
                      <button
                        onClick={() => onShowFAQ?.()}
                        className="relative w-full p-6 sm:p-7 text-left cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon indicator */}
                          <div className="flex-shrink-0 mt-0.5">
                            <QuestionMarkCircleIcon 
                              className="w-5 h-5 text-slate-400 transition-all duration-300 group-hover:scale-110"
                              style={{
                                color: themeColors.cssVars.primary.light,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = themeColors.cssVars.primary.light;
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-slate-900 font-semibold text-base sm:text-lg leading-snug tracking-tight transition-colors duration-300 mb-2.5"
                              style={{
                                lineHeight: '1.4',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              {faq.question}
                            </h3>
                            {/* Answer preview - only visible on hover */}
                            <div 
                              className="text-slate-600 text-sm sm:text-[15px] leading-relaxed max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden -ml-8 line-clamp-3"
                              style={{
                                lineHeight: '1.6',
                              }}
                              dangerouslySetInnerHTML={{ 
                                __html: faq.answer.replace(/<[^>]*>/g, '').substring(0, 180) + '...' 
                              }}
                            />
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Articles Results Column */}
            {filteredArticles.length > 0 && (
              <div className="space-y-5">
                <button
                  onClick={() => onShowKnowledgeBase?.()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md text-gray-600"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}33`;
                    e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                    e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.base}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <span 
                    className="text-base sm:text-lg font-semibold text-slate-700 transition-colors duration-300"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >{t.articles}</span>
                  <span 
                    className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 transition-colors duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.light;
                      e.currentTarget.style.color = themeColors.cssVars.primary.active;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    {filteredArticles.length}
                  </span>
                  <svg 
                    className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-all duration-300"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="space-y-4">
                  {filteredArticles.slice(0, 3).map((article: Article, index) => (
                    <div key={article.id} className="group relative overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Enhanced glass layer with better contrast */}
                      <div 
                        className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl group-hover:shadow-slate-200/50 group-hover:scale-[1.02] pointer-events-none"
                        style={{
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}15, white 15%, rgba(248, 250, 252, 0.1))`
                        }}
                      />
                      
                      <button
                        onClick={() => router.push(`/help-center?tab=articles&article=${article.slug}`)}
                        className="relative w-full p-6 sm:p-7 text-left cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon indicator */}
                          <div className="flex-shrink-0 mt-0.5">
                            <DocumentTextIcon 
                              className="w-5 h-5 text-slate-400 transition-all duration-300 group-hover:scale-110"
                              style={{
                                color: themeColors.cssVars.primary.light,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = themeColors.cssVars.primary.light;
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-slate-900 font-semibold text-base sm:text-lg leading-snug tracking-tight transition-colors duration-300 mb-2.5"
                              style={{
                                lineHeight: '1.4',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              {article.title}
                            </h3>
                            {/* Description - only visible on hover */}
                            <p 
                              className="text-slate-600 text-sm sm:text-[15px] leading-relaxed max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden -ml-8 line-clamp-3"
                              style={{
                                lineHeight: '1.6',
                              }}
                            >
                              {article.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Features Results Column */}
            {filteredFeatures.length > 0 && (
              <div className="space-y-5">
                <button
                  onClick={() => router.push('/features')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md text-gray-600"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}33`;
                    e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                    e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.base}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <span 
                    className="text-base sm:text-lg font-semibold text-slate-700 transition-colors duration-300"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >{t.features || 'Features'}</span>
                  <span 
                    className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 transition-colors duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.light;
                      e.currentTarget.style.color = themeColors.cssVars.primary.active;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    {filteredFeatures.length}
                  </span>
                  <svg 
                    className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-all duration-300"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="space-y-4">
                  {filteredFeatures.slice(0, 3).map((feature: Feature, index) => (
                    <div key={feature.id} className="group relative overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Enhanced glass layer with better contrast */}
                      <div 
                        className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl group-hover:shadow-slate-200/50 group-hover:scale-[1.02] pointer-events-none"
                        style={{
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}15, white 15%, rgba(248, 250, 252, 0.1))`
                        }}
                      />
                      
                      <button
                        onClick={() => onShowFeatures?.()}
                        className="relative w-full p-6 sm:p-7 text-left cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Icon indicator */}
                          <div className="flex-shrink-0 mt-0.5">
                            <RocketLaunchIcon 
                              className="w-5 h-5 text-slate-400 transition-all duration-300 group-hover:scale-110"
                              style={{
                                color: themeColors.cssVars.primary.light,
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = themeColors.cssVars.primary.light;
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-slate-900 font-semibold text-base sm:text-lg leading-snug tracking-tight transition-colors duration-300 mb-2.5"
                              style={{
                                lineHeight: '1.4',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              {feature.name}
                            </h3>
                            {/* Content preview - only visible on hover */}
                            {feature.content && (
                              <div 
                                className="text-slate-600 text-sm sm:text-[15px] leading-relaxed max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden -ml-8 line-clamp-3"
                                style={{
                                  lineHeight: '1.6',
                                }}
                                dangerouslySetInnerHTML={{ 
                                  __html: feature.content.replace(/<[^>]*>/g, '').substring(0, 180) + '...' 
                                }}
                              />
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Plans Results Column */}
            {filteredPricingPlans.length > 0 && (
              <div className="space-y-5">
                <button
                  onClick={() => router.push('/products')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl transition-all duration-300 group shadow-sm hover:shadow-md text-gray-600"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}33`;
                    e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                    e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.base}80`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '';
                    e.currentTarget.style.borderColor = '';
                  }}
                >
                  <span 
                    className="text-base sm:text-lg font-semibold text-slate-700 transition-colors duration-300"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >{t.offerings}</span>
                  <span 
                    className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 transition-colors duration-300"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = themeColors.cssVars.primary.light;
                      e.currentTarget.style.color = themeColors.cssVars.primary.active;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                      e.currentTarget.style.color = '';
                    }}
                  >
                    {filteredPricingPlans.length}
                  </span>
                  <svg 
                    className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-all duration-300"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                    onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="space-y-4">
                  {filteredPricingPlans.slice(0, 3).map((plan: PricingPlan, index) => (
                    <div key={plan.id} className="group relative overflow-hidden"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Enhanced glass layer with better contrast */}
                      <div 
                        className="absolute inset-0 bg-white/80 backdrop-blur-xl rounded-2xl transition-all duration-300 group-hover:bg-white/95 group-hover:shadow-xl group-hover:shadow-slate-200/50 group-hover:scale-[1.02] pointer-events-none"
                        style={{
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                        }}
                      />
                      <div 
                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}15, white 15%, rgba(248, 250, 252, 0.1))`
                        }}
                      />
                      
                      <button
                        onClick={() => router.push(plan.product_slug ? `/products/${plan.product_slug}` : '/products')}
                        className="relative w-full p-6 sm:p-7 text-left cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          {/* Price badge - always visible */}
                          <div className="flex-shrink-0 mt-0.5">
                            <div 
                              className="px-3 py-2 rounded-lg font-bold text-sm transition-all duration-300 group-hover:scale-105"
                              style={{
                                backgroundColor: `${themeColors.cssVars.primary.lighter}40`,
                                color: themeColors.cssVars.primary.hover,
                              }}
                            >
                              {plan.currency_symbol}{((plan.is_promotion && plan.promotion_price ? plan.promotion_price : plan.price) / 100).toFixed(2)}
                              {plan.recurring_interval && (
                                <span className="text-slate-500 text-xs font-normal ml-0.5">
                                  /{plan.recurring_interval.substring(0, 2)}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 
                              className="text-slate-900 font-semibold text-base sm:text-lg leading-snug tracking-tight transition-colors duration-300 mb-2.5"
                              style={{
                                lineHeight: '1.4',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                              onMouseLeave={(e) => e.currentTarget.style.color = ''}
                            >
                              {plan.product_name || plan.package}
                            </h3>
                            {/* Description - only visible on hover */}
                            {plan.description && (
                              <p 
                                className="text-slate-600 text-sm sm:text-[15px] leading-relaxed max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden -ml-8 line-clamp-3"
                                style={{
                                  lineHeight: '1.6',
                                }}
                              >
                                {plan.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
              );
            })()}

            {/* No Results - Full Width */}
            {filteredFAQs.length === 0 && filteredArticles.length === 0 && filteredFeatures.length === 0 && filteredPricingPlans.length === 0 && (
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

        {/* Popular FAQs - Enhanced Apple Style */}
        {!searchQuery.trim() && helpCenterFAQs.length > 0 && (
          <div className="pt-8 sm:pt-12 border-t border-gray-100 max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-light text-gray-900 mb-3 sm:mb-4 tracking-tight">{t.frequentlyAskedQuestions}</h2>
              <p className="text-base sm:text-lg text-gray-500 font-light">{t.faqDescription}</p>
            </div>
            <div className="space-y-4 sm:space-y-5">
              {helpCenterFAQs.slice(0, 5).map((faq: FAQ, index: number) => (
                <div key={faq.id} className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {expandedFAQ === faq.id ? (
                    // Simple white card when expanded - no effects
                    <div className="bg-white p-6 sm:p-10 shadow-lg">
                      <button
                        onClick={() => setExpandedFAQ(null)}
                        className="w-full text-left flex items-start justify-between group/button"
                      >
                        <span className="text-gray-900 font-semibold text-base sm:text-[19px] leading-relaxed pr-6 sm:pr-10 antialiased tracking-[-0.02em]">
                          {faq.question}
                        </span>
                        <div className="relative flex-shrink-0 mt-1">
                          <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center">
                            <ChevronDownIcon 
                              className="h-5 w-5 sm:h-6 sm:w-6 rotate-180"
                              style={{ color: themeColors.cssVars.primary.hover }}
                            />
                          </div>
                        </div>
                      </button>
                      
                      <div className="mt-8 sm:mt-10 pt-8 sm:pt-10">
                        <div className="p-6 sm:p-8">
                          <div 
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                            className="text-gray-700 leading-relaxed text-sm sm:text-[17px] antialiased tracking-[-0.01em] prose prose-sm max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>a]:underline [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                            onMouseOver={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'A') {
                                target.style.color = themeColors.cssVars.primary.hover;
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Glass effect card when collapsed
                    <>
                      {/* Multiple glass layers for depth */}
                      <div 
                        className="absolute inset-0 bg-white/60 backdrop-blur-2xl group-hover:bg-white/80 group-hover:scale-[1.02] rounded-3xl border border-gray-200/40 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          backdropFilter: 'blur(24px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.light}60`}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                      />
                      <div 
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}30, white 20%, ${themeColors.cssVars.primary.lighter}20)`
                        }}
                      />
                      
                      {/* Subtle border glow on hover */}
                      <div 
                        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}10, ${themeColors.cssVars.primary.hover}10)`,
                          filter: 'blur(1px)',
                        }}
                      />
                      
                      <div className="relative p-6 sm:p-10">
                        <button
                          onClick={() => setExpandedFAQ(faq.id)}
                          className="w-full text-left flex items-start justify-between group/button"
                        >
                          <span className="text-gray-900 font-semibold text-base sm:text-[19px] leading-relaxed pr-6 sm:pr-10 antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500">
                            {faq.question}
                          </span>
                          <div className="relative flex-shrink-0 mt-1">
                            {/* Button glass container */}
                            <div 
                              className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 transition-all duration-500"
                              style={{
                                backdropFilter: 'blur(16px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.border}60`}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                            />
                            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                              <ChevronDownIcon 
                                className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 transition-all duration-500 group-hover/button:scale-110"
                                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                                onMouseLeave={(e) => e.currentTarget.style.color = ''}
                              />
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Articles - Enhanced Apple Style */}
        {!searchQuery.trim() && helpCenterArticles.length > 0 && (
          <div className="pt-8 sm:pt-12 border-t border-gray-100 max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-light text-gray-900 mb-3 sm:mb-4 tracking-tight">{t.popularArticles}</h2>
              <p className="text-base sm:text-lg text-gray-500 font-light">{t.popularArticlesDescription}</p>
            </div>
            <div className={`gap-4 sm:gap-6 ${
              size === 'initial' 
                ? 'space-y-4 sm:space-y-6' 
                : size === 'half' 
                  ? 'grid grid-cols-1 sm:grid-cols-2' 
                  : 'grid grid-cols-1 sm:grid-cols-2'
            }`}>
              {helpCenterArticles.slice(0, size === 'initial' ? 3 : size === 'half' ? 4 : 8).map((article: Article) => (
                <button
                  key={article.id}
                  onClick={() => router.push(`/help-center?tab=articles&article=${article.slug}`)}
                  className="w-full p-6 sm:p-8 bg-white rounded-3xl border hover:scale-[1.01] transition-all duration-500 ease-out text-left group relative overflow-hidden"
                  style={{ borderColor: 'rgb(243, 244, 246)' }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.light}40`}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgb(243, 244, 246)'}
                >
                  <div 
                    className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 group-hover:opacity-80 transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}50, transparent)`
                    }}
                  ></div>
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 
                          className="text-gray-900 font-semibold text-lg sm:text-xl mb-3 sm:mb-4 transition-colors duration-500 leading-tight"
                          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        >{article.title}</h4>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed text-sm sm:text-base">{article.description}</p>
                      </div>
                      <div 
                        className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-full flex items-center justify-center ml-6 sm:ml-8 flex-shrink-0 group-hover:scale-110 transition-all duration-500"
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = `${themeColors.cssVars.primary.lighter}40`}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = ''}
                      >
                        <DocumentTextIcon 
                          className="h-5 w-5 sm:h-7 sm:w-7 text-gray-400 transition-colors duration-500"
                          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.base}
                          onMouseLeave={(e) => e.currentTarget.style.color = ''}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Featured Features - Enhanced Apple Style */}
        {!searchQuery.trim() && helpCenterFeatures.length > 0 && (
          <div className="pt-8 sm:pt-12 border-t border-gray-100 max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-light text-gray-900 mb-3 sm:mb-4 tracking-tight">{t.featuredFeatures || 'Featured Features'}</h2>
              <p className="text-base sm:text-lg text-gray-500 font-light">{t.featuredFeaturesDescription || 'Discover what makes us special'}</p>
            </div>
            <div className="space-y-4 sm:space-y-5">
              {helpCenterFeatures.slice(0, 5).map((feature: Feature, index: number) => (
                <div key={feature.id} className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Multiple glass layers for depth */}
                  <div 
                    className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:scale-[1.02]"
                    style={{
                      backdropFilter: 'blur(24px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.light}60`}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                  />
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}30, white 20%, rgba(248, 250, 252, 0.2))`
                    }}
                  />
                  
                  {/* Subtle border glow on hover */}
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: `linear-gradient(135deg, ${themeColors.cssVars.primary.base}10, ${themeColors.cssVars.primary.hover}10)`,
                      filter: 'blur(1px)',
                    }}
                  />
                  
                  <div className="relative p-6 sm:p-8">
                    <button
                      onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                      className="w-full text-left flex items-start justify-between group/button"
                    >
                      <div className="flex items-start gap-4 flex-1 pr-4 sm:pr-8">
                        {/* Feature Icon */}
                        <div 
                          className="flex-shrink-0 w-12 h-12 neomorphic rounded-2xl flex items-center justify-center"
                          style={{
                            background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}, rgba(248, 250, 252, 1))`
                          }}
                        >
                          {renderFeatureIcon(feature.icon)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-900 font-semibold text-base sm:text-[19px] leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500 block">
                            {feature.name}
                          </span>
                          {feature.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="relative flex-shrink-0 mt-1">
                        {/* Button glass container */}
                        <div 
                          className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 transition-all duration-500"
                          style={{
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = `${themeColors.cssVars.primary.border}60`}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = ''}
                        />
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                          <ChevronDownIcon 
                            className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 transition-all duration-500 group-hover/button:scale-110 ${
                              expandedFeature === feature.id ? 'rotate-180' : ''
                            }`}
                            style={expandedFeature === feature.id ? { color: themeColors.cssVars.primary.hover } : undefined}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = themeColors.cssVars.primary.hover;
                            }}
                            onMouseLeave={(e) => {
                              if (expandedFeature !== feature.id) {
                                e.currentTarget.style.color = '';
                              }
                            }}
                          />
                        </div>
                      </div>
                    </button>
                    
                    {expandedFeature === feature.id && (
                      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        {/* Feature content with glass background */}
                        <div className="relative">
                          <div 
                            className="absolute inset-0 backdrop-blur-sm rounded-2xl -m-4 sm:-m-6 p-4 sm:p-6"
                            style={{
                              backgroundColor: `${themeColors.cssVars.primary.lighter}30`,
                              borderColor: `${themeColors.cssVars.primary.light}30`,
                              borderWidth: '1px',
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                            }}
                          />
                          <div className="relative p-4 sm:p-6">
                            {feature.content && (
                              <div 
                                dangerouslySetInnerHTML={{ __html: feature.content.substring(0, 500) }}
                                className="text-gray-700 font-normal leading-relaxed text-sm sm:text-[16px] antialiased tracking-[-0.01em] mb-4 prose prose-sm max-w-none"
                              />
                            )}
                            
                            {/* Jump to Details Link with Arrow */}
                            <button
                              onClick={() => router.push(`/features/${feature.slug}`)}
                              className="mt-4 inline-flex items-center gap-2 font-medium text-sm transition-all duration-300 group/link"
                              style={{ color: themeColors.cssVars.primary.hover }}
                              onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.active}
                              onMouseLeave={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                            >
                              <span>View full details</span>
                              <span className="text-lg group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300">↗</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
