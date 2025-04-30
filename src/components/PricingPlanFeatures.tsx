// /src/components/PricingPlanFeatures.tsx
'use client';

import parse from 'html-react-parser';
import Link from 'next/link';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if the content is scrollable
  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        setIsScrollable(scrollHeight > clientHeight);
      }
    };

    checkScrollable();

    // Recheck on window resize or content change
    window.addEventListener('resize', checkScrollable);
    return () => window.removeEventListener('resize', checkScrollable);
  }, [selectedPlan?.features]);

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
          className="max-h-[5.0rem] overflow-y-auto scrollbar-thin scrollbar-thumb-sky-500 scrollbar-track-gray-100 pr-2"
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
        {isScrollable && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center w-full">
            <ChevronDownIcon
              className="h-5 w-5 text-sky-500 animate-bounce"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    </div>
  );
}