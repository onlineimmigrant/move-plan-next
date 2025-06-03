// /components/NavbarFooterWrapper.tsx
'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface SubMenuItem {
  id: number;
  name: string;
  url_name: string;
  order: number;
  description?: string;
  is_displayed?: boolean;
  organization_id: string | null;
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
  order: number;
  image?: string;
  react_icon_id?: number;
  react_icons?: ReactIcon | ReactIcon[]; // Updated type
  website_submenuitem?: SubMenuItem[];
  organization_id: string | null;
}

interface NavbarFooterWrapperProps {
  children: React.ReactNode;
  menuItems: MenuItem[] | undefined;
}

export default function NavbarFooterWrapper({ children, menuItems = [] }: NavbarFooterWrapperProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');

  return (
    <>
      {!isAdminRoute && <Header menuItems={menuItems} />}
      {children}
      {!isAdminRoute && <Footer menuItems={menuItems} />}
    </>
  );
}