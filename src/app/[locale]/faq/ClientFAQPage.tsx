// /app/faq/ClientFAQPage.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import FAQSection from '../../../components/HomePageSections/FAQSection';
import { FAQ } from '@/types/faq';
import { useTranslations } from 'next-intl';

interface ClientFAQPageProps {
  initialFAQs: FAQ[];
  hasMore: boolean;
  organizationId: string | null;
}

export default function ClientFAQPage({ initialFAQs, hasMore, organizationId }: ClientFAQPageProps) {
  const t = useTranslations();
  // Memoize normalizedFAQs
  const normalizedFAQs = useMemo(
    () =>
      initialFAQs.map(faq => ({
        ...faq,
        organization_id: faq.organization_id ?? faq.organisation_id ?? null,
      })),
    [initialFAQs]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [allFAQs, setAllFAQs] = useState<FAQ[]>(normalizedFAQs);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMoreFAQs, setHasMoreFAQs] = useState(hasMore);

  // Memoize filtered FAQs for better performance
  const filteredFAQs = useMemo(() => {
    if (!searchQuery) return allFAQs;
    
    const query = searchQuery.toLowerCase();
    return allFAQs.filter((faq) => {
      const question = faq.question ?? '';
      return question.toLowerCase().includes(query);
    });
  }, [searchQuery, allFAQs]);

  // Memoize search input handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  // Load more FAQs function
  const loadMoreFAQs = useCallback(async () => {
    if (!organizationId || isLoading || !hasMoreFAQs) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/faq?organizationId=${organizationId}&offset=${allFAQs.length}&limit=10`);
      if (!response.ok) throw new Error('Failed to load more FAQs');
      
      const result = await response.json();
      const newFAQs = result.data.map((faq: FAQ) => ({
        ...faq,
        organization_id: faq.organization_id ?? faq.organisation_id ?? null,
      }));
      
      setAllFAQs(prev => [...prev, ...newFAQs]);
      setHasMoreFAQs(result.hasMore);
    } catch (error) {
      console.error('Error loading more FAQs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, allFAQs.length, isLoading, hasMoreFAQs]);

  return (
    <div className="min-h-screen ">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mb-6 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 bg-clip-text text-transparent mb-4">
            {t('faq.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('faq.subtitle')}
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={t('faq.searchPlaceholder')}
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-4 py-4 text-base bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all duration-300 placeholder:text-gray-400"
              aria-label="Search FAQs"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-cyan-500/5 pointer-events-none" />
          </div>
        </div>

        {/* FAQ Section */}
        <div className="space-y-6">
          {filteredFAQs.length > 0 ? (
            <>
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl  border-gray-100/50 overflow-hidden">
                <FAQSection faqs={filteredFAQs} showTitle={false} />
              </div>
              
              {/* Load More Button - Only show if not searching and there are more FAQs */}
              {!searchQuery && hasMoreFAQs && (
                <div className="text-center pt-8">
                  <button
                    onClick={loadMoreFAQs}
                    disabled={isLoading}
                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 disabled:shadow-gray-400/20 transition-all duration-300 transform hover:-translate-y-1 disabled:translate-y-0 disabled:cursor-not-allowed"
                    aria-label="Load more FAQs"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="relative">{t('faq.loadingMoreQuestions')}</span>
                      </>
                    ) : (
                      <>
                        <span className="relative">{t('faq.loadMoreQuestions')}</span>
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {searchQuery ? t('faq.noQuestionsFound') : t('faq.noQuestionsAvailable')}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchQuery 
                  ? t('faq.tryAdjustingSearch')
                  : t('faq.checkBackLater')
                }
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  {t('faq.clearSearchAndViewAll')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}