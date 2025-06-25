'use client';

import { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminTableLayout({ children }: { children: ReactNode }) {
  const { session, isAdmin } = useAuth();
  console.log('[AdminTableLayout] Rendering, session:', !!session, 'isAdmin:', isAdmin);

  return (
    <>
      {children}
    </>
  );
}