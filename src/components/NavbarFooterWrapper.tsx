'use client';

import { MenuItem } from '@/types/menu'; // Shared type
import Header from './Header';
import Footer from './Footer';

interface NavbarFooterWrapperProps {
  children: React.ReactNode;
  menuItems?: MenuItem[];
  fixedBannersHeight: number;
}

export default function NavbarFooterWrapper({
  children,
  menuItems,
  fixedBannersHeight,
}: NavbarFooterWrapperProps) {
  return (
    <>
      <Header menuItems={menuItems} fixedBannersHeight={fixedBannersHeight} />
      {children}
      <Footer menuItems={menuItems} />
    </>
  );
}