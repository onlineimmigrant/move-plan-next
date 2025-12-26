export const mixWithTransparent = (color: string | undefined | null, percent: number): string => {
  if (!color) return 'transparent';
  // Works for hex, rgb(), hsl(), and var(--...)
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
};
