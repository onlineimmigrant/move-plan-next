'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface StructuredDataInjectorProps {
  baseUrl: string;
}

export default function ClientStructuredDataInjector({ baseUrl }: StructuredDataInjectorProps) {
  const pathname = usePathname();

  useEffect(() => {
    console.log('🔍 [ClientStructuredDataInjector] Current pathname:', pathname);
    
    // Remove any existing structured data scripts
    const existingScripts = document.querySelectorAll('script[data-structured-data="true"]');
    existingScripts.forEach(script => script.remove());
    
    // Create breadcrumb structured data
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": generateBreadcrumbs(pathname, baseUrl)
    };
    
    // Create webpage structured data
    const webPageData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": getPageTitle(pathname),
      "description": getPageDescription(pathname),
      "url": `${baseUrl}${pathname}`
    };
    
    // Inject breadcrumb structured data
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.setAttribute('data-structured-data', 'true');
    breadcrumbScript.textContent = JSON.stringify(breadcrumbData);
    document.head.appendChild(breadcrumbScript);
    
    // Inject webpage structured data
    const webPageScript = document.createElement('script');
    webPageScript.type = 'application/ld+json';
    webPageScript.setAttribute('data-structured-data', 'true');
    webPageScript.textContent = JSON.stringify(webPageData);
    document.head.appendChild(webPageScript);
    
    console.log('✅ [ClientStructuredDataInjector] Structured data injected for:', pathname);
    console.log('📋 [ClientStructuredDataInjector] Breadcrumb data:', JSON.stringify(breadcrumbData, null, 2));
    console.log('📋 [ClientStructuredDataInjector] WebPage data:', JSON.stringify(webPageData, null, 2));
    
  }, [pathname, baseUrl]);

  return null;
}

function generateBreadcrumbs(pathname: string, baseUrl: string) {
  const breadcrumbs = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": baseUrl
    }
  ];
  
  if (pathname === '/' || pathname === '') {
    return breadcrumbs;
  }
  
  const pathSegments = pathname.split('/').filter(Boolean);
  let currentPath = '';
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === pathSegments.length - 1;
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    const breadcrumb: any = {
      "@type": "ListItem",
      "position": index + 2,
      "name": label
    };
    
    // Don't include URL for the current page (last item)
    if (!isLast) {
      breadcrumb.item = `${baseUrl}${currentPath}`;
    }
    
    breadcrumbs.push(breadcrumb);
  });
  
  return breadcrumbs;
}

function getPageTitle(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'Home';
  
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
}

function getPageDescription(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'Welcome to our platform';
  
  const title = getPageTitle(pathname);
  return `Learn more about ${title} and explore our services.`;
}
