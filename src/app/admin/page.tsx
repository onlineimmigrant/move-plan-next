"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DevicePhoneMobileIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { session, supabase } = useAuth(); // Use supabase for refresh

  useEffect(() => {
    async function checkSession() {
      if (!session?.user) {
        console.log("[AdminDashboard] No user found, attempting refresh");
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) {
          console.log("[AdminDashboard] Session refresh failed or no user, redirecting to login");
          router.push("/login?redirectTo=/admin");
          return;
        }
        console.log("[AdminDashboard] Session refreshed: id=", data.session.user.id);
      } else {
        console.log("[AdminDashboard] User found: id=", session.user.id);
      }
      setLoading(false);
    }

    checkSession();
  }, [session, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-gray-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  const dashboardLinks = [
    { href: "/admin/relocation_plans", label: "App", icon: DevicePhoneMobileIcon },
    { href: "/admin/products/management", label: "Products", icon: ArchiveBoxIcon },
    { href: "/admin/pricingplans/management", label: "PricingPlans", icon: CurrencyDollarIcon },
    { href: "/admin/cookie_category", label: "Cookies", icon: ShieldCheckIcon },
    { href: "/admin/reports/custom", label: "Reports", icon: ChartBarIcon },
    { href: "/admin/settings", label: "Settings", icon: Cog6ToothIcon },
    { href: "/admin/tickets/management", label: "Tickets", icon: ChartBarIcon },
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
              <item.icon className="h-6 w-6 text-gray-500 group-hover:text-sky-500 transition-colors" />
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