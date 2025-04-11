// src/components/SettingsWrapper.tsx
"use client";

import { useEffect } from "react";
import NavbarWrapper from "@/components/NavbarFooterWrapper";
import { Settings } from "@/types/settings";

function SettingsWrapper({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: Settings;
}) {
  useEffect(() => {
    // Optional: Set CSS variables for custom styling (not needed for Tailwind classes)
    document.documentElement.style.setProperty("--primary-color", settings.primary_color.hex);
    document.documentElement.style.setProperty("--font-family", settings.primary_font.name);
    document.documentElement.style.setProperty("--font-size-base", `${settings.font_size_base.value}px`);
  }, [settings]);

  return (
    <div
      className={`font-${settings.primary_font.name.toLowerCase()} text-${settings.font_size_base.name}`}
    >
      <NavbarWrapper>{children}</NavbarWrapper>
    </div>
  );
}

export default SettingsWrapper;