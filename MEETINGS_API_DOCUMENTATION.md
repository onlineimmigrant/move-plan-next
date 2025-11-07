# Meetings Module - API Documentation

## Overview

This document provides comprehensive API documentation for all components, utilities, and hooks in the Meetings module.

## Table of Contents

- [Components](#components)
- [Utilities](#utilities)
- [Hooks](#hooks)
- [Types](#types)
- [Error Handling](#error-handling)

---

## Components

### TimeSlotSelector

Sophisticated time slot selection component with keyboard navigation and accessibility features.

#### Props

```typescript
interface TimeSlotSelectorProps {
  /** Array of available time slots to display */
  availableSlots: TimeSlot[];
  
  /** Currently selected time slot */
  selectedSlot: TimeSlot | null;
  
  /** Callback when a slot is selected */
  onSlotSelect: (slot: TimeSlot) => void;
  
  /** Use 24-hour time format (default: true) */
  timeFormat24?: boolean;
  
  /** Admin mode with additional features (default: false) */
  isAdmin?: boolean;
  
  /** Business hours configuration */
  businessHours?: { start: string; end: string };
  
  /** Timezone information for display */
  timezoneInfo?: {
    abbreviation: string;
    offset: string;
    cityName: string;
  };
  
  /** Validation errors to display */
  errors?: Record<string, string>;
  
  /** Additional CSS classes */
  className?: string;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Error state */
  error?: string | null;
  
  /** Callback when retry is clicked */
  onRetry?: () => void;
}
```

#### Usage

```tsx
import { TimeSlotSelector } from './shared/ui/TimeSlotSelector';

function BookingForm() {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  return (
    <TimeSlotSelector
      availableSlots={availableSlots}
      selectedSlot={selectedSlot}
      onSlotSelect={setSelectedSlot}
      timeFormat24={false}
      timezoneInfo={{
        abbreviation: 'PST',
        offset: '-08:00',
        cityName: 'Los Angeles'
      }}
      isLoading={isLoadingSlots}
      error={error}
      onRetry={refetchSlots}
    />
  );
}
```

#### Keyboard Navigation

- **Arrow Up/Down**: Navigate between time slots
- **Enter/Space**: Select focused time slot
- **?**: Show keyboard shortcuts help
- **Escape**: Close keyboard shortcuts help

#### Accessibility

- Full ARIA label support
- Keyboard navigation
- Focus management
- Screen reader compatible

---

### MeetingsErrorBoundary

Error boundary component for catching and handling React errors in the Meetings module.

#### Props

```typescript
interface MeetingsErrorBoundaryProps {
  /** Child components to render */
  children: ReactNode;
  
  /** Custom fallback UI to show on error */
  fallback?: ReactNode;
  
  /** Callback when error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}
```

#### Usage

```tsx
import { MeetingsErrorBoundary } from './shared/ErrorBoundary';

function App() {
  return (
    <MeetingsErrorBoundary
      onError={(error, errorInfo) => {
        // Log to error tracking service
        logToSentry(error, errorInfo);
      }}
      fallback={<CustomErrorUI />}
    >
      <MeetingsAdminModal />
    </MeetingsErrorBoundary>
  );
}
```

#### Default Error UI

The component provides a default error UI with:
- Error message display (development only)
- "Try Again" button to reset error state
- "Reload Page" button to refresh the application
- Contact support message

---

### MeetingsAdminModal

Main administrative interface for managing meetings and bookings.

#### Props

```typescript
interface MeetingsAdminModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** Initial view to display */
  initialView?: 'calendar' | 'bookings' | 'settings';
  
  /** Pre-selected date */
  selectedDate?: Date;
}
```

#### Usage

```tsx
import { MeetingsAdminModal } from './MeetingsModals/MeetingsAdminModal';

function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Manage Meetings
      </button>
      
      <MeetingsAdminModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        initialView="calendar"
        selectedDate={new Date()}
      />
    </>
  );
}
```

#### Features

- Calendar view with month/week/day options
- Booking management
- Meeting type configuration
- Settings management
- Real-time updates

---

### BookingForm

Multi-step booking wizard for creating new bookings.

#### Props

```typescript
interface BookingFormProps {
  /** Available meeting types */
  meetingTypes: MeetingType[];
  
  /** Pre-selected date */
  selectedDate?: Date;
  
  /** Pre-selected time slot */
  selectedSlot?: TimeSlot;
  
  /** Callback on successful booking */
  onSuccess: (booking: Booking) => void;
  
  /** Callback on cancel */
  onCancel: () => void;
  
  /** User timezone */
  userTimezone?: string;
}
```

#### Usage

```tsx
import { BookingForm } from './shared/components/BookingForm';

function CreateBooking() {
  const handleSuccess = (booking: Booking) => {
    toast.success('Booking created successfully!');
    console.log('New booking:', booking);
  };

  return (
    <BookingForm
      meetingTypes={meetingTypes}
      selectedDate={new Date()}
      onSuccess={handleSuccess}
      onCancel={() => setShowForm(false)}
      userTimezone="America/Los_Angeles"
    />
  );
}
```

#### Steps

1. **Time Selection**: Choose date and time slot
2. **Meeting Type**: Select meeting type
3. **Details**: Enter name, email, and message
4. **Confirmation**: Review and submit

---

## Utilities

### Error Handling

#### getErrorMessage

Extracts user-friendly error message from various error types.

```typescript
function getErrorMessage(error: unknown): string

// Usage
try {
  await fetchBookings();
} catch (error) {
  const message = getErrorMessage(error);
  toast.error(message);
}
```

#### validateResponse

Validates that a fetch response is successful, throws MeetingsError if not.

```typescript
async function validateResponse(response: Response): Promise<Response>

// Usage
const response = await fetch('/api/meetings');
await validateResponse(response);
const data = await response.json();
```

#### handleApiError

Handles API response errors and converts them to MeetingsError.

```typescript
async function handleApiError(response: Response): Promise<never>

// Usage
const response = await fetch('/api/meetings');
if (!response.ok) {
  await handleApiError(response);
}
```

#### safeAsync

Safely executes an async function with error handling.

```typescript
async function safeAsync<T>(
  fn: () => Promise<T>,
  errorHandler?: (error: unknown) => void
): Promise<T | undefined>

// Usage
const data = await safeAsync(
  () => fetchMeetingTypes(),
  (error) => console.error('Failed to fetch:', error)
);
```

#### withRetry

Creates a retry wrapper for async functions.

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T>

// Usage
const data = await withRetry(
  () => fetch('/api/meetings').then(r => r.json()),
  3,  // max retries
  1000 // delay in ms
);
```

#### logError

Logs error to console (development) or tracking service (production).

```typescript
function logError(error: unknown, context?: Record<string, unknown>): void

// Usage
try {
  await riskyOperation();
} catch (error) {
  logError(error, {
    component: 'MeetingsAdminModal',
    action: 'loadBookings',
    userId: user?.id,
  });
}
```

---

## Hooks

### useThemeColors

Returns theme colors based on current theme settings.

```typescript
function useThemeColors(): {
  cssVars: {
    primary: string;
    secondary: string;
    // ... other colors
  };
}

// Usage
const themeColors = useThemeColors();
const primaryColor = themeColors.cssVars.primary;
```

### useSettings

Access global settings and configuration.

```typescript
function useSettings(): {
  timeFormat24: boolean;
  timezone: string;
  // ... other settings
}

// Usage
const { timeFormat24, timezone } = useSettings();
```

---

## Types

### TimeSlot

Represents an available time slot for booking.

```typescript
interface TimeSlot {
  /** Start time of the slot */
  start: Date;
  
  /** End time of the slot */
  end: Date;
  
  /** Whether the slot is available */
  available: boolean;
  
  /** Whether the slot is within business hours */
  isBusinessHours?: boolean;
  
  /** Optional ID for the slot */
  id?: string;
}
```

### MeetingType

Represents a type of meeting that can be booked.

```typescript
interface MeetingType {
  /** Unique identifier */
  id: string;
  
  /** Display name */
  name: string;
  
  /** Description of the meeting type */
  description?: string;
  
  /** Duration in minutes */
  duration: number;
  
  /** Color for visual identification */
  color?: string;
  
  /** Whether this type is active */
  active: boolean;
  
  /** Buffer time before meeting (minutes) */
  bufferBefore?: number;
  
  /** Buffer time after meeting (minutes) */
  bufferAfter?: number;
  
  /** Meeting link or location */
  location?: string;
  
  /** Meeting link type */
  locationType?: 'zoom' | 'google_meet' | 'teams' | 'phone' | 'in_person' | 'custom';
}
```

### Booking

Represents a meeting booking.

```typescript
interface Booking {
  /** Unique identifier */
  id: string;
  
  /** Meeting type ID */
  meetingTypeId: string;
  
  /** Start time */
  startTime: Date;
  
  /** End time */
  endTime: Date;
  
  /** Guest name */
  guestName: string;
  
  /** Guest email */
  guestEmail: string;
  
  /** Optional message from guest */
  message?: string;
  
  /** Booking status */
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  
  /** Created timestamp */
  createdAt: Date;
  
  /** Updated timestamp */
  updatedAt: Date;
  
  /** Host user ID */
  hostUserId: string;
  
  /** Meeting link */
  meetingLink?: string;
  
  /** Timezone of the booking */
  timezone: string;
}
```

### MeetingsError

Custom error class for the Meetings module.

```typescript
class MeetingsError extends Error {
  /** Error type */
  type: MeetingsErrorType;
  
  /** HTTP status code if applicable */
  statusCode?: number;
  
  /** Additional error details */
  details?: unknown;

  constructor(
    message: string,
    type?: MeetingsErrorType,
    statusCode?: number,
    details?: unknown
  );
}
```

### MeetingsErrorType

Enum of possible error types.

```typescript
enum MeetingsErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  BOOKING_CONFLICT = 'BOOKING_CONFLICT',
  INVALID_TIME_SLOT = 'INVALID_TIME_SLOT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}
```

---

## Error Handling

### Error Types

The module provides typed errors for better error handling:

```typescript
import { MeetingsError, MeetingsErrorType } from './utils/errorHandling';

try {
  await createBooking(data);
} catch (error) {
  if (error instanceof MeetingsError) {
    switch (error.type) {
      case MeetingsErrorType.BOOKING_CONFLICT:
        toast.error('Time slot no longer available');
        break;
      case MeetingsErrorType.VALIDATION_ERROR:
        toast.error(error.message);
        break;
      default:
        toast.error('An error occurred');
    }
  }
}
```

### Error Boundary Usage

Wrap components with error boundary:

```tsx
<MeetingsErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking
    Sentry.captureException(error, {
      extra: errorInfo
    });
  }}
>
  <YourComponent />
</MeetingsErrorBoundary>
```

### API Error Handling

```typescript
import { validateResponse, handleApiError } from './utils/errorHandling';

// Method 1: Using validateResponse
async function fetchData() {
  const response = await fetch('/api/endpoint');
  await validateResponse(response); // Throws on error
  return await response.json();
}

// Method 2: Manual handling
async function fetchData() {
  const response = await fetch('/api/endpoint');
  if (!response.ok) {
    await handleApiError(response);
  }
  return await response.json();
}
```

---

## Testing

See [MEETINGS_TESTING_GUIDE.md](./MEETINGS_TESTING_GUIDE.md) for comprehensive testing documentation.

## Examples

### Complete Booking Flow

```tsx
import { useState } from 'react';
import { TimeSlotSelector } from './shared/ui/TimeSlotSelector';
import { BookingForm } from './shared/components/BookingForm';
import { MeetingsErrorBoundary } from './shared/ErrorBoundary';
import { validateResponse, getErrorMessage } from './shared/utils/errorHandling';

function BookingPage() {
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/meetings/slots');
      await validateResponse(response);
      const data = await response.json();
      setAvailableSlots(data.slots);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MeetingsErrorBoundary>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Book a Meeting</h1>
        
        <TimeSlotSelector
          availableSlots={availableSlots}
          selectedSlot={selectedSlot}
          onSlotSelect={setSelectedSlot}
          isLoading={isLoading}
          error={error}
          onRetry={fetchSlots}
          timezoneInfo={{
            abbreviation: 'PST',
            offset: '-08:00',
            cityName: 'Los Angeles'
          }}
        />

        {selectedSlot && (
          <BookingForm
            meetingTypes={meetingTypes}
            selectedSlot={selectedSlot}
            onSuccess={(booking) => {
              toast.success('Booking created!');
              router.push(`/bookings/${booking.id}`);
            }}
            onCancel={() => setSelectedSlot(null)}
          />
        )}
      </div>
    </MeetingsErrorBoundary>
  );
}
```

---

## Migration Guide

### From Old Error Handling

```typescript
// Old way ❌
try {
  const res = await fetch('/api/meetings');
  const data = await res.json();
  if (!res.ok) {
    alert('Error!');
  }
} catch (err) {
  alert('Error!');
}

// New way ✅
import { validateResponse, getErrorMessage } from './utils/errorHandling';

try {
  const res = await fetch('/api/meetings');
  await validateResponse(res);
  const data = await res.json();
  toast.success('Success!');
} catch (err) {
  toast.error(getErrorMessage(err));
}
```

---

## Resources

- [Testing Guide](./MEETINGS_TESTING_GUIDE.md)
- [Error Handling Guide](./MEETINGS_ERROR_HANDLING_GUIDE.md)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
