'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { MenuItem, SubMenuItem, ReactIcon } from '@/types/menu';

interface FooterProps {
  menuItems?: MenuItem[];
  error?: string;
}

const Footer: React.FC<FooterProps> = ({ menuItems = [], error = '' }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { session, logout = () => {} } = useAuth();
  const { settings } = useSettings();
  const { setShowSettings } = useCookieSettings();
  const router = useRouter();
  const isLoggedIn = !!session;
  const maxItemsPerColumn = 8;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { itemsWithSubitems, groupedItemsWithoutSubitems } = useMemo(() => {
    const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];

    const withSubitems = safeMenuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        item.website_submenuitem?.length
    );

    const withoutSubitems = safeMenuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        !item.website_submenuitem?.length
    );

    const grouped: MenuItem[][] = [];
    for (let i = 0; i < withoutSubitems.length; i += maxItemsPerColumn) {
      grouped.push(withoutSubitems.slice(i, i + maxItemsPerColumn));
    }

    return {
      itemsWithSubitems: withSubitems,
      groupedItemsWithoutSubitems: grouped,
    };
  }, [menuItems]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => () => router.push(path);

  const footerBackground = settings?.footer_color || 'gray-800';

  if (!isMounted) {
    return null;
  }

  return (
    <footer className={`bg-${footerBackground} py-8 text-sm text-white px-4`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex items-center">
          <button
            onClick={() => setShowSettings(true)}
            className="text-gray-300 hover:text-white whitespace-nowrap"
            aria-label="Privacy Settings"
          >
            Privacy Settings
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-min">
          {menuItems.length === 0 ? (
            <span className="text-gray-500">No menu items available</span>
          ) : (
            <>
              {itemsWithSubitems.map((item) => (
                <div key={item.id}>
                  <h3 className="mb-2 font-medium text-white">
                    <Link href={item.url_name} className="hover:text-gray-300">
                      {item.display_name}
                    </Link>
                  </h3>
                  <ul className="space-y-1">
                    {item.website_submenuitem
                      ?.filter((subItem) => subItem.is_displayed !== false)
                      .map((subItem) => (
                        <li key={subItem.id}>
                          <Link href={subItem.url_name} className="text-gray-300 hover:text-white">
                            {subItem.name}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}

              {groupedItemsWithoutSubitems.map((group, index) => (
                <div key={`group-${index}`}>
                  <h3 className="mb-2 font-medium text-white">
                    <Link
                      className="hover:text-gray-300"
                      href={group[0]?.url_name || '#'}
                    >
                      {itemsWithSubitems.length ? '' : 'Links'}
                    </Link>
                  </h3>
                  <ul className="space-y-1">
                    {group.map((item) => (
                      <li key={item.id}>
                        <Link href={item.url_name} className="text-gray-300 hover:text-white">
                          {item.display_name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div>
                <h3 className="mb-2 font-medium text-white">Profile</h3>
                <ul className="space-y-1">
                  {isLoggedIn ? (
                    <li>
                      <button
                        onClick={handleLogout}
                        type="button"
                        className="text-gray-300 hover:text-white"
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
                          className="text-gray-300 hover:text-white"
                          aria-label="Login"
                        >
                          Login
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={handleNavigation('/register')}
                          className="text-gray-300 hover:text-white"
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
        </div>

        <div className="mt-4 border-t border-gray-600 pt-4 text-center">
          <p className="text-xs text-gray-300">
            © 2025 {settings?.site || 'Company'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default React.memo(Footer);