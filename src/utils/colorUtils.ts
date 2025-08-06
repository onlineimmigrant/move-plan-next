import { tailwindColors } from '@/lib/colorsPalette';

/**
 * Convert a hex color to the closest Tailwind color name
 * @param hex - The hex color string (with or without #)
 * @returns The closest Tailwind color name (e.g., 'gray-800')
 */
export function hexToTailwindColor(hex: string): string {
  if (!hex) return 'gray-500'; // Default fallback
  
  // Remove # if present and convert to lowercase
  const cleanHex = hex.replace('#', '').toLowerCase();
  
  // If it's already a Tailwind color name, return as is
  if (!cleanHex.match(/^[0-9a-f]{6}$/)) {
    return hex;
  }
  
  let closestColor = 'gray-500';
  let minDistance = Infinity;
  
  // Convert hex to RGB
  const hexR = parseInt(cleanHex.substr(0, 2), 16);
  const hexG = parseInt(cleanHex.substr(2, 2), 16);
  const hexB = parseInt(cleanHex.substr(4, 2), 16);
  
  // Search through all Tailwind colors
  Object.keys(tailwindColors).forEach(colorName => {
    Object.keys(tailwindColors[colorName]).forEach(shade => {
      const tailwindHex = tailwindColors[colorName][shade].replace('#', '').toLowerCase();
      
      // Convert Tailwind color to RGB
      const tailwindR = parseInt(tailwindHex.substr(0, 2), 16);
      const tailwindG = parseInt(tailwindHex.substr(2, 2), 16);
      const tailwindB = parseInt(tailwindHex.substr(4, 2), 16);
      
      // Calculate Euclidean distance in RGB space
      const distance = Math.sqrt(
        Math.pow(hexR - tailwindR, 2) +
        Math.pow(hexG - tailwindG, 2) +
        Math.pow(hexB - tailwindB, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = `${colorName.toLowerCase()}-${shade}`;
      }
    });
  });
  
  return closestColor;
}

/**
 * Convert a Tailwind color name to hex
 * @param tailwindColor - The Tailwind color name (e.g., 'gray-800')
 * @returns The hex color string (e.g., '#1f2937')
 */
export function tailwindColorToHex(tailwindColor: string): string {
  if (!tailwindColor) return '#6b7280'; // Default gray
  
  // If it's already a hex color, return as is
  if (tailwindColor.startsWith('#')) {
    return tailwindColor;
  }
  
  const parts = tailwindColor.split('-');
  if (parts.length !== 2) return '#6b7280'; // Default gray
  
  const colorName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  const shade = parts[1];
  
  const hexColor = tailwindColors[colorName]?.[shade];
  return hexColor || '#6b7280'; // Default gray if not found
}
