'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Tooltip from '@/components/Tooltip';
import AiChatHistory from '@/components/ai/AiChatHistory';
import AiFlashcards from '@/components/ai/AiFlashcards';
import ChatWidget from '@/components/ChatWidget';
import HelpModal from '@/components/ai/HelpModal';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MemoryHub() {
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError('Please log in to access your memory hub.');
          router.push('/login');
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single();
        if (profileError || !profile) {
          setError('User profile not found.');
          router.push('/login');
          return;
        }
        setUserId(user.id);
      } catch (error: any) {
        setError(error.message || 'Failed to authenticate user.');
        console.error('Auth error:', error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [router]);

  if (loading) {
    return <div className="text-gray text-center">Loading...</div>;
  }

  return (
    <div>
      <Tooltip content="Account">
        <Link href="/account" className="absolute top-2 left-2">
          <button className="cursor-pointer bg-sky-blue text-white p-2 rounded-full hover:bg-sky-blue-dark transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
        </Link>
      </Tooltip>
      <div className="flex flex-col items-center">
        <Tooltip content="Memory Hub">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-gray relative">
            Memory Hub
            <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-blue rounded-full" />
          </h1>
        </Tooltip>
      </div>

      {error && <div className="text-red mb-4 text-center">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-9 mx-auto p-4 rounded-lg min-h-screen gap-8">
        <div className="order-2 sm:order-1 sm:col-span-3">
          <AiChatHistory userId={userId} onError={setError} />
        </div>

        <div className="order-1 sm:order-2 sm:col-span-4">
          <AiFlashcards userId={userId} onError={setError} />
   
        </div>

        <div className="order-3 sm:col-span-2">

          <ChatWidget />
        </div>
      </div>

      <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </div>
  );
}