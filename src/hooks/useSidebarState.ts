import { useEffect, useReducer, useCallback, useMemo } from 'react';
import { DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';

// Constants
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

// State management types
export type SidebarState = {
  isSidebarOpen: boolean;
  isParentMenuOpen: boolean;
  isParentMenuCollapsed: boolean;
  activeSection: string;
  openTablesSections: Record<TablesDisclosureKey, boolean>;
  openReportsSections: Record<ReportsDisclosureKey, boolean>;
  searchQuery: string;
  isTablesHovered: boolean;
};

export type SidebarAction =
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

export function sidebarReducer(state: SidebarState, action: SidebarAction): SidebarState {
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

/**
 * Custom hook for managing sidebar state with useReducer
 * Provides dispatch actions for common sidebar operations
 */
export function useSidebarState() {
  const [state, dispatch] = useReducer(sidebarReducer, initialSidebarState);

  // Memoized action creators to prevent unnecessary re-renders
  const actions = useMemo(
    () => ({
      toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
      setSidebarOpen: (open: boolean) => dispatch({ type: 'SET_SIDEBAR_OPEN', payload: open }),
      toggleParentMenu: () => dispatch({ type: 'TOGGLE_PARENT_MENU' }),
      setParentMenuOpen: (open: boolean) => dispatch({ type: 'SET_PARENT_MENU_OPEN', payload: open }),
      setParentMenuCollapsed: (collapsed: boolean) =>
        dispatch({ type: 'SET_PARENT_MENU_COLLAPSED', payload: collapsed }),
      setActiveSection: (section: string) => dispatch({ type: 'SET_ACTIVE_SECTION', payload: section }),
      setTablesSections: (sections: Record<TablesDisclosureKey, boolean>) =>
        dispatch({ type: 'SET_TABLES_SECTIONS', payload: sections }),
      setReportsSections: (sections: Record<ReportsDisclosureKey, boolean>) =>
        dispatch({ type: 'SET_REPORTS_SECTIONS', payload: sections }),
      setSearchQuery: (query: string) => dispatch({ type: 'SET_SEARCH_QUERY', payload: query }),
      setTablesHovered: (hovered: boolean) => dispatch({ type: 'SET_TABLES_HOVERED', payload: hovered }),
    }),
    []
  );

  return { state, actions };
}
