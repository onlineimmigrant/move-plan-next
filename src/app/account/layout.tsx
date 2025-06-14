// app/account/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { StudentProvider } from '@/lib/StudentContext';
import { BannerProvider } from '@/context/BannerContext';
import  BannerDisplay  from '@/components/banners/BannerDisplay';
import { supabase } from '@/lib/supabaseClient';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('AccountLayout: Error restoring session:', error.message);
        router.push('/login'); // Redirect to login if session cannot be restored
        return;
      }
      if (data.session) {
        console.log('AccountLayout: Session restored');
        setSession(data.session);
      } else {
        console.warn('AccountLayout: No session found, redirecting to login');
        router.push('/login');
      }
    };

    if (!session) {
      restoreSession();
    }
  }, [session, setSession, router]);

  // Show a loading state while session is being restored
  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex justify-center gap-2">
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-sky-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return (
    <StudentProvider>
      <BannerProvider>
        <BannerDisplay />
        {children}
      </BannerProvider>
    </StudentProvider>
  );
}