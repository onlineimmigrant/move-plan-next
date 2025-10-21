'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Loading from '@/ui/Loading';
import {
  DevicePhoneMobileIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  CogIcon, ChatBubbleLeftIcon, ArrowsRightLeftIcon,RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import Tooltip from '@/components/Tooltip';
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';

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
          <Loading />
      </div>
    );
  }

  const dashboardLinks = [
    { href: '/admin/site/management', label: 'Site', icon: DevicePhoneMobileIcon, tooltip: 'Site Management' },
    { href: '/admin/products/management', label: 'Products', icon: ArchiveBoxIcon, tooltip: 'Product Management' },
    { href: '/admin/pricingplans/management', label: 'Pricing Plans', icon: CurrencyDollarIcon, tooltip: 'Price Management' },
    { href: '/admin/cookie_category', label: 'Cookies', icon: ShieldCheckIcon, tooltip: 'Consent Management' },
    //{ href: '/admin/reports/custom', label: 'Reports', icon: ChartBarIcon, tooltip: 'Standard and Custom' },
    { href: '/admin/ai/management', label: 'AI', icon: RocketLaunchIcon, tooltip: 'AI Models' },
    { href: '/admin/site-management', label: 'Settings', icon: Cog6ToothIcon, tooltip:'Website Management' },
    { href: '/admin/tickets/management', label: 'Tickets', icon: ChatBubbleLeftIcon, tooltip: 'Contact Management' },
    { href: '/account', label: 'Account', icon: ArrowsRightLeftIcon, tooltip: 'Personal' },
  ];

  return (
    <div className="min-h-screen bg-gray py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="mt-8  mb-4 sm:mb-6 text-2xl sm:text-3xl font-bold text-center text-gray-900 relative">
          Admin 
          <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
        </h1>
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Tooltip key={item.href} content={item.tooltip}>
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
              </Tooltip>
            );
          })}
        </div>
              <div className='my-16 sm:my-32 flex justify-center'>
      <CogIcon className='h-16 w-16 text-sky-600'/>
      </div>
      
      {/* Admin Meetings Toggle Button - visible only on admin pages */}
      <MeetingsAdminToggleButton />
      </div>
    </div>
  );
}