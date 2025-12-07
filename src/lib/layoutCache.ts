/**
 * Simple in-memory cache for layout data with 1-hour TTL
 * Prevents redundant database queries within the same deployment
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class LayoutCache {
  private cache = new Map<string, CacheEntry<any>>();
  private ttl = 3600000; // 1 hour in milliseconds

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

export const layoutCache = new LayoutCache();
