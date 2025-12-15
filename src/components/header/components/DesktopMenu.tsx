import React from 'react';
import { MenuItem } from '@/types/menu';
import { getColorValue } from '@/components/Shared/ColorPaletteDropdown';
import { MegaMenu } from './MegaMenu';
import { SimpleDropdown } from './SimpleDropdown';

interface DesktopMenuProps {
  filteredMenuItems: MenuItem[];
  currentLocale: string | null;
  pathname: string;
  openSubmenu: number | null;
  headerColor: string;
  headerColorHover: string;
  hoveredSubmenuItem: any;
  fixedBannersHeight: number;
  menuFontSizeClass: string;
  menuFontWeightClass: string;
  themeColors: any;
  settings: any;
  translations: any;
  setOpenSubmenu: (id: number | null) => void;
  handleMenuEnter: (id: number, hasSubmenu: boolean) => void;
  handleMenuLeave: () => void;
  handleSubmenuEnter: () => void;
  handleSubmenuLeave: () => void;
  handleSubmenuItemHover: (item: any) => void;
  translateMenuItem: (item: MenuItem) => any;
  PrefetchedMenuLink: React.ComponentType<any>;
}

/**
 * DesktopMenu - Desktop navigation with dropdowns
 * Handles menu items with submenus (MegaMenu/SimpleDropdown) and direct links
 */
const DesktopMenuComponent: React.FC<DesktopMenuProps> = ({
  filteredMenuItems,
  currentLocale,
  pathname,
  openSubmenu,
  headerColor,
  headerColorHover,
  hoveredSubmenuItem,
  fixedBannersHeight,
  menuFontSizeClass,
  menuFontWeightClass,
  themeColors,
  settings,
  translations,
  setOpenSubmenu,
  handleMenuEnter,
  handleMenuLeave,
  handleSubmenuEnter,
  handleSubmenuLeave,
  handleSubmenuItemHover,
  translateMenuItem,
  PrefetchedMenuLink,
}) => {
  if (filteredMenuItems.length === 0) {
    return <span className="text-gray-500">{translations.noMenuItems}</span>;
  }

  return (
    <>
      {filteredMenuItems.map((item) => {
        const displayedSubItems = (item.website_submenuitem || [])
          .filter((subItem) => subItem.is_displayed !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Use shared translateMenuItem function
        const translatedItem = translateMenuItem(item);
        const { translatedDisplayName } = translatedItem;

        // Check if current menu item is active
        const isActive = pathname.startsWith(`/${item.url_name}`) || 
                        displayedSubItems.some(subItem => pathname.startsWith(`/${subItem.url_name}`));

        return (
          <div 
            key={item.id} 
            className="relative"
            onMouseEnter={() => handleMenuEnter(item.id, displayedSubItems.length > 0)}
            onMouseLeave={handleMenuLeave}
          >
            {displayedSubItems.length > 0 ? (
              <>
                <button
                  type="button"
                  className="group cursor-pointer flex items-center justify-center px-4 py-2.5 rounded-xl focus:outline-none transition-colors duration-200"
                  style={{
                    // Apply color via inline style for both hex and Tailwind colors
                    // Use hover color when submenu is open
                    color: openSubmenu === item.id ? getColorValue(headerColorHover) : getColorValue(headerColor),
                  }}
                  title={translatedDisplayName}
                  aria-label={translations.openMenuFor(translatedDisplayName)}
                  onClick={() => setOpenSubmenu(openSubmenu === item.id ? null : item.id)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = getColorValue(headerColorHover);
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = openSubmenu === item.id ? getColorValue(headerColorHover) : getColorValue(headerColor);
                  }}
                >
                  <span 
                    className={`${menuFontSizeClass} ${menuFontWeightClass} transition-colors duration-200 ${
                      isActive ? 'font-semibold' : ''
                    }`}
                    style={{
                      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    }}
                  >{translatedDisplayName}</span>
                  <svg 
                    className="ml-1.5 h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-180" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Mega menu or simple dropdown based on items count */}
                {displayedSubItems.length >= 2 ? (
                  <MegaMenu
                    item={item}
                    isOpen={openSubmenu === item.id}
                    fixedBannersHeight={fixedBannersHeight}
                    currentLocale={currentLocale}
                    themeColors={themeColors}
                    settings={settings}
                    hoveredSubmenuItem={hoveredSubmenuItem}
                    onSubmenuEnter={handleSubmenuEnter}
                    onSubmenuLeave={handleSubmenuLeave}
                    onClose={() => setOpenSubmenu(null)}
                    onSubmenuItemHover={handleSubmenuItemHover}
                    PrefetchedMenuLink={PrefetchedMenuLink}
                  />
                ) : (
                  <SimpleDropdown
                    item={item}
                    isOpen={openSubmenu === item.id}
                    currentLocale={currentLocale}
                    settings={settings}
                    onSubmenuEnter={handleSubmenuEnter}
                    onSubmenuLeave={handleSubmenuLeave}
                    onClose={() => setOpenSubmenu(null)}
                    PrefetchedMenuLink={PrefetchedMenuLink}
                  />
                )}
              </>
            ) : (
              <div
                className="cursor-pointer transition-colors duration-200"
                style={{
                  // Apply color via inline style for both hex and Tailwind colors
                  color: getColorValue(headerColor),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = getColorValue(headerColorHover);
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = getColorValue(headerColor);
                }}
              >
                <PrefetchedMenuLink
                  href={item.url_name}
                  onClick={() => setOpenSubmenu(null)}
                  className="flex items-center justify-center px-4 py-2.5 rounded-xl focus:outline-none transition-colors duration-200 group"
                  title={translatedDisplayName}
                  aria-label={translations.goTo(translatedDisplayName)}
                >
                  <span className={`${menuFontSizeClass} ${menuFontWeightClass} transition-colors duration-200 ${
                    // Only apply default classes if using hex colors
                    headerColor.startsWith('#') ? '' : (isActive ? 'font-semibold' : '')
                  }`}>{translatedDisplayName}</span>
                </PrefetchedMenuLink>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// Memoized export to prevent unnecessary re-renders
export const DesktopMenu = React.memo(DesktopMenuComponent, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return (
    prevProps.filteredMenuItems === nextProps.filteredMenuItems &&
    prevProps.currentLocale === nextProps.currentLocale &&
    prevProps.pathname === nextProps.pathname &&
    prevProps.openSubmenu === nextProps.openSubmenu &&
    prevProps.headerColor === nextProps.headerColor &&
    prevProps.headerColorHover === nextProps.headerColorHover &&
    prevProps.hoveredSubmenuItem === nextProps.hoveredSubmenuItem &&
    prevProps.menuFontSizeClass === nextProps.menuFontSizeClass &&
    prevProps.menuFontWeightClass === nextProps.menuFontWeightClass
  );
});
