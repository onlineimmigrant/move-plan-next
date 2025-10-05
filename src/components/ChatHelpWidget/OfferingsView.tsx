// components/ChatHelpWidget/OfferingsView.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { WidgetSize } from '../ChatWidget/types';
import { usePricingPlans, type PricingPlan } from './hooks/usePricingPlans';
import { useHelpCenterTranslations } from './useHelpCenterTranslations';

interface OfferingsViewProps {
  size: WidgetSize;
  onBack: () => void;
}

export default function OfferingsView({ size, onBack }: OfferingsViewProps) {
  const router = useRouter();
  const [expandedPricingPlan, setExpandedPricingPlan] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { pricingPlans, loading, error } = usePricingPlans();
  const { t } = useHelpCenterTranslations();

  const filteredPricingPlans = pricingPlans.filter((plan: PricingPlan) =>
    plan.product_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.package?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`h-full overflow-y-auto ${size === 'fullscreen' ? 'max-w-5xl mx-auto' : ''} relative`}>
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white/10 to-yellow-50/20 pointer-events-none" />
      
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
            onClick={() => router.push('/help-center?tab=features')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-sky-50 hover:to-sky-100/50 border border-gray-200/50 hover:border-sky-300/50 rounded-2xl transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <span className="text-lg font-semibold text-gray-700 group-hover:text-sky-600 transition-colors duration-300">{t.features}</span>
            <svg className="w-4 h-4 text-gray-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 border border-amber-600 rounded-2xl shadow-md cursor-default"
          >
            <span className="text-lg font-semibold text-white">{t.offerings || 'Offerings'}</span>
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
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/20 via-white/30 to-yellow-50/20 rounded-3xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-150 ease-out" />
            
            {/* Search icon with enhanced styling */}
            <div className="absolute inset-y-0 left-0 pl-7 flex items-center pointer-events-none z-10">
              <div className="relative">
                <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-amber-500 transition-all duration-150 ease-out group-focus-within:scale-110" />
                <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md opacity-0 group-focus-within:opacity-100 transition-opacity duration-150 ease-out" />
              </div>
            </div>
            
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchOfferings || 'Search offerings...'}
              className="relative z-10 block w-full pl-20 pr-8 py-6 bg-transparent text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-all duration-150 ease-out text-[17px] font-medium antialiased tracking-[-0.01em] rounded-3xl selection:bg-amber-200/50"
            />
          </div>
        </div>

        {/* Apple-style Offerings List */}
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
                {/* Multiple glass layers for depth */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl border border-gray-200/40 rounded-3xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white/80 group-hover:border-amber-200/60 group-hover:scale-[1.02]"
                  style={{
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white/20 to-yellow-50/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                {/* Subtle border glow on hover */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                  style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 179, 8, 0.1))',
                    filter: 'blur(1px)',
                  }}
                />
                
                <div className="relative p-6 sm:p-8">
                  <button
                    onClick={() => setExpandedPricingPlan(expandedPricingPlan === plan.id ? null : plan.id)}
                    className="w-full text-left flex items-start justify-between group/button"
                  >
                    <div className="flex items-start gap-4 flex-1 pr-4 sm:pr-8">
                      {/* Product Image or Icon */}
                      <div className="flex-shrink-0 w-16 h-16 neomorphic rounded-2xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50">
                        {plan.links_to_image ? (
                          <img src={plan.links_to_image} alt={plan.product_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl">💎</span>
                        )}
                      </div>
                      
                      {/* Product Title and Price */}
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-900 font-semibold text-base sm:text-[19px] leading-relaxed antialiased tracking-[-0.02em] group-hover/button:text-gray-800 transition-colors duration-500 block">
                          {plan.product_name || plan.package}
                        </span>
                        {plan.measure && (
                          <span className="inline-block mt-2 px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full tracking-wide uppercase border border-amber-100">
                            {plan.measure}
                          </span>
                        )}
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
                      </div>
                    </div>
                    
                    <div className="relative flex-shrink-0 mt-1">
                      {/* Button glass container */}
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl rounded-full border border-gray-200/40 group-hover/button:border-amber-300/60 transition-all duration-500"
                        style={{
                          backdropFilter: 'blur(16px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                        }}
                      />
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/button:scale-110 group-hover/button:rotate-180">
                        <ChevronDownIcon 
                          className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-hover/button:text-amber-600 transition-all duration-500 group-hover/button:scale-110 ${
                            expandedPricingPlan === plan.id ? 'rotate-180 text-amber-600' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </button>
                  
                  {expandedPricingPlan === plan.id && (
                    <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200/40 animate-in slide-in-from-top-6 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                      {/* Feature content with glass background */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-50/30 backdrop-blur-sm rounded-2xl border border-amber-200/30 -m-4 sm:-m-6 p-4 sm:p-6"
                          style={{
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)',
                          }}
                        />
                        <div className="relative p-4 sm:p-6">
                          {plan.description && (
                            <p className="text-gray-700 font-normal leading-relaxed text-sm sm:text-[16px] antialiased tracking-[-0.01em] mb-4">
                              {plan.description}
                            </p>
                          )}
                          
                          {/* Jump to Details Link with Arrow */}
                          <button
                            onClick={() => router.push(`/products/${plan.product_slug || plan.product_id}`)}
                            className="mt-4 inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm transition-all duration-300 group/link"
                          >
                            <span>View details & purchase</span>
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
