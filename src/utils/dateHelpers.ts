// Optimized date utilities with caching for CRM components

const dateFormatCache = new Map<string, string>();
const timeFormatCache = new Map<string, string>();

export function formatDate(dateString: string): string {
  if (dateFormatCache.has(dateString)) {
    return dateFormatCache.get(dateString)!;
  }
  
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  dateFormatCache.set(dateString, formatted);
  return formatted;
}

export function formatTime(dateString: string): string {
  if (timeFormatCache.has(dateString)) {
    return timeFormatCache.get(dateString)!;
  }
  
  const date = new Date(dateString);
  const formatted = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  
  timeFormatCache.set(dateString, formatted);
  return formatted;
}

export function formatTimeRange(startTime: string, durationMinutes: number): string {
  const cacheKey = `${startTime}-${durationMinutes}`;
  if (timeFormatCache.has(cacheKey)) {
    return timeFormatCache.get(cacheKey)!;
  }
  
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  
  const startStr = start.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  const endStr = end.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
  
  const formatted = `${startStr} - ${endStr}`;
  timeFormatCache.set(cacheKey, formatted);
  return formatted;
}

export function formatDateShort(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  
  if (dateFormatCache.has(dateString + '-short')) {
    return dateFormatCache.get(dateString + '-short')!;
  }
  
  const date = new Date(dateString);
  const formatted = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  dateFormatCache.set(dateString + '-short', formatted);
  return formatted;
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined || amount === null) return '$0.00';
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(amount);
}

// Clear cache periodically to prevent memory leaks
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (dateFormatCache.size > 1000) {
      dateFormatCache.clear();
    }
    if (timeFormatCache.size > 1000) {
      timeFormatCache.clear();
    }
  }, 300000); // Clear every 5 minutes if cache is large
}
