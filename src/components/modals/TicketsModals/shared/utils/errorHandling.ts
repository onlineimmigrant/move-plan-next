/**
 * Error Handling Utilities for Tickets Module
 * 
 * Provides centralized error handling, logging, and user-friendly error messages.
 */

/**
 * Standard error types for the Tickets module
 */
export enum TicketsErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for Tickets module
 */
export class TicketsError extends Error {
  type: TicketsErrorType;
  statusCode?: number;
  details?: unknown;

  constructor(
    message: string,
    type: TicketsErrorType = TicketsErrorType.UNKNOWN_ERROR,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'TicketsError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TicketsError);
    }
  }
}

/**
 * Maps HTTP status codes to error types
 */
function getErrorTypeFromStatus(status: number): TicketsErrorType {
  if (status === 401 || status === 403) return TicketsErrorType.AUTH_ERROR;
  if (status === 404) return TicketsErrorType.NOT_FOUND;
  if (status === 413) return TicketsErrorType.FILE_UPLOAD_ERROR;
  if (status === 429) return TicketsErrorType.RATE_LIMIT_ERROR;
  if (status >= 400 && status < 500) return TicketsErrorType.VALIDATION_ERROR;
  if (status >= 500) return TicketsErrorType.NETWORK_ERROR;
  return TicketsErrorType.UNKNOWN_ERROR;
}

/**
 * Extracts user-friendly error message from various error types
 * 
 * @param error - The error to extract message from
 * @returns User-friendly error message
 * 
 * @example
 * ```ts
 * try {
 *   await fetchTickets();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   showToast(message, 'error');
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof TicketsError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Handles API response errors and converts them to TicketsError
 * 
 * @param response - Fetch API Response object
 * @returns Promise that rejects with TicketsError
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/tickets');
 * if (!response.ok) {
 *   throw await handleApiError(response);
 * }
 * ```
 */
export async function handleApiError(response: Response): Promise<TicketsError> {
  const errorType = getErrorTypeFromStatus(response.status);
  let errorMessage = `Request failed with status ${response.status}`;
  let errorDetails: unknown;

  try {
    const data = await response.json();
    errorMessage = data.error || data.message || errorMessage;
    errorDetails = data;
  } catch {
    // If response body is not JSON, use status text
    errorMessage = response.statusText || errorMessage;
  }

  return new TicketsError(errorMessage, errorType, response.status, errorDetails);
}

/**
 * Logs error with context information
 * 
 * @param error - The error to log
 * @param context - Additional context about where/why the error occurred
 * 
 * @example
 * ```ts
 * try {
 *   await sendMessage(ticketId, message);
 * } catch (error) {
 *   logError(error, { 
 *     context: 'Sending ticket message', 
 *     ticketId,
 *     userId 
 *   });
 *   throw error;
 * }
 * ```
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const errorMessage = getErrorMessage(error);
  const errorType = error instanceof TicketsError ? error.type : 'UNKNOWN';
  
  // In development, log full error details
  if (process.env.NODE_ENV === 'development') {
    console.error('[Tickets Error]', {
      type: errorType,
      message: errorMessage,
      error,
      context,
      timestamp: new Date().toISOString(),
    });
  } else {
    // In production, log minimal info (you might want to send to error tracking service)
    console.error('[Tickets Error]', errorType, errorMessage);
  }

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

/**
 * User-friendly error messages based on error type
 */
export const ERROR_MESSAGES: Record<TicketsErrorType, string> = {
  [TicketsErrorType.NETWORK_ERROR]: 
    'Unable to connect to the server. Please check your internet connection and try again.',
  [TicketsErrorType.VALIDATION_ERROR]: 
    'Please check your input and try again.',
  [TicketsErrorType.AUTH_ERROR]: 
    'You need to be logged in to perform this action.',
  [TicketsErrorType.NOT_FOUND]: 
    'The requested ticket could not be found.',
  [TicketsErrorType.PERMISSION_DENIED]: 
    'You do not have permission to perform this action.',
  [TicketsErrorType.FILE_UPLOAD_ERROR]: 
    'File upload failed. The file may be too large or in an unsupported format.',
  [TicketsErrorType.RATE_LIMIT_ERROR]: 
    'Too many requests. Please wait a moment and try again.',
  [TicketsErrorType.UNKNOWN_ERROR]: 
    'An unexpected error occurred. Please try again later.',
};

/**
 * Get a user-friendly error message based on error type
 * 
 * @param error - The error to get message for
 * @returns User-friendly error message
 */
export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof TicketsError) {
    return ERROR_MESSAGES[error.type] || error.message;
  }
  
  return getErrorMessage(error);
}

/**
 * Checks if an error is a specific type
 * 
 * @param error - The error to check
 * @param type - The error type to check for
 * @returns True if error matches type
 */
export function isErrorType(error: unknown, type: TicketsErrorType): boolean {
  return error instanceof TicketsError && error.type === type;
}

/**
 * Retry helper for failed operations
 * 
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of retry attempts
 * @param delay - Delay between retries in milliseconds
 * @returns Promise with the result of the function
 * 
 * @example
 * ```ts
 * const tickets = await retry(
 *   () => fetchTickets(organizationId),
 *   3,
 *   1000
 * );
 * ```
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on auth or validation errors
      if (error instanceof TicketsError) {
        if (
          error.type === TicketsErrorType.AUTH_ERROR ||
          error.type === TicketsErrorType.VALIDATION_ERROR ||
          error.type === TicketsErrorType.PERMISSION_DENIED
        ) {
          throw error;
        }
      }

      // If this isn't the last attempt, wait before retrying
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * Safe async wrapper that catches and logs errors
 * 
 * @param fn - The async function to wrap
 * @param fallback - Fallback value to return on error
 * @param context - Context for error logging
 * @returns Promise with result or fallback
 * 
 * @example
 * ```ts
 * const tickets = await safeAsync(
 *   () => fetchTickets(orgId),
 *   [],
 *   { context: 'Loading tickets', orgId }
 * );
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}
