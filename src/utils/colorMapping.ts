export default function getColorClass(color?: string): string {
    if (!color) return 'gray-800';
    const colorMap: { [key: string]: string } = {
      blue: 'blue-500',
      red: 'red-500',
      green: 'green-500',
      sky: 'sky-500',
      // Add more mappings
    };
    return colorMap[color.toLowerCase()] || 'gray-800';
  }