// app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UsersIcon,
  DevicePhoneMobileIcon,
  ShoppingCartIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseClient";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      // 1) Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // 2) Fetch the user's role from "profiles"
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.push("/login");
        return;
      }

      // 3) If not admin, redirect
      if (profile.role !== "admin") {
        router.push("/");
        return;
      }

      // If admin, show the page
      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAdmin) {
    return null; // or some fallback UI while redirecting
  }

  const dashboardLinks = [
    {
      label: "Users",
      icon: <UsersIcon className="h-8 w-8 text-gray-600" />,
      href: "/admin/profiles",
    },
    {
      label: "App",
      icon: <DevicePhoneMobileIcon className="h-8 w-8 text-gray-600" />,
      href: "/admin/relocation_plans",
    },
    {
      label: "Sell",
      icon: <ShoppingCartIcon className="h-8 w-8 text-gray-600" />,
      href: "/admin/products",
    },
    {
      label: "Consent Management",
      icon: <ShieldCheckIcon className="h-8 w-8 text-gray-600" />,
      href: "/admin/cookie_category",
    },
    {
      label: "Reports",
      icon: <ChartBarIcon className="h-8 w-8 text-gray-600" />,
      href: "/admin/reports/custom",
    },
    {
      label: "Settings",
      icon: <Cog6ToothIcon className="h-8 w-8 text-gray-600" />,
      href: "/admin/settings",
    },
  ];

  return (
    <div className="p-4">
      <h1 className="text-base text-center tracking-tightest font-bold mb-4 bg-gradient-to-r from-gray-300 via-gray-600 to-gray-900 bg-clip-text text-transparent">
        Admin Dashboard
      </h1>
      <p className="mb-6"></p>
      {/* Grid of Dashboard Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {dashboardLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group flex flex-col items-center justify-center p-4 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
            title={item.label} // Tooltip for all devices; visible on mobile hover/focus
          >
            {item.icon}
            <span className="mt-2 text-sm text-gray-700 text-center md:block hidden">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}