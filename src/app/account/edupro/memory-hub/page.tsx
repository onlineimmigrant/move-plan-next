'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Tooltip from '@/components/Tooltip';
import AiChatHistory from '@/components/ai/AiChatHistory';
import AiFlashcards from '@/components/ai/AiFlashcards';
import CardSyncPlanner from '@/components/ai/CardSyncPlanner';
import HelpModal from '@/components/ai/HelpModal';
import { Flashcard, PlanFlashcard } from '@/lib/types';
import { PlannerContext } from '@/lib/context';
import ChatWidget from '@/components/ChatWidget';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MemoryHub() {
  const [userId, setUserId] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [flashcardRefreshKey, setFlashcardRefreshKey] = useState(0);
  const [filteredFlashcardIds, setFilteredFlashcardIds] = useState<number[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [newPlanFlashcardIds, setNewPlanFlashcardIds] = useState<PlanFlashcard[]>([]);

  const router = useRouter();

  const handleError = useCallback((msg: string) => {
    console.log('handleError called:', msg);
    setMessage({ type: msg.includes('successfully') ? 'success' : 'error', text: msg });
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          if (isMounted) {
            handleError('Please log in to access your memory hub.');
            router.push('/login');
          }
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, organization_id')
          .eq('id', user.id)
          .single();
        if (profileError || !profile) {
          if (isMounted) {
            handleError('User profile not found.');
            router.push('/login');
          }
          return;
        }
        if (isMounted) {
          setUserId(user.id);
          setOrganizationId(profile.organization_id || null);
        }
      } catch (error: any) {
        if (isMounted) {
          handleError(error.message || 'Failed to authenticate user.');
          console.error('Auth error:', error.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [router, handleError]);

  const fetchFlashcards = useCallback(async () => {
    if (!userId || !organizationId) return;
    try {
      const { data: userFlashcards, error: userError } = await supabase
        .from('ai_user_flashcards')
        .select('id, name, messages, created_at, updated_at, topic, section, user_id')
        .eq('user_id', userId);

      if (userError) {
        throw new Error('Failed to fetch user flashcards: ' + userError.message);
      }

      const { data: defaultFlashcards, error: defaultError } = await supabase
        .from('ai_default_flashcards')
        .select('id, name, messages, created_at, updated_at, topic, section, organization_id')
        .eq('organization_id', organizationId);

      if (defaultError) {
        throw new Error('Failed to fetch default flashcards: ' + defaultError.message);
      }

      const { data: statuses, error: statusError } = await supabase
        .from('ai_flashcard_status')
        .select('ai_user_flashcards_id, ai_default_flashcards_id, status')
        .eq('user_id', userId);

      if (statusError) {
        throw new Error('Failed to fetch flashcard statuses: ' + statusError.message);
      }

      const userFlashcardsWithStatus: Flashcard[] = (userFlashcards || []).map((fc) => ({
        ...fc,
        status: statuses?.find((s) => s.ai_user_flashcards_id === fc.id)?.status || 'learning',
        messages: fc.messages || [],
      }));

      const defaultFlashcardsWithStatus: Flashcard[] = (defaultFlashcards || []).map((fc) => ({
        ...fc,
        status: statuses?.find((s) => s.ai_default_flashcards_id === fc.id)?.status || 'learning',
        messages: fc.messages || [],
      }));

      const combinedFlashcards: Flashcard[] = [...userFlashcardsWithStatus, ...defaultFlashcardsWithStatus];
      const uniqueFlashcards = Array.from(
        new Map(combinedFlashcards.map((f) => [f.id, f])).values()
      );

      setFlashcards(uniqueFlashcards);
      console.log('Flashcards fetched in MemoryHub:', uniqueFlashcards.length);
    } catch (error: any) {
      handleError(error.message || 'Failed to fetch flashcards.');
      console.error('Fetch flashcards error:', error);
    }
  }, [userId, organizationId, handleError]);

  useEffect(() => {
    let isMounted = true;

    fetchFlashcards().then(() => {
      if (isMounted) {
        console.log('Flashcards fetched in MemoryHub:', flashcards.length);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchFlashcards, flashcardRefreshKey]);

  const handleFlashcardCreated = useCallback(() => {
    setFlashcardRefreshKey((prev) => prev + 1);
  }, []);

  const handleNewMessages = useCallback(
    (data: { historyId: number; messages: { role: string; content: string }[] }) => {
      console.log('New messages received:', data);
    },
    []
  );

  const handleFilteredFlashcards = useCallback((flashcardIds: number[]) => {
    setFilteredFlashcardIds(flashcardIds);
    console.log('Filtered flashcards updated:', flashcardIds);
  }, []);

  const addFlashcardToPlanner = useCallback((flashcardId: number, isUserFlashcard: boolean) => {
    if (!flashcards.some((f) => f.id === flashcardId)) {
      console.warn(`Flashcard with id ${flashcardId} not found when adding to planner`);
      return;
    }
    if (newPlanFlashcardIds.some((pf) => pf.id === flashcardId)) {
      const flashcard = flashcards.find((f) => f.id === flashcardId);
      handleError(`Flashcard "${flashcard?.name || `ID: ${flashcardId}`}" is already added to the planner.`);
      return;
    }
    setNewPlanFlashcardIds((prev) => {
      const newIds = [...prev, { id: flashcardId, isUserFlashcard }];
      console.log('Added flashcard to planner:', newIds);
      return newIds;
    });
  }, [flashcards, newPlanFlashcardIds, handleError]);

  const plannerContextValue = useMemo(
    () => ({
      newPlanFlashcardIds,
      setNewPlanFlashcardIds,
      addFlashcardToPlanner,
    }),
    [newPlanFlashcardIds, addFlashcardToPlanner]
  );

  if (loading) {
    return <div className="text-gray-700 text-center">Loading...</div>;
  }

  return (
    <PlannerContext.Provider value={plannerContextValue}>
      <div>

        <div className="mx-auto  flex justify-between items-center p-4">

                        <Tooltip content="Account">
          <Link href="/account" className="">
            <button className="cursor-pointer  hover:bg-gray-200 text-sky-600 p-2 rounded-full hover:bg-sky-blue-dark transition-colors">
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          </Link>
        </Tooltip>                  

         <Tooltip content="Memory Hub">
            <h1 className="text-xl sm:text-2xl font-bold text-center text-gray-800 relative">
              Memory Hub
              <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
            </h1>
          </Tooltip>
                          <Tooltip content="Guide">
                            <button
                              onClick={() => setIsHelpModalOpen(true)}
                              className="cursor-pointer  hover:bg-gray-200 text-sky-600 rounded-full hover:bg-sky-blue-dark transition-colors">
                         
                              <QuestionMarkCircleIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                       
          <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />



 

          {message && (
            <div
              className={`p-3 border-l-4 rounded-r text-sm font-medium animate-fadeIn !animate-none mt-4 mx-4 max-w-2xl ${
                message.type === 'success'
                  ? 'bg-teal-100 border-teal-500 text-teal-800'
                  : 'bg-red-100 border-red-500 text-red-800'
              }`}
              aria-live="polite"
            >
              {message.text}
            </div>
          )}
        </div>
        <div className="flex mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-10 mx-auto p-4 lg:px-8 rounded-lg min-h-screen gap-8 lg:gap-16">
            <div className="order-3 sm:order-1 sm:col-span-3">
              <AiChatHistory
                userId={userId}
                onError={handleError}
                onFlashcardCreated={handleFlashcardCreated}
                onNewMessages={handleNewMessages}
              />
            </div>
            <div className="order-1 sm:order-2 sm:col-span-4">
              <AiFlashcards
                userId={userId}
                onError={handleError}
                onFilteredFlashcards={handleFilteredFlashcards}
                setFlashcards={setFlashcards}
              />
            </div>
            <div className="order-2 sm:order-3 sm:col-span-3">
              <CardSyncPlanner
                userId={userId}
                onError={handleError}
                flashcards={flashcards}
              />
              <ChatWidget />
            </div>
          </div>

        </div>
      </div>
    </PlannerContext.Provider>
  );
}