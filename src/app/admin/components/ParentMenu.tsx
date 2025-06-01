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
      href: "/admin/tables",
      onClick: () => setActiveSection("tables"),
    },


    {
      label: "App",
      icon: <DevicePhoneMobileIcon className="h-4 w-4" />,
      href: "/admin/relocation_plans",
      onClick: () => setActiveSection("tables"),
    },
    {
      label: "Reports",
      icon: <ChartBarIcon className="h-4 w-4" />,
      href: "/admin/reports/custom",
      onClick: () => setActiveSection("reports"),
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

  const menuItemsBottom = [

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
        "z-50 bg-gray-50 border-r border-gray-200 h-screen flex flex-col transition-all duration-300 text-base",
        isCollapsed ? "w-14" : "w-48",
      )}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <nav className="fixed flex-1 flex flex-col px-2 pt-4 ">
        <div className="flex flex-col gap-8">
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
                 src={isCollapsed ? "/images/logo_collapsed.svg" : "/images/logo.svg"}
                alt="Logo"
                width={20}
                height={20}
                className="h-6 w-auto"
              />
            </span>
            {!isCollapsed && (
              <Link
                href="/"
                className=
                  "ml-4 tracking-tight text-sm sm:text-base font-bold text-sky-600"
               
              >
                {settings?.site || ''}
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
                    isActive 
                      ? `text-gray-700`
                      : isActive
                      ? "text-sky-600"
                      : "",
                  )}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span
                    className=
                       "text-gray-900 font-semibold text-left pl-4 text-base"
                   
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