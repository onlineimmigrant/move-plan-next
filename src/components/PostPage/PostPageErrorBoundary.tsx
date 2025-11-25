'use client';

import React from 'react';
import { debug } from '@/utils/debug';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorCount: number;
  isRetrying: boolean;
}

/**
 * Error Boundary for Post Page
 * Catches JavaScript errors in the post page component tree and displays a fallback UI
 * Includes automatic retry mechanism with exponential backoff
 */
export class PostPageErrorBoundary extends React.Component<Props, State> {
  private retryTimeoutId?: NodeJS.Timeout;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      errorCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    debug.error('PostPageErrorBoundary', 'Component Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState(prev => ({
      error,
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    // Auto-retry with exponential backoff (max 3 attempts)
    if (this.state.errorCount < 3) {
      const delay = Math.min(1000 * Math.pow(2, this.state.errorCount), 8000);
      debug.log('PostPageErrorBoundary', `Auto-retry in ${delay}ms (attempt ${this.state.errorCount + 1}/3)`);
      
      this.setState({ isRetrying: true });
      
      this.retryTimeoutId = setTimeout(() => {
        this.handleReset();
      }, delay);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleReset = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
    
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      isRetrying: false,
      // Keep errorCount to prevent infinite loops
    });
  };

  handleHardReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      errorCount: 0,
      isRetrying: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoBack = () => {
    window.history.back();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred while loading this page.'}
            </p>

            {/* Retry state indicator */}
            {this.state.isRetrying && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  Attempting to recover... (Retry {this.state.errorCount}/3)
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                disabled={this.state.errorCount >= 3 || this.state.isRetrying}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className="h-5 w-5" />
                {this.state.errorCount >= 3 ? 'Max retries reached' : this.state.isRetrying ? 'Retrying...' : 'Try Again'}
              </button>

              {this.state.errorCount >= 3 && (
                <button
                  onClick={this.handleHardReset}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Reset and Try Again
                </button>
              )}

              <button
                onClick={this.handleReload}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Reload Page
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Go to Home
              </button>
            </div>

            {/* Development details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                  {this.state.error.stack}
                </pre>
                {this.state.errorInfo && (
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
