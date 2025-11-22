// Utility functions for path processing & request single-flight dedup
// Keep extremely small to avoid adding to initial bundle weight unnecessarily.

const SUPPORTED_LOCALES = ['en','es','fr','de','ru','pt','it','nl','pl','ja','zh'];

export function getBasePathFromLocale(pathname: string | null | undefined): string {
  if (!pathname) return '/';
  const pathSegments = pathname.split('/').filter(Boolean);
  const first = pathSegments[0];
  return first && first.length === 2 && SUPPORTED_LOCALES.includes(first)
    ? '/' + pathSegments.slice(1).join('/') || '/'
    : pathname;
}

// Simple single-flight (in-flight request deduplication) helper.
const inFlight = new Map<string, Promise<any>>();

export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, p);
  return p;
}
