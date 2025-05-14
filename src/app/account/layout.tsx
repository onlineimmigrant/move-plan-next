// app/account/layout.tsx
'use client';

import { StudentProvider } from '@/lib/StudentContext';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <StudentProvider>{children}</StudentProvider>;
}