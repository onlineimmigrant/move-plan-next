/**
 * SEO Data Caching Layer
 * 
 * Implements in-memory and ISR caching for SEO metadata
 * to dramatically reduce database queries and improve TTFB
 */

import { SEOData } from './seo';

// In-memory cache with TTL
interface CacheEntry {
  data: SEOData;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SEOCache {
  private cache: Map<string, CacheEntry>;
  private readonly defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  /**
   * Generate cache key from pathname and domain
   */
  private getCacheKey(pathname: string, domain: string): string {
    return `${domain}::${pathname}`;
  }

  /**
   * Get cached SEO data if not expired
   */
  get(pathname: string, domain: string): SEOData | null {
    const key = this.getCacheKey(pathname, domain);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set SEO data in cache
   */
  set(pathname: string, domain: string, data: SEOData, ttl?: number): void {
    const key = this.getCacheKey(pathname, domain);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(pathname: string, domain: string): void {
    const key = this.getCacheKey(pathname, domain);
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean up expired entries (call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global singleton cache instance
export const seoCache = new SEOCache();

// Cleanup expired entries every 10 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(() => {
    seoCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Cache configuration for different page types
 */
export const CACHE_CONFIG = {
  // Static pages - cache for 1 hour
  STATIC_PAGE: 60 * 60 * 1000,
  
  // Dynamic pages - cache for 5 minutes
  DYNAMIC_PAGE: 5 * 60 * 1000,
  
  // Blog posts - cache for 15 minutes
  BLOG_POST: 15 * 60 * 1000,
  
  // Product pages - cache for 10 minutes
  PRODUCT_PAGE: 10 * 60 * 1000,
  
  // Homepage - cache for 30 minutes
  HOME_PAGE: 30 * 60 * 1000,
};

/**
 * Determine cache TTL based on pathname
 */
export function getCacheTTL(pathname: string): number {
  // Homepage
  if (pathname === '/' || pathname === '/home') {
    return CACHE_CONFIG.HOME_PAGE;
  }
  
  // Static pages
  const staticPages = ['/about', '/contact', '/privacy-policy', '/terms-of-service', '/cookie-policy'];
  if (staticPages.includes(pathname)) {
    return CACHE_CONFIG.STATIC_PAGE;
  }
  
  // Blog posts
  if (pathname.startsWith('/blog/') || pathname.match(/^\/[^\/]+$/)) {
    return CACHE_CONFIG.BLOG_POST;
  }
  
  // Product pages
  if (pathname.startsWith('/products/')) {
    return CACHE_CONFIG.PRODUCT_PAGE;
  }
  
  // Default for other dynamic pages
  return CACHE_CONFIG.DYNAMIC_PAGE;
}
