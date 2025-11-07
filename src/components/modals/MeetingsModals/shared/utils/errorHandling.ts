/**
 * Error Handling Utilities for Meetings Module
 * 
 * Provides centralized error handling, logging, and user-friendly error messages.
 */

/**
 * Standard error types for the Meetings module
 */
export enum MeetingsErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Custom error class for Meetings module
 */
export class MeetingsError extends Error {
  type: MeetingsErrorType;
  statusCode?: number;
  details?: unknown;

  constructor(
    message: string,
    type: MeetingsErrorType = MeetingsErrorType.UNKNOWN_ERROR,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'MeetingsError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeetingsError);
    }
  }
}

/**
 * Maps HTTP status codes to error types
 */
function getErrorTypeFromStatus(status: number): MeetingsErrorType {
  if (status === 401 || status === 403) return MeetingsErrorType.AUTH_ERROR;
  if (status === 404) return MeetingsErrorType.NOT_FOUND;
  if (status === 409) return MeetingsErrorType.BOOKING_CONFLICT;
  if (status >= 400 && status < 500) return MeetingsErrorType.VALIDATION_ERROR;
  if (status >= 500) return MeetingsErrorType.NETWORK_ERROR;
  return MeetingsErrorType.UNKNOWN_ERROR;
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
 *   await fetchBookings();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   toast.error(message);
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof MeetingsError) {
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
 * Handles API response errors and converts them to MeetingsError
 * 
 * @param response - Fetch API Response object
 * @returns Promise that rejects with MeetingsError
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/meetings');
 * if (!response.ok) {
 *   await handleApiError(response);
 * }
 * ```
 */
export async function handleApiError(response: Response): Promise<never> {
  const errorType = getErrorTypeFromStatus(response.status);
  let errorMessage = `Request failed with status ${response.status}`;
  let details: unknown;

  try {
    const data = await response.json();
    errorMessage = data.error || data.message || errorMessage;
    details = data;
  } catch {
    // Response body is not JSON or empty
    errorMessage = response.statusText || errorMessage;
  }

  throw new MeetingsError(errorMessage, errorType, response.status, details);
}

/**
 * Safely executes an async function with error handling
 * 
 * @param fn - Async function to execute
 * @param errorHandler - Optional custom error handler
 * @returns Result of the function or undefined on error
 * 
 * @example
 * ```ts
 * const data = await safeAsync(
 *   () => fetchMeetingTypes(),
 *   (error) => console.error('Failed to fetch:', error)
 * );
 * ```
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    if (errorHandler) {
      errorHandler(error);
    } else {
      console.error('Error in safeAsync:', getErrorMessage(error));
    }
    return undefined;
  }
}

/**
 * Validates that a response is successful, throws MeetingsError if not
 * 
 * @param response - Fetch API Response object
 * @returns The same response if successful
 * @throws MeetingsError if response is not ok
 * 
 * @example
 * ```ts
 * const response = await fetch('/api/meetings');
 * await validateResponse(response);
 * const data = await response.json();
 * ```
 */
export async function validateResponse(response: Response): Promise<Response> {
  if (!response.ok) {
    await handleApiError(response);
  }
  return response;
}

/**
 * Creates a retry wrapper for async functions
 * 
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param delayMs - Delay between retries in milliseconds
 * @returns Result of the function
 * 
 * @example
 * ```ts
 * const data = await withRetry(
 *   () => fetch('/api/meetings').then(r => r.json()),
 *   3,
 *   1000
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof MeetingsError && error.statusCode) {
        if (error.statusCode >= 400 && error.statusCode < 500) {
          throw error;
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
    }
  }

  throw lastError;
}

/**
 * Logs error to console with additional context
 * 
 * @param error - Error to log
 * @param context - Additional context information
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Meetings Module Error:', {
      error: error instanceof Error ? error : new Error(String(error)),
      message: getErrorMessage(error),
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // TODO: Send to error tracking service in production
  // if (process.env.NODE_ENV === 'production') {
  //   sendToErrorTracking(error, context);
  // }
}
