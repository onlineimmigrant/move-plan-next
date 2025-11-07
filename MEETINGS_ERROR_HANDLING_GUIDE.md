# Meetings Module - Error Handling Guide

## Overview

This guide explains the error handling architecture, patterns, and best practices for the Meetings module.

## Error Handling Architecture

### 1. Error Types

The module uses typed errors for better error handling:

```typescript
enum MeetingsErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',           // Network/API failures
  VALIDATION_ERROR = 'VALIDATION_ERROR',     // Input validation failures
  AUTH_ERROR = 'AUTH_ERROR',                 // Authentication/authorization failures
  NOT_FOUND = 'NOT_FOUND',                   // Resource not found
  PERMISSION_DENIED = 'PERMISSION_DENIED',   // Insufficient permissions
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',     // Time slot conflicts
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',   // Invalid time selection
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',           // Unexpected errors
}
```

### 2. Custom Error Class

```typescript
class MeetingsError extends Error {
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
  }
}
```

## Usage Patterns

### 1. API Call Error Handling

**Basic Pattern:**

```typescript
import { validateResponse, getErrorMessage } from './utils/errorHandling';

async function fetchMeetingTypes() {
  try {
    const response = await fetch('/api/meetings/types');
    await validateResponse(response); // Throws MeetingsError if not ok
    return await response.json();
  } catch (error) {
    const message = getErrorMessage(error);
    toast.error(message);
    throw error; // Re-throw if caller needs to handle it
  }
}
```

**Advanced Pattern with Retry:**

```typescript
import { withRetry, validateResponse } from './utils/errorHandling';

async function fetchBookingsWithRetry() {
  return withRetry(async () => {
    const response = await fetch('/api/meetings/bookings');
    await validateResponse(response);
    return await response.json();
  }, 3, 1000); // 3 retries, 1 second delay
}
```

### 2. Form Validation Error Handling

```typescript
async function handleBookingSubmit(formData: BookingFormData) {
  try {
    // Validate inputs
    if (!formData.email || !isValidEmail(formData.email)) {
      throw new MeetingsError(
        'Please enter a valid email address',
        MeetingsErrorType.VALIDATION_ERROR
      );
    }

    if (!formData.timeSlot) {
      throw new MeetingsError(
        'Please select a time slot',
        MeetingsErrorType.INVALID_TIME_SLOT
      );
    }

    // Submit booking
    const response = await fetch('/api/meetings/bookings', {
      method: 'POST',
      body: JSON.stringify(formData),
    });

    await validateResponse(response);
    toast.success('Booking created successfully!');
  } catch (error) {
    if (error instanceof MeetingsError) {
      // Handle specific error types
      switch (error.type) {
        case MeetingsErrorType.BOOKING_CONFLICT:
          toast.error('This time slot is no longer available. Please choose another.');
          break;
        case MeetingsErrorType.VALIDATION_ERROR:
          toast.error(error.message);
          break;
        default:
          toast.error('Failed to create booking. Please try again.');
      }
    } else {
      toast.error('An unexpected error occurred');
    }
  }
}
```

### 3. Safe Async Execution

For non-critical operations where you want to continue even if they fail:

```typescript
import { safeAsync } from './utils/errorHandling';

async function loadOptionalData() {
  // Won't throw, returns undefined on error
  const analytics = await safeAsync(
    () => fetch('/api/analytics').then(r => r.json()),
    (error) => console.warn('Analytics failed to load:', error)
  );

  // Continue with main functionality even if analytics failed
  return { analytics };
}
```

### 4. Component-Level Error Handling

**Using Error States:**

```typescript
function MeetingsAdminModal() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBookings = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/meetings/bookings');
      await validateResponse(response);
      const data = await response.json();
      setBookings(data);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-800">{error}</p>
        <button onClick={loadBookings} className="mt-2 text-blue-600">
          Try Again
        </button>
      </div>
    );
  }

  // ... rest of component
}
```

**Using Error Boundary:**

```tsx
import { MeetingsErrorBoundary } from './shared/ErrorBoundary';

function App() {
  return (
    <MeetingsErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        logErrorToService(error, errorInfo);
      }}
    >
      <MeetingsAdminModal />
    </MeetingsErrorBoundary>
  );
}
```

## Error Recovery Strategies

### 1. Automatic Retry

```typescript
// Automatically retry failed requests
const data = await withRetry(
  () => fetchMeetingTypes(),
  3, // max retries
  1000 // initial delay in ms (uses exponential backoff)
);
```

### 2. Fallback Data

```typescript
async function loadMeetingTypes() {
  try {
    return await fetchMeetingTypes();
  } catch (error) {
    console.warn('Failed to load meeting types, using cache');
    return getCachedMeetingTypes() || [];
  }
}
```

### 3. Partial Failure Handling

```typescript
async function loadAllData() {
  const [bookings, types, settings] = await Promise.allSettled([
    fetchBookings(),
    fetchMeetingTypes(),
    fetchSettings(),
  ]);

  return {
    bookings: bookings.status === 'fulfilled' ? bookings.value : [],
    types: types.status === 'fulfilled' ? types.value : [],
    settings: settings.status === 'fulfilled' ? settings.value : defaultSettings,
  };
}
```

### 4. User-Initiated Retry

```tsx
function BookingForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      await createBooking(formData);
      onSuccess();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      {submitError && (
        <div className="mt-4 p-3 bg-red-50 rounded">
          <p className="text-red-800">{submitError}</p>
          <button type="submit" className="mt-2 text-blue-600">
            Try Again
          </button>
        </div>
      )}
    </form>
  );
}
```

## Error Logging

### Development

```typescript
import { logError } from './utils/errorHandling';

try {
  await riskyOperation();
} catch (error) {
  logError(error, {
    component: 'MeetingsAdminModal',
    action: 'loadBookings',
    userId: user?.id,
  });
  throw error;
}
```

### Production

Integrate with error tracking services:

```typescript
// utils/errorHandling.ts
export function logError(error: unknown, context?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('Meetings Module Error:', { error, context });
  }

  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry, LogRocket, etc.
    if (window.Sentry) {
      Sentry.captureException(error, {
        tags: { module: 'meetings' },
        extra: context,
      });
    }
  }
}
```

## User-Friendly Error Messages

### Message Mapping

```typescript
function getUserFriendlyMessage(error: MeetingsError): string {
  const messages: Record<MeetingsErrorType, string> = {
    [MeetingsErrorType.NETWORK_ERROR]: 
      'Unable to connect to the server. Please check your internet connection.',
    [MeetingsErrorType.VALIDATION_ERROR]: 
      error.message, // Use specific validation message
    [MeetingsErrorType.AUTH_ERROR]: 
      'You need to be signed in to perform this action.',
    [MeetingsErrorType.NOT_FOUND]: 
      'The requested resource could not be found.',
    [MeetingsErrorType.PERMISSION_DENIED]: 
      'You don\'t have permission to perform this action.',
    [MeetingsErrorType.BOOKING_CONFLICT]: 
      'This time slot is no longer available. Please choose another time.',
    [MeetingsErrorType.INVALID_TIME_SLOT]: 
      'Please select a valid time slot.',
    [MeetingsErrorType.UNKNOWN_ERROR]: 
      'An unexpected error occurred. Please try again.',
  };

  return messages[error.type] || messages[MeetingsErrorType.UNKNOWN_ERROR];
}
```

## Common Error Scenarios

### 1. Network Timeout

```typescript
async function fetchWithTimeout(url: string, timeout = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    await validateResponse(response);
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new MeetingsError(
        'Request timed out. Please try again.',
        MeetingsErrorType.NETWORK_ERROR
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

### 2. Stale Data

```typescript
async function refreshBookings() {
  const cachedData = getCachedBookings();
  
  try {
    const freshData = await fetchBookings();
    updateCache(freshData);
    return freshData;
  } catch (error) {
    if (cachedData) {
      toast.warning('Using cached data. Failed to refresh.');
      return cachedData;
    }
    throw error;
  }
}
```

### 3. Concurrent Operations

```typescript
async function handleConcurrentBooking() {
  try {
    const response = await fetch('/api/meetings/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });

    if (response.status === 409) {
      throw new MeetingsError(
        'This time slot was just booked by someone else. Please select another time.',
        MeetingsErrorType.BOOKING_CONFLICT,
        409
      );
    }

    await validateResponse(response);
    return await response.json();
  } catch (error) {
    if (error instanceof MeetingsError && error.type === MeetingsErrorType.BOOKING_CONFLICT) {
      // Refresh available slots
      await refreshAvailableSlots();
    }
    throw error;
  }
}
```

## Best Practices

### 1. Always Handle Errors

```typescript
// ❌ Bad - unhandled promise rejection
fetch('/api/meetings').then(r => r.json());

// ✅ Good - explicit error handling
fetch('/api/meetings')
  .then(r => r.json())
  .catch(error => {
    console.error('Failed to fetch:', error);
    toast.error('Failed to load meetings');
  });

// ✅ Better - async/await with try-catch
try {
  const response = await fetch('/api/meetings');
  await validateResponse(response);
  const data = await response.json();
} catch (error) {
  handleError(error);
}
```

### 2. Provide Context

```typescript
try {
  await deleteBooking(bookingId);
} catch (error) {
  logError(error, {
    action: 'deleteBooking',
    bookingId,
    timestamp: new Date().toISOString(),
  });
}
```

### 3. Don't Swallow Errors

```typescript
// ❌ Bad - silent failure
try {
  await riskyOperation();
} catch (error) {
  // Nothing here
}

// ✅ Good - at minimum, log the error
try {
  await riskyOperation();
} catch (error) {
  console.error('Operation failed:', error);
  // Optionally re-throw or handle
}
```

### 4. Use Type Guards

```typescript
function handleError(error: unknown) {
  if (error instanceof MeetingsError) {
    // Handle typed error
    switch (error.type) {
      case MeetingsErrorType.AUTH_ERROR:
        redirectToLogin();
        break;
      // ... other cases
    }
  } else if (error instanceof Error) {
    // Handle generic Error
    toast.error(error.message);
  } else {
    // Handle unknown error types
    toast.error('An unexpected error occurred');
  }
}
```

## Testing Error Handling

See [MEETINGS_TESTING_GUIDE.md](./MEETINGS_TESTING_GUIDE.md) for comprehensive testing examples.

## Resources

- [Error Handling in React](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [JavaScript Error Handling Best Practices](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
