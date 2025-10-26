// components/ChatHelpWidget/FAQView.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MagnifyingGlassIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useFAQs } from './hooks/useFAQs';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import type { FAQ } from '@/types/faq';
import { useThemeColors } from '@/hooks/useThemeColors';
import { HelpCenterNavBadges } from './HelpCenterNavBadges';
import { HelpCenterSearchBar } from './HelpCenterSearchBar';

interface FAQViewProps {
  size: WidgetSize;
  onBack: () => void;
}

export default function FAQView({ size, onBack }: FAQViewProps) {
  const router = useRouter();
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const { faqs, loading, error } = useFAQs();
  const { t } = useHelpCenterTranslations();
  const themeColors = useThemeColors();

  // Get unique sections
  const sections = ['all', ...Array.from(new Set(faqs.map(f => f.section).filter(Boolean)))] as string[];

  // Get count for each section
  const getSectionCount = (section: string) => {
    if (section === 'all') return faqs.length;
    return faqs.filter(f => f.section === section).length;
  };

  const filteredFAQs = faqs.filter((faq: FAQ) => {
    const matchesSearch = faq.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSection = selectedSection === 'all' || faq.section === selectedSection;
    
    return matchesSearch && matchesSection;
  });

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-5xl mx-auto' : ''} relative`}>
      {/* Background gradient overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}20 0%, transparent 50%, ${themeColors.cssVars.primary.lighter}10 100%)`
        }}
      />
      
      <div className="relative p-8 space-y-12">
        {/* Tab Navigation Badges */}
        <HelpCenterNavBadges 
          activeTab="faq"
          showAllBadge={true}
          translations={{
            all: 'All',
            faqs: t.faqs,
            articles: t.articles,
            features: t.features || 'Features',
            offerings: t.offerings
          }}
          onNavigate={(tab) => {
            if (tab === 'all') {
              router.push('/help-center');
            } else {
              router.push(`/help-center?tab=${tab}`);
            }
          }}
        />

        {/* Search Bar */}
        <HelpCenterSearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t.searchFAQs}
        />

        {/* Section Filter */}
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 max-w-full">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
                style={{
                  backgroundColor: selectedSection === section 
                    ? themeColors.cssVars.primary.base 
                    : 'white',
                  color: selectedSection === section 
                    ? 'white' 
                    : themeColors.cssVars.primary.base,
                  border: `1px solid ${selectedSection === section ? themeColors.cssVars.primary.base : themeColors.cssVars.primary.light}40`,
                }}
              >
                <span>{section === 'all' ? 'All FAQs' : section}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: selectedSection === section 
                      ? 'rgba(255, 255, 255, 0.25)' 
                      : `${themeColors.cssVars.primary.lighter}60`,
                    color: selectedSection === section 
                      ? 'white' 
                      : themeColors.cssVars.primary.hover,
                  }}
                >
                  {getSectionCount(section)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apple-style FAQ List */}
        <div className="space-y-3 max-w-4xl mx-auto">
          {loading ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl rounded-full"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.light}50, ${themeColors.cssVars.primary.lighter}30)`
                  }}
                />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: themeColors.cssVars.primary.base,
                      borderTopColor: 'transparent'
                    }}
                  ></div>
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
                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl rounded-3xl group-hover:bg-white/80 group-hover:shadow-xl transition-all duration-300 ease-out"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div 
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                  style={{
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}30, white 20%, ${themeColors.cssVars.primary.lighter}20)`
                  }}
                />
                
                <div className="relative p-6 sm:p-8">
                  <button
                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                    className="w-full text-left group/button"
                  >
                    <span className="text-gray-900 font-semibold text-base leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-300 ease-out">
                      {faq.question}
                    </span>
                    
                    {/* Preview on hover - only show if not expanded */}
                    {expandedFAQ !== faq.id && (
                      <div 
                        className="text-gray-600 text-[15px] leading-relaxed mt-2 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden"
                        dangerouslySetInnerHTML={{ 
                          __html: faq.answer.replace(/<[^>]*>/g, '').substring(0, 150) + '...' 
                        }}
                      />
                    )}
                  </button>
                  
                  {expandedFAQ === faq.id && (
                    <div className="mt-8 pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-300 ease-out">
                      {/* Answer content with simple light background */}
                      <div className="relative bg-white/50 rounded-2xl p-6">
                        <div className="text-gray-700 font-normal leading-relaxed text-[17px] antialiased tracking-[-0.01em] prose prose-sm max-w-none">
                          <div 
                            dangerouslySetInnerHTML={{ __html: faq.answer }}
                            className="[&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-4 [&>ol]:mb-4 [&>li]:mb-1 [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-semibold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-medium [&>h3]:mb-2 [&>strong]:font-semibold [&>em]:italic [&>a]:underline [&>code]:bg-gray-100 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-sm [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:list-decimal [&>ol]:pl-6"
                            onMouseOver={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'A') {
                                target.style.color = themeColors.cssVars.primary.hover;
                              }
                            }}
                            onMouseOut={(e) => {
                              const target = e.target as HTMLElement;
                              if (target.tagName === 'A') {
                                target.style.color = themeColors.cssVars.primary.base;
                              }
                            }}
                            onMouseEnter={(e) => {
                              const links = e.currentTarget.querySelectorAll('a');
                              links.forEach(link => {
                                (link as HTMLElement).style.color = themeColors.cssVars.primary.base;
                              });
                            }}
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
