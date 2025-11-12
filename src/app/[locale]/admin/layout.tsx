'use client';

import { ReactNode, useEffect, useMemo, useCallback, useRef, Suspense, lazy, Component, ErrorInfo } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { ModalProvider } from '@/context/ModalContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import AccountTopBar from '@/components/AccountTopBar';
import ParentMenu from './components/ParentMenu';
import Loading from '@/ui/Loading';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useMenuVisibility } from '@/hooks/useMenuVisibility';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { getFilteredSidebarLinks, DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { reportSidebarLinks, DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';
import { sidebarLinks } from '@/lib/sidebarLinks';
import { UnifiedModalManager } from '@/components/modals/UnifiedMenu';

// Lazy load sidebar menus for better initial load performance
const TablesChildMenu = lazy(() => import('./components/TablesChildMenu'));
const ReportsChildMenu = lazy(() => import('./components/ReportsChildMenu'));

// Error Boundary Component for sidebar menus
class SidebarErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Sidebar Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">
              Failed to load menu. Please refresh the page.
            </p>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Loading fallback for lazy loaded components
const MenuLoadingFallback = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white" />
  </div>
);

// Inner component that uses auth context
function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isSuperadmin, isInGeneralOrganization, isLoading } = useAuth();
  const { isMobileMenuOpen } = useSidebar();

  // Use custom hooks for state management and visibility logic
  const { state: sidebarState, actions } = useSidebarState();
  const isDesktop = useIsDesktop();
  const { shouldShowTablesChildMenu, shouldShowReportsChildMenu } = useMenuVisibility({
    pathname,
    activeSection: sidebarState.activeSection,
    isTablesHovered: sidebarState.isTablesHovered,
    isParentMenuOpen: sidebarState.isParentMenuOpen,
    isDesktop,
  });
  
  // Ref to track hover timeout for cleanup
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize filtered sidebar links to prevent unnecessary recalculations
  const filteredSidebarLinks = useMemo(
    () => getFilteredSidebarLinks(sidebarLinks, isInGeneralOrganization),
    [isInGeneralOrganization]
  );

  // Sync ParentMenu open state with navbar hamburger button
  useEffect(() => {
    actions.setParentMenuOpen(isMobileMenuOpen);
  }, [isMobileMenuOpen, actions]);

  // Update active section based on pathname
  useEffect(() => {
    if (pathname.startsWith('/admin/reports')) {
      actions.setActiveSection('reports');
    } else if (pathname.startsWith('/admin/tables')) {
      actions.setActiveSection('tables');
    } else {
      actions.setActiveSection('');
    }
  }, [pathname, actions]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Auto-expand child menus when they should be visible
  useEffect(() => {
    if (shouldShowTablesChildMenu || shouldShowReportsChildMenu) {
      if (!sidebarState.isSidebarOpen) {
        actions.setSidebarOpen(true);
      }
    }
  }, [shouldShowTablesChildMenu, shouldShowReportsChildMenu, sidebarState.isSidebarOpen, actions]);

  // Wrapper functions for setting state that handle both values and callbacks
  const setOpenTablesSections = useCallback((value: React.SetStateAction<Record<TablesDisclosureKey, boolean>>) => {
    if (typeof value === 'function') {
      actions.setTablesSections(value(sidebarState.openTablesSections));
    } else {
      actions.setTablesSections(value);
    }
  }, [sidebarState.openTablesSections, actions]);

  const setOpenReportsSections = useCallback((value: React.SetStateAction<Record<ReportsDisclosureKey, boolean>>) => {
    if (typeof value === 'function') {
      actions.setReportsSections(value(sidebarState.openReportsSections));
    } else {
      actions.setReportsSections(value);
    }
  }, [sidebarState.openReportsSections, actions]);

  // Memoize callback for toggling sidebar expansion
  const toggleSidebarExpansion = useCallback(() => {
    actions.toggleSidebar();
  }, [actions]);

  // When ParentMenu closes via navbar, also close child menus
  useEffect(() => {
    if (!sidebarState.isParentMenuOpen) {
      actions.setTablesHovered(false);
      actions.setActiveSection('');
      actions.setSidebarOpen(false);
    }
  }, [sidebarState.isParentMenuOpen, actions]);

  // Early return for loading/unauthorized - after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-white/20">
          
          {/* Header Skeleton */}
          <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-7 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Content Skeleton */}
          <div className="p-4 sm:p-6 bg-white/20 dark:bg-gray-800/20">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 flex flex-col items-center justify-center gap-3 animate-pulse"
                >
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not admin - AuthContext will handle redirect
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl border border-white/20">
          
          {/* Header Skeleton */}
          <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-white/10 bg-white/30 dark:bg-gray-800/30 rounded-t-2xl">
            <div className="w-6 h-6 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-7 w-48 bg-gray-300 dark:bg-gray-700 rounded animate-pulse" />
          </div>

          {/* Content Skeleton */}
          <div className="p-4 sm:p-6 bg-white/20 dark:bg-gray-800/20">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 flex flex-col items-center justify-center gap-3 animate-pulse"
                >
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-lg" />
                  <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
          <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Top Navigation Bar - Always show, hamburger only for superadmins */}
            <AccountTopBar />
            
            <div className="flex flex-1">
              {/* Parent Menu - Only accessible by superadmins */}
              {isSuperadmin && sidebarState.isParentMenuOpen && (
                <div className="relative flex">
                  <ParentMenu
                    isCollapsed={sidebarState.isParentMenuCollapsed}
                    setIsCollapsed={actions.setParentMenuCollapsed}
                    setActiveSection={actions.setActiveSection}
                    setIsTablesHovered={actions.setTablesHovered}
                  />
                  {shouldShowTablesChildMenu && (
                    <SidebarErrorBoundary>
                      <Suspense fallback={<MenuLoadingFallback />}>
                        <TablesChildMenu
                          isSidebarOpen={sidebarState.isSidebarOpen}
                          setIsSidebarOpen={toggleSidebarExpansion}
                          sidebarLinks={filteredSidebarLinks}
                          openSections={sidebarState.openTablesSections}
                          setOpenSections={setOpenTablesSections}
                          searchQuery={sidebarState.searchQuery}
                          setSearchQuery={actions.setSearchQuery}
                        />
                      </Suspense>
                    </SidebarErrorBoundary>
                  )}
                </div>
              )}
              
              {/* Reports Child Menu - Only accessible by superadmins */}
              {isSuperadmin && shouldShowReportsChildMenu && (
                <SidebarErrorBoundary>
                  <Suspense fallback={<MenuLoadingFallback />}>
                    <ReportsChildMenu
                      isSidebarOpen={sidebarState.isSidebarOpen}
                      setIsSidebarOpen={toggleSidebarExpansion}
                      sidebarLinks={reportSidebarLinks}
                      openSections={sidebarState.openReportsSections}
                      setOpenSections={setOpenReportsSections}
                      searchQuery={sidebarState.searchQuery}
                      setSearchQuery={actions.setSearchQuery}
                    />
                  </Suspense>
                </SidebarErrorBoundary>
              )}
              
              <main className="flex-1 overflow-y-auto min-h-screen">
                <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8">{children}</div>
              </main>
            
            {/* Unified Menu - Bottom Right */}
            <UnifiedModalManager forceShow position="bottom-right" />
            
            {/* Superadmin Portal Button */}
            {isSuperadmin && (
              <a
                href="/superadmin"
                className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                title="Go to Superadmin Portal"
              >
                <span className="text-xl">👑</span>
                <span className="font-medium hidden sm:inline">Superadmin Portal</span>
              </a>
            )}
            </div>
          </div>
  );
}

// Outer component that provides auth context
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BasketProvider>
        <ModalProvider>
          <SidebarProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
          </SidebarProvider>
        </ModalProvider>
      </BasketProvider>
    </AuthProvider>
  );
}