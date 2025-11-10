// useMenuItems Hook
// Filters menu items based on user permissions and feature flags

import { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MenuItemConfig } from '../types';

/**
 * Hook to filter menu items based on current user's permissions
 * 
 * @param items - Array of menu items to filter
 * @returns Filtered array of menu items the user can access
 */
export function useMenuItems(items: MenuItemConfig[]): MenuItemConfig[] {
  const { session, isAdmin, isSuperadmin } = useAuth();
  const isAuthenticated = !!session;

  return useMemo(() => {
    return items.filter((item) => {
      // Skip hidden items
      if (item.hidden) {
        return false;
      }

      // Check authentication requirement
      if (item.requireAuth && !isAuthenticated) {
        return false;
      }

      // Check superadmin requirement (must be exactly superadmin)
      if (item.requireSuperadmin && !isSuperadmin) {
        return false;
      }

      // Check admin requirement (admin OR superadmin)
      if (item.requireAdmin && !isAdmin && !isSuperadmin) {
        return false;
      }

      // Feature flags would be checked here in the future
      // For now, we'll skip feature checking since it's not yet in AuthContext
      // if (item.requireFeature) {
      //   // Check feature flags from organization settings
      // }

      return true;
    });
  }, [items, isAuthenticated, isAdmin, isSuperadmin]);
}
