// src/components/StructuredDataInjector.tsx
'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Placeholder for future structured data (e.g., product-specific JSON-LD)
interface StructuredDataInjectorProps {
  overrides?: any[]; // Keep for consistency
  extraCrumbs?: any[]; // Keep for consistency
}

const StructuredDataInjector: React.FC<StructuredDataInjectorProps> = ({
  overrides = [],
  extraCrumbs = [],
}) => {
  const pathname = usePathname();

  useEffect(() => {
    console.log('StructuredDataInjector running for path:', pathname);
    // Placeholder: No breadcrumb injection; handled server-side in /app/layout.tsx
    // Add other structured data here if needed (e.g., product schema)
    return () => {
      // No cleanup needed for now
      console.log('StructuredDataInjector cleanup for path:', pathname);
    };
  }, [pathname, overrides, extraCrumbs]);

  return null;
};

export default StructuredDataInjector;