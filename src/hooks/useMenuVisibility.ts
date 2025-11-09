import { useMemo } from 'react';
import { DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';

// Constants for excluded paths
const EXCLUDED_PATHS = [
  '/admin',
  '/admin/tickets',
  '/admin/products/management',
  '/admin/pricingplans/management',
  '/admin/ai/management',
  '/admin/miners/management',
] as const;

interface UseMenuVisibilityProps {
  pathname: string;
  activeSection: string;
  isTablesHovered: boolean;
  isParentMenuOpen: boolean;
  isDesktop: boolean;
}

/**
 * Custom hook to determine visibility of child menus (TablesChildMenu, ReportsChildMenu)
 * Handles complex visibility logic based on pathname, active section, hover state, and viewport
 */
export function useMenuVisibility({ pathname, activeSection, isTablesHovered, isParentMenuOpen, isDesktop }: UseMenuVisibilityProps) {
  // Check if current path is in excluded paths
  const isExcludedPath = useMemo(() => {
    return EXCLUDED_PATHS.some((excludedPath) =>
      pathname === excludedPath || pathname.startsWith(`${excludedPath}/`)
    );
  }, [pathname]);

  // Determine if TablesChildMenu should be shown
  const shouldShowTablesChildMenu = useMemo(() => {
    if (!isParentMenuOpen || isExcludedPath) return false;
    
    // Desktop: show on hover or if tables section is active
    // Mobile: show only if tables section is explicitly active
    if (isDesktop) {
      return isTablesHovered && !pathname.startsWith('/admin/reports');
    }
    
    return activeSection === 'tables';
  }, [pathname, activeSection, isTablesHovered, isExcludedPath, isParentMenuOpen, isDesktop]);

  // Determine if ReportsChildMenu should be shown
  const shouldShowReportsChildMenu = useMemo(() => {
    if (!isParentMenuOpen || isExcludedPath) return false;
    
    return activeSection === 'reports';
  }, [activeSection, isExcludedPath, isParentMenuOpen]);

  return {
    shouldShowTablesChildMenu,
    shouldShowReportsChildMenu,
    isExcludedPath,
  };
}

/**
 * Hook to determine if a specific disclosure section should be auto-opened
 * Used for automatic section expansion based on current route
 */
export function useAutoExpandSection(
  pathname: string,
  sectionKey: TablesDisclosureKey | ReportsDisclosureKey,
  links: Array<{ href?: string; label: string; children?: any[] }>
): boolean {
  return useMemo(() => {
    return links.some((link) => {
      if (link.href === pathname) return true;
      if (link.children) {
        return link.children.some((child) => child.href === pathname);
      }
      return false;
    });
  }, [pathname, links]);
}
