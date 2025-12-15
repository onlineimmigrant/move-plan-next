import React from 'react';
import Image from 'next/image';
import { Disclosure } from '@headlessui/react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';
import { MenuItem } from '@/types/menu';
import LocalizedLink from '@/components/LocalizedLink';
import { getTranslatedMenuContent } from '@/utils/menuTranslations';

interface MobileMenuProps {
  filteredMenuItems: MenuItem[];
  currentLocale: string | null;
  settings: any;
  translations: any;
  setIsOpen: (isOpen: boolean) => void;
}

/**
 * MobileMenu - Mobile navigation with expandable sections
 * Uses Disclosure for accordion-style submenu items
 */
const MobileMenuComponent: React.FC<MobileMenuProps> = ({
  filteredMenuItems,
  currentLocale,
  settings,
  translations,
  setIsOpen,
}) => {
  if (filteredMenuItems.length === 0) {
    return (
      <div className="p-6 text-center h-[50vh] flex items-center justify-center">
        <span className="text-[14px] text-gray-500 antialiased">{translations.noMenuItems}</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredMenuItems.map((item) => {
        const displayedSubItems = (item.website_submenuitem || [])
          .filter((subItem) => subItem.is_displayed !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Get translated content for menu item
        const translatedDisplayName = currentLocale 
          ? getTranslatedMenuContent(item.display_name, item.display_name_translation, currentLocale)
          : item.display_name;

        return (
          <div key={item.id} className="relative">
            {displayedSubItems.length > 0 ? (
              <Disclosure>
                {({ open }) => (
                  <div>
                    <Disclosure.Button
                      className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                      aria-label={translations.toggleMenu(translatedDisplayName)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-left">
                          <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedDisplayName}</span>
                          <p className="text-xs text-gray-500" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>
                            {displayedSubItems.length} {displayedSubItems.length === 1 ? 'option' : 'options'}
                          </p>
                        </div>
                      </div>
                      <div className="transition-colors duration-200">
                        {open ? (
                          <MinusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        ) : (
                          <PlusIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        )}
                      </div>
                    </Disclosure.Button>
                    <Disclosure.Panel className="mt-3 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-hide">
                      {displayedSubItems.map((subItem) => {
                        // Get translated content for submenu item
                        const translatedSubItemName = currentLocale 
                          ? getTranslatedMenuContent(subItem.name, subItem.name_translation, currentLocale)
                          : subItem.name;

                        // Properly handle description with translation logic
                        const translatedDescription = subItem.description
                          ? (currentLocale 
                              ? getTranslatedMenuContent(subItem.description, subItem.description_translation, currentLocale)
                              : subItem.description)
                          : null;

                        const displayDescription = translatedDescription || `Learn more about ${translatedSubItemName.toLowerCase()}`;

                        return (
                          <LocalizedLink
                            key={subItem.id}
                            href={subItem.url_name}
                            onClick={() => setIsOpen(false)}
                            className="flex text-gray-800 hover:text-gray-900 transition-colors duration-200"
                          >
                            {/* Image section - 1/3 width, full height */}
                            <div className="relative w-1/3 flex-shrink-0 min-h-[60px]">
                              {subItem.image ? (
                                <Image
                                  src={subItem.image}
                                  alt={translatedSubItemName}
                                  fill
                                  sizes="(max-width: 768px) 80px, 100px"
                                  className="object-cover rounded-l-xl"
                                  loading="lazy"
                                  placeholder="blur"
                                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA4MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo="
                                  onError={() =>
                                    console.error(
                                      `Failed to load image for submenu item ${translatedSubItemName}: ${subItem.image}`
                                    )
                                  }
                                />
                              ) : settings?.image ? (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-l-xl p-3">
                                  <div className="relative w-full h-full">
                                    <Image
                                      src={settings.image}
                                      alt="Logo"
                                      fill
                                      sizes="(max-width: 768px) 80px, 100px"
                                      className="object-contain"
                                      loading="lazy"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-l-xl min-h-[60px]">
                                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            
                            {/* Content section - 2/3 width */}
                            <div className="flex-1 flex items-center justify-between p-3">
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium block mb-1" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedSubItemName}</span>
                                <p className="text-xs text-gray-500 line-clamp-2" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{displayDescription}</p>
                              </div>
                            </div>
                          </LocalizedLink>
                        );
                      })}
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>
            ) : (
              <LocalizedLink
                href={item.url_name}
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between w-full p-4 text-gray-800 hover:text-gray-900 focus:outline-none transition-colors duration-200"
                aria-label={translations.goTo(translatedDisplayName)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}>{translatedDisplayName}</span>
                  </div>
                </div>
              </LocalizedLink>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Memoized export to prevent unnecessary re-renders
export const MobileMenu = React.memo(MobileMenuComponent, (prevProps, nextProps) => {
  // Only re-render if critical props change
  return (
    prevProps.filteredMenuItems === nextProps.filteredMenuItems &&
    prevProps.currentLocale === nextProps.currentLocale &&
    prevProps.settings?.image === nextProps.settings?.image
  );
});
