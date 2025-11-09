'use client';

import { ReactNode, useState, useEffect, useMemo, useCallback, useRef, useReducer, Suspense, lazy, Component, ErrorInfo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { ModalProvider } from '@/context/ModalContext';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
import AccountTopBar from '@/components/AccountTopBar';
import ParentMenu from './components/ParentMenu';
import TicketsAdminToggleButton from '@/components/modals/TicketsModals/TicketsAdminModal/TicketsAdminToggleButton';
import Loading from '@/ui/Loading';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

// Lazy load sidebar menus for better initial load performance
const TablesChildMenu = lazy(() => import('./components/TablesChildMenu'));
const ReportsChildMenu = lazy(() => import('./components/ReportsChildMenu'));

import { sidebarLinks, getFilteredSidebarLinks, DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { reportSidebarLinks, DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';

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

// Constants moved outside component to prevent recreation on every render
const EXCLUDED_PATHS = [
  '/admin',
  '/admin/tickets',
  '/admin/products/management',
  '/admin/pricingplans/management',
  '/admin/ai/management',
  '/admin/miners/management',
] as const;

const INITIAL_TABLES_SECTIONS: Record<TablesDisclosureKey, boolean> = {
  users: false,
  sell: false,
  booking: false,
  app: false,
  consent_management: false,
  blog: false,
  edupro: false,
  quiz: false,
  feedback: false,
  ai: false,
  datacollection: false,
  website: false,
  email: false,
  settings: false,
};

const INITIAL_REPORTS_SECTIONS: Record<ReportsDisclosureKey, boolean> = {
  tables: false,
  custom: false,
};

// State management types for useReducer
type SidebarState = {
  isSidebarOpen: boolean;
  isParentMenuOpen: boolean;
  isParentMenuCollapsed: boolean;
  activeSection: string;
  openTablesSections: Record<TablesDisclosureKey, boolean>;
  openReportsSections: Record<ReportsDisclosureKey, boolean>;
  searchQuery: string;
  isTablesHovered: boolean;
};

type SidebarAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_OPEN'; payload: boolean }
  | { type: 'TOGGLE_PARENT_MENU' }
  | { type: 'SET_PARENT_MENU_OPEN'; payload: boolean }
  | { type: 'SET_PARENT_MENU_COLLAPSED'; payload: boolean }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'SET_TABLES_SECTIONS'; payload: Record<TablesDisclosureKey, boolean> }
  | { type: 'SET_REPORTS_SECTIONS'; payload: Record<ReportsDisclosureKey, boolean> }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_TABLES_HOVERED'; payload: boolean };

const initialSidebarState: SidebarState = {
  isSidebarOpen: false,
  isParentMenuOpen: false,
  isParentMenuCollapsed: true,
  activeSection: '',
  openTablesSections: INITIAL_TABLES_SECTIONS,
  openReportsSections: INITIAL_REPORTS_SECTIONS,
  searchQuery: '',
  isTablesHovered: false,
};

function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };
    case 'SET_SIDEBAR_OPEN':
      return { ...state, isSidebarOpen: action.payload };
    case 'TOGGLE_PARENT_MENU':
      return { ...state, isParentMenuOpen: !state.isParentMenuOpen };
    case 'SET_PARENT_MENU_OPEN':
      return { ...state, isParentMenuOpen: action.payload };
    case 'SET_PARENT_MENU_COLLAPSED':
      return { ...state, isParentMenuCollapsed: action.payload };
    case 'SET_ACTIVE_SECTION':
      return { ...state, activeSection: action.payload };
    case 'SET_TABLES_SECTIONS':
      return { ...state, openTablesSections: action.payload };
    case 'SET_REPORTS_SECTIONS':
      return { ...state, openReportsSections: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_TABLES_HOVERED':
      return { ...state, isTablesHovered: action.payload };
    default:
      return state;
  }
}

// Inner component that uses auth context
function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isSuperadmin, isInGeneralOrganization, isLoading } = useAuth();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar();

  // Use reducer for complex sidebar state management
  const [sidebarState, dispatch] = useReducer(sidebarReducer, initialSidebarState);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Ref to track hover timeout for cleanup
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize filtered sidebar links to prevent unnecessary recalculations
  const filteredSidebarLinks = useMemo(
    () => getFilteredSidebarLinks(sidebarLinks, isInGeneralOrganization),
    [isInGeneralOrganization]
  );

  // Sync ParentMenu open state with navbar hamburger button
  useEffect(() => {
    dispatch({ type: 'SET_PARENT_MENU_OPEN', payload: isMobileMenuOpen });
  }, [isMobileMenuOpen]);

  // Optimized resize listener with debouncing to prevent excessive re-renders
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const currentMatches = mediaQuery.matches;
    setIsDesktop(currentMatches);

    // Only update state if the value actually changes
    const handleResize = (e: MediaQueryListEvent) => {
      if (e.matches !== isDesktop) {
        setIsDesktop(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [isDesktop]); // Add isDesktop to prevent unnecessary updates

  useEffect(() => {
    if (pathname.startsWith('/admin/reports')) {
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: 'reports' });
    } else if (pathname.startsWith('/admin/tables')) {
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: 'tables' });
    } else {
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: '' });
    }
  }, [pathname]);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Memoize shouldShowTablesChildMenu calculation
  // Keep it open once triggered, only close via navbar close button
  const shouldShowTablesChildMenu = useMemo(
    () =>
      sidebarState.isParentMenuOpen &&
      ((isDesktop &&
        !EXCLUDED_PATHS.includes(pathname as any) &&
        !pathname.startsWith('/admin/reports') &&
        sidebarState.isTablesHovered) ||
      (!isDesktop && sidebarState.activeSection === 'tables')),
    [isDesktop, pathname, sidebarState.isTablesHovered, sidebarState.activeSection, sidebarState.isParentMenuOpen]
  );

  // Memoize shouldShowReportsChildMenu calculation
  const shouldShowReportsChildMenu = useMemo(
    () => sidebarState.isParentMenuOpen && sidebarState.activeSection === 'reports',
    [sidebarState.isParentMenuOpen, sidebarState.activeSection]
  );

  // Auto-expand child menus when they should be visible
  useEffect(() => {
    if (shouldShowTablesChildMenu || shouldShowReportsChildMenu) {
      if (!sidebarState.isSidebarOpen) {
        dispatch({ type: 'SET_SIDEBAR_OPEN', payload: true });
      }
    }
  }, [shouldShowTablesChildMenu, shouldShowReportsChildMenu, sidebarState.isSidebarOpen]);

  // Wrapper functions for setting state that handle both values and callbacks
  const setOpenTablesSections = useCallback((value: React.SetStateAction<Record<TablesDisclosureKey, boolean>>) => {
    if (typeof value === 'function') {
      dispatch({ type: 'SET_TABLES_SECTIONS', payload: value(sidebarState.openTablesSections) });
    } else {
      dispatch({ type: 'SET_TABLES_SECTIONS', payload: value });
    }
  }, [sidebarState.openTablesSections]);

  const setOpenReportsSections = useCallback((value: React.SetStateAction<Record<ReportsDisclosureKey, boolean>>) => {
    if (typeof value === 'function') {
      dispatch({ type: 'SET_REPORTS_SECTIONS', payload: value(sidebarState.openReportsSections) });
    } else {
      dispatch({ type: 'SET_REPORTS_SECTIONS', payload: value });
    }
  }, [sidebarState.openReportsSections]);

  // Memoize callback for toggling sidebar expansion
  const toggleSidebarExpansion = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, []);

  // When ParentMenu closes via navbar, also close child menus
  useEffect(() => {
    if (!sidebarState.isParentMenuOpen) {
      dispatch({ type: 'SET_TABLES_HOVERED', payload: false });
      dispatch({ type: 'SET_ACTIVE_SECTION', payload: '' });
      dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false });
    }
  }, [sidebarState.isParentMenuOpen]);

  // Early return for loading/unauthorized - after all hooks
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  // Don't render if not admin - AuthContext will handle redirect
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
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
                    setIsCollapsed={(collapsed) => dispatch({ type: 'SET_PARENT_MENU_COLLAPSED', payload: collapsed })}
                    setActiveSection={(section) => dispatch({ type: 'SET_ACTIVE_SECTION', payload: section })}
                    setIsTablesHovered={(hovered) => dispatch({ type: 'SET_TABLES_HOVERED', payload: hovered })}
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
                          setSearchQuery={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query })}
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
                      setSearchQuery={(query) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query })}
                    />
                  </Suspense>
                </SidebarErrorBoundary>
              )}
              
              <main className="flex-1 overflow-y-auto min-h-screen">
                <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8">{children}</div>
              </main>
            
            {/* Superadmin Portal Button */}
            {isSuperadmin && (
              <a
                href="/superadmin"
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                title="Go to Superadmin Portal"
              >
                <span className="text-xl">👑</span>
                <span className="font-medium hidden sm:inline">Superadmin Portal</span>
              </a>
            )}
            
            <TicketsAdminToggleButton />
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