// admin/layout.tsx
"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { BasketProvider } from "@/context/BasketContext";
import { ModalProvider } from "@/context/ModalContext";
import ParentMenu from "./components/ParentMenu";
import TablesChildMenu from "./components/TablesChildMenu";
import ReportsChildMenu from "./components/ReportsChildMenu";
import { sidebarLinks, DisclosureKey as TablesDisclosureKey } from "@/lib/sidebarLinks";
import { reportSidebarLinks, DisclosureKey as ReportsDisclosureKey } from "@/lib/reportSidebarLinks";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isParentMenuCollapsed, setIsParentMenuCollapsed] = useState(true);
  const [activeSection, setActiveSection] = useState("");
  const [openTablesSections, setOpenTablesSections] = useState<Record<TablesDisclosureKey, boolean>>({
    users: false,
    sell: false,
    app: false,
    consent_management: false,
    blog: false,
    eduPro: false,
    settings: false,
  });
  const [openReportsSections, setOpenReportsSections] = useState<Record<ReportsDisclosureKey, boolean>>({
    tables: false,
    custom: false,
  });
  const [searchQuery, setSearchQuery] = useState("");

  // Sync activeSection with pathname
  useEffect(() => {
    if (pathname.startsWith("/admin/reports")) {
      setActiveSection("reports");
    } else if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/reports")) {
      // Any /admin/* path not under /admin/reports is considered a table
      setActiveSection("tables");
    } else {
      setActiveSection(""); // For non-admin routes (unlikely in this context)
    }
    console.log("pathname:", pathname, "activeSection:", activeSection); // Debug log
  }, [pathname]);

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

            {activeSection === "tables" && (
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

            {activeSection === "reports" && (
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