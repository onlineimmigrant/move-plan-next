'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCookieSettings } from '@/context/CookieSettingsContext';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  image?: string;
  react_icon_id?: number;
  react_icons?: { icon_name: string };
  website_submenuitem?: SubMenuItem[];
  organization_id?: string; // Optional for NULL logic
}

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  description?: string;
  is_displayed?: boolean;
  organization_id?: string; // Optional for NULL logic
}

interface FooterProps {
  companyLogo?: string;
}

const Footer: React.FC<FooterProps> = ({}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session, logout } = useAuth();
  const { settings } = useSettings();
  const { setShowSettings } = useCookieSettings();
  const router = useRouter();
  const isLoggedIn = !!session;
  const maxItemsPerColumn = 8;

  useEffect(() => {
    let mounted = true;

    const fetchMenuItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/menu', { cache: 'force-cache' });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch menu items');
        }
        const data = await response.json();
        console.log('Fetched menu items in Footer:', JSON.stringify(data, null, 2));
        if (mounted) setMenuItems(data);
      } catch (error) {
        console.error('Error fetching menu items in Footer:', error);
        if (mounted) setMenuItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchMenuItems();

    return () => {
      mounted = false;
    };
  }, []);

  const { itemsWithSubitems, groupedItemsWithoutSubitems } = useMemo(() => {
    // Step 1: Filter items with subitems
    const withSubitems = menuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        item.website_submenuitem?.length
    );

    // Step 2: Filter items without subitems
    const withoutSubitems = menuItems.filter(
      (item) =>
        item.is_displayed_on_footer &&
        item.display_name !== 'Profile' &&
        !item.website_submenuitem?.length
    );

    // Step 3: Group items without subitems
    const grouped: MenuItem[][] = [];
    for (let i = 0; i < withoutSubitems.length; i += maxItemsPerColumn) {
      grouped.push(withoutSubitems.slice(i, i + maxItemsPerColumn));
    }

    // Step 4: Return computed values
    return {
      itemsWithSubitems: withSubitems,
      groupedItemsWithoutSubitems: grouped,
    };
  }, [menuItems]);

  const totalColumns = itemsWithSubitems.length + groupedItemsWithoutSubitems.length + 1;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => () => router.push(path);

  const footerBackground = settings?.footer_color || 'gray-800';

  // Fallback UI for loading or empty menu
  if (isLoading) {
    return (
      <footer className={`bg-${footerBackground} py-12 text-sm text-white`}>
        <div className="mx-auto max-w-7xl px-8">
          <p className="text-center text-gray-300">Loading footer...</p>
        </div>
      </footer>
    );
  }

  if (menuItems.length === 0) {
    return (
      <footer className={`bg-${footerBackground} py-12 text-sm text-white`}>
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-8">
            <button
              onClick={() => setShowSettings(true)}
              className="hover:text-gray-300"
              aria-label="Privacy Settings"
            >
              <strong>Privacy Settings</strong>
            </button>
          </div>
          <div className="mt-12 border-t border-gray-100 pt-8 text-center">
            <p className="text-xs font-medium tracking-widest text-gray-300">
              © 2025 {settings?.site || 'Company'}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-${footerBackground} py-12 text-sm text-white`}>
      <div className="mx-auto max-w-7xl px-8">
        <div className="mb-8">
          <button
            onClick={() => setShowSettings(true)}
            className="hover:text-gray-300"
            aria-label="Privacy Settings"
          >
            <strong>Privacy Settings</strong>
          </button>
        </div>

        <div
          className={`grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-${Math.min(totalColumns, 4)}`}
        >
          {itemsWithSubitems.map((item) => (
            <div key={item.id}>
              <h3 className="mb-4 font-semibold">
                <Link href={item.url_name} className="hover:text-gray-300">
                  {item.display_name}
                </Link>
              </h3>
              <ul className="space-y-2">
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
              <h3 className="mb-0 text-sm font-semibold">
                <Link
                  className="text-white hover:text-gray-300"
                  href={group[0]?.url_name || '#'}
                >
                  {itemsWithSubitems.length ? '' : 'Links'}
                </Link>
              </h3>
              <ul className="space-y-2">
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
            <h3 className="mb-4 text-sm font-semibold">Profile</h3>
            <ul className="space-y-2">
              {isLoggedIn ? (
                <li>
                  <button onClick={handleLogout} type="button" className="text-gray-300 hover:text-white">
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
                    >
                      Login
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={handleNavigation('/register')}
                      className="text-gray-300 hover:text-white"
                    >
                      Register
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8 text-center">
          <p className="text-xs font-medium text-gray-300 tracking-wide">
            © 2025 {settings?.site || 'Company'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;