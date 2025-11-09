import { sidebarReducer, SidebarState, SidebarAction } from '../useSidebarState';
import { DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';

describe('sidebarReducer', () => {
  const initialState: SidebarState = {
    isSidebarOpen: false,
    isParentMenuOpen: false,
    isParentMenuCollapsed: true,
    activeSection: '',
    openTablesSections: {
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
    },
    openReportsSections: {
      tables: false,
      custom: false,
    },
    searchQuery: '',
    isTablesHovered: false,
  };

  describe('TOGGLE_SIDEBAR', () => {
    it('should toggle sidebar from closed to open', () => {
      const action: SidebarAction = { type: 'TOGGLE_SIDEBAR' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.isSidebarOpen).toBe(true);
      expect(newState).not.toBe(initialState); // Ensure immutability
    });

    it('should toggle sidebar from open to closed', () => {
      const openState = { ...initialState, isSidebarOpen: true };
      const action: SidebarAction = { type: 'TOGGLE_SIDEBAR' };
      const newState = sidebarReducer(openState, action);
      
      expect(newState.isSidebarOpen).toBe(false);
    });
  });

  describe('SET_SIDEBAR_OPEN', () => {
    it('should set sidebar open to true', () => {
      const action: SidebarAction = { type: 'SET_SIDEBAR_OPEN', payload: true };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.isSidebarOpen).toBe(true);
    });

    it('should set sidebar open to false', () => {
      const openState = { ...initialState, isSidebarOpen: true };
      const action: SidebarAction = { type: 'SET_SIDEBAR_OPEN', payload: false };
      const newState = sidebarReducer(openState, action);
      
      expect(newState.isSidebarOpen).toBe(false);
    });
  });

  describe('TOGGLE_PARENT_MENU', () => {
    it('should toggle parent menu from closed to open', () => {
      const action: SidebarAction = { type: 'TOGGLE_PARENT_MENU' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.isParentMenuOpen).toBe(true);
    });

    it('should toggle parent menu from open to closed', () => {
      const openState = { ...initialState, isParentMenuOpen: true };
      const action: SidebarAction = { type: 'TOGGLE_PARENT_MENU' };
      const newState = sidebarReducer(openState, action);
      
      expect(newState.isParentMenuOpen).toBe(false);
    });
  });

  describe('SET_PARENT_MENU_OPEN', () => {
    it('should set parent menu open to true', () => {
      const action: SidebarAction = { type: 'SET_PARENT_MENU_OPEN', payload: true };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.isParentMenuOpen).toBe(true);
    });

    it('should set parent menu open to false', () => {
      const openState = { ...initialState, isParentMenuOpen: true };
      const action: SidebarAction = { type: 'SET_PARENT_MENU_OPEN', payload: false };
      const newState = sidebarReducer(openState, action);
      
      expect(newState.isParentMenuOpen).toBe(false);
    });
  });

  describe('SET_PARENT_MENU_COLLAPSED', () => {
    it('should set parent menu collapsed to false', () => {
      const action: SidebarAction = { type: 'SET_PARENT_MENU_COLLAPSED', payload: false };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.isParentMenuCollapsed).toBe(false);
    });

    it('should set parent menu collapsed to true', () => {
      const expandedState = { ...initialState, isParentMenuCollapsed: false };
      const action: SidebarAction = { type: 'SET_PARENT_MENU_COLLAPSED', payload: true };
      const newState = sidebarReducer(expandedState, action);
      
      expect(newState.isParentMenuCollapsed).toBe(true);
    });
  });

  describe('SET_ACTIVE_SECTION', () => {
    it('should set active section to tables', () => {
      const action: SidebarAction = { type: 'SET_ACTIVE_SECTION', payload: 'tables' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.activeSection).toBe('tables');
    });

    it('should set active section to reports', () => {
      const action: SidebarAction = { type: 'SET_ACTIVE_SECTION', payload: 'reports' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.activeSection).toBe('reports');
    });

    it('should clear active section', () => {
      const stateWithSection = { ...initialState, activeSection: 'tables' };
      const action: SidebarAction = { type: 'SET_ACTIVE_SECTION', payload: '' };
      const newState = sidebarReducer(stateWithSection, action);
      
      expect(newState.activeSection).toBe('');
    });
  });

  describe('SET_TABLES_SECTIONS', () => {
    it('should update tables sections', () => {
      const newSections: Record<TablesDisclosureKey, boolean> = {
        ...initialState.openTablesSections,
        users: true,
        sell: true,
      };
      const action: SidebarAction = { type: 'SET_TABLES_SECTIONS', payload: newSections };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.openTablesSections.users).toBe(true);
      expect(newState.openTablesSections.sell).toBe(true);
      expect(newState.openTablesSections.booking).toBe(false);
    });

    it('should replace all tables sections', () => {
      const newSections: Record<TablesDisclosureKey, boolean> = {
        users: true,
        sell: true,
        booking: true,
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
      const action: SidebarAction = { type: 'SET_TABLES_SECTIONS', payload: newSections };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.openTablesSections).toEqual(newSections);
    });
  });

  describe('SET_REPORTS_SECTIONS', () => {
    it('should update reports sections', () => {
      const newSections: Record<ReportsDisclosureKey, boolean> = {
        tables: true,
        custom: false,
      };
      const action: SidebarAction = { type: 'SET_REPORTS_SECTIONS', payload: newSections };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.openReportsSections.tables).toBe(true);
      expect(newState.openReportsSections.custom).toBe(false);
    });

    it('should toggle both reports sections', () => {
      const newSections: Record<ReportsDisclosureKey, boolean> = {
        tables: true,
        custom: true,
      };
      const action: SidebarAction = { type: 'SET_REPORTS_SECTIONS', payload: newSections };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.openReportsSections).toEqual(newSections);
    });
  });

  describe('SET_SEARCH_QUERY', () => {
    it('should set search query', () => {
      const action: SidebarAction = { type: 'SET_SEARCH_QUERY', payload: 'users' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.searchQuery).toBe('users');
    });

    it('should clear search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'test' };
      const action: SidebarAction = { type: 'SET_SEARCH_QUERY', payload: '' };
      const newState = sidebarReducer(stateWithQuery, action);
      
      expect(newState.searchQuery).toBe('');
    });

    it('should update existing search query', () => {
      const stateWithQuery = { ...initialState, searchQuery: 'old' };
      const action: SidebarAction = { type: 'SET_SEARCH_QUERY', payload: 'new query' };
      const newState = sidebarReducer(stateWithQuery, action);
      
      expect(newState.searchQuery).toBe('new query');
    });
  });

  describe('SET_TABLES_HOVERED', () => {
    it('should set tables hovered to true', () => {
      const action: SidebarAction = { type: 'SET_TABLES_HOVERED', payload: true };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState.isTablesHovered).toBe(true);
    });

    it('should set tables hovered to false', () => {
      const hoveredState = { ...initialState, isTablesHovered: true };
      const action: SidebarAction = { type: 'SET_TABLES_HOVERED', payload: false };
      const newState = sidebarReducer(hoveredState, action);
      
      expect(newState.isTablesHovered).toBe(false);
    });
  });

  describe('Immutability', () => {
    it('should not mutate original state for TOGGLE_SIDEBAR', () => {
      const action: SidebarAction = { type: 'TOGGLE_SIDEBAR' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState).not.toBe(initialState);
      expect(initialState.isSidebarOpen).toBe(false);
    });

    it('should not mutate original state for SET_ACTIVE_SECTION', () => {
      const action: SidebarAction = { type: 'SET_ACTIVE_SECTION', payload: 'tables' };
      const newState = sidebarReducer(initialState, action);
      
      expect(newState).not.toBe(initialState);
      expect(initialState.activeSection).toBe('');
    });

    it('should create new state object for each action', () => {
      const action1: SidebarAction = { type: 'SET_SIDEBAR_OPEN', payload: true };
      const state1 = sidebarReducer(initialState, action1);
      
      const action2: SidebarAction = { type: 'SET_ACTIVE_SECTION', payload: 'reports' };
      const state2 = sidebarReducer(state1, action2);
      
      expect(state2).not.toBe(state1);
      expect(state2).not.toBe(initialState);
    });
  });

  describe('Default case', () => {
    it('should return current state for unknown action type', () => {
      const unknownAction = { type: 'UNKNOWN_ACTION' } as any;
      const newState = sidebarReducer(initialState, unknownAction);
      
      expect(newState).toEqual(initialState);
    });
  });

  describe('Complex state transitions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;
      
      state = sidebarReducer(state, { type: 'TOGGLE_SIDEBAR' });
      expect(state.isSidebarOpen).toBe(true);
      
      state = sidebarReducer(state, { type: 'SET_ACTIVE_SECTION', payload: 'tables' });
      expect(state.activeSection).toBe('tables');
      
      state = sidebarReducer(state, { type: 'SET_TABLES_HOVERED', payload: true });
      expect(state.isTablesHovered).toBe(true);
      
      state = sidebarReducer(state, { type: 'SET_PARENT_MENU_OPEN', payload: true });
      expect(state.isParentMenuOpen).toBe(true);
      
      // All changes should be persisted
      expect(state).toEqual({
        ...initialState,
        isSidebarOpen: true,
        activeSection: 'tables',
        isTablesHovered: true,
        isParentMenuOpen: true,
      });
    });
  });
});
