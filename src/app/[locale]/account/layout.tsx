// app/account/layout.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { StudentProvider } from '@/lib/StudentContext';
import { BannerProvider } from '@/context/BannerContext';
import  BannerDisplay  from '@/components/banners/BannerDisplay';
import Loading from '@/ui/Loading';
import TicketsAccountToggleButton from '@/components/modals/TicketsModals/TicketsAccountModal/TicketsAccountToggleButton';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  // Show loading state while auth context is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  // Don't render if no session
  // AuthContext or middleware will handle redirect
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loading />
      </div>
    );
  }

  return (
    <StudentProvider>
      <BannerProvider>
        <BannerDisplay />
        {children}
        <TicketsAccountToggleButton />
      </BannerProvider>
    </StudentProvider>
  );
}