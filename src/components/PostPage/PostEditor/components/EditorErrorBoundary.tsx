'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary for PostEditor sections
 * Prevents editor crashes from breaking the entire page
 * 
 * @example
 * ```tsx
 * <EditorErrorBoundary fallback={<div>Editor failed to load</div>}>
 *   <VisualEditor />
 * </EditorErrorBoundary>
 * ```
 */
export class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PostEditor Error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
            Editor Error
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4 text-center max-w-md">
            {this.state.error?.message || 'An unexpected error occurred in the editor'}
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            aria-label="Reset editor"
          >
            Reset Editor
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
