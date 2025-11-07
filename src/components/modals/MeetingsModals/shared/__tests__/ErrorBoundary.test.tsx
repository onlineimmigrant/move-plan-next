import { render, screen, waitFor } from '@testing-library/react';
import { MeetingsErrorBoundary } from '../ErrorBoundary';

// Component that throws an error
const ErrorComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Success</div>;
};

describe('MeetingsErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={false} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('renders error UI when child component throws', () => {
    render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
  });

  it('displays Try Again button', () => {
    render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('displays Reload Page button', () => {
    render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('calls custom error handler when provided', () => {
    const mockErrorHandler = jest.fn();

    render(
      <MeetingsErrorBoundary onError={mockErrorHandler}>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom Error UI</div>;

    render(
      <MeetingsErrorBoundary fallback={customFallback}>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('shows error message in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('resets error state when Try Again is clicked', async () => {
    const { rerender } = render(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={true} />
      </MeetingsErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click Try Again
    const tryAgainButton = screen.getByText('Try Again');
    tryAgainButton.click();

    // Rerender with no error
    rerender(
      <MeetingsErrorBoundary>
        <ErrorComponent shouldThrow={false} />
      </MeetingsErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });
});
