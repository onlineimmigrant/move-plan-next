// components/ChatHelpWidget/FAQView.tsx
'use client';
import { useState } from 'react';
import { ArrowLeftIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
    <div className={`h-full p-4 ${size === 'fullscreen' ? 'max-w-4xl mx-auto' : ''}`}>
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-sky-600 hover:text-sky-700 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          {t.backToWelcome}
        </button>
        <h2 className="text-xl font-bold text-gray-800">{t.frequentlyAskedQuestionsLong}</h2>
        <p className="text-gray-600 text-sm mt-1 mb-4">{t.findAnswersCommon}</p>
        
        {/* Search Bar */}
        <div className="relative z-10">
          <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchFAQs}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* FAQ List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">{t.loadingContent}</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
          </div>
        ) : filteredFAQs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              {searchQuery ? t.noFAQsFound : t.noFAQsFound}
            </p>
          </div>
        ) : (
          filteredFAQs.map((faq: FAQ) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex justify-between items-center"
              >
                <span className="font-medium text-gray-800">{faq.question}</span>
                <span className="text-gray-400 text-lg">
                  {expandedFAQ === faq.id ? '−' : '+'}
                </span>
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100">
                  <div className="pt-3">{faq.answer}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
