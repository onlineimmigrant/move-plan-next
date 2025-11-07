/**
 * Calendar data cache utilities
 * Provides caching for calendar events to reduce API calls
 * 
 * Features:
 * - Time-based cache expiration (5 minutes)
 * - Automatic stale data removal
 * - Type-safe caching
 * 
 * @example
 * ```tsx
 * import { getCachedData, setCachedData, clearCache } from './calendarCache';
 * 
 * // Try to get cached data
 * const cached = getCachedData('2025-11');
 * if (cached) {
 *   return cached;
 * }
 * 
 * // Fetch and cache new data
 * const events = await fetchEvents();
 * setCachedData('2025-11', events);
 * ```
 */

import { CalendarEvent } from '@/types/meetings';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: CalendarEvent[];
  timestamp: number;
}

const enhancedCache = new Map<string, CacheEntry>();

/**
 * Get cached calendar data if available and not stale
 * 
 * @param key - Cache key (usually formatted as YYYY-MM)
 * @returns Cached events or null if not found/stale
 */
export function getCachedData(key: string): CalendarEvent[] | null {
  const entry = enhancedCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data;
  }
  if (entry) {
    enhancedCache.delete(key); // Remove stale data
  }
  return null;
}

/**
 * Store calendar data in cache with current timestamp
 * 
 * @param key - Cache key (usually formatted as YYYY-MM)
 * @param data - Calendar events to cache
 */
export function setCachedData(key: string, data: CalendarEvent[]): void {
  enhancedCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Clear all cached calendar data
 * Useful when user logs out or organization changes
 */
export function clearCache(): void {
  enhancedCache.clear();
}

/**
 * Remove specific cache entry
 * 
 * @param key - Cache key to remove
 */
export function removeCachedData(key: string): void {
  enhancedCache.delete(key);
}
