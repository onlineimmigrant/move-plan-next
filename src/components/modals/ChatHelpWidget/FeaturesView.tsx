// components/ChatHelpWidget/FeaturesView.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WidgetSize } from '../ChatWidget/types';
import { useFeatures, type Feature } from './hooks/useFeatures';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { HelpCenterNavBadges } from './HelpCenterNavBadges';
import { HelpCenterSearchBar } from './HelpCenterSearchBar';

interface FeaturesViewProps {
  size: WidgetSize;
  onBack: () => void;
}

export default function FeaturesView({ size, onBack }: FeaturesViewProps) {
  const router = useRouter();
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const { features, loading, error } = useFeatures();
  const { t } = useHelpCenterTranslations();
  const themeColors = useThemeColors();

  // Get unique feature types
  const featureTypes = ['all', ...Array.from(new Set(features.map(f => f.type).filter(Boolean)))] as string[];

  // Get count for each type
  const getTypeCount = (type: string) => {
    if (type === 'all') return features.length;
    return features.filter(f => f.type === type).length;
  };

  const filteredFeatures = features.filter((feature: Feature) => {
    const matchesSearch = feature.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || feature.type === selectedType;
    
    return matchesSearch && matchesType;
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
          activeTab="features"
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
          placeholder={t.searchFeatures || 'Search features...'}
        />

        {/* Type Filter */}
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 max-w-full">
            {featureTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
                style={{
                  backgroundColor: selectedType === type 
                    ? themeColors.cssVars.primary.base 
                    : 'white',
                  color: selectedType === type 
                    ? 'white' 
                    : themeColors.cssVars.primary.base,
                  border: `1px solid ${selectedType === type ? themeColors.cssVars.primary.base : themeColors.cssVars.primary.light}40`,
                }}
              >
                <span>{type === 'all' ? 'All Features' : type}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: selectedType === type 
                      ? 'rgba(255, 255, 255, 0.25)' 
                      : `${themeColors.cssVars.primary.lighter}60`,
                    color: selectedType === type 
                      ? 'white' 
                      : themeColors.cssVars.primary.hover,
                  }}
                >
                  {getTypeCount(type)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apple-style Features List */}
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
                    background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}50, ${themeColors.cssVars.primary.lighter}30)`
                  }}
                />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div 
                    className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin"
                    style={{
                      borderColor: `${themeColors.cssVars.primary.base} transparent transparent transparent`,
                      borderWidth: '3px'
                    }}
                  ></div>
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
                  <span className="text-4xl">✨</span>
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em] mb-2">{t.noResultsFound || 'No features found'}</p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em]">Try adjusting your search query or filter</p>
            </div>
          ) : (
            filteredFeatures.map((feature: Feature, index: number) => (
              <div key={feature.id} className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glass layer with no border */}
                <div 
                  className="absolute inset-0 bg-white/60 backdrop-blur-2xl rounded-3xl group-hover:bg-white/80 group-hover:shadow-xl transition-all duration-300 ease-out"
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
                    onClick={() => setExpandedFeature(expandedFeature === feature.id ? null : feature.id)}
                    className="w-full text-left group/button"
                  >
                    <span className="text-gray-900 font-semibold text-base leading-relaxed">
                      {feature.name}
                    </span>
                    
                    {/* Preview on hover */}
                    {expandedFeature !== feature.id && (
                      <div className="text-gray-600 text-[15px] leading-relaxed mt-2 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                        {feature.description ? `${feature.description.substring(0, 150)}...` : feature.content ? `${feature.content.replace(/<[^>]*>/g, '').substring(0, 150)}...` : ''}
                      </div>
                    )}
                  </button>
                  
                  {expandedFeature === feature.id && (
                    <div className="mt-8 pt-8 border-t border-gray-200/40">
                      <div className="relative bg-white/50 rounded-2xl p-6">
                        {feature.description && (
                          <p className="text-gray-700 font-normal leading-relaxed text-[15px] mb-4">
                            {feature.description}
                          </p>
                        )}
                        {feature.content && (
                          <div className="text-gray-700 font-normal leading-relaxed text-[15px] mb-4">
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
                        
                        {/* Jump to Details Link */}
                        <button
                          onClick={() => router.push(`/features/${feature.slug}`)}
                          className="mt-4 inline-flex items-center gap-2 font-medium text-sm transition-all duration-300 group/link"
                          style={{ color: themeColors.cssVars.primary.hover }}
                          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.active}
                          onMouseLeave={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                        >
                          <span>{feature.content && feature.content.length > 500 ? 'Continue reading' : 'View details'}</span>
                          <span className="text-lg group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform duration-300">↗</span>
                        </button>
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
