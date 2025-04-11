'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useSettings } from "@/context/SettingsContext";
import { cn } from "@/lib/utils";

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
}

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  description?: string;
}

interface FooterProps {
  companyLogo?: string;
}

const Footer: React.FC<FooterProps> = ({ companyLogo = '/images/logo.svg' }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { session, logout } = useAuth();
  const router = useRouter();
  const isLoggedIn = !!session;
  const CONNECTED_APP_URL = 'https://app.letspring.com';
  const { settings } = useSettings();

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) {
          throw new Error('Failed to fetch menu items');
        }
        const data: MenuItem[] = await response.json();
        console.log('Fetched menu items:', data);
        setMenuItems(data);
      } catch (error) {
        console.error('Error fetching menu items:', error);
      } finally {
        setIsMounted(true);
      }
    };
    fetchMenuItems();
  }, []);

  useEffect(() => {
    console.log('isLoggedIn:', isLoggedIn);
    console.log('session:', session);
    console.log('menuItems:', menuItems);
  }, [isLoggedIn, session, menuItems]);

  const handleLogoutAction = () => {
    logout();
    router.push('/login');
  };

  const handleShowLogin = () => {
    router.push('/login');
  };

  const handleShowRegister = () => {
    router.push('/register');
  };

  const itemsWithSubitems = menuItems.filter(
    item =>
      item.is_displayed_on_footer &&
      item.display_name !== 'Profile' &&
      item.website_submenuitem &&
      item.website_submenuitem.length > 0
  );

  const itemsWithoutSubitems = menuItems.filter(
    item =>
      item.is_displayed_on_footer &&
      item.display_name !== 'Profile' &&
      (!item.website_submenuitem || item.website_submenuitem.length === 0)
  );

  const maxItemsPerColumn = 6;
  const groupedItemsWithoutSubitems: MenuItem[][] = [];
  for (let i = 0; i < itemsWithoutSubitems.length; i += maxItemsPerColumn) {
    groupedItemsWithoutSubitems.push(itemsWithoutSubitems.slice(i, i + maxItemsPerColumn));
  }

  const totalColumns = itemsWithSubitems.length + groupedItemsWithoutSubitems.length + 1;

  return (
    <footer className={cn(
      "tracking-tight text-sm sm:text-sm font-medium text-white py-12",
      settings?.footer_color?.name
        ? `bg-${settings.footer_color.name}`
        : "text-sky-600",
    )}>
      <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-2 md:grid-cols-2 lg:grid-cols-${Math.min(totalColumns, 4)} gap-8`}>
          {/* Menu Items with Subitems */}
          {itemsWithSubitems.length > 0 && itemsWithSubitems.map(item => (
            <div key={item.id}>
              <h3 className="text-sm font-semibold mb-4">
                <Link 
                  href={item.url_name}
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  {item.display_name}
                </Link>
              </h3>
              <ul className="space-y-2">
                {item.website_submenuitem?.map(subItem => (
                  <li key={subItem.id}>
                    <Link
                      href={subItem.url_name}
                      className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Grouped Menu Items without Subitems */}
          {groupedItemsWithoutSubitems.length > 0 && groupedItemsWithoutSubitems.map((group, index) => (
            <div key={`group-${index}`}>
              <h3 className="text-sm font-semibold mb-0">
                <Link
                  href={group[0]?.url_name || '#'} // Use first item's url_name as fallback
                  className="text-white hover:text-gray-300 transition-colors duration-200"
                >
                  {itemsWithSubitems.length > 0 ? '' : 'Links'}
                  {groupedItemsWithoutSubitems.length > 1 ? ` ` : ''}
                </Link>
              </h3>
              <ul className="space-y-2">
                {group.map(item => (
                  <li key={item.id}>
                    <Link
                      href={item.url_name}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {item.display_name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Profile Column */}
          <div>
            <h3 className="text-sm font-semibold mb-4">Profile</h3>
            <ul className="space-y-2">
              {isLoggedIn ? (
                <li>
                  <button
                    onClick={handleLogoutAction}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Logout
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <button
                      onClick={handleShowLogin}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      Login
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleShowRegister}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      Register
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-12 border-t border-gray-100 pt-8 text-center">
          <p className="text-gray-300 text-xs font-medium tracking-widest">
            © {new Date().getFullYear()} {settings?.site}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;