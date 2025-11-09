/**
 * Production-safe logger utility
 * Only logs in development environment
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.isDevelopment && level !== 'error') {
      return; // Only log errors in production
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message, ...args);
        // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'info':
        console.info(prefix, message, ...args);
        break;
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      default:
        console.log(prefix, message, ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    this.formatMessage('log', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('info', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }
}

export const logger = new Logger();
