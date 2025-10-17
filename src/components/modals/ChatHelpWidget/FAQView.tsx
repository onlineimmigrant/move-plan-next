// components/ChatHelpWidget/FAQView.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { faqs, loading, error } = useFAQs();
  const { t } = useHelpCenterTranslations();

  const filteredFAQs = faqs.filter((faq: FAQ) =>
    faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-5xl mx-auto' : ''} relative`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/10 to-blue-50/20 pointer-events-none" />
      
      <div className="relative p-8 space-y-12">
        {/* Tab Navigation Badges */}
        <div className="flex justify-center gap-3 pb-4">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 border border-sky-600 rounded-2xl shadow-md cursor-default"
          >
            <span className="text-lg font-semibold text-white">{t.faqs}</span>
          </button>
          <button
            onClick={() => router.push('/help-center?tab=articles')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.articles}</span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Apple-style Header */}
        <div className="space-y-10">
          {/* Apple-style Premium Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            {/* Multiple glass layers for depth */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-3xl rounded-3xl group-focus-within:scale-[1.01] transition-all duration-150 ease-out"
              style={{
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-sky-50/20 via-white/30 to-blue-50/20 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-150 ease-out" />
            
            {/* Search icon with enhanced styling */}
            <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none z-10">
              <div className="relative">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-sky-500 transition-all duration-150 ease-out group-focus-within:scale-110" />
                <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-150 ease-out" />
              </div>
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchFAQs}
              className="relative z-10 block w-full pl-20 pr-8 py-6 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-150 ease-out text-[17px] font-medium antialiased tracking-[-0.01em] rounded-3xl selection:bg-sky-200/50"
            />
          </div>
        </div>

        {/* Apple-style FAQ List */}
        <div className="space-y-5 max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl rounded-full"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-sky-100/50 to-blue-100/30 rounded-full" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em]">{t.loadingContent}</p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em] mt-2">Please wait while we fetch your answers...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-red-50/80 backdrop-blur-2xl rounded-full"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 to-red-50/30 rounded-full" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-red-500 text-3xl font-light">!</span>
                </div>
              </div>
              <p className="text-red-700 text-[20px] font-semibold antialiased tracking-[-0.01em]">{error}</p>
              <p className="text-red-500 text-[16px] font-medium antialiased tracking-[-0.01em] mt-2">Something went wrong. Please try again.</p>
            </div>
          ) : filteredFAQs.length === 0 ? (
            <div className="text-center py-24">
              <div className="relative w-24 h-24 mx-auto mb-10">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl border border-gray-200/40 rounded-full"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100/50 to-gray-50/30 rounded-full" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-400" />
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em]">
                {searchQuery ? 'No matching FAQs found' : 'No FAQs available'}
              </p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em] mt-2">
                {searchQuery ? 'Try adjusting your search terms' : 'FAQs will appear here when available'}
              </p>
            </div>
          ) : (
            filteredFAQs.map((faq: FAQ, index) => (
              <div key={faq.id} className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Multiple glass layers for depth */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl rounded-3xl group-hover:bg-white/80 group-hover:scale-[1.02] transition-all duration-150 ease-out"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/20 to-blue-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out" />
                
                <div className="relative p-10">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full text-left flex items-start justify-between group/button"
                  >
                    <span className="text-gray-900 font-semibold text-[19px] leading-relaxed pr-10 antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-150 ease-out">
                      {faq.question}
                    </span>
                    <div className="relative flex-shrink-0 mt-1">
                      {/* Button glass container */}
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full transition-all duration-150 ease-out group-hover/button:scale-105"
                        style={{
                          backdropFilter: 'blur(16px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        }}
                      />
                      <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-150 ease-out group-hover/button:scale-110 group-hover/button:rotate-180">
                        {expandedFAQ === faq.id ? (
                          <ChevronUpIcon className="h-6 w-6 text-sky-600 transition-all duration-150 ease-out group-hover/button:scale-110" />
                        ) : (
                          <ChevronDownIcon className="h-6 w-6 text-gray-500 group-hover/button:text-sky-600 transition-all duration-150 ease-out group-hover/button:scale-110" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="mt-10 pt-10 animate-in slide-in-from-top-6 duration-150 ease-out">
                      {/* Answer content with glass background */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-sky-50/30 backdrop-blur-sm rounded-2xl -m-6 p-6"
                          style={{
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                          }}
                        />
                        <div className="relative text-gray-700 font-normal leading-relaxed text-[17px] antialiased tracking-[-0.01em] p-6 prose prose-sm max-w-none">
                          <div 
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                            className="[&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>a]:text-sky-600 [&>a:hover]:text-sky-700 [&>a]:underline [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Bottom padding with fade effect */}
        <div className="h-16 bg-gradient-to-t from-white/50 to-transparent"></div>
      </div>
    </div>
  );
}
