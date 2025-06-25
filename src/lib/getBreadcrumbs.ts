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
    const normalizedDomain = domain.replace(/\/+$/, '');
    const normalizedPathname = pathname.trim() === '' || pathname === '/' ? '/' : pathname.replace(/\/+$/, '').replace(/\?.*$/, '');
    console.log('getBreadcrumbStructuredData Input:', { pathname, normalizedPathname, domain: normalizedDomain });

    const breadcrumbs: { label: string; url?: string }[] = [
      { label: 'Home', url: normalizedDomain },
    ];

    if (normalizedPathname === '/') {
      const structuredBreadcrumbs = breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.label,
        item: crumb.url,
      }));
      console.log('Root Path Breadcrumb Structured Data:', JSON.stringify(structuredBreadcrumbs, null, 2));
      return structuredBreadcrumbs;
    }

    let accumulatedPath = '';
    const pathSegments = normalizedPathname.split('/').filter(Boolean);

    pathSegments.forEach((segment, index) => {
      accumulatedPath += `/${segment}`;
      let formattedLabel = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ') || 'Unknown';

      const override = overrides.find((o) => o.segment === segment);
      if (override) {
        formattedLabel = override.label;
        accumulatedPath = override.url || accumulatedPath;
      }

      breadcrumbs.push({
        label: formattedLabel,
        url: index < pathSegments.length - 1 ? `${normalizedDomain}${accumulatedPath}` : undefined,
      });
    });

    if (extraCrumbs.length > 0) {
      const productsIndex = breadcrumbs.findIndex(
        (crumb) => crumb.label === 'Products' || crumb.label === 'All Products'
      );
      if (productsIndex !== -1) {
        breadcrumbs.splice(
          productsIndex + 1,
          0,
          ...extraCrumbs.map((crumb) => ({
            label: crumb.label,
            url: crumb.url ? `${normalizedDomain}${crumb.url}` : undefined,
          }))
        );
      }
    }

    const structuredBreadcrumbs = breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label || 'Unknown',
      ...(crumb.url && { item: crumb.url }),
    }));

    console.log('Generated Breadcrumb Structured Data:', JSON.stringify(structuredBreadcrumbs, null, 2));
    return structuredBreadcrumbs;
  } catch (error) {
    console.error('Error in getBreadcrumbStructuredData:', error);
    const fallback = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: domain.replace(/\/+$/, ''),
      },
    ];
    console.log('Fallback Breadcrumb Structured Data:', JSON.stringify(fallback, null, 2));
    return fallback;
  }
}