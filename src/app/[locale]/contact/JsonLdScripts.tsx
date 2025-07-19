'use client';

import Head from 'next/head';
import { useEffect } from 'react';

interface JsonLdScriptsProps {
  webPageSchema: object;
  breadcrumbSchema: object;
  contactPageSchema: object;
}

export default function JsonLdScripts({ 
  webPageSchema, 
  breadcrumbSchema, 
  contactPageSchema 
}: JsonLdScriptsProps) {
  
  useEffect(() => {
    // Remove any existing JSON-LD scripts for this page
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"][data-contact-page]');
    existingScripts.forEach(script => script.remove());

    // Create and inject WebPage schema
    const webPageScript = document.createElement('script');
    webPageScript.type = 'application/ld+json';
    webPageScript.setAttribute('data-contact-page', 'webpage');
    webPageScript.textContent = JSON.stringify(webPageSchema);
    document.head.appendChild(webPageScript);

    // Create and inject Breadcrumb schema
    const breadcrumbScript = document.createElement('script');
    breadcrumbScript.type = 'application/ld+json';
    breadcrumbScript.setAttribute('data-contact-page', 'breadcrumb');
    breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
    document.head.appendChild(breadcrumbScript);

    // Create and inject ContactPage schema
    const contactScript = document.createElement('script');
    contactScript.type = 'application/ld+json';
    contactScript.setAttribute('data-contact-page', 'contact');
    contactScript.textContent = JSON.stringify(contactPageSchema);
    document.head.appendChild(contactScript);

    // Cleanup function
    return () => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"][data-contact-page]');
      scripts.forEach(script => script.remove());
    };
  }, [webPageSchema, breadcrumbSchema, contactPageSchema]);

  return null; // This component doesn't render anything visible
}
