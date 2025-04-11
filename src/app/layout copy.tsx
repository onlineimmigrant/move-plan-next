// src/app/layout.tsx
import { Inter } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { BasketProvider } from "@/context/BasketContext";
import { SettingsProvider } from "@/context/SettingsContext";
import NavbarWrapper from "@/components/NavbarFooterWrapper";
import { supabaseServer } from "@/lib/supabaseServerClient";
import Header from '../components/Header';
import { Settings } from "@/types/settings";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata = {
  title: "My Next.js App",
  description: "Sample admin app with Next.js 13",
};

async function getSettings(): Promise<Settings> {
  const { data, error } = await supabaseServer
    .from("settings")
    .select(`
      id,
      site,
      primary_color:primary_color_id (id, name, hex, img_color, created_at),
      secondary_color:secondary_color_id (id, name, hex, img_color, created_at),
      primary_font:primary_font_id (id, name, description, default_type, created_at),
      secondary_font:secondary_font_id (id, name, description, default_type, created_at),
      font_size_base:font_size_base_id (id, name, value, description, created_at),
      font_size_small:font_size_small_id (id, name, value, description, created_at),
      font_size_large:font_size_large_id (id, name, value, description, created_at),
      updated_at
    `)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Supabase error:", error);
    return {
      id: 0,
      primary_color: {
        id: 1,
        name: "sky-600",
        hex: "#0284C7",
        img_color: null,
        created_at: "",
      },
      secondary_color: {
        id: 2,
        name: "red-500",
        hex: "#EF4444",
        img_color: null,
        created_at: "",
      },
      primary_font: {
        id: 1,
        name: "Inter",
        description: null,
        default_type: true,
        created_at: "",
      },
      secondary_font: {
        id: 2,
        name: "Roboto",
        description: null,
        default_type: true,
        created_at: "",
      },
      font_size_base: {
        id: 1,
        name: "base",
        value: 16.0,
        description: null,
        created_at: "",
      },
      font_size_small: {
        id: 2,
        name: "sm",
        value: 14.0,
        description: null,
        created_at: "",
      },
      font_size_large: {
        id: 3,
        name: "xl",
        value: 20.0,
        description: null,
        created_at: "",
      },
      updated_at: new Date().toISOString(),
    };
  }

  if (!data) {
    console.warn("No settings data found in Supabase. Using fallback settings.");
    return {
      id: 0,
      primary_color: {
        id: 1,
        name: "sky-600",
        hex: "#0284C7",
        img_color: null,
        created_at: "",
      },
      secondary_color: {
        id: 2,
        name: "red-500",
        hex: "#EF4444",
        img_color: null,
        created_at: "",
      },
      primary_font: {
        id: 1,
        name: "Inter",
        description: null,
        default_type: true,
        created_at: "",
      },
      secondary_font: {
        id: 2,
        name: "Roboto",
        description: null,
        default_type: true,
        created_at: "",
      },
      font_size_base: {
        id: 1,
        name: "base",
        value: 16.0,
        description: null,
        created_at: "",
      },
      font_size_small: {
        id: 2,
        name: "sm",
        value: 14.0,
        description: null,
        created_at: "",
      },
      font_size_large: {
        id: 3,
        name: "xl",
        value: 20.0,
        description: null,
        created_at: "",
      },
      updated_at: new Date().toISOString(),
    };
  }

  console.log("Fetched settings:", data);
  return data as Settings;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  console.log("Settings passed to SettingsProvider:", settings);

  return (
    <html lang="en" className={inter.className}>
      <body>
        <AuthProvider>
          <BasketProvider>
            <SettingsProvider settings={settings}>
              <NavbarWrapper>
                <div className="">{children}</div>
              </NavbarWrapper>
            </SettingsProvider>
          </BasketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}