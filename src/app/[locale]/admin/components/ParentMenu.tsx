"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  TableCellsIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  ShoppingCartIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  SwatchIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { useModal } from "@/context/ModalContext";

interface ParentMenuProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setActiveSection: (section: string) => void;
  setIsTablesHovered: (hovered: boolean) => void;
}

const ParentMenu: React.FC<ParentMenuProps> = ({
  isCollapsed,
  setIsCollapsed,
  setActiveSection,
  setIsTablesHovered,
}) => {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { setIsPaletteModalOpen } = useModal();
  const companyLogo = settings?.image;

  const menuItems = [
    { 
      label: "Dashboard", 
      icon: <HomeIcon className="h-4 w-4" />, 
      href: "/admin"
    },
    {
      label: "Tables",
      icon: <TableCellsIcon className="h-4 w-4" />,
      href: "/admin/tables",
      onClick: () => setActiveSection("tables"),
      hasSubmenu: true
    },
    {
      label: "App",
      icon: <DevicePhoneMobileIcon className="h-4 w-4" />,
      href: "/admin/relocation_plans",
      onClick: () => setActiveSection("app")
    },
    {
      label: "Reports",
      icon: <ChartBarIcon className="h-4 w-4" />,
      href: "/admin/reports/custom",
      onClick: () => setActiveSection("reports")
    },
    {
      label: "Settings",
      icon: <Cog6ToothIcon className="h-4 w-4" />,
      href: "/admin/settings"
    },
  ];

  // Special items that appear only on settings page
  const settingsPageItems = pathname === "/admin/settings" ? [
    {
      label: "Palette",
      icon: <SwatchIcon className="h-4 w-4" />,
      href: "#",
      onClick: () => setIsPaletteModalOpen(true)
    },
  ] : [];

  return (
    <div
      className={cn(
        "z-50 h-screen flex flex-col transition-all duration-300 text-base",
        "bg-gradient-to-b from-white via-gray-50/80 to-gray-100/60",
        "border-r border-gray-200/80 backdrop-blur-sm",
        "shadow-lg shadow-gray-200/50",
        isCollapsed ? "w-14" : "w-48 pl-6",
      )}
      onMouseEnter={() => {
        // Don't auto-expand when TablesChildMenu might be shown
        // Individual menu items handle their own hover logic
      }}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <nav className="fixed flex-1 flex flex-col px-2 pt-6">
        <div className="flex flex-col gap-6">
          <div
            className={cn(
              "grid grid-cols-[auto_1fr] items-center p-2 rounded-md transition-all duration-200",
              isCollapsed && "grid-cols-1 justify-items-center p-0",
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center",
                isCollapsed
                  ? "h-10 w-10 hover:bg-gray-100 hover:rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                  : "justify-self-start",
              )}
            >
              <Link href="/admin">
                <Image
                  src={isCollapsed ? "/images/codedharmony-collapsed.png" : `${companyLogo}`}
                  alt="Logo"
                  width={20}
                  height={20}
                  className="h-6 w-auto"
                />
              </Link>
            </span>
            {!isCollapsed && (
              <Link
                href="/"
                className="hidden ml-4 tracking-tight text-sm sm:text-base font-bold text-sky-600"
              >
                {settings?.site || ''}
              </Link>
            )}
          </div>

          {/* Main Navigation Items */}
          <div className="space-y-2">
            {menuItems.map((item) => {
              // Ensure exact pathname matching for active state
              const isActive = pathname === item.href && pathname !== "";
              return (
                <Link
                  key={`${item.href}-${pathname}`}
                  href={item.href}
                  onClick={() => {
                    if (item.onClick) item.onClick();
                    else setActiveSection("");
                  }}
                  onMouseEnter={() => {
                    if (item.label === "Tables") {
                      setIsTablesHovered(true);
                      setIsCollapsed(true); // Keep ParentMenu collapsed when Tables is hovered
                    } else {
                      setIsCollapsed(false); // Expand for other items
                      setIsTablesHovered(false); // Close Tables menu when hovering other items
                    }
                  }}
                  className={cn(
                    "group relative grid grid-cols-[auto_1fr] items-center p-2.5 text-xs font-medium rounded-xl transition-all duration-200",
                    "hover:shadow-md hover:shadow-gray-200/50 hover:-translate-y-0.5",
                    // Only apply active styles when pathname exactly matches
                    pathname === item.href && pathname !== ""
                      ? "bg-gradient-to-r from-sky-50 to-blue-50 text-sky-900 border border-sky-200/50 shadow-md shadow-sky-200/30"
                      : "text-slate-600 hover:bg-gradient-to-r hover:from-white/80 hover:to-gray-50/60 hover:text-gray-900 border border-transparent hover:border-gray-200/50",
                    isCollapsed && "grid-cols-1 justify-items-center p-2 mx-1",
                    item.hasSubmenu && !isActive && "hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-blue-50/30"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center transition-all duration-200",
                      isCollapsed
                        ? "h-8 w-8 group-hover:bg-white/60 group-hover:rounded-full group-hover:scale-110"
                        : "justify-self-start",
                      pathname === item.href && pathname !== ""
                        ? "text-sky-600"
                        : "group-hover:text-sky-600 group-hover:scale-105",
                    )}
                  >
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="text-xs font-semibold leading-tight pl-3">
                      {item.label}
                    </span>
                  )}
                  {/* Submenu indicator */}
                  {item.hasSubmenu && !isCollapsed && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-sky-400 rounded-full opacity-60" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings Page Special Items */}
          {settingsPageItems.length > 0 && (
            <div className="border-t border-gray-200/60 pt-4 mt-4">
              <div className="space-y-2">
                {settingsPageItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn(
                      "group w-full grid grid-cols-[auto_1fr] items-center p-2.5 text-xs font-medium rounded-xl transition-all duration-200",
                      "text-slate-600 hover:bg-gradient-to-r hover:from-purple-50/80 hover:to-pink-50/60 hover:text-purple-900 border border-transparent hover:border-purple-200/50",
                      "hover:shadow-md hover:shadow-purple-200/30 hover:-translate-y-0.5",
                      isCollapsed && "grid-cols-1 justify-items-center p-2 mx-1",
                    )}
                  >
                    <span
                      className={cn(
                        "flex items-center justify-center transition-all duration-200",
                        isCollapsed
                          ? "h-8 w-8 group-hover:bg-white/60 group-hover:rounded-full group-hover:scale-110"
                          : "justify-self-start",
                        "group-hover:text-purple-600 group-hover:scale-105",
                      )}
                    >
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="text-xs font-semibold leading-tight pl-3">
                        {item.label}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        

      </nav>
    </div>
  );
};

export default ParentMenu;