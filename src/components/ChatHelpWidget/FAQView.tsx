// components/ChatHelpWidget/FAQView.tsx
'use client';
import { useState } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useFAQs } from './hooks/useFAQs';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { FAQ } from '@/types/faq';

interface FAQViewProps {
  size: WidgetSize;
  onBack: () => void;
}

export default function FAQView({ size, onBack }: FAQViewProps) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { faqs, loading, error } = useFAQs();
  const { t } = useHelpCenterTranslations();

  const filteredFAQs = faqs.filter((faq: FAQ) =>
    faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="p-8 space-y-8">
        {/* Header with Back Button */}
        <div className="space-y-6">
          <button
            onClick={onBack}
            className="flex items-center text-sky-500 hover:text-sky-600 hover:bg-sky-50 px-3 py-2 rounded-full transition-all duration-300 ease-out hover:scale-105"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            <span className="font-light">{t.backToHelpCenter}</span>
          </button>
          
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-light text-gray-900 tracking-tight">{t.frequentlyAskedQuestionsLong}</h2>
            <p className="text-xl text-gray-500 font-light max-w-lg mx-auto leading-relaxed">{t.findAnswersCommon}</p>
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
              placeholder={t.searchFAQs}
              className="block w-full pl-14 pr-6 py-5 bg-gray-50 border-0 rounded-3xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all duration-300 text-lg font-normal shadow-sm hover:bg-gray-100"
            />
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-6 max-w-3xl mx-auto">
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
              <p className="text-red-500 text-xl font-light">{error}</p>
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-xl font-light">
                {searchQuery ? t.noFAQsFound : t.noFAQsFound}
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq: FAQ) => (
              <div key={faq.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-400">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                  className="w-full text-left flex items-center justify-between group"
                >
                  <span className="text-gray-900 font-medium text-lg leading-relaxed pr-6">{faq.question}</span>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 bg-gray-50 group-hover:bg-sky-50">
                    {expandedFAQ === faq.id ? (
                      <ChevronUpIcon className="h-5 w-5 text-sky-500" />
                    ) : (
                      <ChevronDownIcon className="h-5 w-5 text-gray-400 group-hover:text-sky-500" />
                    )}
                  </div>
                </button>
                {expandedFAQ === faq.id && (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-gray-600 font-normal leading-relaxed text-base">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Bottom padding for scrolling */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}
