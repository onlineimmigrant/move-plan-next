'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  DevicePhoneMobileIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const { session, supabase } = useAuth();

  useEffect(() => {
    async function checkSession() {
      if (!session?.user) {
        console.log('[AdminDashboard] No user found, attempting refresh');
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) {
          console.log('[AdminDashboard] Session refresh failed or no user, redirecting to login');
          router.push('/login?redirectTo=/admin');
          return;
        }
        console.log('[AdminDashboard] Session refreshed: id=', data.session.user.id);
      } else {
        console.log('[AdminDashboard] User found: id=', session.user.id);
      }
      setLoading(false);
    }

    checkSession();
  }, [session, supabase, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex gap-2">
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  const dashboardLinks = [
    { href: '/admin/relocation_plans', label: 'App', icon: DevicePhoneMobileIcon },
    { href: '/admin/products/management', label: 'Products', icon: ArchiveBoxIcon },
    { href: '/admin/pricingplans/management', label: 'Pricing Plans', icon: CurrencyDollarIcon },
    { href: '/admin/cookie_category', label: 'Cookies', icon: ShieldCheckIcon },
    { href: '/admin/reports/custom', label: 'Reports', icon: ChartBarIcon },
    { href: '/admin/settings', label: 'Settings', icon: Cog6ToothIcon },
    { href: '/admin/tickets/management', label: 'Tickets', icon: ChartBarIcon },
    { href: '/account', label: 'Profile', icon: UserCircleIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="mt-16 sm:mt-18 mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
          Admin Dashboard
          <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
        </h1>
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-sky-50 transition-all duration-300 ${
                  isActive ? 'bg-sky-50 shadow-md' : ''
                }`}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="transform group-hover:scale-110 transition-transform">
                  <item.icon
                    className={`h-10 w-10 ${
                      item.href === '/account'
                        ? 'text-sky-600'
                        : 'text-gray-600 group-hover:text-sky-600 transition-colors'
                    }`}
                  />
                </div>
                <span className="mt-3 text-sm font-medium text-gray-800 group-hover:text-sky-600 text-center sm:text-base">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}