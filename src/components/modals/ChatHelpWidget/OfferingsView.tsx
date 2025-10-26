// components/ChatHelpWidget/OfferingsView.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { usePricingPlans, type PricingPlan } from './hooks/usePricingPlans';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';
import { HelpCenterNavBadges } from './HelpCenterNavBadges';
import { HelpCenterSearchBar } from './HelpCenterSearchBar';

interface OfferingsViewProps {
  size: WidgetSize;
  onBack: () => void;
}

export default function OfferingsView({ size, onBack }: OfferingsViewProps) {
  const router = useRouter();
  const [expandedPricingPlan, setExpandedPricingPlan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeasure, setSelectedMeasure] = useState<string>('all');
  const { pricingPlans, loading, error } = usePricingPlans();
  const { t } = useHelpCenterTranslations();
  const themeColors = useThemeColors();

  // Get unique measures
  const measures = ['all', ...Array.from(new Set(pricingPlans.map(p => p.measure).filter(Boolean)))] as string[];

  // Get count for each measure
  const getMeasureCount = (measure: string) => {
    if (measure === 'all') return pricingPlans.length;
    return pricingPlans.filter(p => p.measure === measure).length;
  };

  const filteredPricingPlans = pricingPlans.filter((plan: PricingPlan) => {
    const matchesSearch = plan.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.package?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesMeasure = selectedMeasure === 'all' || plan.measure === selectedMeasure;
    
    return matchesSearch && matchesMeasure;
  });

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-5xl mx-auto' : ''} relative`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white/10 to-yellow-50/20 pointer-events-none" />
      
      <div className="relative p-8 space-y-12">
        {/* Tab Navigation Badges */}
        <HelpCenterNavBadges 
          activeTab="offerings"
          showAllBadge={true}
          translations={{
            all: 'All',
            faqs: t.faqs,
            articles: t.articles,
            features: t.features || 'Features',
            offerings: t.offerings || 'Offerings'
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
          placeholder={t.searchOfferings || 'Search offerings...'}
        />

        {/* Measure Filter */}
        <div className="flex justify-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 max-w-full">
            {measures.map((measure) => (
              <button
                key={measure}
                onClick={() => setSelectedMeasure(measure)}
                className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2"
                style={{
                  backgroundColor: selectedMeasure === measure 
                    ? themeColors.cssVars.primary.base 
                    : 'white',
                  color: selectedMeasure === measure 
                    ? 'white' 
                    : themeColors.cssVars.primary.base,
                  border: `1px solid ${selectedMeasure === measure ? themeColors.cssVars.primary.base : themeColors.cssVars.primary.light}40`,
                }}
              >
                <span>{measure === 'all' ? 'All Offerings' : measure}</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: selectedMeasure === measure 
                      ? 'rgba(255, 255, 255, 0.25)' 
                      : `${themeColors.cssVars.primary.lighter}60`,
                    color: selectedMeasure === measure 
                      ? 'white' 
                      : themeColors.cssVars.primary.hover,
                  }}
                >
                  {getMeasureCount(measure)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Apple-style Offerings List */}
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
                <div className="absolute inset-0 bg-gradient-to-br from-amber-100/50 to-yellow-100/30 rounded-full" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em]">{t.loadingContent}</p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em] mt-2">Please wait while we fetch offerings...</p>
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
          ) : filteredPricingPlans.length === 0 ? (
            <div className="text-center py-24">
              <div className="relative w-20 h-20 mx-auto mb-10">
                <div className="absolute inset-0 bg-white/70 backdrop-blur-2xl rounded-full border border-gray-200" />
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-4xl">💎</span>
                </div>
              </div>
              <p className="text-gray-700 text-[20px] font-semibold antialiased tracking-[-0.01em] mb-2">{t.noOfferingsFound || 'No offerings found'}</p>
              <p className="text-gray-500 text-[16px] font-medium antialiased tracking-[-0.01em]">Try adjusting your search query</p>
            </div>
          ) : (
            filteredPricingPlans.map((plan: PricingPlan, index: number) => (
              <div key={plan.id} className="group relative"
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
                    onClick={() => setExpandedPricingPlan(expandedPricingPlan === plan.id ? null : plan.id)}
                    className="w-full text-left group/button"
                  >
                    <div className="flex items-start gap-4">
                      {/* Product Title and Price */}
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-900 font-semibold text-base leading-relaxed">
                          {plan.product_name || plan.package}
                        </span>
                        
                        {/* Price Display */}
                        <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-bold text-gray-900">
                            {plan.currency_symbol}{(plan.is_promotion && plan.promotion_price ? plan.promotion_price : plan.price) / 100}
                          </span>
                          {plan.is_promotion && plan.promotion_price && (
                            <span className="text-sm text-gray-400 line-through">
                              {plan.currency_symbol}{plan.price / 100}
                            </span>
                          )}
                          {plan.recurring_interval && plan.recurring_interval !== 'one_time' && (
                            <span className="text-sm text-gray-500 font-medium">/ {plan.recurring_interval}</span>
                          )}
                        </div>
                        
                        {/* Hover preview */}
                        {expandedPricingPlan !== plan.id && plan.description && (
                          <div className="text-gray-600 text-[15px] leading-relaxed mt-2 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-500 overflow-hidden">
                            {plan.description.substring(0, 150)}...
                          </div>
                        )}
                      </div>
                      
                      {/* Product Image or Icon */}
                      <div className="flex-shrink-0 w-16 h-16 neomorphic rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${themeColors.cssVars.primary.lighter}40, ${themeColors.cssVars.primary.lighter}20)`
                        }}
                      >
                        {plan.links_to_image ? (
                          <img src={plan.links_to_image} alt={plan.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">💎</span>
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {expandedPricingPlan === plan.id && (
                    <div className="mt-8 pt-8 border-t border-gray-200/40">
                      <div className="relative bg-white/50 rounded-2xl p-6">
                        {plan.description && (
                          <p className="text-gray-700 font-normal leading-relaxed text-[15px] mb-4">
                            {plan.description}
                          </p>
                        )}
                        
                        {/* Jump to Details Link */}
                        <button
                          onClick={() => router.push(`/products/${plan.product_slug || plan.product_id}`)}
                          className="mt-4 inline-flex items-center gap-2 font-medium text-sm transition-all duration-300 group/link"
                          style={{ color: themeColors.cssVars.primary.hover }}
                          onMouseEnter={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.active}
                          onMouseLeave={(e) => e.currentTarget.style.color = themeColors.cssVars.primary.hover}
                        >
                          <span>View details & purchase</span>
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

        {/* View All Offerings Button */}
        {!loading && !error && pricingPlans.length > 0 && (
          <div className="text-center pt-8">
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center gap-3 px-8 py-4 neomorphic text-sm font-light rounded-full text-gray-700 hover:text-gray-900 transition-all duration-300 group"
            >
              <span className="tracking-wide">View All Offerings</span>
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
