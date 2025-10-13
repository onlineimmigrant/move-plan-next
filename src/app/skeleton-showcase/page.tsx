'use client';

import React, { useState } from 'react';
import { 
  TemplateSectionSkeleton,
  GeneralSectionSkeleton,
  ReviewsSectionSkeleton,
  FAQSectionSkeleton,
  ContactSectionSkeleton,
  BrandsSectionSkeleton,
  BlogPostsSectionSkeleton,
  PricingPlansSectionSkeleton,
  HelpCenterSectionSkeleton,
  RealEstateSectionSkeleton
} from '@/components/skeletons/TemplateSectionSkeletons';

type SectionType = 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';

/**
 * Skeleton Showcase Component
 * 
 * This is a development/testing component to preview all skeleton types.
 * To use: Navigate to /skeleton-showcase in your browser
 * 
 * Features:
 * - Preview all 9 skeleton types
 * - Switch between types with buttons
 * - Test count prop (show multiple skeletons)
 * - Compare side-by-side
 */
const SkeletonShowcase = () => {
  const [selectedType, setSelectedType] = useState<SectionType>('general');
  const [count, setCount] = useState(1);
  const [showAll, setShowAll] = useState(false);

  const skeletonTypes: { value: SectionType; label: string; description: string }[] = [
    { value: 'general', label: 'General', description: 'Standard metrics grid' },
    { value: 'reviews', label: 'Reviews', description: 'Customer testimonials' },
    { value: 'faq', label: 'FAQ', description: 'Question accordion' },
    { value: 'contact', label: 'Contact', description: 'Contact form' },
    { value: 'brand', label: 'Brands', description: 'Logo grid' },
    { value: 'article_slider', label: 'Blog Posts', description: 'Article cards' },
    { value: 'pricing_plans', label: 'Pricing', description: 'Pricing tiers' },
    { value: 'help_center', label: 'Help Center', description: 'Help topics' },
    { value: 'real_estate', label: 'Real Estate', description: 'Property listings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Template Section Skeletons
          </h1>
          <p className="text-lg text-gray-600">
            Preview all skeleton loading states for template sections
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="space-y-6">
            {/* Show All Toggle */}
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showAll}
                  onChange={(e) => setShowAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  Show all skeleton types at once
                </span>
              </label>
            </div>

            {!showAll && (
              <>
                {/* Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Skeleton Type
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {skeletonTypes.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setSelectedType(type.value)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedType === type.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Count Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Number of Skeletons: {count}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                    <span>5</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {showAll ? 'All Skeleton Types' : `Preview: ${selectedType}`}
            </h2>
            <div className="text-sm text-gray-500">
              Loading state visualization
            </div>
          </div>

          {/* Skeleton Display */}
          <div className="bg-gray-50 rounded-lg">
            {showAll ? (
              <div className="space-y-8">
                {skeletonTypes.map((type) => (
                  <div key={type.value}>
                    <div className="px-6 py-3 bg-white border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">{type.label}</h3>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                    <TemplateSectionSkeleton sectionType={type.value} count={1} />
                  </div>
                ))}
              </div>
            ) : (
              <TemplateSectionSkeleton sectionType={selectedType} count={count} />
            )}
          </div>
        </div>

        {/* Code Example */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-4">Usage Code</h3>
          <pre className="text-sm overflow-x-auto">
            <code>
{`import { TemplateSectionSkeleton } from '@/components/skeletons/TemplateSectionSkeletons';

// Show ${showAll ? 'all types' : selectedType} skeleton${count > 1 ? 's' : ''}
<TemplateSectionSkeleton 
  sectionType="${selectedType}" 
  count={${count}}
/>`}
            </code>
          </pre>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-blue-800 font-semibold mb-2">✨ Smooth Animations</div>
            <div className="text-sm text-blue-700">
              CSS-only shimmer effect running at 60 FPS for optimal performance
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-green-800 font-semibold mb-2">♿ Accessible</div>
            <div className="text-sm text-green-700">
              Includes proper ARIA labels and screen reader support
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="text-purple-800 font-semibold mb-2">📱 Responsive</div>
            <div className="text-sm text-purple-700">
              Adapts to all screen sizes from mobile to desktop
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonShowcase;
