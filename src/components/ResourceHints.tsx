/**
 * ResourceHints Component
 * Adds DNS prefetch, preconnect, and prefetch hints for critical resources
 * Improves loading performance for external resources
 */

'use client';

import Head from 'next/head';

export function ResourceHints() {
  return (
    <Head>
      {/* DNS Prefetch for external domains */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//www.googletagmanager.com" />
      <link rel="dns-prefetch" href="//www.google-analytics.com" />
      
      {/* Preconnect for critical external resources */}
      <link rel="preconnect" href="//fonts.googleapis.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="//fonts.gstatic.com" crossOrigin="anonymous" />
      
      {/* Prefetch for likely next pages */}
      {typeof window !== 'undefined' && window.location.pathname === '/' && (
        <>
          <link rel="prefetch" href="/about" />
          <link rel="prefetch" href="/products" />
        </>
      )}
    </Head>
  );
}

export default ResourceHints;
