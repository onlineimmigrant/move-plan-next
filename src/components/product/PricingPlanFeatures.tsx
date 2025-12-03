// /src/components/PricingPlanFeatures.tsx
'use client';

import parse from 'html-react-parser';
import Link from 'next/link';
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

  // Check if the content is scrollable or can be scrollable when collapsed
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        // Check if content overflows when collapsed (max-h-[12rem] = 192px)
        const collapsedHeightPx = 192;
        const wouldBeScrollable = scrollHeight > collapsedHeightPx;
        setCanBeScrollable(wouldBeScrollable);
      }
    };

    checkScrollable();
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [selectedPlan?.features, isExpanded]);

  // Toggle expand/collapse state
  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // Collapse the expanded area
  const collapseFeatures = () => {
    setIsExpanded(false);
  };

  if (!selectedPlan) {
    return null;
  }

  if (!selectedPlan.features || selectedPlan.features.length === 0) {
    return (
      <div className="mt-3 px-4 sm:px-0">
        <h2 className="text-base font-semibold text-gray-800 mb-3">{t.featuresIncluded}</h2>
        <p className="text-sm text-gray-500">{t.noFeaturesListed}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 px-4 sm:px-0">
      <h2 className="text-base font-semibold text-gray-800 mb-3">{t.featuresIncluded}</h2>
      <div className="relative bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl md:rounded-2xl p-4 md:p-5">
        <div
          ref={scrollContainerRef}
          className={`${
            isExpanded ? 'max-h-none' : 'max-h-[12rem]'
          } overflow-hidden transition-all duration-300 ease-in-out`}
        >
          <ul className="space-y-3">
            {selectedPlan.features.map((feature) => (
              <li
                key={feature.id}
                className="flex items-start gap-3 last:pb-0"
              >
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/features/${feature.slug}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline no-underline focus:outline-none inline-flex items-center gap-1 group transition-colors duration-200"
                  >
                    {feature.name}
                    <RightArrowDynamic />
                  </Link>
                  <div className={`text-sm text-gray-600 mt-0.5 ${isExpanded ? '' : 'line-clamp-2'}`}>
                    {parse(feature.content || '')}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        {canBeScrollable && (
          <div className="mt-3 pt-3 border-t border-gray-200/60 flex justify-center">
            <button
              onClick={isExpanded ? collapseFeatures : toggleExpand}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 focus:outline-none transition-colors duration-200"
              aria-label={isExpanded ? t.collapseFeaturesAriaLabel : t.expandFeaturesAriaLabel}
            >
              {isExpanded ? '← Show less' : 'Show more →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}