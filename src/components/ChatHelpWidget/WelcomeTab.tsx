'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChatBubbleLeftRightIcon, DocumentTextIcon, RocketLaunchIcon, QuestionMarkCircleIcon, UserGroupIcon, ChevronDownIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import * as Icons from '@heroicons/react/24/outline';
import { MdOutlineFeaturedPlayList } from 'react-icons/md';
import { WidgetSize } from '../ChatWidget/types';
import { useFAQs } from './hooks/useFAQs';
import { useArticles } from './hooks/useArticles';
import { useFeatures } from './hooks/useFeatures';
import { usePricingPlans } from './hooks/usePricingPlans';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { FAQ } from '@/types/faq';
import type { Article } from './hooks/useArticles';
import type { Feature } from './hooks/useFeatures';
import type { PricingPlan } from './hooks/usePricingPlans';

type HeroIconName = keyof typeof Icons;

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
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [expandedPricingPlan, setExpandedPricingPlan] = useState<string | null>(null);
  const [currentOfferingSlide, setCurrentOfferingSlide] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3); // Default to 3 for desktop
  
  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet: 2 cards
      } else {
        setItemsPerView(3); // Desktop: 3 cards
      }
    };
    
    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);
  
  // Fetch Help Center items for display (when not searching)
  const { faqs: helpCenterFAQs, loading: faqLoading, error: faqError } = useFAQs(true);
  const { articles: helpCenterArticles, loading: articlesLoading, error: articlesError } = useArticles(true);
  const { features: helpCenterFeatures, loading: featuresLoading, error: featuresError } = useFeatures(true);
  const { pricingPlans: helpCenterPricingPlans, loading: pricingLoading, error: pricingError } = usePricingPlans(true);
  
  // Fetch ALL items for search functionality
  const { faqs: allFAQs, loading: allFaqsLoading } = useFAQs(false);
  const { articles: allArticles, loading: allArticlesLoading } = useArticles(false);
  const { features: allFeatures, loading: allFeaturesLoading } = useFeatures(false);
  const { pricingPlans: allPricingPlans, loading: allPricingLoading } = usePricingPlans(false);
  
  const { t } = useHelpCenterTranslations();

  const loading = faqLoading || articlesLoading || featuresLoading || pricingLoading;
  const error = faqError || articlesError || featuresError || pricingError;

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
    (plan.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false)
  );

  const hasSearchResults = searchQuery.trim() && (filteredFAQs.length > 0 || filteredArticles.length > 0 || filteredFeatures.length > 0 || filteredPricingPlans.length > 0);

  const renderFeatureIcon = (iconName?: string) => {
    if (!iconName || iconName.trim() === '') {
      return <MdOutlineFeaturedPlayList className="w-5 h-5 text-sky-500" />;
    }
    const IconComponent = Icons[iconName as HeroIconName];
    if (!IconComponent) {
      return <MdOutlineFeaturedPlayList className="w-5 h-5 text-sky-500" />;
    }
    return <IconComponent className="w-5 h-5 text-sky-500" />;
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
    <div className="h-full overflow-y-auto">
      <div className="p-2 sm:p-6 lg:p-8 space-y-8 sm:space-y-10 mx-auto max-w-7xl">
        {/* Welcome Header - Enhanced Apple Style */}
        <div className="text-center space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-thin text-gray-900 tracking-tight leading-none">
            {t.howCanWeHelp}
          </h2>
          <p className="text-lg sm:text-xl text-gray-500 font-light max-w-2xl mx-auto leading-relaxed">
            {t.searchKnowledgeBase}
          </p>
        </div>

        {/* Search Bar - Enhanced Apple Style */}
        <div className="relative max-w-2xl mx-auto group">
          <div className="absolute inset-0 bg-gradient-to-r from-sky-100 via-white to-sky-100 rounded-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl"></div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 sm:pl-6 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 group-focus-within:text-sky-500 transition-colors duration-300" />
            </div>
            <input
              type="text"
              placeholder={t.searchForHelp}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="relative block w-full pl-12 sm:pl-16 pr-6 sm:pr-8 py-4 sm:py-6 bg-gray-50/80 backdrop-blur-sm border-0 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white transition-all duration-500 text-base sm:text-lg font-normal hover:bg-gray-100/80"
            />
          </div>
        </div>

        {/* Tab Navigation Badges - Only show when NOT searching */}
        {!hasSearchResults && (
          <div className="flex justify-center gap-3 pb-4 flex-wrap w-full px-4 sm:px-6">
            <button
              onClick={() => onShowFAQ?.()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <span className="text-base sm:text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.faqs}</span>
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                {allFAQs.length}
              </span>
            </button>
            <button
              onClick={() => onShowKnowledgeBase?.()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <span className="text-base sm:text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.articles}</span>
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                {allArticles.length}
              </span>
            </button>
            <button
              onClick={() => router.push('/help-center?tab=features')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <span className="text-base sm:text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.features || 'Features'}</span>
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                {allFeatures.length}
              </span>
            </button>
            <button
              onClick={() => router.push('/help-center?tab=offerings')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
            >
              <span className="text-base sm:text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.offerings || 'Offerings'}</span>
              <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                {allPricingPlans.length}
              </span>
            </button>
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
                    return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 max-w-7xl mx-auto gap-8 lg:gap-12';
                  case 4:
                  default:
                    return 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-12';
                }
              };

              return (
                <div className={getGridClasses()}>
                  {/* FAQs Results Column */}
                  {filteredFAQs.length > 0 && (
                <div className="space-y-5">
                  <button
                    onClick={() => onShowFAQ?.()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
                  >
                    <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.faqs}</span>
                    <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                      {filteredFAQs.length}
                    </span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <div className="space-y-4">
                    {filteredFAQs.slice(0, 3).map((faq: FAQ, index) => (
                    <div key={faq.id} className="group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Multiple glass layers for depth */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-sky-200/60 group-hover:scale-[1.02]"
                        style={{
                          backdropFilter: 'blur(24px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/20 to-blue-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      {/* Subtle border glow on hover */}
                      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
                          filter: 'blur(1px)',
                        }}
                      />
                      
                      <div className="relative p-6 sm:p-8">
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                          className="w-full text-left flex items-start justify-between group/button"
                        >
                          <span className="text-gray-900 font-semibold text-base sm:text-[18px] leading-relaxed pr-4 sm:pr-8 antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500">{faq.question}</span>
                          <div className="relative flex-shrink-0 mt-1">
                            {/* Button glass container */}
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-sky-300/60 transition-all duration-500"
                              style={{
                                backdropFilter: 'blur(16px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                              }}
                            />
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                              <ChevronDownIcon 
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover/button:text-sky-600 transition-all duration-500 group-hover/button:scale-110 ${
                                  expandedFAQ === faq.id ? 'rotate-180 text-sky-600' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </button>
                        
                        {expandedFAQ === faq.id && (
                          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            {/* Answer content with glass background */}
                            <div className="relative">
                              <div className="absolute inset-0 bg-sky-50/30 backdrop-blur-sm rounded-2xl border border-sky-200/30 -m-4 sm:-m-6 p-4 sm:p-6"
                                style={{
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                }}
                              />
                              <div 
                                dangerouslySetInnerHTML={{ __html: faq.answer }}
                                className="relative text-gray-700 font-normal leading-relaxed text-sm sm:text-[16px] antialiased tracking-[-0.01em] p-4 sm:p-6 prose prose-sm max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>a]:text-sky-600 [&>a:hover]:text-sky-700 [&>a]:underline [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                              />
                            </div>
                          </div>
                        )}
                      </div>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.articles}</span>
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                    {filteredArticles.length}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="space-y-4">
                  {filteredArticles.slice(0, 3).map((article: Article, index) => (
                    <div key={article.id} className="group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Multiple glass layers for depth - matching FAQ style */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-sky-200/60 group-hover:scale-[1.02] pointer-events-none"
                        style={{
                          backdropFilter: 'blur(24px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/20 to-blue-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                      
                      {/* Subtle border glow on hover */}
                      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
                          filter: 'blur(1px)',
                        }}
                      />
                      
                      <button
                        onClick={() => router.push(`/help-center?tab=articles&article=${article.slug}`)}
                        className="relative w-full p-6 sm:p-8 text-left flex items-start justify-between group/button"
                      >
                        <div className="flex-1 pr-4 sm:pr-8">
                          <h3 className="text-gray-900 font-semibold text-base sm:text-[18px] leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500 mb-2">
                            {article.title}
                          </h3>
                          {/* Description - only visible on hover */}
                          <p className="text-gray-600 text-sm sm:text-base leading-relaxed opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-20 transition-all duration-500 overflow-hidden">
                            {article.description}
                          </p>
                        </div>
                        <div className="relative flex-shrink-0 mt-1">
                          {/* Button glass container - matching FAQ style */}
                          <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-sky-300/60 transition-all duration-500"
                            style={{
                              backdropFilter: 'blur(16px) saturate(180%)',
                              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                            }}
                          />
                          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110">
                            {/* Right arrow icon - matching FAQ chevron style */}
                            <svg 
                              className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover/button:text-sky-600 transition-all duration-500 group-hover/button:scale-110 group-hover/button:translate-x-0.5" 
                              fill="none" 
                              viewBox="0 0 24 24" 
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.features || 'Features'}</span>
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                    {filteredFeatures.length}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="space-y-4">
                  {filteredFeatures.slice(0, 3).map((feature: Feature, index) => (
                    <div key={feature.id} className="group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Multiple glass layers for depth */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-sky-200/60 group-hover:scale-[1.02]"
                        style={{
                          backdropFilter: 'blur(24px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/20 to-blue-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      {/* Subtle border glow on hover */}
                      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
                          filter: 'blur(1px)',
                        }}
                      />
                      
                      <div className="relative p-6 sm:p-8">
                        <button
                          onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                          className="w-full text-left flex items-start justify-between group/button"
                        >
                          <div className="flex items-start gap-3 flex-1 pr-4 sm:pr-8">
                            {/* Feature Icon */}
                            <div className="flex-shrink-0 w-10 h-10 neomorphic rounded-2xl flex items-center justify-center">
                              {renderFeatureIcon(feature.feature_image)}
                            </div>
                            
                            {/* Feature Title */}
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900 font-semibold text-base sm:text-[18px] leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500 block">
                                {feature.name}
                              </span>
                              {feature.type && (
                                <span className="inline-block mt-2 px-3 py-1 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
                                  {feature.type}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="relative flex-shrink-0 mt-1">
                            {/* Button glass container */}
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-sky-300/60 transition-all duration-500"
                              style={{
                                backdropFilter: 'blur(16px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                              }}
                            />
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                              <ChevronDownIcon 
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover/button:text-sky-600 transition-all duration-500 group-hover/button:scale-110 ${
                                  expandedFeature === feature.id ? 'rotate-180 text-sky-600' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </button>
                        
                        {expandedFeature === feature.id && (
                          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            {/* Feature content with glass background */}
                            <div className="relative">
                              <div className="absolute inset-0 bg-sky-50/30 backdrop-blur-sm rounded-2xl border border-sky-200/30 -m-4 sm:-m-6 p-4 sm:p-6"
                                style={{
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                }}
                              />
                              <div className="relative p-4 sm:p-6">
                                {feature.description && (
                                  <p className="text-gray-700 text-sm leading-relaxed mb-3">
                                    {feature.description}
                                  </p>
                                )}
                                
                                {/* Content Preview */}
                                {feature.content && (
                                  <div className="text-gray-600 text-sm leading-relaxed mb-3">
                                    <div 
                                      dangerouslySetInnerHTML={{ 
                                        __html: feature.content.length > 500 
                                          ? feature.content.substring(0, 500).replace(/<[^>]*>/g, '') + '...' 
                                          : feature.content 
                                      }}
                                      className="prose prose-sm max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0"
                                    />
                                  </div>
                                )}
                                
                                {/* Jump to Details Link with Arrow */}
                                <button
                                  onClick={() => router.push(`/features/${feature.slug}`)}
                                  className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-medium text-sm transition-all duration-300 group/link"
                                >
                                  <span>{feature.content && feature.content.length > 500 ? 'Continue reading' : 'View details'}</span>
                                  <span className="text-base group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300">↗</span>
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

            {/* Offerings Results Column */}
            {filteredPricingPlans.length > 0 && (
              <div className="space-y-5">
                <button
                  onClick={() => router.push('/products')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.offerings || 'Offerings'}</span>
                  <span className="flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 group-hover:bg-sky-100 group-hover:text-sky-700 transition-colors duration-300">
                    {filteredPricingPlans.length}
                  </span>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="space-y-4">
                  {filteredPricingPlans.slice(0, 3).map((plan: PricingPlan, index) => (
                    <div key={plan.id} className="group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Glass morphism card */}
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-sky-200/60 group-hover:scale-[1.02]"
                        style={{
                          backdropFilter: 'blur(24px) saturate(200%)',
                          WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/20 to-blue-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      
                      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        style={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
                          filter: 'blur(1px)',
                        }}
                      />
                      
                      <div className="relative p-6 sm:p-8">
                        <button
                          onClick={() => setExpandedPricingPlan(expandedPricingPlan === plan.id ? null : plan.id)}
                          className="w-full text-left flex items-start justify-between group/button"
                        >
                          <div className="flex items-start gap-3 flex-1 pr-4 sm:pr-8">
                            {/* Product Image or Icon */}
                            <div className="flex-shrink-0 w-12 h-12 neomorphic rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50">
                              {plan.links_to_image ? (
                                <img src={plan.links_to_image} alt={plan.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-2xl">💎</span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-900 font-semibold text-base sm:text-[18px] leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500 block">
                                {plan.product_name || plan.package}
                              </span>
                              {plan.measure && (
                                <span className="inline-block mt-2 px-3 py-1 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
                                  {plan.measure}
                                </span>
                              )}
                              {/* Price Display */}
                              <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-xl font-bold text-gray-900">
                                  {plan.currency_symbol}{(plan.is_promotion && plan.promotion_price ? plan.promotion_price : plan.price) / 100}
                                </span>
                                {plan.is_promotion && plan.promotion_price && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {plan.currency_symbol}{plan.price / 100}
                                  </span>
                                )}
                                {plan.recurring_interval && plan.recurring_interval !== 'one_time' && (
                                  <span className="text-sm text-gray-500">/ {plan.recurring_interval}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative flex-shrink-0 mt-1">
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-sky-300/60 transition-all duration-500"
                              style={{
                                backdropFilter: 'blur(16px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                              }}
                            />
                            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                              <ChevronDownIcon 
                                className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover/button:text-sky-600 transition-all duration-500 group-hover/button:scale-110 ${
                                  expandedPricingPlan === plan.id ? 'rotate-180 text-sky-600' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </button>
                        
                        {expandedPricingPlan === plan.id && (
                          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                            <div className="relative">
                              <div className="absolute inset-0 bg-sky-50/30 backdrop-blur-sm rounded-2xl border border-sky-200/30 -m-4 sm:-m-6 p-4 sm:p-6"
                                style={{
                                  backdropFilter: 'blur(8px)',
                                  WebkitBackdropFilter: 'blur(8px)',
                                }}
                              />
                              <div className="relative p-4 sm:p-6">
                                {plan.description && (
                                  <p className="text-gray-700 text-sm leading-relaxed mb-4">
                                    {plan.description}
                                  </p>
                                )}
                                
                                <button
                                  onClick={() => router.push(`/products/${plan.product_slug || plan.product_id}`)}
                                  className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-medium text-sm transition-all duration-300 group/link"
                                >
                                  <span>View details & purchase</span>
                                  <span className="text-base group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300">↗</span>
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
                  {/* Multiple glass layers for depth */}
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-sky-200/60 group-hover:scale-[1.02]"
                    style={{
                      backdropFilter: 'blur(24px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/20 to-blue-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Subtle border glow on hover */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
                      filter: 'blur(1px)',
                    }}
                  />
                  
                  <div className="relative p-6 sm:p-10">
                    <button
                      onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                      className="w-full text-left flex items-start justify-between group/button"
                    >
                      <span className="text-gray-900 font-semibold text-base sm:text-[19px] leading-relaxed pr-6 sm:pr-10 antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500">
                        {faq.question}
                      </span>
                      <div className="relative flex-shrink-0 mt-1">
                        {/* Button glass container */}
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-sky-300/60 transition-all duration-500"
                          style={{
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                          }}
                        />
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                          <ChevronDownIcon 
                            className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-500 group-hover/button:text-sky-600 transition-all duration-500 group-hover/button:scale-110 ${
                              expandedFAQ === faq.id ? 'rotate-180 text-sky-600' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                    
                    {expandedFAQ === faq.id && (
                      <div className="mt-8 sm:mt-10 pt-8 sm:pt-10 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        {/* Answer content with glass background */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-sky-50/30 backdrop-blur-sm rounded-2xl border border-sky-200/30 -m-4 sm:-m-6 p-4 sm:p-6"
                            style={{
                              backdropFilter: 'blur(8px)',
                              WebkitBackdropFilter: 'blur(8px)',
                            }}
                          />
                          <div 
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                            className="relative text-gray-700 leading-relaxed text-sm sm:text-[17px] antialiased tracking-[-0.01em] p-4 sm:p-6 prose prose-sm max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>a]:text-sky-600 [&>a:hover]:text-sky-700 [&>a]:underline [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                          />
                        </div>
                      </div>
                    )}
                  </div>
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
                  className="w-full p-6 sm:p-8 bg-white rounded-3xl border border-gray-100 hover:scale-[1.01] hover:border-gray-200 transition-all duration-500 ease-out text-left group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-50/50 to-transparent rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10 group-hover:opacity-80 transition-opacity duration-500"></div>
                  <div className="relative">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-gray-900 font-semibold text-lg sm:text-xl mb-3 sm:mb-4 group-hover:text-sky-600 transition-colors duration-500 leading-tight">{article.title}</h4>
                        <p className="text-gray-600 line-clamp-2 leading-relaxed text-sm sm:text-base">{article.description}</p>
                      </div>
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-50 rounded-full flex items-center justify-center ml-6 sm:ml-8 flex-shrink-0 group-hover:bg-sky-50 group-hover:scale-110 transition-all duration-500">
                        <DocumentTextIcon className="h-5 w-5 sm:h-7 sm:w-7 text-gray-400 group-hover:text-sky-500 transition-colors duration-500" />
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
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-purple-200/60 group-hover:scale-[1.02]"
                    style={{
                      backdropFilter: 'blur(24px) saturate(200%)',
                      WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white/20 to-pink-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {/* Subtle border glow on hover */}
                  <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                    style={{
                      background: 'linear-gradient(135deg, rgba(147, 51, 234, 0.1), rgba(236, 72, 153, 0.1))',
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
                        <div className="flex-shrink-0 w-12 h-12 neomorphic rounded-2xl flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
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
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-purple-300/60 transition-all duration-500"
                          style={{
                            backdropFilter: 'blur(16px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                          }}
                        />
                        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                          <ChevronDownIcon 
                            className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover/button:text-purple-600 transition-all duration-500 group-hover/button:scale-110 ${
                              expandedFeature === feature.id ? 'rotate-180 text-purple-600' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </button>
                    
                    {expandedFeature === feature.id && (
                      <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                        {/* Feature content with glass background */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-purple-50/30 backdrop-blur-sm rounded-2xl border border-purple-200/30 -m-4 sm:-m-6 p-4 sm:p-6"
                            style={{
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
                              className="mt-4 inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-all duration-300 group/link"
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

        {/* Hot Offerings - Product Cards with Slider */}
        {!searchQuery.trim() && helpCenterPricingPlans.length > 0 && (
          <div className="pt-8 sm:pt-12 border-t border-gray-100 max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-4xl font-light text-gray-900 mb-3 sm:mb-4 tracking-tight">{t.hotOfferings || 'Hot Offerings'}</h2>
              <p className="text-base sm:text-lg text-gray-500 font-light">{t.hotOfferingsDescription || 'Special pricing plans just for you'}</p>
            </div>
            
            {/* Slider Container */}
            <div className="relative overflow-hidden">
              <div className="relative px-8 sm:px-12 md:px-16 lg:px-20">
                {/* Cards Container - Flex-based slider */}
                <div 
                  className="flex gap-4 sm:gap-6 transition-transform duration-500 ease-in-out"
                  style={{
                    transform: `translateX(-${currentOfferingSlide * (100 / itemsPerView)}%)`,
                  }}
                >
                  {helpCenterPricingPlans.map((plan: PricingPlan, index: number) => (
                    <div
                      key={plan.id}
                      onClick={() => router.push(`/products/${plan.product_slug || plan.product_id}`)}
                      className="group cursor-pointer flex-shrink-0"
                      style={{ 
                        width: itemsPerView === 1 
                          ? 'calc(100% - 0px)' 
                          : itemsPerView === 2 
                          ? 'calc(50% - 12px)' 
                          : 'calc(33.333% - 16px)',
                        animationDelay: `${index * 100}ms` 
                      }}
                    >
                      {/* Product Card - Similar to /products page */}
                      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full min-h-[420px]">
                        {/* Product Image */}
                        {plan.links_to_image && plan.links_to_image.trim() !== '' ? (
                          <div className="w-full h-48 sm:h-52 flex-shrink-0 overflow-hidden">
                            <img
                              src={plan.links_to_image}
                              alt={plan.product_name || plan.package || 'Product'}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-48 sm:h-52 flex-shrink-0 bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
                            <span className="text-6xl">💎</span>
                          </div>
                        )}
                        
                        {/* Card Content */}
                        <div className="p-4 sm:p-6 flex flex-col flex-grow">
                          {/* Product Name */}
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors duration-200 min-h-[3rem]">
                            {plan.product_name || plan.package}
                          </h3>
                          
                          {/* Package/Type and Measure Badges */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {plan.package && (
                              <span className="inline-block px-3 py-1 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
                                {plan.package}
                              </span>
                            )}
                            {plan.measure && (
                              <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full tracking-wide uppercase border border-amber-100">
                                {plan.measure}
                              </span>
                            )}
                          </div>
                          
                          {/* Promotion Badge */}
                          {plan.is_promotion && (
                            <div className="mb-3">
                              <span className="inline-block px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full tracking-wide uppercase border border-red-100">
                                {plan.promotion_percent ? `-${plan.promotion_percent}%` : 'SALE'}
                              </span>
                            </div>
                          )}
                          
                          {/* Description */}
                          {plan.description && (
                            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                              {plan.description}
                            </p>
                          )}
                          
                          {/* Pricing Section */}
                          <div className="mt-auto">
                            <div className="flex items-baseline gap-2 mb-3">
                              <div className="flex items-baseline gap-2">
                                {plan.is_promotion && plan.promotion_price ? (
                                  <>
                                    <span className="text-xl sm:text-2xl font-bold text-red-600">
                                      {plan.currency_symbol}{(plan.promotion_price / 100).toFixed(2)}
                                    </span>
                                    <span className="text-sm text-gray-400 line-through">
                                      {plan.currency_symbol}{(plan.price / 100).toFixed(2)}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-xl sm:text-2xl font-bold text-gray-700">
                                    {plan.currency_symbol}{(plan.price / 100).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              {plan.recurring_interval && plan.recurring_interval !== 'one_time' && (
                                <span className="text-sm text-gray-500 font-medium">
                                  / {plan.recurring_interval}
                                </span>
                              )}
                            </div>
                            
                            {/* View Details Arrow */}
                            <div className="flex justify-end">
                              <span className="text-sky-400 transition-all duration-300 group-hover:translate-x-1">
                                <ArrowRightIcon className="h-5 w-5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Navigation Arrows */}
                {helpCenterPricingPlans.length > itemsPerView && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentOfferingSlide(prev => Math.max(0, prev - 1));
                      }}
                      disabled={currentOfferingSlide === 0}
                      className="absolute left-0 sm:-left-2 lg:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200/50 z-10 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous offerings"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentOfferingSlide(prev => Math.min(helpCenterPricingPlans.length - itemsPerView, prev + 1));
                      }}
                      disabled={currentOfferingSlide >= helpCenterPricingPlans.length - itemsPerView}
                      className="absolute right-0 sm:-right-2 lg:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group border border-gray-200/50 z-10 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next offerings"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-gray-900 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Dot Indicators */}
              {helpCenterPricingPlans.length > itemsPerView && (
                <div className="flex justify-center gap-2 mt-6">
                  {Array.from({ 
                    length: Math.max(0, helpCenterPricingPlans.length - itemsPerView + 1)
                  }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentOfferingSlide(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === currentOfferingSlide
                          ? 'w-8 h-2 bg-amber-500'
                          : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                      }`}
                      aria-label={`Go to offering slide ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom padding for scrolling */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
