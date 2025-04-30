// /src/components/PricingPlanFeatures.tsx
'use client';

import parse from 'html-react-parser';
import Link from 'next/link';
import { ChevronDownIcon, ChevronDoubleUpIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';

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
      <div className="mt-6 px-4 sm:px-8">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Features Included</h2>
        <p className="text-sm text-gray-600">No features listed for this plan.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 px-4 sm:px-8">
      <h2 className="text-base font-semibold text-gray-700 mb-4">Features Included</h2>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className={`${
            isExpanded ? 'max-h-none' : 'max-h-[5.0rem] overflow-y-auto'
          } scrollbar-thin scrollbar-thumb-sky-500 scrollbar-track-gray-100 pr-2 pb-6 transition-all duration-300 ease-in-out`}
          style={{ scrollbarWidth: 'thin' }}
        >
          <ul className="space-y-4">
            {selectedPlan.features.map((feature) => (
              <li
                key={feature.id}
                className="flex items-start gap-3 border-b border-gray-100 pb-4 last:border-b-0"
              >
                <span className="text-sky-500">•</span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    <Link
                      href={`/features/${feature.slug}`}
                      className="text-sky-600 hover:underline focus:outline-none focus:ring-2 focus:ring-sky-300"
                    >
                      {feature.name}
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
                className="p-1 rounded-full bg-sky-50 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-colors duration-200"
                aria-label="Collapse features list"
              >
                <ChevronDoubleUpIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={toggleExpand}
                className="p-1 rounded-full bg-sky-50 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-colors duration-200"
                aria-label="Expand features list"
              >
                <ChevronDownIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}