"use client";

import React, { Suspense, memo, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { HomePageData } from '@/types/home_page_data';
import PricingModal from '@/components/pricing/PricingModal';
import { useSettings } from '@/context/SettingsContext';

// Optimized lazy loading with loading components
const Hero = dynamic(() => import('@/components/HomePageSections/Hero'), { 
  ssr: true,
  loading: () => <HeroSkeleton />
});

// Removed: BlogPostSlider, Brands, FAQSection - now universal via template sections

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

// Removed skeleton components - no longer needed since sections moved to template sections

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

interface PricingComparison {
  id: number;
  created_at: string;
  name: string;
  description: string;
  name_translation: Record<string, string>;
  description_translation: Record<string, string>;
  organization_id: number;
}

interface HomePageProps {
  data: HomePageData;
}

// Memoized component for better performance
const HomePageComponent: React.FC<HomePageProps> = ({ data }) => {
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingComparison, setPricingComparison] = useState<PricingComparison | null>(null);
  const [isLoadingPricing, setIsLoadingPricing] = useState(false);
  const { settings } = useSettings();

  // Fetch pricing comparison data with organization_id
  useEffect(() => {
    const fetchPricingData = async () => {
      if (!settings?.organization_id) return;
      
      setIsLoadingPricing(true);
      try {
        const url = `/api/pricing-comparison?organizationId=${encodeURIComponent(settings.organization_id)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setPricingComparison(data);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.log('Error fetching pricing comparison:', errorData);
          // Set null on error to indicate no data available
          setPricingComparison(null);
        }
      } catch (error) {
        console.log('Network error fetching pricing comparison:', error);
        // Set null on error to indicate no data available
        setPricingComparison(null);
      } finally {
        setIsLoadingPricing(false);
      }
    };

    fetchPricingData();
  }, [settings?.organization_id]); // Only depend on organization_id to prevent infinite loops

  // Handle hash-based routing for pricing modal
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Check if hash starts with '#pricing' (supports both #pricing and #pricing#product_name)
      const hashParts = hash.split('#').filter(Boolean);
      const isPricingHash = hashParts.length > 0 && hashParts[0] === 'pricing';
      
      setIsPricingModalOpen(isPricingHash);
    };

    // Handle custom modal open events
    const handleOpenPricingModal = () => {
      console.log('Custom pricing modal open event triggered');
      setIsPricingModalOpen(true);
      
      // Only set basic pricing hash if no pricing hash exists
      const hash = window.location.hash;
      const hashParts = hash.split('#').filter(Boolean);
      const hasPricingHash = hashParts.length > 0 && hashParts[0] === 'pricing';
      
      if (!hasPricingHash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + '#pricing');
      }
    };

    // Check initial hash on mount - multiple checks to ensure it works
    const checkInitialHash = () => {
      handleHashChange();
    };
    
    // Immediate check
    checkInitialHash();
    
    // Check again after a short delay to handle any timing issues
    setTimeout(checkInitialHash, 100);
    
    // Check again after DOM is fully ready
    setTimeout(checkInitialHash, 500);

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Also listen for popstate to catch browser back/forward navigation
    window.addEventListener('popstate', handleHashChange);

    // Handle programmatic navigation and ensure hash changes are detected
    const handleLocationChange = () => {
      setTimeout(handleHashChange, 0);
    };
    
    // Listen for any URL changes
    window.addEventListener('load', handleHashChange);
    
    // Listen for custom pricing modal events
    window.addEventListener('openPricingModal', handleOpenPricingModal);
    
    // Handle clicks on pricing links throughout the app
    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href="#pricing"], a[href*="#pricing"]');
      if (link) {
        // console.log('Pricing link clicked, current hash:', window.location.hash);
        e.preventDefault(); // Prevent default navigation
        
        // Always open the modal, regardless of current hash
        setIsPricingModalOpen(true);
        
        // Only set basic pricing hash if no pricing hash exists
        const hash = window.location.hash;
        const hashParts = hash.split('#').filter(Boolean);
        const hasPricingHash = hashParts.length > 0 && hashParts[0] === 'pricing';
        
        if (!hasPricingHash) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search + '#pricing');
        }
      }
    };

    document.addEventListener('click', handleClick, true); // Use capture phase

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handleHashChange);
      window.removeEventListener('load', handleHashChange);
      window.removeEventListener('openPricingModal', handleOpenPricingModal);
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Handle modal close
  const handleClosePricingModal = () => {
    console.log('Closing pricing modal'); // Debug log
    setIsPricingModalOpen(false);
    
    // Remove hash from URL if it starts with 'pricing'
    const hash = window.location.hash;
    const hashParts = hash.split('#').filter(Boolean);
    
    if (hashParts.length > 0 && hashParts[0] === 'pricing') {
      // Use replaceState to avoid adding to browser history
      const url = window.location.pathname + window.location.search;
      window.history.replaceState(null, '', url);
    }
  };

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

      {/* Removed: Brands, FAQ, and BlogPostSlider sections */}
      {/* These are now universal and can be added via template sections on any page */}

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={isPricingModalOpen}
        onClose={handleClosePricingModal}
        pricingComparison={pricingComparison}
      />
    </main>
  );
};

// Wrap with memo for performance
const HomePage = memo(HomePageComponent);
HomePage.displayName = 'HomePage';

// Export
export { HomePage };
export default HomePage;