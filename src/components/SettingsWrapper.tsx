"use client";

import { useEffect } from "react";
import NavbarFooterWrapper from "@/components/NavbarFooterWrapper";
import { Settings } from "@/types/settings";
import { MenuItem } from "@/types/menu";
import { useBanner } from "@/context/BannerContext"; // Import useBanner hook

function SettingsWrapper({
  children,
  settings,
  menuItems,
}: {
  children: React.ReactNode;
  settings: Settings;
  menuItems: MenuItem[] | undefined;
}) {
  const { getFixedBannersHeight } = useBanner(); // Access banner context
  const fixedBannersHeight = getFixedBannersHeight(); // Compute fixedBannersHeight

  useEffect(() => {
    // Optional: Set CSS variables for custom styling (not needed for Tailwind classes)
    document.documentElement.style.setProperty("--primary-color", settings.footer_color);
  }, [settings]);

  return (
    <div className="font-inter text-base">
      <NavbarFooterWrapper menuItems={menuItems} fixedBannersHeight={fixedBannersHeight}>
        {children}
      </NavbarFooterWrapper>
    </div>
  );
}

export default SettingsWrapper;