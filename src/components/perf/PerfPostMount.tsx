"use client";
import { useEffect } from 'react';

export default function PerfPostMount() {
  useEffect(() => {
    try {
      if (typeof performance !== 'undefined') {
        performance.mark('PerfPost-mount');
        const navClickMark = performance.getEntriesByName('PerfPost-click').at(-1);
        if (navClickMark) {
          const diff = performance.now() - navClickMark.startTime;
          console.log('[PerfPost] Click→Mount ms:', Math.round(diff));
        }
      }
    } catch (e) {
      // Silent fail
    }
  }, []);
  return null;
}