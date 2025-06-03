// src/components/SettingsWrapper.tsx
"use client";

import { useEffect } from "react";
import NavbarFooterWrapper from "@/components/NavbarFooterWrapper";
import { Settings } from "@/types/settings";

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
  react_icons?: ReactIcon | ReactIcon[];
  website_submenuitem?: SubMenuItem[];
  organization_id: string | null;
}

function SettingsWrapper({
  children,
  settings,
  menuItems,
}: {
  children: React.ReactNode;
  settings: Settings;
  menuItems: MenuItem[] | undefined;
}) {
  useEffect(() => {
    // Optional: Set CSS variables for custom styling (not needed for Tailwind classes)
    document.documentElement.style.setProperty("--primary-color", settings.footer_color);
  }, [settings]);

  return (
    <div className={`font-inter text-base`}>
      <NavbarFooterWrapper menuItems={menuItems}>{children}</NavbarFooterWrapper>
    </div>
  );
}

export default SettingsWrapper;