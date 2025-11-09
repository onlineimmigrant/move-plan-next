/**
 * Error Boundary for Tickets Module
 * 
 * Catches JavaScript errors anywhere in the ticket modal component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logError } from './utils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * TicketsErrorBoundary
 * 
 * Wraps ticket modal components to catch and handle errors gracefully.
 * Provides a user-friendly error UI with retry functionality.
 * 
 * @example
 * ```tsx
 * <TicketsErrorBoundary>
 *   <TicketsAdminModal isOpen={isOpen} onClose={onClose} />
 * </TicketsErrorBoundary>
 * ```
 */
export class TicketsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details
    logError(error, {
      context: 'Tickets Module Error Boundary',
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If custom fallback provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with glass morphism
      return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000] p-4">
          <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100/80 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Something went wrong
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  We encountered an error while loading the tickets module. 
                  Please try refreshing the page or contact support if the problem persists.
                </p>

                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mb-4">
                    <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 mb-2">
                      Error Details (Development Only)
                    </summary>
                    <div className="bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-3 overflow-auto max-h-40">
                      <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                        {this.state.error.toString()}
                      </pre>
                      {this.state.errorInfo && (
                        <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 whitespace-pre-wrap">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm hover:shadow-md font-medium text-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </button>

                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-700/80 text-gray-700 dark:text-gray-200 rounded-lg transition-all border border-gray-300 dark:border-gray-600 font-medium text-sm"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default TicketsErrorBoundary;
