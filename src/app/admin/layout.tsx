'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext'; // Corrected import path
import { BasketProvider } from '@/context/BasketContext';
import { ModalProvider } from '@/context/ModalContext';
import ParentMenu from './components/ParentMenu';
import TablesChildMenu from './components/TablesChildMenu';
import ReportsChildMenu from './components/ReportsChildMenu';
import { sidebarLinks, DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { reportSidebarLinks, DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  console.log('[AdminLayout] Rendering for path:', pathname);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isParentMenuCollapsed, setIsParentMenuCollapsed] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [isDesktop, setIsDesktop] = useState(false);
  const [openTablesSections, setOpenTablesSections] = useState<Record<TablesDisclosureKey, boolean>>({
    users: false,
    sell: false,
    booking: false,
    app: false,
    consent_management: false,
    blog: false,
    edupro: false,
    quiz: false,
    feedback: false,
    ai: false,
    datacollection: false,
    website: false,
    email: false,
    settings: false,
  });
  const [openReportsSections, setOpenReportsSections] = useState<Record<ReportsDisclosureKey, boolean>>({
    tables: false,
    custom: false,
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mediaQuery.matches);

    const handleResize = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
    };

    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, []);

  useEffect(() => {
    if (pathname.startsWith('/admin/reports')) {
      setActiveSection('reports');
    } else if (pathname.startsWith('/admin/tables')) {
      setActiveSection('tables');
    } else {
      setActiveSection('');
    }
    console.log('pathname:', pathname, 'activeSection:', activeSection);
  }, [pathname, activeSection]);

  const shouldShowTablesChildMenu =
    (isDesktop && !pathname.startsWith('/admin/reports') && pathname !== '/admin') ||
    (!isDesktop && activeSection === 'tables');

  return (
    <AuthProvider>
      <AdminProvider> {/* Add AdminProvider here */}
        <BasketProvider>
          <ModalProvider>
            <div className="pt-12 min-h-screen flex bg-gray-50">
              <ParentMenu
                isCollapsed={isParentMenuCollapsed}
                setIsCollapsed={setIsParentMenuCollapsed}
                setActiveSection={setActiveSection}
              />
              {shouldShowTablesChildMenu && (
                <TablesChildMenu
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                  sidebarLinks={sidebarLinks}
                  openSections={openTablesSections}
                  setOpenSections={setOpenTablesSections}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}
              {activeSection === 'reports' && (
                <ReportsChildMenu
                  isSidebarOpen={isSidebarOpen}
                  setIsSidebarOpen={setIsSidebarOpen}
                  sidebarLinks={reportSidebarLinks}
                  openSections={openReportsSections}
                  setOpenSections={setOpenReportsSections}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                />
              )}
              <main className="flex-1 overflow-y-auto min-h-screen">
                <div className="max-w-7xl mx-auto px-0 sm:px-6 md:px-8">{children}</div>
              </main>
            </div>
          </ModalProvider>
        </BasketProvider>
      </AdminProvider>
    </AuthProvider>
  );
}