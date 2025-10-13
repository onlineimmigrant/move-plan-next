'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { SliderNavigation } from '@/ui/SliderNavigation';

export interface PricingPlan {
  id: string;
  created_at: string;
  product_id: string;
  product_name?: string;
  package?: string;
  measure?: string;
  price: number;
  currency: string;
  currency_symbol: string;
  is_promotion?: boolean;
  promotion_price?: number;
  promotion_percent?: number;
  recurring_interval?: string;
  recurring_interval_count?: number;
  description?: string;
  links_to_image?: string;
  slug?: string;
  product_slug?: string;
  type?: string;
  is_active: boolean;
  is_help_center?: boolean;
  organization_id: string;
}

interface PricingPlansSliderProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
  className?: string;
}

export default function PricingPlansSlider({
  plans,
  title = 'Hot Offerings',
  description = 'Special pricing plans just for you',
  className = '',
}: PricingPlansSliderProps) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update items per view based on screen size
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 768) {
        setItemsPerView(1); // Mobile: 1 card
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2); // Tablet: 2 cards
      } else if (window.innerWidth < 1536) {
        setItemsPerView(3); // Desktop: 3 cards
      } else {
        setItemsPerView(4); // Large desktop: 4 cards (max)
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, []);

  // Handle scroll events on mobile for updating currentSlide indicator
  useEffect(() => {
    if (itemsPerView !== 1 || !scrollContainerRef.current || !plans.length) return;

    const container = scrollContainerRef.current;
    
    const handleScroll = () => {
      if (container) {
        const cardWidth = container.scrollWidth / plans.length;
        const scrollPosition = container.scrollLeft + (cardWidth / 2);
        const newIndex = Math.floor(scrollPosition / cardWidth);
        setCurrentSlide(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [itemsPerView, plans.length]);

  if (!plans || plans.length === 0) {
    return null;
  }

  return (
    <div className={`pb-48 sm:pb-56 lg:pb-64 ${className}`}>
      <div className="pt-8 sm:pt-12 border-t border-gray-100 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-[-0.02em] antialiased">
            {title}
          </h2>
          <p className="text-base sm:text-lg text-gray-500 font-light">
            {description}
          </p>
        </div>

        {/* Slider Container with Navigation */}
        <div className="relative">
          {/* Scrollable Cards Container */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto overflow-y-visible scrollbar-hide snap-x snap-mandatory sm:overflow-hidden"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {/* Mobile: Add padding for perfect centering, Desktop: Standard padding */}
            <div className={itemsPerView === 1 ? "px-[7.5vw]" : "sm:px-12 md:px-16 lg:px-20"}>
              {/* Cards Container - Touch scroll on mobile, transform on desktop */}
              <div
                className={`flex gap-4 sm:gap-6 sm:transition-transform sm:duration-500 sm:ease-in-out ${
                  // Center cards on desktop when less than itemsPerView
                  itemsPerView > 1 && plans.length < itemsPerView ? 'justify-center' : ''
                }`}
                style={{
                  transform:
                    itemsPerView === 1 ? 'none' : `translateX(-${currentSlide * (100 / itemsPerView)}%)`,
                }}
              >
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    onClick={() => router.push(`/products/${plan.product_slug || plan.product_id}`)}
                    className="group cursor-pointer flex-shrink-0 snap-center"
                    style={{
                      width:
                        itemsPerView === 1
                          ? '85vw' // Mobile: 85% viewport width (perfectly centered with padding)
                          : itemsPerView === 2
                          ? 'calc(50% - 12px)'
                          : itemsPerView === 3
                          ? 'calc(33.333% - 16px)'
                          : 'calc(25% - 18px)', // 4 cards
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Product Card */}
                    <div className="bg-white rounded-xl border border-gray-200 hover:border-sky-400 transition-all duration-300 overflow-hidden flex flex-col h-full min-h-[420px]">
                      {/* Product Image - Centered and fully visible */}
                      {plan.links_to_image && plan.links_to_image.trim() !== '' ? (
                        <div className="w-full h-52 sm:h-56 lg:h-60 flex-shrink-0 bg-gray-50 flex items-center justify-center overflow-hidden">
                          <img
                            src={plan.links_to_image}
                            alt={plan.product_name || plan.package || 'Product'}
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-52 sm:h-56 lg:h-60 flex-shrink-0 bg-gradient-to-br from-amber-50 to-yellow-50 flex items-center justify-center">
                          <span className="text-6xl">💎</span>
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="p-4 sm:p-6 flex flex-col flex-grow">
                        {/* Product Name */}
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-sky-400 transition-colors duration-200 min-h-[3rem]">
                          {plan.product_name || plan.package}
                        </h3>

                        {/* Package/Type, Measure Badges */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {plan.package && (
                            <span className="inline-block px-3 py-1 bg-sky-50 text-sky-600 text-xs font-medium rounded-full tracking-wide uppercase border border-sky-100">
                              {plan.package}
                            </span>
                          )}
                          {plan.measure && (
                            <span className="inline-block px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-full tracking-wide uppercase border border-amber-100">
                              {plan.measure}
                            </span>
                          )}
                        </div>

                        {/* Description */}
                        {plan.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
                            {plan.description}
                          </p>
                        )}

                        {/* Pricing Section */}
                        <div className="mt-auto">
                          <div className="flex items-baseline gap-2 mb-3">
                            <div className="flex items-baseline gap-2">
                              {plan.is_promotion && plan.promotion_price ? (
                                <>
                                  <span className="text-xl sm:text-2xl font-bold text-sky-600">
                                    {plan.currency_symbol}
                                    {(plan.promotion_price / 100).toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-400 line-through">
                                    {plan.currency_symbol}
                                    {(plan.price / 100).toFixed(2)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-xl sm:text-2xl font-bold text-gray-700">
                                  {plan.currency_symbol}
                                  {(plan.price / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                            {plan.type !== 'one_time' &&
                              plan.recurring_interval &&
                              plan.recurring_interval !== 'one_time' && (
                                <span className="text-sm text-gray-500 font-medium">
                                  / {plan.recurring_interval}
                                </span>
                              )}
                          </div>

                          {/* Promotion Badge */}
                          {plan.is_promotion && plan.promotion_percent && (
                            <div className="mb-3">
                              <div className="relative inline-block">
                                <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-sm animate-pulse"></div>
                                <span className="relative block px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-red-500 via-red-600 to-pink-600 rounded-full shadow-xl border-2 border-white/30 backdrop-blur-sm">
                                  <span className="flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    -{plan.promotion_percent}% OFF
                                  </span>
                                </span>
                              </div>
                            </div>
                          )}

                          {/* View Details Arrow */}
                          <div className="flex justify-end">
                            <span className="text-sky-400 transition-all duration-300 group-hover:translate-x-1">
                              <ArrowRightIcon className="h-5 w-5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Unified Slider Navigation */}
          <SliderNavigation
            onPrevious={() => {
              const newIndex = Math.max(0, currentSlide - 1);
              setCurrentSlide(newIndex);
              // On mobile, scroll to the card
              if (itemsPerView === 1 && scrollContainerRef.current) {
                const cardWidth = scrollContainerRef.current.scrollWidth / plans.length;
                scrollContainerRef.current.scrollTo({
                  left: cardWidth * newIndex,
                  behavior: 'smooth',
                });
              }
            }}
            onNext={() => {
              const newIndex = Math.min(
                itemsPerView === 1 ? plans.length - 1 : plans.length - itemsPerView,
                currentSlide + 1
              );
              setCurrentSlide(newIndex);
              // On mobile, scroll to the card
              if (itemsPerView === 1 && scrollContainerRef.current) {
                const cardWidth = scrollContainerRef.current.scrollWidth / plans.length;
                scrollContainerRef.current.scrollTo({
                  left: cardWidth * newIndex,
                  behavior: 'smooth',
                });
              }
            }}
            currentIndex={currentSlide}
            totalItems={Math.max(0, plans.length - (itemsPerView === 1 ? 1 : itemsPerView) + 1)}
            onDotClick={(index) => {
              setCurrentSlide(index);
              // On mobile, scroll to the card
              if (itemsPerView === 1 && scrollContainerRef.current) {
                const cardWidth = scrollContainerRef.current.scrollWidth / plans.length;
                scrollContainerRef.current.scrollTo({
                  left: cardWidth * index,
                  behavior: 'smooth',
                });
              }
            }}
            showDots={true}
            buttonPosition="bottom-right"
            buttonVariant="minimal"
            dotVariant="default"
          />
        </div>
      </div>
    </div>
  );
}
