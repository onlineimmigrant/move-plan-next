'use client';

import React, { Component, ReactNode } from 'react';
import { ErrorState } from '@/components/modals/ShopModal/components';

interface EmailErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface EmailErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for Email Modal
 * Catches React errors and displays a fallback UI
 */
export class EmailErrorBoundary extends Component<EmailErrorBoundaryProps, EmailErrorBoundaryState> {
  constructor(props: EmailErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): EmailErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Email Modal Error:', error, errorInfo);
    
    // In production, you might want to log this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <ErrorState
            message={this.state.error?.message || 'Something went wrong loading the email module'}
            onRetry={this.handleReset}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
