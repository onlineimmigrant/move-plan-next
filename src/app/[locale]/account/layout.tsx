// app/account/layout.tsx
'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { StudentProvider } from '@/lib/StudentContext';
import { BannerProvider } from '@/context/BannerContext';
import  BannerDisplay  from '@/components/banners/BannerDisplay';
import Loading from '@/ui/Loading';

// Error Boundary Component for account section
class AccountErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Account Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="max-w-md w-full p-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 mb-6 bg-red-100/80 dark:bg-red-900/30 backdrop-blur-sm rounded-full flex items-center justify-center border border-red-200/50 dark:border-red-700/50">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Something went wrong
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                We encountered an error loading your account. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-6 py-3 bg-blue-600/90 hover:bg-blue-700/90 dark:bg-blue-500/90 dark:hover:bg-blue-600/90 backdrop-blur-sm text-white font-medium rounded-xl border border-blue-500/20 transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  // Show loading state while auth context is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  // Don't render if no session
  // AuthContext or middleware will handle redirect
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  return (
    <AccountErrorBoundary>
      <StudentProvider>
        <BannerProvider>
          <BannerDisplay />
          {children}
        </BannerProvider>
      </StudentProvider>
    </AccountErrorBoundary>
  );
}