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
import TicketsAdminToggleButton from '@/components/modals/TicketsModals/TicketsAdminModal/TicketsAdminToggleButton';

// Inner component that uses auth context
function AdminLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAdmin, isSuperadmin, isInGeneralOrganization } = useAuth();
  console.log('[AdminLayout] Rendering for path:', pathname, 'isAdmin:', isAdmin, 'isSuperadmin:', isSuperadmin, 'isInGeneralOrganization:', isInGeneralOrganization);

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
  const [isTablesHovered, setIsTablesHovered] = useState(false);

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
      !pathname.startsWith('/admin/reports') &&
      isTablesHovered) ||
    (!isDesktop && activeSection === 'tables');

  if (!isAdmin) {
    return null; // Redirect handled by AuthProvider
  }

  return (
      <BasketProvider>
        <ModalProvider>
          <div className="min-h-screen flex bg-gray-50">
            <div 
              className="relative flex"
              onMouseLeave={(e) => {
                // Check if mouse is leaving the entire hover area
                const rect = e.currentTarget.getBoundingClientRect();
                const { clientX, clientY } = e;
                
                // If mouse is outside the hover container, close the tables menu
                if (clientX < rect.left || clientX > rect.right || 
                    clientY < rect.top || clientY > rect.bottom) {
                  setTimeout(() => setIsTablesHovered(false), 100);
                }
              }}
            >
              <ParentMenu
                isCollapsed={isParentMenuCollapsed}
                setIsCollapsed={setIsParentMenuCollapsed}
                setActiveSection={setActiveSection}
                setIsTablesHovered={setIsTablesHovered}
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
            </div>
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
            
            {/* Superadmin Portal Button */}
            {isSuperadmin && (
              <a
                href="/superadmin"
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                title="Go to Superadmin Portal"
              >
                <span className="text-xl">👑</span>
                <span className="font-medium hidden sm:inline">Superadmin Portal</span>
              </a>
            )}
            
            <TicketsAdminToggleButton />
          </div>
        </ModalProvider>
      </BasketProvider>
  );
}

// Outer component that provides auth context
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <BasketProvider>
        <ModalProvider>
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </ModalProvider>
      </BasketProvider>
    </AuthProvider>
  );
}