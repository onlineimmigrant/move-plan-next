'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminProvider } from '@/context/AdminContext';
import { supabase } from '@/lib/supabaseClient';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, setSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const restoreSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('AdminLayout: Error restoring session:', error.message);
        router.push('/login');
        return;
      }
      if (data.session) {
        console.log('AdminLayout: Session restored');
        setSession(data.session);
      } else {
        console.warn('AdminLayout: No session found, redirecting to login');
        router.push('/login');
      }
    };

    if (!session) {
      restoreSession();
    }
  }, [session, setSession, router]);

  if (!session) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex justify-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    );
  }

  return <AdminProvider>{children}</AdminProvider>;
}