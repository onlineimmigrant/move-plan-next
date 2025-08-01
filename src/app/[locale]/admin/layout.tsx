'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { BasketProvider } from '@/context/BasketContext';
import { ModalProvider } from '@/context/ModalContext';
import ParentMenu from './components/ParentMenu';
import TablesChildMenu from './components/TablesChildMenu';
import ReportsChildMenu from './components/ReportsChildMenu';
import { sidebarLinks, getFilteredSidebarLinks, DisclosureKey as TablesDisclosureKey } from '@/lib/sidebarLinks';
import { reportSidebarLinks, DisclosureKey as ReportsDisclosureKey } from '@/lib/reportSidebarLinks';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isInGeneralOrganization } = useAuth();
  console.log('[AdminLayout] Rendering for path:', pathname, 'isAdmin:', isAdmin, 'isInGeneralOrganization:', isInGeneralOrganization);

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

  // Get filtered sidebar links based on user permissions
  const filteredSidebarLinks = getFilteredSidebarLinks(sidebarLinks, isInGeneralOrganization);

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
  }, [pathname]);

  const excludedPaths = [
    '/admin',
    '/admin/tickets/management',
    '/admin/products/management',
    '/admin/pricingplans/management',
    '/admin/ai/management',
    '/admin/miners/management',
  ];

  const shouldShowTablesChildMenu =
    (isDesktop &&
      !excludedPaths.includes(pathname) &&
      !pathname.startsWith('/admin/reports')) ||
    (!isDesktop && activeSection === 'tables');

  if (!isAdmin) {
    return null; // Redirect handled by AuthProvider
  }

  return (
    <AuthProvider>
      <BasketProvider>
        <ModalProvider>
          <div className="min-h-screen flex bg-gray-50">
            <ParentMenu
              isCollapsed={isParentMenuCollapsed}
              setIsCollapsed={setIsParentMenuCollapsed}
              setActiveSection={setActiveSection}
            />
            {shouldShowTablesChildMenu && (
              <TablesChildMenu
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                sidebarLinks={filteredSidebarLinks}
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
    </AuthProvider>
  );
}