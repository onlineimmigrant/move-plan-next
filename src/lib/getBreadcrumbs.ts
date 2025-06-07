interface Breadcrumb {
  label: string;
  url?: string;
}

interface StructuredBreadcrumbItem {
  '@type': string;
  position: number;
  name: string;
  item?: string;
}

export function getBreadcrumbStructuredData({
  pathname,
  baseUrl,
  overrides = [],
  extraCrumbs = [],
}: {
  pathname: string;
  baseUrl: string;
  overrides?: { segment: string; label: string; url?: string }[];
  extraCrumbs?: { label: string; url?: string }[];
}): StructuredBreadcrumbItem[] {
  // Initialize breadcrumbs with "Home"
  const breadcrumbs: Breadcrumb[] = [{ label: 'Home', url: '/' }];
  let accumulatedPath = '';

  // Split pathname into segments
  const pathSegments = pathname.split('/').filter(Boolean);

  // Build breadcrumbs
  pathSegments.forEach((segment, index) => {
    accumulatedPath += `/${segment}`;
    let formattedLabel = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

    // Apply override if present
    const override = overrides.find((o) => o.segment === segment);
    if (override) {
      formattedLabel = override.label;
      accumulatedPath = override.url || accumulatedPath;
    }

    // Add breadcrumb
    if (index < pathSegments.length - 1) {
      breadcrumbs.push({ label: formattedLabel, url: accumulatedPath });
    } else {
      breadcrumbs.push({ label: formattedLabel });
    }
  });

  // Insert extra crumbs after "Products" or "All Products"
  if (extraCrumbs.length > 0) {
    const productsIndex = breadcrumbs.findIndex(
      (crumb) => crumb.label === 'Products' || crumb.label === 'All Products'
    );
    if (productsIndex !== -1) {
      breadcrumbs.splice(productsIndex + 1, 0, ...extraCrumbs);
    }
  }

  // Convert to structured data
  return breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.label,
    item: crumb.url ? `${baseUrl}${crumb.url}` : undefined,
  }));
}