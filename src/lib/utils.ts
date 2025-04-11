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