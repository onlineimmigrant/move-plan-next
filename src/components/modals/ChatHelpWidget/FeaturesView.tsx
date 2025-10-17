// components/ChatHelpWidget/FeaturesView.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { useFeatures, type Feature } from './hooks/useFeatures';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import * as Icons from '@heroicons/react/24/outline';
import { MdOutlineFeaturedPlayList } from 'react-icons/md';

interface FeaturesViewProps {
  size: WidgetSize;
  onBack: () => void;
}

type HeroIconName = keyof typeof Icons;

export default function FeaturesView({ size, onBack }: FeaturesViewProps) {
  const router = useRouter();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { features, loading, error } = useFeatures();
  const { t } = useHelpCenterTranslations();

  const filteredFeatures = features.filter((feature: Feature) =>
    feature.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    feature.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-5xl mx-auto' : ''} relative`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/30 via-white/10 to-blue-50/20 pointer-events-none" />
      
      <div className="relative p-8 space-y-12">
        {/* Tab Navigation Badges */}
        <div className="flex justify-center gap-3 pb-4 flex-wrap">
          <button
            onClick={() => router.push('/help-center?tab=faqs')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.faqs}</span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-sky-600 border border-sky-600 rounded-2xl shadow-md cursor-default"
          >
            <span className="text-lg font-semibold text-white">{t.features || 'Features'}</span>
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
              placeholder={t.searchFeatures || 'Search features...'}
              className="relative z-10 block w-full pl-20 pr-8 py-6 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-150 ease-out text-[17px] font-medium antialiased tracking-[-0.01em] rounded-3xl selection:bg-sky-200/50"
            />
          </div>
        </div>

        {/* Apple-style Features List */}
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
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em] mt-2">Please wait while we fetch features...</p>
            </div>
          ) : error ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-red-50/70 backdrop-blur-2xl rounded-full border border-red-100" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-red-500 text-3xl font-thin">!</span>
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em] mb-2">{t.errorLoadingContent}</p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em]">{error}</p>
            </div>
          ) : filteredFeatures.length === 0 ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl rounded-full border border-gray-200" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <MdOutlineFeaturedPlayList className="w-10 h-10 text-gray-400" />
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em] mb-2">{t.noResultsFound || 'No features found'}</p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em]">Try adjusting your search query</p>
            </div>
          ) : (
            filteredFeatures.map((feature: Feature, index: number) => (
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
                    <div className="flex items-start gap-4 flex-1 pr-4 sm:pr-8">
                      {/* Feature Icon */}
                      <div className="flex-shrink-0 w-12 h-12 neomorphic rounded-2xl flex items-center justify-center">
                        {renderFeatureIcon(feature.feature_image)}
                      </div>
                      
                      {/* Feature Title and Type */}
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
                            <p className="text-gray-700 font-normal leading-relaxed text-sm sm:text-[16px] antialiased tracking-[-0.01em] mb-4">
                              {feature.description}
                            </p>
                          )}
                          {feature.content && (
                            <div className="text-gray-700 font-normal leading-relaxed text-sm sm:text-[16px] antialiased tracking-[-0.01em] mb-4">
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
                            className="mt-4 inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-medium text-sm transition-all duration-300 group/link"
                          >
                            <span>{feature.content && feature.content.length > 500 ? 'Continue reading' : 'View details'}</span>
                            <span className="text-lg group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300">↗</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* View All Features Button */}
        {!loading && !error && features.length > 0 && (
          <div className="text-center pt-8">
            <button
              onClick={() => router.push('/features')}
              className="inline-flex items-center gap-3 px-8 py-4 neomorphic text-sm font-light rounded-full text-gray-700 hover:text-gray-900 transition-all duration-300 group"
            >
              <span className="tracking-wide">View All Features</span>
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
