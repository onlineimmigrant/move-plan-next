import React from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { MenuItem, SubMenuItem } from '@/types/menu';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { getTranslatedMenuContent } from '@/utils/menuTranslations';

interface MegaMenuProps {
  item: MenuItem;
  isOpen: boolean;
  fixedBannersHeight: number;
  currentLocale: string | null;
  themeColors: any;
  settings: any;
  hoveredSubmenuItem: SubMenuItem | null;
  onSubmenuEnter: () => void;
  onSubmenuLeave: () => void;
  onClose: () => void;
  onSubmenuItemHover: (item: SubMenuItem) => void;
  PrefetchedMenuLink: React.ComponentType<any>;
}

/**
 * MegaMenu component - Full-width dropdown with grid layout
 * Rendered at document.body level via Portal to escape stacking contexts
 * Optimized with React.memo to prevent unnecessary re-renders
 */
const MegaMenuComponent: React.FC<MegaMenuProps> = ({
  item,
  isOpen,
  fixedBannersHeight,
  currentLocale,
  themeColors,
  settings,
  hoveredSubmenuItem,
  onSubmenuEnter,
  onSubmenuLeave,
  onClose,
  onSubmenuItemHover,
  PrefetchedMenuLink,
}) => {
  const displayedSubItems = (item.website_submenuitem || [])
    .filter((subItem) => subItem.is_displayed !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // Translate menu item
  const translatedDisplayName = currentLocale 
    ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
    : item.display_name;

  const translatedMenuItemDescription = item.description
    ? (currentLocale 
        ? getTranslatedMenuContent(item.description, item.description_translation, currentLocale)
        : item.description)
    : null;

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className={`fixed left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] transition-all duration-200 mx-4 sm:mx-8 ${
        isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
      }`}
      style={{
        top: `${fixedBannersHeight + 64}px`,
        backgroundColor: 'white',
        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        backdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        WebkitBackdropFilter: 'blur(24px) saturate(200%) brightness(105%)',
        pointerEvents: isOpen ? 'auto' : 'none',
        paddingTop: '8px',
        marginTop: '-8px'
      }}
      onMouseEnter={onSubmenuEnter}
      onMouseLeave={onSubmenuLeave}
    >
      <div className="max-h-[calc(100vh-140px)] overflow-y-auto">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          {/* Header section */}
          <div className="mb-6 p-4">
            <h3 className="text-base font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
              {translatedDisplayName}
            </h3>
            {translatedMenuItemDescription && (
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                {translatedMenuItemDescription}
              </p>
            )}
          </div>
          
          {/* Grid of submenu items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayedSubItems.map((subItem) => {
              const translatedSubItemName = currentLocale 
                ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                : subItem.name;

              const translatedDescription = subItem.description
                ? (currentLocale 
                    ? getTranslatedMenuContent(subItem.description, subItem.description_translation, currentLocale)
                    : subItem.description)
                : null;

              return (
                <div 
                  key={subItem.id}
                  onMouseEnter={() => onSubmenuItemHover(subItem)}
                  onMouseLeave={() => onSubmenuItemHover(null as any)}
                  className="group/item"
                >
                  <PrefetchedMenuLink
                    href={subItem.url_name}
                    onClick={onClose}
                    className={`block rounded-lg overflow-hidden transition-all duration-200 ${
                      item.display_as_card ? 'hover:shadow-xl hover:scale-105' : 'hover:shadow-lg border border-gray-200/30'
                    }`}
                  >
                    <div className="relative w-full h-48">
                      {item.display_as_card ? (
                        // Card mode: white card with title/description
                        <div className="relative w-full h-full flex flex-col justify-center backdrop-blur-sm p-6" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                          <h4 className="text-base font-medium text-gray-700 mb-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                            {translatedSubItemName}
                          </h4>
                          {translatedDescription && (
                            <p className="text-sm text-gray-600 line-clamp-3" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {translatedDescription}
                            </p>
                          )}
                          <ArrowRightIcon 
                            className="absolute bottom-4 right-4 h-5 w-5 opacity-0 group-hover/item:opacity-100 transition-all duration-300 transform translate-x-0 group-hover/item:translate-x-1" 
                            style={{ color: themeColors.cssVars.primary.base }}
                          />
                        </div>
                      ) : hoveredSubmenuItem?.id === subItem.id ? (
                        // Image mode + hovered: white card
                        <div className="w-full h-full flex flex-col items-center justify-center bg-white p-6">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2 text-center" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                            {translatedSubItemName}
                          </h4>
                          {translatedDescription && (
                            <p className="text-sm text-gray-600 text-center line-clamp-4" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {translatedDescription}
                            </p>
                          )}
                        </div>
                      ) : (
                        // Image mode + not hovered: show image with text overlay
                        <>
                          {subItem.image ? (
                            <Image
                              src={subItem.image}
                              alt={translatedSubItemName}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              className="object-cover"
                              loading="lazy"
                              placeholder="blur"
                              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                            />
                          ) : settings?.image ? (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                              <div className="relative w-2/3 h-2/3">
                                <Image
                                  src={settings.image}
                                  alt="Logo"
                                  fill
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                  className="object-contain"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover/item:from-black/80 transition-all duration-200" />
                          
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h4 className="text-base font-semibold text-white mb-1 drop-shadow-lg" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                              {translatedSubItemName}
                            </h4>
                            {translatedDescription && (
                              <p className="text-xs text-white/90 line-clamp-2 drop-shadow" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                                {translatedDescription}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </PrefetchedMenuLink>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Memoized export to prevent unnecessary re-renders
export const MegaMenu = React.memo(MegaMenuComponent, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.currentLocale === nextProps.currentLocale &&
    prevProps.fixedBannersHeight === nextProps.fixedBannersHeight &&
    prevProps.hoveredSubmenuItem?.id === nextProps.hoveredSubmenuItem?.id
  );
});
