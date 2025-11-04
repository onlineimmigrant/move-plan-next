'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import FilesModal from '@/components/modals/ChatWidget/FilesModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FilesPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }
        setUserId(user.id);
      } catch (err: any) {
        console.error('[FilesPage] Auth error:', err);
        router.push('/login');
      }
    };

    fetchUser();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-xai-dark to-gray-900 flex items-center justify-center p-4">
      <FilesModal
        isOpen={true}
        onClose={() => router.push('/account')}
        userId={userId}
      />
    </div>
  );
}
