'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { MenuItem, SubMenuItem } from '@/types/menu';
import LanguageSwitcher from './LanguageSwitcher';

interface FooterProps {
  menuItems?: MenuItem[];
}

const Footer: React.FC<FooterProps> = ({ menuItems = [] }) => {
  const { session, logout = () => {} } = useAuth();
  const { settings } = useSettings();
  const { setShowSettings } = useCookieSettings();
  const router = useRouter();
  const isAuthenticated = !!session;
  const maxItemsPerColumn = 8;

  // Memoize menu grouping logic
  const { itemsWithSubitems, groupedItemsWithoutSubitems } = useMemo(() => {
    const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
    const itemsWithSubitems = safeMenuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        item.website_submenuitem?.length
    );
    const itemsWithoutSubitems = safeMenuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        !item.website_submenuitem?.length
    );
    const groupedItems: MenuItem[][] = [];
    for (let i = 0; i < itemsWithoutSubitems.length; i += maxItemsPerColumn) {
      groupedItems.push(itemsWithoutSubitems.slice(i, i + maxItemsPerColumn));
    }
    return {
      itemsWithSubitems,
      groupedItemsWithoutSubitems: groupedItems,
    };
  }, [menuItems]);

  // Memoize handlers
  const handleLogout = useMemo(() => () => {
    logout();
    router.push('/login');
  }, [logout, router]);

  const handleNavigation = useMemo(() => (path: string) => () => router.push(path), [router]);

  const footerBackground = settings?.footer_color || 'neutral-900';

  // Rest of the component remains unchanged
  return (
    <footer className={`bg-${footerBackground} text-white py-12 px-6 md:px-8 min-h-[400px]`} role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={() => setShowSettings(true)}
            className="text-neutral-400 hover:text-white text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            aria-label="Privacy Settings"
          >
            Privacy Settings
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5" aria-label="Footer navigation">
          {menuItems.length === 0 ? (
            <span className="text-neutral-500 text-sm">No menu items available</span>
          ) : (
            <>
              {itemsWithSubitems.map((item) => (
                <div key={item.id} className="col-span-1 min-h-[200px]">
                  <h3 className="text-base font-semibold mb-4">
                    <Link
                      href={item.url_name || '#'}
                      className="hover:text-neutral-300 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    >
                      {item.display_name}
                    </Link>
                  </h3>
                  <ul className="space-y-2">
                    {item.website_submenuitem
                      ?.filter((subItem) => subItem.is_displayed !== false)
                      .map((subItem) => (
                        <li key={subItem.id}>
                          <Link
                            href={subItem.url_name || '#'}
                            className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          >
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}

              {groupedItemsWithoutSubitems.map((group, index) => (
                <div key={`group-${index}`} className="col-span-1 min-h-[200px]">
                  <h3 className="text-base font-semibold mb-4">
                    <Link
                      href={group[0]?.url_name || '#'}
                      className="hover:text-neutral-300 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                    >
                      {itemsWithSubitems.length ? '' : 'Links'}
                    </Link>
                  </h3>
                  <ul className="space-y-2">
                    {group.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={item.url_name || '#'}
                          className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                        >
                          {item.display_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="col-span-1 min-h-[200px]">
                <h3 className="text-base font-semibold mb-4">Profile</h3>
                <ul className="space-y-2">
                  {isAuthenticated ? (
                    <li>
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                        aria-label="Logout"
                      >
                        Logout
                      </button>
                    </li>
                  ) : (
                    <>
                      <li>
                        <button
                          type="button"
                          onClick={handleNavigation('/login')}
                          className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          aria-label="Login"
                        >
                          Login
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleNavigation('/register')}
                          className="text-neutral-400 hover:text-white text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                          aria-label="Register"
                        >
                          Register
                        </button>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </>
          )}
        </nav>

        <div className="mt-12 border-t border-neutral-500 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <small className="text-xs text-neutral-500">
              © {new Date().getFullYear()} {settings?.site || 'Company'}. All rights reserved.
            </small>
            {settings?.with_language_switch && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500">Language:</span>
                <LanguageSwitcher />
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);