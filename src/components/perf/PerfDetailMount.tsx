'use client';
import { useEffect } from 'react';

export default function PerfDetailMount() {
  useEffect(() => {
    try {
      const clickEntries = performance.getEntriesByName('PerfProdDetail-click');
      if (clickEntries.length) {
        const clickTime = clickEntries[clickEntries.length - 1].startTime;
        const now = performance.now();
        const delta = (now - clickTime).toFixed(0);
        performance.mark('PerfProdDetail-mounted');
        performance.measure('PerfProdDetail-navigation', 'PerfProdDetail-click', 'PerfProdDetail-mounted');
        console.log(`[PerfProdDetail] mounted after ${delta}ms (click->mount)`);
      } else {
        console.log('[PerfProdDetail] no click mark found');
      }
    } catch {}
  }, []);
  return null;
}
