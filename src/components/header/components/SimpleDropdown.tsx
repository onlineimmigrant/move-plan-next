import React from 'react';
import Image from 'next/image';
import { MenuItem } from '@/types/menu';
import { getTranslatedMenuContent } from '@/utils/menuTranslations';

interface SimpleDropdownProps {
  item: MenuItem;
  isOpen: boolean;
  currentLocale: string | null;
  settings: any;
  onSubmenuEnter: () => void;
  onSubmenuLeave: () => void;
  onClose: () => void;
  PrefetchedMenuLink: React.ComponentType<any>;
}

/**
 * SimpleDropdown component - Compact dropdown for <2 submenu items
 * Positioned absolutely relative to parent button
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const SimpleDropdownComponent: React.FC<SimpleDropdownProps> = ({
  item,
  isOpen,
  currentLocale,
  settings,
  onSubmenuEnter,
  onSubmenuLeave,
  onClose,
  PrefetchedMenuLink,
}) => {
  const displayedSubItems = (item.website_submenuitem || [])
    .filter((subItem) => subItem.is_displayed !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div 
      className={`absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] transition-all duration-200 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        pointerEvents: isOpen ? 'auto' : 'none'
      }}
      onMouseEnter={onSubmenuEnter}
      onMouseLeave={onSubmenuLeave}
    >
      <div className="p-2">
        {displayedSubItems.map((subItem) => {
          const translatedSubItemName = currentLocale 
            ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
            : subItem.name;

          return (
            <PrefetchedMenuLink
              key={subItem.id}
              href={subItem.url_name}
              onClick={onClose}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                {subItem.image ? (
                  <Image
                    src={subItem.image}
                    alt={translatedSubItemName}
                    fill
                    sizes="40px"
                    className="object-cover rounded"
                    loading="lazy"
                  />
                ) : settings?.image ? (
                  <div className="relative w-full h-full flex items-center justify-center bg-gray-50 rounded p-1.5">
                    <Image
                      src={settings.image}
                      alt="Logo"
                      width={28}
                      height={28}
                      className="object-contain"
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900 block" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                  {translatedSubItemName}
                </span>
              </div>
            </PrefetchedMenuLink>
          );
        })}
      </div>
    </div>
  );
};

// Memoized export to prevent unnecessary re-renders
export const SimpleDropdown = React.memo(SimpleDropdownComponent, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.currentLocale === nextProps.currentLocale
  );
});
