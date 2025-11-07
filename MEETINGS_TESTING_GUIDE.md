# Meetings Module - Testing Guide

## Overview

This guide covers testing strategies, setup, and best practices for the Meetings module.

## Test Setup

### Prerequisites

Install required dependencies:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @swc/jest
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test TimeSlotSelector.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="keyboard navigation"
```

## Test Structure

### Directory Organization

```
src/components/modals/MeetingsModals/
├── shared/
│   ├── __tests__/
│   │   ├── ErrorBoundary.test.tsx
│   │   ├── errorHandling.test.ts
│   │   └── TimeSlotSelector.test.tsx
│   ├── ErrorBoundary.tsx
│   └── utils/
│       └── errorHandling.ts
```

### Test File Naming

- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Integration tests: `feature.integration.test.tsx`

## Testing Patterns

### 1. Component Testing

**Example: TimeSlotSelector Component**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TimeSlotSelector from '../ui/TimeSlotSelector';

describe('TimeSlotSelector', () => {
  const mockSlots = [
    { time: '09:00 AM', available: true },
    { time: '10:00 AM', available: false },
  ];

  it('renders all time slots', () => {
    render(
      <TimeSlotSelector
        slots={mockSlots}
        selectedSlot={null}
        onSlotSelect={jest.fn()}
      />
    );

    expect(screen.getByText('09:00 AM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM')).toBeInTheDocument();
  });

  it('calls onSlotSelect when clicked', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();

    render(
      <TimeSlotSelector
        slots={mockSlots}
        selectedSlot={null}
        onSlotSelect={handleSelect}
      />
    );

    await user.click(screen.getByText('09:00 AM'));
    expect(handleSelect).toHaveBeenCalledWith('09:00 AM');
  });
});
```

### 2. Error Handling Testing

**Example: Error Utilities**

```typescript
import { MeetingsError, getErrorMessage, withRetry } from '../utils/errorHandling';

describe('Error Handling', () => {
  it('extracts error messages correctly', () => {
    const error = new MeetingsError('Test error', MeetingsErrorType.VALIDATION_ERROR);
    expect(getErrorMessage(error)).toBe('Test error');
  });

  it('retries failed operations', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new Error('Fail'))
      .mockResolvedValue('Success');

    const result = await withRetry(fn, 3, 100);
    expect(result).toBe('Success');
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
```

### 3. Error Boundary Testing

**Example: React Error Boundaries**

```tsx
import { render, screen } from '@testing-library/react';
import { MeetingsErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Success</div>;
};

describe('MeetingsErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});
```

### 4. Accessibility Testing

**Example: Keyboard Navigation**

```tsx
describe('Keyboard Navigation', () => {
  it('supports arrow key navigation', () => {
    render(<TimeSlotSelector slots={mockSlots} {...props} />);

    const firstSlot = screen.getByText('09:00 AM').closest('button');
    firstSlot?.focus();
    fireEvent.keyDown(firstSlot!, { key: 'ArrowDown' });

    const secondSlot = screen.getByText('10:00 AM').closest('button');
    expect(document.activeElement).toBe(secondSlot);
  });

  it('has proper ARIA labels', () => {
    render(<TimeSlotSelector slots={mockSlots} {...props} />);
    
    const slot = screen.getByText('09:00 AM').closest('button');
    expect(slot).toHaveAttribute('aria-label', expect.stringContaining('09:00 AM'));
  });
});
```

### 5. Async Testing

**Example: API Calls**

```tsx
import { waitFor } from '@testing-library/react';

describe('Data Fetching', () => {
  it('loads bookings on mount', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ bookings: [/* ... */] }),
    });
    global.fetch = mockFetch;

    render(<MeetingsAdminModal />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/meetings/bookings');
    });

    expect(screen.getByText('Booking 1')).toBeInTheDocument();
  });
});
```

## Mocking Strategies

### 1. Mock API Responses

```typescript
beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (url === '/api/meetings/types') {
      return Promise.resolve({
        ok: true,
        json: async () => ({ types: mockMeetingTypes }),
      });
    }
    return Promise.reject(new Error('Unknown endpoint'));
  }) as jest.Mock;
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

### 2. Mock Supabase Client

```typescript
jest.mock('@/lib/supabase/client', () => ({
  createClientComponentClient: () => ({
    from: jest.fn(() => ({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    })),
  }),
}));
```

### 3. Mock Next.js Router

```typescript
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/',
    query: {},
  }),
  useSearchParams: () => new URLSearchParams(),
}));
```

## Coverage Goals

### Minimum Requirements

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Priority Coverage Areas

1. **Critical User Flows**
   - Booking creation
   - Meeting type management
   - Calendar navigation
   - Time slot selection

2. **Error Handling**
   - API failures
   - Validation errors
   - Network issues

3. **Accessibility**
   - Keyboard navigation
   - Screen reader support
   - Focus management

4. **Edge Cases**
   - Empty states
   - Loading states
   - Error states

## Best Practices

### 1. Test Naming

```typescript
// ❌ Bad
it('test 1', () => { ... });

// ✅ Good
it('displays error message when booking fails', () => { ... });
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('selects time slot on click', async () => {
  // Arrange
  const user = userEvent.setup();
  const handleSelect = jest.fn();
  render(<TimeSlotSelector onSlotSelect={handleSelect} {...props} />);

  // Act
  await user.click(screen.getByText('09:00 AM'));

  // Assert
  expect(handleSelect).toHaveBeenCalledWith('09:00 AM');
});
```

### 3. Avoid Implementation Details

```typescript
// ❌ Bad - testing implementation
expect(component.state.isOpen).toBe(true);

// ✅ Good - testing behavior
expect(screen.getByRole('dialog')).toBeInTheDocument();
```

### 4. Use User Events Over Fire Events

```typescript
// ❌ Less realistic
fireEvent.click(button);

// ✅ More realistic user interaction
await user.click(button);
```

### 5. Clean Up After Tests

```typescript
afterEach(() => {
  jest.clearAllMocks();
  cleanup(); // From @testing-library/react
});
```

## Common Testing Scenarios

### Testing Form Validation

```tsx
it('shows validation error for invalid email', async () => {
  const user = userEvent.setup();
  render(<BookingForm />);

  await user.type(screen.getByLabelText(/email/i), 'invalid-email');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
});
```

### Testing Loading States

```tsx
it('shows loading spinner while fetching data', async () => {
  render(<MeetingsAdminModal />);

  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
```

### Testing Error States

```tsx
it('displays error message on API failure', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

  render(<MeetingsAdminModal />);

  await waitFor(() => {
    expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
  });
});
```

## Debugging Tests

### Enable Debug Output

```typescript
import { render, screen } from '@testing-library/react';

it('debugging test', () => {
  const { debug } = render(<Component />);
  
  // Print entire DOM
  debug();
  
  // Print specific element
  debug(screen.getByRole('button'));
});
```

### Check What's Rendered

```typescript
// See all accessible roles
screen.logTestingPlaygroundURL();

// Find elements
screen.getByRole('button', { name: /submit/i });
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## Resources

- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
