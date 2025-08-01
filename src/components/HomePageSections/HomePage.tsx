"use client";

import React, { Suspense, memo } from 'react';
import dynamic from 'next/dynamic';
import { HomePageData } from '@/types/home_page_data';

// Optimized lazy loading with loading components
const Hero = dynamic(() => import('@/components/HomePageSections/Hero'), { 
  ssr: true,
  loading: () => <HeroSkeleton />
});

const Brands = dynamic(() => import('@/components/HomePageSections/Brands'), { 
  ssr: false,
  loading: () => <BrandsSkeleton />
});

const FAQSection = dynamic(() => import('@/components/HomePageSections/FAQSection'), { 
  ssr: false,
  loading: () => <FAQSkeleton />
});

// Skeleton components for better UX
const HeroSkeleton = () => (
  <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 animate-pulse">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 bg-gray-200 rounded-lg w-96 mx-auto"></div>
        <div className="h-6 bg-gray-200 rounded w-64 mx-auto"></div>
        <div className="h-10 bg-blue-200 rounded-lg w-32 mx-auto mt-8"></div>
      </div>
    </div>
  </div>
);

const BrandsSkeleton = () => (
  <div className="py-16 bg-gray-50 animate-pulse">
    <div className="max-w-7xl mx-auto px-4">
      <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-12"></div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  </div>
);

const FAQSkeleton = () => (
  <div className="py-16 animate-pulse">
    <div className="max-w-5xl mx-auto px-4">
      <div className="h-10 bg-gray-200 rounded w-80 mx-auto mb-12"></div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b border-gray-200 pb-4">
            <div className="h-6 bg-gray-200 rounded w-full mb-2"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('HomePage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

interface HomePageProps {
  data: HomePageData;
}

// Memoized component for better performance
const HomePage: React.FC<HomePageProps> = memo(({ data }) => {
  // Early validation
  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Data Loading Error</h2>
          <p className="text-gray-600">Unable to load page content. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  if (!data.hero) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Hero Content Missing</h2>
          <p className="text-gray-600">Essential page content is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section - Critical, render immediately */}
      <ErrorBoundary 
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p className="text-gray-500">Failed to load hero section</p>
          </div>
        }
      >
        <Hero hero={data.hero} />
      </ErrorBoundary>

      {/* Brands Section - Less critical, can be lazy loaded */}
      {(data.brands?.length ?? 0) > 0 && (
        <ErrorBoundary 
          fallback={
            <div className="py-8 text-center text-gray-500">
              Failed to load brands section
            </div>
          }
        >
          <section className="py-16 bg-gray-50">
            <Suspense fallback={<BrandsSkeleton />}>
              <Brands 
                brands={data.brands || []} 
                textContent={{ brands_heading: data.brands_heading || 'Our Trusted Partners' }} 
              />
            </Suspense>
          </section>
        </ErrorBoundary>
      )}

      {/* FAQ Section - Least critical, lazy load */}
      {(data.faqs?.length ?? 0) > 0 && (
        <ErrorBoundary 
          fallback={
            <div className="py-8 text-center text-gray-500">
              Failed to load FAQ section
            </div>
          }
        >
          <section className="py-16">
            <div className="mx-auto max-w-5xl px-4">
              <Suspense fallback={<FAQSkeleton />}>
                <FAQSection faqs={data.faqs || []} />
              </Suspense>
            </div>
          </section>
        </ErrorBoundary>
      )}
    </main>
  );
});

HomePage.displayName = 'HomePage';

export default HomePage;