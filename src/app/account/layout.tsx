// app/account/layout.tsx
'use client';

import { StudentProvider } from '@/lib/StudentContext';
import { BannerProvider } from '@/context/BannerContext';
import BannerDisplay from '@/components/banners/BannerDisplay';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentProvider>
      <BannerProvider>
        <BannerDisplay />
        {children}
      </BannerProvider>
    </StudentProvider>
  );
}