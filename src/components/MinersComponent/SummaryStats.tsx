'use client';

import React, { useState, useEffect } from 'react';
import { MinerData } from './types';
import { getMinerStatus } from './utils';

interface SummaryStatsProps {
  sortedMiners: MinerData[];
}

// Custom hook for animated counting
function useAnimatedCounter(endValue: number, duration: number = 1000, decimals: number = 0) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (endValue === 0) {
      setCurrentValue(0);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      
      const value = endValue * easeOutCubic;
      setCurrentValue(value);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [endValue, duration]);

  return decimals > 0 ? currentValue.toFixed(decimals) : Math.floor(currentValue).toString();
}

export default function SummaryStats({ sortedMiners }: SummaryStatsProps) {
  // Calculate status counts using consistent logic
  const onlineMiners = sortedMiners.filter(m => getMinerStatus(m) === 'online').length;
  const offlineMiners = sortedMiners.filter(m => getMinerStatus(m) === 'offline').length;
  const unknownMiners = sortedMiners.filter(m => getMinerStatus(m) === 'unknown').length;
  
  const totalHashrate = sortedMiners.reduce((sum, m) => sum + (m.hashrate || 0), 0);
  const totalProfit = sortedMiners.reduce((sum, m) => sum + (m.profit || 0), 0);

  // Animated values
  const animatedTotal = useAnimatedCounter(sortedMiners.length, 800);
  const animatedOnline = useAnimatedCounter(onlineMiners, 900);
  const animatedHashrate = useAnimatedCounter(totalHashrate, 1200, 1);
  const animatedProfit = useAnimatedCounter(totalProfit, 1000, 2);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-600 uppercase tracking-wide">Filtered Results</h3>
            <p className="text-3xl font-bold text-blue-900 mt-1 tabular-nums">{animatedTotal}</p>
            <p className="text-blue-700 text-sm mt-1">miners</p>
          </div>
          <div className="bg-blue-200 p-3 rounded-xl">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-green-600 uppercase tracking-wide">Online Status</h3>
            <p className="text-3xl font-bold text-green-900 mt-1 tabular-nums">{animatedOnline}</p>
            <p className="text-green-700 text-sm mt-1">
              online {offlineMiners > 0 && `• ${offlineMiners} offline`}
              {unknownMiners > 0 && ` • ${unknownMiners} unknown`}
            </p>
          </div>
          <div className="bg-green-200 p-3 rounded-xl">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-purple-600 uppercase tracking-wide">Total Hashrate</h3>
            <p className="text-3xl font-bold text-purple-900 mt-1 tabular-nums">{animatedHashrate}</p>
            <p className="text-purple-700 text-sm mt-1">TH/s</p>
          </div>
          <div className="bg-purple-200 p-3 rounded-xl">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2-2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-orange-600 uppercase tracking-wide">Total Profit</h3>
            <p className="text-3xl font-bold text-orange-900 mt-1 tabular-nums">${animatedProfit}</p>
            <p className="text-orange-700 text-sm mt-1">per day</p>
          </div>
          <div className="bg-orange-200 p-3 rounded-xl">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
