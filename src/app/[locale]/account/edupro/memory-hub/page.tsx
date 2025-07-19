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
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

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
    console.log('Filtered flashcards updated in MemoryHub:', flashcardIds);
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

  const openCardById = useCallback((flashcardId: number, planId: string | null = null) => {
    console.log('openCardById called with flashcardId:', flashcardId, 'planId:', planId);
    const isFiltered = filteredFlashcardIds.includes(flashcardId);
    const targetId = isFiltered ? flashcardId : filteredFlashcardIds[0] || flashcardId;
    const index = flashcards.findIndex((f) => f.id === targetId);
    if (index !== -1) {
      console.log('Opening flashcard at index:', index, 'ID:', targetId);
      setSelectedCardIndex(index);
      setIsFlipped(false);
    } else {
      console.warn('Flashcard not found for ID:', targetId);
      handleError(`Flashcard with ID ${targetId} not found`);
    }
  }, [flashcards, filteredFlashcardIds, handleError]);

  const closeCard = useCallback(() => {
    console.log('closeCard called, resetting selectedCardIndex');
    setSelectedCardIndex(null);
    setIsFlipped(false);
  }, []);

  const flipCard = useCallback(() => {
    console.log('flipCard called in MemoryHub, current isFlipped:', isFlipped);
    setIsFlipped((prev) => {
      const newFlipped = !prev;
      console.log('Setting isFlipped to:', newFlipped);
      return newFlipped;
    });
  }, [isFlipped]);

  const prevCard = useCallback(async () => {
    if (flashcards.length === 0 || selectedCardIndex === null) return;

    let planFlashcardIds: number[] = filteredFlashcardIds.length > 0 ? filteredFlashcardIds : flashcards.map((f) => f.id);
    if (planFlashcardIds.length === 0) return;

    const currentFlashcardId = flashcards[selectedCardIndex].id;
    const currentIndexInPlan = planFlashcardIds.indexOf(currentFlashcardId);
    const prevIndexInPlan = currentIndexInPlan === 0 ? planFlashcardIds.length - 1 : currentIndexInPlan - 1;
    const prevFlashcardId = planFlashcardIds[prevIndexInPlan];
    const prevIndex = flashcards.findIndex((f) => f.id === prevFlashcardId);

    if (prevIndex !== -1) {
      console.log('Navigating to previous card, index:', prevIndex, 'ID:', prevFlashcardId);
      setSelectedCardIndex(prevIndex);
      setIsFlipped(false);
    } else {
      handleError(`Previous flashcard ID ${prevFlashcardId} not found`);
    }
  }, [flashcards, selectedCardIndex, filteredFlashcardIds, handleError]);

  const nextCard = useCallback(async () => {
    if (flashcards.length === 0 || selectedCardIndex === null) return;

    let planFlashcardIds: number[] = filteredFlashcardIds.length > 0 ? filteredFlashcardIds : flashcards.map((f) => f.id);
    if (planFlashcardIds.length === 0) return;

    const currentFlashcardId = flashcards[selectedCardIndex].id;
    const currentIndexInPlan = planFlashcardIds.indexOf(currentFlashcardId);
    const nextIndexInPlan = currentIndexInPlan === planFlashcardIds.length - 1 ? 0 : currentIndexInPlan + 1;
    const nextFlashcardId = planFlashcardIds[nextIndexInPlan];
    const nextIndex = flashcards.findIndex((f) => f.id === nextFlashcardId);

    if (nextIndex !== -1) {
      console.log('Navigating to next card, index:', nextIndex, 'ID:', nextFlashcardId);
      setSelectedCardIndex(nextIndex);
      setIsFlipped(false);
    } else {
      handleError(`Next flashcard ID ${nextFlashcardId} not found`);
    }
  }, [flashcards, selectedCardIndex, filteredFlashcardIds, handleError]);

  const getStatusLabel = useCallback((status: string): string => {
    const statusLabels: { [key: string]: string } = {
      learning: 'Learning',
      review: 'Review',
      mastered: 'Mastered',
      suspended: 'Suspended',
      lapsed: 'Lapsed',
      status: 'Status',
    };
    return statusLabels[status] || status;
  }, []);

  const getNextStatus = useCallback((currentStatus: string | undefined): string => {
    const statusCycle: { [key: string]: string } = {
      learning: 'review',
      review: 'mastered',
      mastered: 'learning',
      suspended: 'learning',
      lapsed: 'learning',
    };
    return statusCycle[currentStatus || 'learning'] || 'learning';
  }, []);

  const getStatusBackgroundClass = useCallback((status?: string) => {
    switch (status) {
      case 'learning':
        return 'bg-sky-50';
      case 'review':
        return 'bg-yellow-50';
      case 'mastered':
        return 'bg-teal-50';
      case 'suspended':
        return 'bg-gray-50';
      case 'lapsed':
        return 'bg-red-50';
      default:
        return 'bg-gray-200';
    }
  }, []);

  const getStatusBorderClass = useCallback((status?: string) => {
    switch (status) {
      case 'learning':
        return 'border-2 border-sky-100';
      case 'review':
        return 'border-2 border-yellow-100';
      case 'mastered':
        return 'border-2 border-teal-100';
      case 'suspended':
        return 'border-2 border-gray-100';
      case 'lapsed':
        return 'border-2 border-red-100';
      default:
        return 'border-2 border-gray-200';
    }
  }, []);

  const handleStatusTransition = useCallback(
    async (flashcard: Flashcard) => {
      const nextStatus = getNextStatus(flashcard.status);
      const tableName = flashcard.user_id ? 'ai_user_flashcards_id' : 'ai_default_flashcards_id';
      try {
        const { data: existingStatus, error: selectError } = await supabase
          .from('ai_flashcard_status')
          .select('id, status')
          .eq(tableName, flashcard.id)
          .eq('user_id', userId)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          throw new Error(`Failed to check existing status for flashcard ${flashcard.id}: ${selectError.message}`);
        }

        if (existingStatus) {
          const { error: updateError } = await supabase
            .from('ai_flashcard_status')
            .update({ status: nextStatus, updated_at: new Date().toISOString() })
            .eq('id', existingStatus.id);
          if (updateError) throw new Error(`Failed to update flashcard status for ${flashcard.id}: ${updateError.message}`);
        } else {
          const { error: insertError } = await supabase
            .from('ai_flashcard_status')
            .insert({ [tableName]: flashcard.id, user_id: userId, status: nextStatus, updated_at: new Date().toISOString() });
          if (insertError) throw new Error(`Failed to insert flashcard status for ${flashcard.id}: ${insertError.message}`);
        }

        setFlashcards((prev) =>
          prev.map((f) => (f.id === flashcard.id ? { ...f, status: nextStatus } : f))
        );
      } catch (error: any) {
        handleError(error.message || 'Failed to update flashcard status.');
        console.error('Status transition error:', error);
      }
    },
    [userId, handleError, getNextStatus]
  );

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
        <div className="mx-auto flex justify-between items-center px-4 sm:py-4">
          <Tooltip content="Account" variant="right">
            <Link href="/account" className="">
              <button className="cursor-pointer hover:bg-gray-200 text-sky-600 p-2 rounded-full hover:bg-sky-blue-dark transition-colors">
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
            </Link>
          </Tooltip>
          <h1 className="text-lg sm:text-xl font-bold text-center text-gray-800 relative">
            Memory Hub
            <span className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-sky-600 rounded-full" />
          </h1>
          <Tooltip content="Guide" variant="left">
            <button
              onClick={() => setIsHelpModalOpen(true)}
              className="cursor-pointer hover:bg-gray-200 text-sky-600 rounded-full hover:bg-sky-blue-dark transition-colors"
            >
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
          <div className="grid grid-cols-1 md:grid-cols-7 lg:grid-cols-10 mx-auto p-4 lg:px-8 rounded-lg min-h-screen gap-8 lg:gap-16">
            <div className="order-3 lg:order-1 col-span-1 sm:col-span-3">
              <AiChatHistory
                userId={userId}
                onError={handleError}
                onFlashcardCreated={handleFlashcardCreated}
                onNewMessages={handleNewMessages}
              />
            </div>
            <div className="order-1 lg:order-2 sm:col-span-4">
              <AiFlashcards
                userId={userId}
                onError={handleError}
                onFilteredFlashcards={handleFilteredFlashcards}
                setFlashcards={setFlashcards}
                openCardById={openCardById}
                closeCard={closeCard}
                prevCard={prevCard}
                nextCard={nextCard}
                flipCard={flipCard}
                getStatusLabel={getStatusLabel}
                getNextStatus={getNextStatus}
                getStatusBackgroundClass={getStatusBackgroundClass}
                getStatusBorderClass={getStatusBorderClass}
                handleStatusTransition={handleStatusTransition}
              />
            </div>
            <div className="order-2 lg:order-3 sm:col-span-3">
              <CardSyncPlanner
                userId={userId}
                onError={handleError}
                flashcards={flashcards}
                 setFlashcards={setFlashcards}
                openCard={openCardById}
              />
              <ChatWidget />
            </div>
          </div>
        </div>
      </div>
    </PlannerContext.Provider>
  );
}