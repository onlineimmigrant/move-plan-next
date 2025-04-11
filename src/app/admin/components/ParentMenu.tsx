// src/admin/components/ParentMenu.tsx
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
}

const ParentMenu: React.FC<ParentMenuProps> = ({
  isCollapsed,
  setIsCollapsed,
  setActiveSection,
}) => {
  const pathname = usePathname();
  const { settings } = useSettings();
  const { setIsPaletteModalOpen } = useModal();

  const menuItemsTop = [
    { label: "Dashboard", icon: <HomeIcon className="h-4 w-4" />, href: "/admin" },
    {
      label: "Tables",
      icon: <TableCellsIcon className="h-4 w-4" />,
      href: "/admin/products",
      onClick: () => setActiveSection("tables"),
    },
    {
      label: "Users",
      icon: <UsersIcon className="h-4 w-4" />,
      href: "/admin/profiles",
      onClick: () => setActiveSection("tables"),
    },
    {
      label: "Sell",
      icon: <ShoppingCartIcon className="h-4 w-4" />,
      href: "/admin/pricingplans",
      onClick: () => setActiveSection("tables"),
    },
    {
      label: "App",
      icon: <DevicePhoneMobileIcon className="h-4 w-4" />,
      href: "/admin/relocation_plans",
      onClick: () => setActiveSection("tables"),
    },
    {
      label: "Consent Management",
      icon: <ShieldCheckIcon className="h-4 w-4" />,
      href: "/admin/cookie_category",
      onClick: () => setActiveSection("tables"),
    },
  ];

  const menuItemsBottom = [
    {
      label: "Reports",
      icon: <ChartBarIcon className="h-4 w-4" />,
      href: "/admin/reports/custom", // Default report page, but clicking triggers child menu
      onClick: () => setActiveSection("reports"), // Updated to trigger ReportsChildMenu
    },
    ...(pathname === "/admin/settings"
      ? [
          {
            label: "Palette",
            icon: <SwatchIcon className="h-4 w-4" />,
            href: "#",
            onClick: () => {
              console.log("Palette button clicked");
              setIsPaletteModalOpen(true);
            },
          },
        ]
      : []),
    {
      label: "Settings",
      icon: <Cog6ToothIcon className="h-4 w-4" />,
      href: "/admin/settings",
    },
  ];

  return (
    <div
      className={cn(
        "z-50 bg-gray-50 border-r border-gray-100 h-screen flex flex-col transition-all duration-300",
        settings?.primary_font?.name && settings?.font_size_base?.name
          ? `font-${settings.primary_font.name.toLowerCase()} text-${settings.font_size_base.name}`
          : "font-inter text-base",
        isCollapsed ? "w-14" : "w-48",
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <nav className="flex-1 flex flex-col px-2 pt-4">
        <div className="flex flex-col gap-2">
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
              <Image
                src="/images/logo.svg"
                alt="Logo"
                width={20}
                height={20}
                className="h-6 w-auto"
              />
            </span>
            {!isCollapsed && (
              <Link
                href="/"
                className={cn(
                  "ml-4 tracking-tight text-sm sm:text-base font-bold",
                  settings?.primary_color?.name
                    ? `text-${settings.primary_color.name}`
                    : "text-sky-600",
                )}
              >
                {settings?.site}
              </Link>
            )}
          </div>

          {menuItemsTop.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.onClick) item.onClick();
                  else setActiveSection("");
                }}
                className={cn(
                  "grid grid-cols-[auto_1fr] items-center p-2 text-xs font-medium rounded-md transition-all duration-200",
                  isActive
                    ? "bg-gray-100 text-gray-900 hover:rounded-full"
                    : "text-slate-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "grid-cols-1 justify-items-center rounded-full p-0",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center",
                    isCollapsed
                      ? "h-10 w-10 hover:bg-gray-100 hover:rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                      : "justify-self-start",
                    isActive && settings?.primary_color?.name
                      ? `text-${settings.primary_color.name}`
                      : isActive
                      ? "text-sky-600"
                      : "",
                  )}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span
                    className={cn(
                      settings?.secondary_color?.name
                        ? `text-${settings.secondary_color.name}`
                        : "text-gray-900",
                      "font-semibold text-left pl-4",
                      settings?.font_size_small?.name
                        ? `text-${settings.font_size_small.name}`
                        : "text-base",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex-1"></div>

        <div className="flex flex-col gap-2 pb-4">
          {menuItemsBottom.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault(); // Prevent navigation if there's an onClick
                    item.onClick();
                  } else {
                    setActiveSection("");
                  }
                }}
                className={cn(
                  "grid grid-cols-[auto_1fr] items-center p-2 text-xs font-medium rounded-md transition-all duration-200",
                  isActive
                    ? "bg-gray-100 text-gray-900 hover:rounded-full"
                    : "text-slate-600 hover:bg-gray-100 hover:text-gray-900",
                  isCollapsed && "grid-cols-1 justify-items-center rounded-full p-0",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center",
                    isCollapsed
                      ? "h-10 w-10 hover:bg-gray-100 hover:rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500"
                      : "justify-self-start",
                    isActive && settings?.primary_color?.name
                      ? `text-${settings.primary_color.name}`
                      : isActive
                      ? "text-sky-600"
                      : "",
                  )}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span
                    className={cn(
                      "text-gray-900 font-semibold text-left pl-4",
                      settings?.font_size_small?.name
                        ? `text-${settings.font_size_small.name}`
                        : "text-base",
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default ParentMenu;