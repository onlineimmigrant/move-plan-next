/**
 * Debug utility for development-only logging
 * All console statements are removed in production builds
 */

const DEBUG = process.env.NODE_ENV === 'development';

export const debug = {
  /**
   * Log a message with a namespace prefix
   * Only logs in development environment
   * 
   * @param namespace - The component or module name (e.g., 'PostPageClient', 'MasterTOC')
   * @param args - Arguments to log
   */
  log: (namespace: string, ...args: any[]) => {
    if (DEBUG) {
      console.log(`[${namespace}]`, ...args);
    }
  },

  /**
   * Log an error with a namespace prefix
   * Always logs (even in production) as errors should be tracked
   * 
   * @param namespace - The component or module name
   * @param args - Arguments to log
   */
  error: (namespace: string, ...args: any[]) => {
    console.error(`[${namespace}]`, ...args);
  },

  /**
   * Log a warning with a namespace prefix
   * Always logs (even in production) as warnings should be tracked
   * 
   * @param namespace - The component or module name
   * @param args - Arguments to log
   */
  warn: (namespace: string, ...args: any[]) => {
    console.warn(`[${namespace}]`, ...args);
  },

  /**
   * Create a collapsible group for related logs
   * Only works in development environment
   * 
   * @param namespace - The component or module name
   * @param label - The group label
   * @param fn - Function containing the logs to group
   */
  group: (namespace: string, label: string, fn: () => void) => {
    if (DEBUG) {
      console.group(`[${namespace}] ${label}`);
      fn();
      console.groupEnd();
    }
  },

  /**
   * Log with an emoji prefix for visual scanning
   * Only logs in development environment
   * 
   * @param namespace - The component or module name
   * @param emoji - Emoji to prefix the log
   * @param args - Arguments to log
   */
  emoji: (namespace: string, emoji: string, ...args: any[]) => {
    if (DEBUG) {
      // console.log(`${emoji} [${namespace}]`, ...args);
    }
  },
};
