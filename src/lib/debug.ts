/**
 * Debug utility for development-only logging
 * Prevents console pollution in production
 */

export const debug = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args);
    }
  },
  
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args);
    }
  },
  
  table: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.table(...args);
    }
  }
};
