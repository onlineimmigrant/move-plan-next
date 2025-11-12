/**
 * useBadgeRefresh Hook
 * 
 * Provides a way to manually trigger badge refresh
 * Used to update badge counts immediately when messages are read
 */

import { useCallback } from 'react';

// Global event emitter for badge refresh
const BADGE_REFRESH_EVENT = 'badge-refresh';

export function triggerBadgeRefresh() {
  window.dispatchEvent(new CustomEvent(BADGE_REFRESH_EVENT));
}

export function useBadgeRefresh(callback: () => void) {
  const handleRefresh = useCallback(() => {
    callback();
  }, [callback]);

  return handleRefresh;
}

export { BADGE_REFRESH_EVENT };
