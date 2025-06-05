// /components/Footer.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useCookieSettings } from '@/context/CookieSettingsContext';

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  description?: string;
  is_displayed?: boolean;
  organization_id?: string | null;
}

interface ReactIcon {
  icon_name: string;
}

interface MenuItem {
  id: number;
  display_name: string;
  url_name: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  image?: string;
  react_icon_id?: number;
  react_icons?: ReactIcon | ReactIcon[];
  website_submenuitem?: SubMenuItem[];
  organization_id?: string | null;
}

interface FooterProps {
  companyLogo?: string;
  menuItems: MenuItem[] | undefined;
  error?: string; // Added for error handling
}

const Footer: React.FC<FooterProps> = ({ companyLogo = '/images/logo.svg', menuItems = [], error }) => {
  const { session, logout } = useAuth();
  const { settings } = useSettings();
  const { setShowSettings } = useCookieSettings();
  const router = useRouter();
  const isLoggedIn = !!session;
  const maxItemsPerColumn = 8;

  console.log('Menu items in Footer:', JSON.stringify(menuItems, null, 2));

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

  const totalColumns = itemsWithSubitems.length + groupedItemsWithoutSubitems.length + 1;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => () => router.push(path);

  const footerBackground = settings?.footer_color || 'gray-800';

  if (error) {
    return (
      <footer className={`bg-${footerBackground} py-12 text-sm text-white min-h-[300px]`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-red-300 min-h-[160px] flex items-center justify-center">
            <p>{error}</p>
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

  if (itemsWithSubitems.length === 0 && groupedItemsWithoutSubitems.length === 0) {
    return (
      <footer className={`bg-${footerBackground} py-12 text-sm text-white min-h-[300px]`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            {settings?.image ? (
              <Image
                src={settings.image}
                alt="Logo"
                width={32}
                height={32}
                className="h-8 w-auto mb-4"
                priority={false}
                onError={(e) => {
                  console.error('Failed to load logo:', settings.image);
                  e.currentTarget.src = companyLogo;
                }}
              />
            ) : (
              <div className="h-8 w-8 bg-gray-600 rounded animate-pulse mb-4" aria-busy="true" />
            )}
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
    <footer className={`bg-${footerBackground} py-12 text-sm text-white min-h-[300px]`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {settings?.image ? (
            <Image
              src={settings.image}
              alt="Logo"
              width={32}
              height={32}
              className="h-8 w-auto mb-4"
              priority={false}
              onError={(e) => {
                console.error('Failed to load logo:', settings.image);
                e.currentTarget.src = companyLogo;
              }}
            />
          ) : (
            <div className="h-8 w-8 bg-gray-600 rounded animate-pulse mb-4" aria-busy="true" />
          )}
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
              <h3 className="mb-4 text-sm font-semibold">
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
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8 text-center">
          <p className="text-xs font-medium tracking-widest text-gray-300">
            © 2025 {settings?.site || 'Company'}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;