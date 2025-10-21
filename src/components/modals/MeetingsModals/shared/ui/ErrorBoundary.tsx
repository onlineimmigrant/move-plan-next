import React, { Component, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { MEETINGS_THEME } from '../theme';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showRetry?: boolean;
  className?: string;
}

/**
 * Error Boundary for Meetings Modals
 * Catches JavaScript errors in the component tree and displays a fallback UI
 */
export class MeetingsErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Meetings Modal Error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={`flex flex-col items-center justify-center min-h-[300px] p-6 text-center ${this.props.className || ''}`}>
          <div className="mb-4">
            <ExclamationTriangleIcon
              className="mx-auto h-12 w-12 text-red-500"
              style={{ color: MEETINGS_THEME.colors.error[500] }}
            />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Something went wrong
          </h3>

          <p className="text-gray-600 mb-4 max-w-md">
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </p>

          {this.props.showRetry !== false && (
            <button
              onClick={this.handleRetry}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              style={{
                backgroundColor: MEETINGS_THEME.colors.primary[600],
              }}
            >
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Try Again
            </button>
          )}

          {/* Development error details */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mt-4 text-left max-w-2xl">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  className?: string;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center min-h-[200px] p-6 text-center ${className}`}>
    <div className="mb-4">
      <ExclamationTriangleIcon
        className="mx-auto h-8 w-8 text-red-500"
        style={{ color: MEETINGS_THEME.colors.error[500] }}
      />
    </div>

    <h4 className="text-base font-semibold text-gray-900 mb-2">
      Something went wrong
    </h4>

    <p className="text-gray-600 text-sm mb-4 max-w-sm">
      {error?.message || 'An unexpected error occurred. Please try again.'}
    </p>

    {resetError && (
      <button
        onClick={resetError}
        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        style={{
          backgroundColor: MEETINGS_THEME.colors.primary[600],
        }}
      >
        <ArrowPathIcon className="w-4 h-4 mr-1.5" />
        Retry
      </button>
    )}
  </div>
);