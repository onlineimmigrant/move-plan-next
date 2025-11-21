import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PricingErrorBoundary } from '../PricingErrorBoundary';

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Working component</div>;
};

describe('PricingErrorBoundary', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress error boundary console errors in tests
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when no error occurs', () => {
    render(
      <PricingErrorBoundary>
        <div>Test content</div>
      </PricingErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should display fallback UI when error occurs', () => {
    render(
      <PricingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PricingErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/Unable to load pricing information/)).toBeInTheDocument();
  });

  it('should show reload button in fallback UI', () => {
    render(
      <PricingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PricingErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload/i });
    expect(reloadButton).toBeInTheDocument();
  });

  it('should reload page when reload button is clicked', () => {
    const mockReload = jest.fn();
    Object.defineProperty(window.location, 'reload', {
      writable: true,
      value: mockReload,
    });

    render(
      <PricingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PricingErrorBoundary>
    );

    const reloadButton = screen.getByRole('button', { name: /reload/i });
    fireEvent.click(reloadButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('should catch errors from child components', () => {
    const { rerender } = render(
      <PricingErrorBoundary>
        <ThrowError shouldThrow={false} />
      </PricingErrorBoundary>
    );

    expect(screen.getByText('Working component')).toBeInTheDocument();

    rerender(
      <PricingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PricingErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should log error information', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <PricingErrorBoundary>
        <ThrowError shouldThrow={true} />
      </PricingErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
