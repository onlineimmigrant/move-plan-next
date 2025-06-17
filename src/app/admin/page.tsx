"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UsersIcon,
  DevicePhoneMobileIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.push("/");
        return;
      }

      if (profile.role !== "admin") {
        router.push("/");
        return;
      }

      setIsAdmin(true);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // or some fallback UI while redirecting
  }

  const dashboardLinks = [

    {
      label: "App",
      icon: <DevicePhoneMobileIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/relocation_plans",
    },
    {
      label: "Products",
      icon: <ArchiveBoxIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/products/management",
    },
    {
      label: "Pricing Plans",
      icon: <CurrencyDollarIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/pricingplans/management",
    },
    {
      label: "Consent Management",
      icon: <ShieldCheckIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/cookie_category",
    },
    {
      label: "Reports",
      icon: <ChartBarIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/reports/custom",
    },

    {
      label: "Settings",
      icon: <Cog6ToothIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/settings",
    },
        {
      label: "Tickets",
      icon: <ChartBarIcon className="h-10 w-10 text-gray-600 group-hover:text-sky-600 transition-colors" />,
      href: "/admin/tickets/management",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl text-center font-bold mb-8 bg-gradient-to-r from-sky-400 to-sky-600 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 px-16">
          {dashboardLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-sky-50 transition-all duration-300"
              title={item.label}
            >
              <div className="transform group-hover:scale-110 transition-transform">{item.icon}</div>
              <span className="mt-3 text-sm font-medium text-gray-800 group-hover:text-sky-600 text-center sm:text-base">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}