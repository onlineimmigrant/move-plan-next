interface StructuredBreadcrumbItem {
  '@type': string;
  position: number;
  name: string;
  item: string; // Always include item for Schema.org compliance
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
  // Normalize URLs
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, ''); // Remove trailing slashes
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const breadcrumbs: { label: string; url: string }[] = [
    { label: 'Home', url: normalizedBaseUrl },
  ];
  let accumulatedPath = '';

  // Split pathname into segments
  const pathSegments = normalizedPathname.split('/').filter(Boolean);

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

    breadcrumbs.push({ label: formattedLabel, url: `${normalizedBaseUrl}${accumulatedPath}` });
  });

  // Insert extra crumbs
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
          url: crumb.url ? `${normalizedBaseUrl}${crumb.url}` : `${normalizedBaseUrl}${accumulatedPath}`,
        }))
      );
    }
  }

  // Convert to structured data
  return breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.label,
    item: crumb.url,
  }));
}