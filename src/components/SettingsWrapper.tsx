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
    document.documentElement.style.setProperty("--primary-color", settings.footer_color);

  }, [settings]);

  return (
    <div
      className={`font-inter text-base`}
    >
      <NavbarWrapper>{children}</NavbarWrapper>
    </div>
  );
}

export default SettingsWrapper;