// File: /lib/utils.ts

import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * A utility function to combine class names with Tailwind CSS merging support
 * @param inputs - Array of class values (strings, arrays, or objects)
 * @returns Combined and merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}


// /lib/utils.ts
export function getBaseUrl(isServer: boolean = false): string {
  if (isServer) {
    // Server-side: Prefer VERCEL_URL for deployed environments
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    // Fallback to NEXT_PUBLIC_BASE_URL or localhost
    return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  }
  // Client-side: Use window.location.origin if available
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}