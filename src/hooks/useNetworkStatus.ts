'use client';

import { useState, useEffect } from 'react';

/**
 * Network Quality Level
 */
export type NetworkQuality = 'high' | 'medium' | 'low' | 'offline';

/**
 * Network Information
 */
export interface NetworkInfo {
  /** Network quality level */
  quality: NetworkQuality;
  /** Effective connection type */
  effectiveType: string;
  /** Downlink speed in Mbps */
  downlink?: number;
  /** Round-trip time in ms */
  rtt?: number;
  /** Whether to save data */
  saveData: boolean;
  /** Whether currently online */
  isOnline: boolean;
}

/**
 * Network Status Hook
 * 
 * Detects network conditions and provides quality hints for adaptive loading.
 * Uses Navigator.connection API (Network Information API) when available.
 * 
 * @returns Network information and quality level
 * 
 * @example
 * const network = useNetworkStatus();
 * if (network.quality === 'low') {
 *   // Serve low-quality images
 * }
 * 
 * @performance
 * - Monitors connection changes in real-time
 * - Provides quality hints for adaptive features
 * - Respects user's data saver preference
 * 
 * @browser Safari doesn't support Network Information API, falls back to 'high'
 */
export function useNetworkStatus(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    quality: 'high',
    effectiveType: '4g',
    saveData: false,
    isOnline: true,
  });

  useEffect(() => {
    // Check if Network Information API is available
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    const updateNetworkInfo = () => {
      const isOnline = navigator.onLine;

      if (!isOnline) {
        setNetworkInfo({
          quality: 'offline',
          effectiveType: 'offline',
          saveData: false,
          isOnline: false,
        });
        return;
      }

      // If Network Information API is not available, assume high quality
      if (!connection) {
        setNetworkInfo({
          quality: 'high',
          effectiveType: '4g',
          saveData: false,
          isOnline: true,
        });
        return;
      }

      const effectiveType = connection.effectiveType || '4g';
      const downlink = connection.downlink;
      const rtt = connection.rtt;
      const saveData = connection.saveData || false;

      // Determine quality based on effective type and metrics
      let quality: NetworkQuality = 'high';

      if (saveData) {
        quality = 'low';
      } else if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        quality = 'low';
      } else if (effectiveType === '3g') {
        quality = 'medium';
      } else if (effectiveType === '4g') {
        // Check downlink and RTT for more precise quality
        if (downlink && downlink < 1.5) {
          quality = 'medium';
        } else if (rtt && rtt > 300) {
          quality = 'medium';
        } else {
          quality = 'high';
        }
      }

      setNetworkInfo({
        quality,
        effectiveType,
        downlink,
        rtt,
        saveData,
        isOnline: true,
      });
    };

    // Initial check
    updateNetworkInfo();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    // Listen for connection changes if API is available
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return networkInfo;
}

/**
 * Get image quality based on network conditions
 * 
 * @param quality - Network quality level
 * @returns Image quality percentage (0-100)
 */
export function getImageQuality(quality: NetworkQuality): number {
  switch (quality) {
    case 'high':
      return 90;
    case 'medium':
      return 70;
    case 'low':
      return 50;
    case 'offline':
      return 0;
    default:
      return 90;
  }
}

/**
 * Get image size multiplier based on network conditions
 * 
 * @param quality - Network quality level
 * @returns Size multiplier (0.5 = 50% of original size)
 */
export function getImageSizeMultiplier(quality: NetworkQuality): number {
  switch (quality) {
    case 'high':
      return 1.0;
    case 'medium':
      return 0.7;
    case 'low':
      return 0.4;
    case 'offline':
      return 0;
    default:
      return 1.0;
  }
}

/**
 * Check if animations should be enabled based on network
 * 
 * @param quality - Network quality level
 * @returns Whether to enable animations
 */
export function shouldEnableAnimations(quality: NetworkQuality): boolean {
  return quality === 'high' || quality === 'medium';
}

/**
 * Get polling interval based on network conditions
 * 
 * @param quality - Network quality level
 * @param baseInterval - Base polling interval in ms
 * @returns Adjusted polling interval
 */
export function getPollingInterval(quality: NetworkQuality, baseInterval: number): number {
  switch (quality) {
    case 'high':
      return baseInterval;
    case 'medium':
      return baseInterval * 2;
    case 'low':
      return baseInterval * 4;
    case 'offline':
      return 0;
    default:
      return baseInterval;
  }
}
