import { useMemo } from 'react';
import { MenuItem } from '@/types/menu';
import { getTranslatedMenuContent } from '@/utils/menuTranslations';

interface UseMenuDataProps {
  menuItems?: MenuItem[];
  currentLocale: string | null;
  filterForHeader?: boolean;
  filterForFooter?: boolean;
}

/**
 * Shared menu data processing hook for Header and Footer
 * Handles filtering, translation, and menu item preparation
 */
export const useMenuData = ({
  menuItems = [],
  currentLocale,
  filterForHeader = false,
  filterForFooter = false,
}: UseMenuDataProps) => {
  // Filter menu items for header (displayed items only, exclude Profile)
  const headerMenuItems = useMemo(() => {
    if (!filterForHeader) return menuItems;
    return menuItems.filter(
      (item) => item.is_displayed && item.display_name !== 'Profile'
    );
  }, [menuItems, filterForHeader]);

  // Filter menu items for footer (footer display flag, exclude Profile)
  const footerMenuItems = useMemo(() => {
    if (!filterForFooter) return menuItems;
    return menuItems.filter(
      (item) => item.is_displayed_on_footer && item.display_name !== 'Profile'
    );
  }, [menuItems, filterForFooter]);

  // Translate menu item
  const translateMenuItem = useMemo(() => {
    return (item: MenuItem) => {
      const translatedDisplayName = currentLocale
        ? getTranslatedMenuContent(
            item.display_name,
            item.display_name_translation,
            currentLocale
          )
        : item.display_name;

      const translatedDescription = item.description
        ? currentLocale
          ? getTranslatedMenuContent(
              item.description,
              item.description_translation,
              currentLocale
            )
          : item.description
        : null;

      return {
        ...item,
        translatedDisplayName,
        translatedDescription,
      };
    };
  }, [currentLocale]);

  return {
    headerMenuItems,
    footerMenuItems,
    allMenuItems: menuItems,
    translateMenuItem,
  };
};
