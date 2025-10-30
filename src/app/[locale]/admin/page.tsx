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
  CogIcon, 
  ChatBubbleLeftIcon, 
  ArrowsRightLeftIcon,
  RocketLaunchIcon,
  VideoCameraIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import Tooltip from '@/components/Tooltip';
import { MeetingsAdminToggleButton } from '@/components/modals/MeetingsModals/MeetingsAdminModal';
import MeetingsAdminModal from '@/components/modals/MeetingsModals/MeetingsAdminModal/MeetingsAdminModal';
import { useThemeColors } from '@/hooks/useThemeColors';

// Modal Button Card Component with hover state
function ModalButtonCard({ item, primary }: any) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <Tooltip content={item.tooltip}>
      <button
        onClick={item.onClick}
        className="w-full group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
        style={{
          backgroundColor: isHovered ? primary.lighter : 'white'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={item.label}
        type="button"
      >
        <div className="transform group-hover:scale-110 transition-transform">
          <item.icon
            className="h-10 w-10 transition-colors"
            style={{ color: isHovered ? primary.base : '#4b5563' }}
          />
        </div>
        <span 
          className="mt-3 text-sm font-medium text-center sm:text-base transition-colors"
          style={{ color: isHovered ? primary.base : '#1f2937' }}
        >
          {item.label}
        </span>
      </button>
    </Tooltip>
  );
}

// Navigation Link Card Component with hover state
function NavigationLinkCard({ item, pathname, primary }: any) {
  const [isHovered, setIsHovered] = useState(false);
  const isActive = pathname === item.href;
  const isAccountPage = item.href === '/account';
  
  return (
    <Tooltip content={item.tooltip}>
      <Link
        href={item.href!}
        className="group flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
        style={{
          backgroundColor: isActive ? primary.lighter : (isHovered ? primary.lighter : 'white')
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className="transform group-hover:scale-110 transition-transform">
          <item.icon
            className="h-10 w-10 transition-colors"
            style={{
              color: (isAccountPage || isHovered) ? primary.base : '#4b5563'
            }}
          />
        </div>
        <span 
          className="mt-3 text-sm font-medium text-center sm:text-base transition-colors"
          style={{ color: isHovered ? primary.base : '#1f2937' }}
        >
          {item.label}
        </span>
      </Link>
    </Tooltip>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMeetingsModalOpen, setIsMeetingsModalOpen] = useState(false);
  const { session, isLoading } = useAuth();
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;

  // The layout already handles auth checks, no need to duplicate
  // Just show loading while AuthContext is initializing
  if (isLoading) {
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
    { 
      onClick: () => setIsMeetingsModalOpen(true), 
      label: 'Appointments', 
      icon: VideoCameraIcon, 
      tooltip: 'Manage Appointments',
      id: 'meetings-modal',
      isModal: true
    },
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
          <span 
            className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full" 
            style={{ backgroundColor: primary.base }}
          />
        </h1>
        <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dashboardLinks.map((item) => {
            // Check if this is a modal trigger or regular link
            if (item.isModal) {
              return <ModalButtonCard key={item.id} item={item} primary={primary} />;
            }
            
            // Regular navigation link
            return <NavigationLinkCard key={item.href} item={item} pathname={pathname} primary={primary} />;
          })}
        </div>
              <div className='my-16 sm:my-32 flex justify-center'>
      <CogIcon className='h-16 w-16' style={{ color: primary.base }}/>
      </div>
      
      {/* Admin Meetings Toggle Button - visible only on admin pages */}
      <MeetingsAdminToggleButton />
      
      {/* Meetings Admin Modal */}
      <MeetingsAdminModal
        isOpen={isMeetingsModalOpen}
        onClose={() => setIsMeetingsModalOpen(false)}
      />
      </div>
    </div>
  );
}