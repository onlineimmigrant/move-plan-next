// /utils/CalculateEndDate.ts

// Function to calculate end_date based on measure (day, week, month, year)
export const calculateEndDate = (startDate: Date, measure: string): Date | null => {
  if (measure.toLowerCase().includes('one-time')) {
    return null; // Indefinite access for one-time products
  }

  const durationMatch = measure.toLowerCase().match(/(\d+)-(day|week|month|year)/);
  if (!durationMatch) {
    console.warn(`Unrecognized measure format: ${measure}`);
    return null; // Default to null if format is unrecognized
  }

  const [, durationStr, unit] = durationMatch;
  const duration = parseInt(durationStr, 10);
  const endDate = new Date(startDate);

  switch (unit) {
    case 'day':
      endDate.setDate(endDate.getDate() + duration);
      break;
    case 'week':
      endDate.setDate(endDate.getDate() + duration * 7); // 1 week = 7 days
      break;
    case 'month':
      endDate.setMonth(endDate.getMonth() + duration);
      break;
    case 'year':
      endDate.setFullYear(endDate.getFullYear() + duration);
      break;
    default:
      console.warn(`Unsupported duration unit: ${unit}`);
      return null;
  }

  return endDate;
};