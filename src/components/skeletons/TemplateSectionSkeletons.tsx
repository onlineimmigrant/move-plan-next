'use client';

import React from 'react';

// Premium shimmer animation with enhanced gradient
const shimmer = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:will-change-transform before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/80 before:via-blue-50/30 before:to-transparent";

// Reusable skeleton primitives
const SkeletonBox = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gradient-to-br from-gray-100 to-gray-200 rounded ${shimmer} ${className}`} />
);

const SkeletonCircle = ({ size = "12" }: { size?: string }) => (
  <div className={`w-${size} h-${size} bg-gradient-to-br from-gray-100 to-gray-200 rounded-full ${shimmer}`} />
);

const SkeletonLine = ({ width = "full", height = "4" }: { width?: string; height?: string }) => (
  <div className={`h-${height} w-${width} bg-gradient-to-r from-gray-100 to-gray-200 rounded ${shimmer}`} />
);

// Section type definition
type SectionType = 'general' | 'brand' | 'article_slider' | 'contact' | 'faq' | 'reviews' | 'help_center' | 'real_estate' | 'pricing_plans';

interface TemplateSectionSkeletonProps {
  sectionType?: SectionType;
  count?: number;
}

// 1. General Section Skeleton (Default)
export const GeneralSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading section...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-4">
        <SkeletonBox className="h-10 sm:h-12 w-64 max-w-full" />
      </div>
      
      {/* Description */}
      <div className="mb-12">
        <SkeletonBox className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBox className="h-4 w-3/4 max-w-xl" />
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            {/* Image */}
            <SkeletonBox className="w-full h-48 rounded-md" />
            {/* Title */}
            <SkeletonBox className="h-6 w-3/4" />
            {/* Description */}
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 2. Reviews Section Skeleton
export const ReviewsSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading reviews...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center mb-12">
        <SkeletonBox className="h-10 w-48 mx-auto mb-4" />
        <SkeletonBox className="h-4 w-96 max-w-full mx-auto" />
      </div>
      
      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            {/* Avatar & Name */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <SkeletonBox className="h-5 w-32 mb-2" />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <div key={star} className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
            {/* Review text */}
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 3. FAQ Section Skeleton
export const FAQSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading FAQs...">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center mb-12">
        <SkeletonBox className="h-10 w-64 mx-auto mb-4" />
        <SkeletonBox className="h-4 w-96 max-w-full mx-auto" />
      </div>
      
      {/* FAQ Items */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <SkeletonBox className="h-6 w-3/4" />
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 4. Contact Form Section Skeleton
export const ContactSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading contact form...">
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center mb-12">
        <SkeletonBox className="h-10 w-64 mx-auto mb-4" />
        <SkeletonBox className="h-4 w-80 max-w-full mx-auto" />
      </div>
      
      {/* Form Fields */}
      <div className="space-y-6">
        {/* Name field */}
        <div>
          <SkeletonBox className="h-4 w-20 mb-2" />
          <SkeletonBox className="h-12 w-full rounded-lg" />
        </div>
        
        {/* Email field */}
        <div>
          <SkeletonBox className="h-4 w-24 mb-2" />
          <SkeletonBox className="h-12 w-full rounded-lg" />
        </div>
        
        {/* Message field */}
        <div>
          <SkeletonBox className="h-4 w-28 mb-2" />
          <SkeletonBox className="h-32 w-full rounded-lg" />
        </div>
        
        {/* Submit button */}
        <SkeletonBox className="h-12 w-full rounded-lg" />
      </div>
    </div>
  </section>
);

// 5. Brand Logos Section Skeleton
export const BrandsSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading brands...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Optional Title */}
      <div className="text-center mb-12">
        <SkeletonBox className="h-8 w-48 mx-auto" />
      </div>
      
      {/* Logo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-center">
            <SkeletonBox className="h-16 w-32 rounded" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 6. Blog Posts Slider Section Skeleton
export const BlogPostsSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading blog posts...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-12">
        <SkeletonBox className="h-10 w-64 mb-4" />
        <SkeletonBox className="h-4 w-96 max-w-full" />
      </div>
      
      {/* Blog Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Featured Image */}
            <SkeletonBox className="w-full h-48" />
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Date */}
              <SkeletonBox className="h-3 w-24" />
              
              {/* Title */}
              <SkeletonBox className="h-6 w-full" />
              
              {/* Excerpt */}
              <div className="space-y-2">
                <SkeletonBox className="h-4 w-full" />
                <SkeletonBox className="h-4 w-4/5" />
              </div>
              
              {/* Read more link */}
              <SkeletonBox className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 7. Pricing Plans Section Skeleton
export const PricingPlansSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading pricing plans...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center mb-12">
        <SkeletonBox className="h-10 w-64 mx-auto mb-4" />
        <SkeletonBox className="h-4 w-96 max-w-full mx-auto" />
      </div>
      
      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`bg-white border-2 rounded-lg p-8 space-y-6 ${i === 2 ? 'border-blue-500' : 'border-gray-200'}`}>
            {/* Plan name */}
            <div className="text-center">
              <SkeletonBox className="h-6 w-32 mx-auto mb-2" />
              {i === 2 && <SkeletonBox className="h-5 w-24 mx-auto" />}
            </div>
            
            {/* Price */}
            <div className="text-center">
              <SkeletonBox className="h-12 w-40 mx-auto mb-2" />
              <SkeletonBox className="h-4 w-24 mx-auto" />
            </div>
            
            {/* Features */}
            <div className="space-y-3 pt-6">
              {[1, 2, 3, 4, 5].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 bg-gray-200 rounded-full animate-pulse flex-shrink-0" />
                  <SkeletonBox className="h-4 flex-1" />
                </div>
              ))}
            </div>
            
            {/* CTA Button */}
            <SkeletonBox className="h-12 w-full rounded-lg mt-6" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 8. Help Center Section Skeleton
export const HelpCenterSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading help center...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="text-center mb-12">
        <SkeletonBox className="h-10 w-56 mx-auto mb-4" />
        <SkeletonBox className="h-4 w-80 max-w-full mx-auto" />
      </div>
      
      {/* Help Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
            
            {/* Title */}
            <SkeletonBox className="h-6 w-3/4" />
            
            {/* Description */}
            <div className="space-y-2">
              <SkeletonBox className="h-4 w-full" />
              <SkeletonBox className="h-4 w-5/6" />
            </div>
            
            {/* Link */}
            <SkeletonBox className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

// 9. Real Estate Section Skeleton
export const RealEstateSectionSkeleton = () => (
  <section className="py-12 sm:py-16" role="status" aria-label="Loading properties...">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <div className="mb-12">
        <SkeletonBox className="h-10 w-64 mb-4" />
        <SkeletonBox className="h-4 w-96 max-w-full" />
      </div>
      
      {/* Property Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {/* Property Image */}
            <SkeletonBox className="w-full h-56" />
            
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Price */}
              <SkeletonBox className="h-8 w-32" />
              
              {/* Location */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <SkeletonBox className="h-4 w-48" />
              </div>
              
              {/* Features */}
              <div className="flex gap-4 pt-2">
                <SkeletonBox className="h-4 w-20" />
                <SkeletonBox className="h-4 w-20" />
                <SkeletonBox className="h-4 w-20" />
              </div>
              
              {/* Details */}
              <div className="space-y-2 pt-2">
                <SkeletonBox className="h-3 w-full" />
                <SkeletonBox className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Main Component - Selects appropriate skeleton based on type
export const TemplateSectionSkeleton: React.FC<TemplateSectionSkeletonProps> = ({ 
  sectionType = 'general',
  count = 1
}) => {
  const getSkeletonComponent = () => {
    switch (sectionType) {
      case 'reviews':
        return ReviewsSectionSkeleton;
      case 'faq':
        return FAQSectionSkeleton;
      case 'contact':
        return ContactSectionSkeleton;
      case 'brand':
        return BrandsSectionSkeleton;
      case 'article_slider':
        return BlogPostsSectionSkeleton;
      case 'pricing_plans':
        return PricingPlansSectionSkeleton;
      case 'help_center':
        return HelpCenterSectionSkeleton;
      case 'real_estate':
        return RealEstateSectionSkeleton;
      case 'general':
      default:
        return GeneralSectionSkeleton;
    }
  };

  const SkeletonComponent = getSkeletonComponent();

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </>
  );
};

// Export individual skeletons for direct use
export default TemplateSectionSkeleton;
