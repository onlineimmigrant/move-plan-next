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
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-5xl mx-auto' : ''} relative`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/10 to-blue-50/20 pointer-events-none" />
      
      <div className="relative p-8 space-y-12">
        {/* Apple-style Header with Back Button */}
        <div className="space-y-10">
          <div className="relative">
            <button
              onClick={onBack}
              className="group relative flex items-center text-sky-600 hover:text-sky-700 px-5 py-4 rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.02] antialiased"
            >
              {/* Glass button background */}
              <div className="absolute inset-0 bg-white/60 backdrop-blur-xl border border-sky-200/40 rounded-2xl shadow-sm group-hover:bg-sky-50/80 group-hover:border-sky-300/60 group-hover:shadow-md transition-all duration-500"
                style={{
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
              />
              <div className="relative flex items-center">
                <ArrowLeftIcon className="h-5 w-5 mr-3 transition-transform duration-500 group-hover:-translate-x-2 group-hover:scale-110" />
                <span className="font-semibold tracking-[-0.01em] text-[15px]">{t.backToHelpCenter}</span>
              </div>
            </button>
          </div>
          
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-[36px] font-bold text-gray-900 tracking-[-0.03em] antialiased leading-tight">
                {t.frequentlyAskedQuestionsLong}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-sky-400 to-blue-500 rounded-full mx-auto opacity-80" />
            </div>
            <p className="text-[19px] text-gray-600 antialiased max-w-2xl mx-auto leading-relaxed font-medium tracking-[-0.01em]">
              {t.findAnswersCommon}
            </p>
          </div>
          
          {/* Apple-style Premium Search Bar */}
          <div className="relative max-w-2xl mx-auto group">
            {/* Multiple glass layers for depth */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-3xl border border-gray-200/40 rounded-3xl shadow-sm group-focus-within:shadow-md group-focus-within:border-sky-300/60 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-sky-50/20 via-white/30 to-blue-50/20 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
            
            {/* Search icon with enhanced styling */}
            <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none z-10">
              <div className="relative">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-sky-500 transition-all duration-500 group-focus-within:scale-110" />
                <div className="absolute inset-0 bg-sky-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchFAQs}
              className="relative z-10 block w-full pl-20 pr-8 py-6 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-500 text-[17px] font-medium antialiased tracking-[-0.01em] rounded-3xl selection:bg-sky-200/50"
            />
          </div>
        </div>

        {/* Apple-style FAQ List */}
        <div className="space-y-5 max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl border border-gray-200/40 rounded-full shadow-sm"
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
                <div className="absolute inset-0 bg-red-50/80 backdrop-blur-2xl border border-red-200/40 rounded-full shadow-sm"
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
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl border border-gray-200/40 rounded-full shadow-sm"
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
                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl shadow-sm group-hover:shadow-md transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-sky-200/60 group-hover:scale-[1.02]"
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
                
                <div className="relative p-10">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full text-left flex items-start justify-between group/button"
                  >
                    <span className="text-gray-900 font-semibold text-[19px] leading-relaxed pr-10 antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500">
                      {faq.question}
                    </span>
                    <div className="relative flex-shrink-0 mt-1">
                      {/* Button glass container */}
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 shadow-sm group-hover/button:shadow-md group-hover/button:border-sky-300/60 transition-all duration-500"
                        style={{
                          backdropFilter: 'blur(16px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        }}
                      />
                      <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                        {expandedFAQ === faq.id ? (
                          <ChevronUpIcon className="h-6 w-6 text-sky-600 transition-all duration-500 group-hover/button:scale-110" />
                        ) : (
                          <ChevronDownIcon className="h-6 w-6 text-gray-500 group-hover/button:text-sky-600 transition-all duration-500 group-hover/button:scale-110" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="mt-10 pt-10 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                      {/* Answer content with glass background */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-sky-50/30 backdrop-blur-sm rounded-2xl border border-sky-200/30 -m-6 p-6"
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
