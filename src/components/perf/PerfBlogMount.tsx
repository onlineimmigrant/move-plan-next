'use client';
import { useEffect } from 'react';

export default function PerfBlogMount() {
  useEffect(() => {
    try {
      const clickEntries = performance.getEntriesByName('PerfBlog-click');
      if (clickEntries.length) {
        const clickTime = clickEntries[clickEntries.length - 1].startTime;
        const now = performance.now();
        const delta = (now - clickTime).toFixed(0);
        performance.mark('PerfBlog-mounted');
        performance.measure('PerfBlog-navigation', 'PerfBlog-click', 'PerfBlog-mounted');
        // eslint-disable-next-line no-console
        console.log(`[PerfBlog] mounted after ${delta}ms (click->mount)`);
      } else {
        // eslint-disable-next-line no-console
        console.log('[PerfBlog] no click mark found');
      }
    } catch {}
  }, []);
  return null;
}
