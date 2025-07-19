// src/lib/getBreadcrumbs.ts
interface StructuredBreadcrumbItem {
  '@type': string;
  position: number;
  name: string;
  item?: string;
}

interface BreadcrumbOverride {
  segment: string;
  label: string;
  url?: string;
}

interface ExtraCrumb {
  label: string;
  url?: string;
}

export function getBreadcrumbStructuredData({
  pathname,
  domain,
  overrides = [],
  extraCrumbs = [],
}: {
  pathname: string;
  domain: string;
  overrides?: BreadcrumbOverride[];
  extraCrumbs?: ExtraCrumb[];
}): StructuredBreadcrumbItem[] {
  try {
    // Normalize domain and pathname
    const normalizedDomain = domain.replace(/\/+$/, '');
    const normalizedPathname = pathname.trim() === '' || pathname === '/' ? '/' : pathname.replace(/\/+$/, '').replace(/\?.*$/, '');
    
    console.log('getBreadcrumbStructuredData Input:', { 
      originalPathname: pathname, 
      normalizedPathname, 
      originalDomain: domain,
      normalizedDomain 
    });

    const breadcrumbs: { label: string; url: string }[] = [
      { label: 'Home', url: normalizedDomain + '/' },
    ];

    // Handle root path case
    if (normalizedPathname === '/') {
      return breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: crumb.url,
      }));
    }

    // Process path segments
    let accumulatedPath = '';
    const pathSegments = normalizedPathname.split('/').filter(Boolean);

    pathSegments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      let formattedLabel = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

      // Apply overrides
      const override = overrides.find((o) => o.segment === segment || o.segment === accumulatedPath);
      if (override) {
        formattedLabel = override.label;
      }

      // For final segment (current page), don't include URL
      const isLastSegment = index === pathSegments.length - 1;
      const fullUrl = `${normalizedDomain}${accumulatedPath}`;

      breadcrumbs.push({
        label: formattedLabel,
        url: isLastSegment ? '' : fullUrl, // No URL for current page per Google guidelines
      });
    });

    // Add extra crumbs if needed
    if (extraCrumbs.length > 0) {
      const insertIndex = breadcrumbs.findIndex(
        (crumb) => crumb.label.toLowerCase().includes('product')
      );
      if (insertIndex !== -1) {
        extraCrumbs.forEach((crumb, idx) => {
          breadcrumbs.splice(insertIndex + 1 + idx, 0, {
            label: crumb.label,
            url: crumb.url ? `${normalizedDomain}${crumb.url}` : '',
          });
        });
      }
    }

    // Convert to structured data format
    const structuredBreadcrumbs = breadcrumbs.map((crumb, index) => {
      const item: StructuredBreadcrumbItem = {
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
      };
      
      // Only add item URL if it's not the last item (current page)
      if (crumb.url && crumb.url !== '') {
        item.item = crumb.url;
      }
      
      return item;
    });

    console.log('Generated Breadcrumb Structured Data:', JSON.stringify(structuredBreadcrumbs, null, 2));
    return structuredBreadcrumbs;
  } catch (error) {
    console.error('Error in getBreadcrumbStructuredData:', error);
    // Return minimal fallback
    const fallbackDomain = domain.replace(/\/+$/, '');
    return [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: fallbackDomain + '/',
      },
    ];
  }
}
