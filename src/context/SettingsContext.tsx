// src/context/SettingsContext.tsx
"use client";

import { createContext, useContext, useEffect } from "react";
import { Settings } from "@/types/settings";

interface SettingsContextType {
  settings: Settings;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: Settings;
}) {
  useEffect(() => {
    // Debug: Log the settings object to confirm the values
    console.log("SettingsProvider received settings:", settings);

    // Validate that primary_color.hex is a valid HEX color
    const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
    let primaryColorHex = settings.primary_color.hex;
    let secondaryColorHex = settings.secondary_color.hex;

    if (!hexColorPattern.test(primaryColorHex)) {
      console.error(
        `Invalid HEX color in settings.primary_color.hex: "${primaryColorHex}". Falling back to #6B7280.`
      );
      primaryColorHex = "#6B7280"; // Default to gray-500 if invalid
    }

    if (!hexColorPattern.test(secondaryColorHex)) {
      console.error(
        `Invalid HEX color in settings.secondary_color.hex: "${secondaryColorHex}". Falling back to #4B5563.`
      );
      secondaryColorHex = "#4B5563"; // Default to gray-600 if invalid
    }

    // Set CSS variables for custom styling
    document.documentElement.style.setProperty("--primary-color", primaryColorHex);
    document.documentElement.style.setProperty("--secondary-color", secondaryColorHex);
    document.documentElement.style.setProperty("--font-family", settings.primary_font.name);
    document.documentElement.style.setProperty(
      "--font-size-base",
      `${settings.font_size_base.value}px`
    );
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}