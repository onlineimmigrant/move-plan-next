// /src/components/PricingPlanFeatures.tsx
'use client';

import parse from 'html-react-parser';
import Link from 'next/link';
import { ChevronDownIcon, ChevronDoubleUpIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import RightArrowDynamic from '@/ui/RightArrowDynamic';
import { useProductTranslations } from './useProductTranslations';
import { useThemeColors } from '@/hooks/useThemeColors';

interface Feature {
  id: string;
  name: string;
  content: string;
  slug: string;
}

interface PricingPlan {
  id: number;
  slug?: string;
  package?: string;
  measure?: string;
  currency: string;
  currency_symbol: string;
  price: number;
  features?: Feature[];
}

interface PricingPlanFeaturesProps {
  selectedPlan: PricingPlan | null;
}

export default function PricingPlanFeatures({ selectedPlan }: PricingPlanFeaturesProps) {
  const [isScrollable, setIsScrollable] = useState(false);
  const [canBeScrollable, setCanBeScrollable] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useProductTranslations();
  const themeColors = useThemeColors();

  // Check if the content is scrollable or can be scrollable when collapsed
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        // Check if content overflows in the current state
        const isCurrentlyScrollable = scrollHeight > clientHeight;
        setIsScrollable(isCurrentlyScrollable);

        // Check if content would overflow when collapsed (max-h-[5.0rem])
        // 5.0rem is approximately 80px (assuming 1rem = 16px)
        const collapsedHeightPx = 80;
        const wouldBeScrollable = scrollHeight > collapsedHeightPx;
        setCanBeScrollable(wouldBeScrollable);

        console.log('Scroll height:', scrollHeight);
        console.log('Client height:', clientHeight);
        console.log('Is currently scrollable:', isCurrentlyScrollable);
        console.log('Can be scrollable (when collapsed):', wouldBeScrollable);
        console.log('Is expanded:', isExpanded);
      }
    };

    checkScrollable();

    // Recheck on window resize or content change
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [selectedPlan?.features, isExpanded]);

  // Toggle expand/collapse state
  const toggleExpand = () => {
    setIsExpanded((prev) => {
      console.log('Toggling isExpanded to:', !prev);
      return !prev;
    });
  };

  // Collapse the expanded area
  const collapseFeatures = () => {
    console.log('Collapsing features');
    setIsExpanded(false);
  };

  if (!selectedPlan) {
    return null;
  }

  if (!selectedPlan.features || selectedPlan.features.length === 0) {
    return (
      <div className="mt-4 sm:mt-6 px-4 sm:px-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t.featuresIncluded}</h2>
        <p className="text-sm text-gray-600">{t.noFeaturesListed}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 sm:mt-6 px-4 sm:px-8">
      <h2 className="text-lg font-bold text-gray-900 mb-3 sm:mb-4">{t.featuresIncluded}</h2>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className={`${
            isExpanded ? 'max-h-none' : 'max-h-[5.0rem] overflow-y-auto'
          } scrollbar-thin scrollbar-thumb-${themeColors.primary.bg} scrollbar-track-gray-100 pr-2 pb-6 transition-all duration-300 ease-in-out`}
          style={{ scrollbarWidth: 'thin' }}
        >
          <ul className="space-y-3 sm:space-y-4">
            {selectedPlan.features.map((feature) => (
              <li
                key={feature.id}
                className="flex items-start gap-3 pb-3 sm:pb-4 last:pb-0"
              >
                <svg className={`w-5 h-5 text-${themeColors.primary.bg} flex-shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    <Link
                      href={`/features/${feature.slug}`}
                      className={`flex items-center transition-all duration-300 group text-${themeColors.primary.text} hover:text-${themeColors.primary.textHover} no-underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-${themeColors.primary.ring}`}
                    >
                      {feature.name}
                      <RightArrowDynamic />
                    </Link>
                  </h3>
                  <div className="text-sm text-gray-600 font-light line-clamp-2">
                    {parse(feature.content || '')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {canBeScrollable && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center w-full">
            {isExpanded ? (
              <button
                onClick={collapseFeatures}
                className={`p-2 rounded-lg bg-white border border-${themeColors.primary.border} hover:bg-${themeColors.primary.bgLighter} hover:border-${themeColors.primary.bgLight} shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-${themeColors.primary.ring} transition-all duration-200`}
                aria-label={t.collapseFeaturesAriaLabel}
              >
                <ChevronDoubleUpIcon className={`h-6 w-6 text-${themeColors.primary.text}`} aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={toggleExpand}
                className={`p-2 rounded-lg bg-white border border-${themeColors.primary.border} hover:bg-${themeColors.primary.bgLighter} hover:border-${themeColors.primary.bgLight} shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-${themeColors.primary.ring} transition-all duration-200`}
                aria-label={t.expandFeaturesAriaLabel}
              >
                <ChevronDownIcon className={`h-6 w-6 text-${themeColors.primary.text}`} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}