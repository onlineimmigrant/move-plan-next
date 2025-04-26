// src/components/Breadcrumbs.tsx
'use client';

import React, { useMemo, memo } from 'react';
import { usePathname } from 'next/navigation';
import { RiHomeFill } from 'react-icons/ri';
import { IoIosArrowForward } from 'react-icons/io';
import { useSettings } from '@/context/SettingsContext';

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

  // Log renders to debug
  console.log('Breadcrumbs rendered:', { pathname, overrides, extraCrumbs, settings });

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
      let formattedLabel = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

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
  }, [pathname, memoizedOverrides, memoizedExtraCrumbs]);

 
  if (!breadcrumbs || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className=''>
      <nav className="bg-white sm:bg-transparent w-full fixed bottom-0 text-xs mt-12 max-w-7xl mx-auto mb-0 p-2 px-4 z-51" aria-label="Breadcrumb">
        <ol className="flex flex-wrap justify-start gap-4 items-center">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {crumb.label === 'Home' ? (
                <a
                  href={crumb.url}
                  className="sm:pl-2 text-gray-400 hover:text-gray-600"
                  title="Navigate to Main Page"
                >
                  <RiHomeFill />
                </a>
              ) : (
                <>
                  <a
                    href={crumb.url}
                    className={`sm:mx-4 pr-2  ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-300'
                        : `text-gray-600 hover:text-gray-400`
                    }`}
                  >
                    {crumb.label && ( // Check if the label exists
                      crumb.label.length > 20 ? `${crumb.label.substring(0, 20)}...` : crumb.label
                    )}
                  </a>
                  {index < breadcrumbs.length - 1 && (
                    <IoIosArrowForward className="text-gray-400" />
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