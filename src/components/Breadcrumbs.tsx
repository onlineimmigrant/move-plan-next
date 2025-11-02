// src/components/Breadcrumbs.tsx
'use client';

import React, { useMemo, memo, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { RiHomeFill } from 'react-icons/ri';
import { IoIosArrowForward } from 'react-icons/io';
import { useSettings } from '@/context/SettingsContext';
import { useProductTranslations } from '@/components/product/useProductTranslations';
import { getOrganizationWithType } from '@/lib/supabase';
import { getBaseUrl } from '@/lib/utils';

// Types
interface Breadcrumb {
  label: string;
  url?: string;
}

interface BreadcrumbsProps {
  overrides?: { segment: string; label: string; url?: string }[];
  extraCrumbs?: { label: string; url?: string }[];
}



const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ overrides = [], extraCrumbs = [] }) => {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { t } = useProductTranslations();
  const [organizationType, setOrganizationType] = useState<string>('services');

  // Fetch organization type
  useEffect(() => {
    const fetchOrganizationType = async () => {
      try {
        const baseUrl = getBaseUrl(true);
        const orgData = await getOrganizationWithType(baseUrl);
        if (orgData?.type) {
          setOrganizationType(orgData.type);
        }
      } catch (error) {
        console.error('Error fetching organization type for breadcrumbs:', error);
      }
    };

    fetchOrganizationType();
  }, []);

  // Function to get translated page title based on organization type
  const getTranslatedPageTitle = (orgType: string): string => {
    switch (orgType) {
      case 'immigration':
        return (t as any).immigrationServices || 'Immigration Services';
      case 'solicitor':
        return (t as any).legalServices || 'Legal Services';
      case 'finance':
        return (t as any).financialServices || 'Financial Services';
      case 'education':
        return (t as any).coursesEducation || 'Courses & Education';
      case 'job':
        return (t as any).jobOpportunities || 'Job Opportunities';
      case 'beauty':
        return (t as any).beautyServices || 'Beauty Services';
      case 'doctor':
        return (t as any).medicalServices || 'Medical Services';
      case 'services':
        return (t as any).ourServices || 'Our Services';
      case 'realestate':
        return (t as any).realEstate || 'Real Estate';
      case 'construction':
        return (t as any).constructionServices || 'Construction & Contracting';
      case 'software':
        return (t as any).softwareServices || 'Software & SaaS Services';
      case 'marketing':
        return (t as any).marketingServices || 'Marketing & Advertising';
      case 'consulting':
        return (t as any).consultingServices || 'Business Consulting';
      case 'automotive':
        return (t as any).automotiveServices || 'Automotive Services';
      case 'hospitality':
        return (t as any).hospitalityServices || 'Hotels & Hospitality';
      case 'retail':
        return (t as any).retailServices || 'Retail & E-commerce';
      case 'healthcare':
        return (t as any).healthcareServices || 'Healthcare Services';
      case 'transportation':
        return (t as any).transportationServices || 'Transport & Logistics';
      case 'technology':
        return (t as any).technologyServices || 'IT & Tech Services';
      case 'platform':
        return (t as any).platformServices || 'Business Platform Solutions';
      case 'general':
        return t.products || 'Products';
      default:
        return t.products || 'Products';
    }
  };

  // Function to get blog page title based on organization type
  const getBlogPageTitle = (orgType: string): string => {
    switch (orgType) {
      case 'immigration':
        return (t as any).immigrationNewsUpdates || 'Immigration News & Updates';
      case 'solicitor':
        return (t as any).legalNewsInsights || 'Legal News & Insights';
      case 'finance':
        return (t as any).financialNewsAnalysis || 'Financial News & Analysis';
      case 'education':
        return (t as any).educationalArticlesResources || 'Educational Articles & Resources';
      case 'job':
        return (t as any).careerNewsOpportunities || 'Career News & Opportunities';
      case 'beauty':
        return (t as any).beautyTipsTrends || 'Beauty Tips & Trends';
      case 'doctor':
        return (t as any).medicalNewsHealthTips || 'Medical News & Health Tips';
      case 'services':
        return (t as any).serviceUpdatesNews || 'Service Updates & News';
      case 'realestate':
        return (t as any).realEstateNewsMarketUpdates || 'Real Estate News & Market Updates';
      case 'construction':
        return (t as any).constructionNewsProjectUpdates || 'Construction News & Project Updates';
      case 'software':
        return (t as any).softwareNewsProductUpdates || 'Software News & Product Updates';
      case 'marketing':
        return (t as any).marketingTipsStrategies || 'Marketing Tips & Strategies';
      case 'consulting':
        return (t as any).consultingInsightsBestPractices || 'Consulting Insights & Best Practices';
      case 'automotive':
        return (t as any).automotiveNewsServiceTips || 'Automotive News & Service Tips';
      case 'hospitality':
        return (t as any).hospitalityTrendsTips || 'Hospitality Trends & Tips';
      case 'retail':
        return (t as any).retailTrendsEcommerceTips || 'Retail Trends & E-commerce Tips';
      case 'healthcare':
        return (t as any).healthcareNewsWellnessTips || 'Healthcare News & Wellness Tips';
      case 'transportation':
        return (t as any).transportationLogisticsNews || 'Transportation & Logistics News';
      case 'technology':
        return (t as any).technologyNewsITInsights || 'Technology News & IT Insights';
      case 'platform':
        return (t as any).platformNewsUpdates || 'Platform News & Updates';
      case 'general':
        return (t as any).latestNewsArticles || 'Latest News & Articles';
      default:
        return (t as any).blogPosts || 'Blog Posts';
    }
  };

  // Log renders to debug
  console.log('Breadcrumbs rendered:', { pathname, overrides, extraCrumbs, settings, organizationType });

  // Memoize overrides and extraCrumbs to prevent unnecessary re-computation
  const memoizedOverrides = useMemo(() => overrides, [overrides]);
  const memoizedExtraCrumbs = useMemo(() => extraCrumbs, [extraCrumbs]);

  // Compute breadcrumbs using useMemo
  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];

    console.log('Computing breadcrumbs for pathname:', pathname);

    // Split the path into segments and filter out empty values
    const pathSegments = pathname.split('/').filter(Boolean);

    // Initialize breadcrumbs with the "Home" link
    const newBreadcrumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }];
    let accumulatedPath = '';

    // Iterate over each segment in the path to create breadcrumbs
    pathSegments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      
      // Decode URL-encoded segment (handles Cyrillic and other non-ASCII characters)
      let decodedSegment: string;
      try {
        decodedSegment = decodeURIComponent(segment);
      } catch (error) {
        // If decoding fails, use the original segment
        console.warn('Failed to decode URL segment:', segment, error);
        decodedSegment = segment;
      }
      
      let formattedLabel = decodedSegment.charAt(0).toUpperCase() + decodedSegment.slice(1).replace(/-/g, ' ');

      // Special handling for products page based on organization type
      if (segment === 'products') {
        formattedLabel = getTranslatedPageTitle(organizationType);
      }

      // Special handling for blog page based on organization type
      if (segment === 'blog') {
        formattedLabel = getBlogPageTitle(organizationType);
      }

      // Check if there is an override for this segment
      const override = memoizedOverrides.find((o) => o.segment === segment);
      if (override) {
        formattedLabel = override.label;
        accumulatedPath = override.url || accumulatedPath;
      }

      // Add breadcrumb with URL for intermediate segments, or without URL for the last one
      if (index < pathSegments.length - 1) {
        newBreadcrumbs.push({ label: formattedLabel, url: accumulatedPath });
      } else {
        newBreadcrumbs.push({ label: formattedLabel });
      }
    });

    // Insert extra breadcrumbs after "Products" or "All Products" if present
    if (memoizedExtraCrumbs.length > 0) {
      const productsIndex = newBreadcrumbs.findIndex(
        (crumb) => crumb.label === 'Products' || crumb.label === 'All Products'
      );
      if (productsIndex !== -1) {
        newBreadcrumbs.splice(productsIndex + 1, 0, ...memoizedExtraCrumbs);
      }
    }

    return newBreadcrumbs;
  }, [pathname, memoizedOverrides, memoizedExtraCrumbs, organizationType]);

 
  // Don't show breadcrumbs on home page
  if (pathname === '/' || pathname === '') {
    return null;
  }

  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className=''>
      <nav 
        className="backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 w-full sm:fixed sm:bottom-0 relative sm:mt-0 mt-8 mb-4 sm:mb-0 py-3 px-4 sm:px-6 sm:z-51" 
        aria-label="Breadcrumb"
      >
        <ol className="flex flex-wrap justify-start gap-1.5 items-center text-sm max-w-7xl mx-auto">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {crumb.label === 'Home' ? (
                <a
                  href={crumb.url}
                  className="text-gray-500 hover:text-blue-600 transition-colors duration-200 p-1.5 hover:bg-blue-500/10 rounded-lg backdrop-blur-sm"
                  title="Navigate to Main Page"
                >
                  <RiHomeFill className="w-4 h-4" />
                </a>
              ) : (
                <>
                  <a
                    href={crumb.url}
                    className={`px-3 py-1.5 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-800 dark:text-white font-semibold bg-white/60 dark:bg-gray-800/60 cursor-default'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 font-medium'
                    }`}
                  >
                    {crumb.label && ( // Check if the label exists
                      crumb.label.length > 25 ? `${crumb.label.substring(0, 25)}...` : crumb.label
                    )}
                  </a>
                  {index < breadcrumbs.length - 1 && (
                    <IoIosArrowForward className="text-gray-400 dark:text-gray-500 mx-1 flex-shrink-0" />
                  )}
                </>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(Breadcrumbs);