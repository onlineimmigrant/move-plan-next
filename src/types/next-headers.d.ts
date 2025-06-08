// src/types/next-headers.d.ts
declare module 'next/headers' {
  export function headers(): Headers;
  export function cookies(): { get(name: string): { value: string } | undefined; set(name: string, value: string, options?: any): void };
}