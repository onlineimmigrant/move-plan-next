'use client';
import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { PlusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Listbox, ListboxOption, ListboxOptions } from '@headlessui/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@supabase/supabase-js';
import Tooltip from '@/components/Tooltip';
import Toast from '@/components/Toast';
import FlashcardModal from '@/components/ai/AiFlashcardsComponents/FlashcardModal';
import { cn } from '@/lib/utils';
import { PlannerContext } from '../../lib/context';
import { Flashcard, PlanFlashcard } from '../../lib/types';
import Button from '@/ui/Button';
import DisclosureButton from '@/ui/DisclosureButton';
import ListboxButton from '@/ui/ListboxButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Plan {
  id: string;
  name: string;
  label: string;
  start_date: string;
  end_date?: string | null;
  flashcard_ids: number[];
  status: string;
  user_id: string;
  is_default: boolean;
}

interface CardSyncPlannerProps {
  userId: string | null;
  onError: (error: string) => void;
  flashcards: Flashcard[];
  setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  openCard: (flashcardId: number, planId: string | null) => void;
}

const periods = [
  { label: 'Today', value: 'today' },
  { label: 'Tomorrow', value: 'tomorrow' },
  { label: '3 Days', value: '3-days' },
  { label: 'Week', value: 'week' },
  { label: '2 Weeks', value: '2-weeks' },
  { label: '1 Month', value: '1-month' },
  { label: 'Custom', value: 'custom' },
];

export default function CardSyncPlanner({
  userId,
  onError,
  flashcards,
  setFlashcards,
  openCard,
}: CardSyncPlannerProps) {
  const { newPlanFlashcardIds, setNewPlanFlashcardIds } = useContext(PlannerContext);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<{ id: string; label: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const toastIdRef = useRef(0);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    console.log('CardSyncPlanner rendered:', { userId, plansLength: plans.length, flashcardsLength: flashcards.length, newPlanFlashcardIds });
    if (newPlanFlashcardIds.length > 0 && !isCreatingPlan) {
      setIsCreatingPlan(true);
    }
  }, [newPlanFlashcardIds, isCreatingPlan]);

  const fetchPlans = useCallback(async (): Promise<Plan[]> => {
    if (!userId) {
      setLoading(false);
      return [];
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_card_sync_planner')
        .select('id, name, label, start_date, end_date, flashcard_ids, status, user_id, is_default')
        .eq('user_id', userId) as { data: Plan[] | null; error: any };
      if (error) {
        throw new Error('Failed to fetch plans: ' + error.message);
      }
      const validPlans = (data || []).map((plan) => ({
        ...plan,
        label: plan.label || 'Plan',
        flashcard_ids: [...new Set(plan.flashcard_ids.filter((id) =>
          flashcards.some((f) => f.id === id)
        ))] as number[],
        is_default: plan.is_default || false,
      }));
      console.log('Fetched plans:', validPlans);
      return validPlans;
    } catch (error: any) {
      addToast(error.message || 'Failed to fetch plans.', 'error');
      onError(error.message || 'Failed to fetch plans.');
      console.error('Fetch plans error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, onError, flashcards, addToast]);

  useEffect(() => {
    let isMounted = true;
    console.log('fetchPlans useEffect triggered:', { userId });

    fetchPlans().then((data) => {
      if (isMounted) {
        setPlans(data);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [fetchPlans]);

  const getPlanDates = useCallback((period: string) => {
    const today = new Date();
    let startDate = new Date(today);
    let endDate: Date | null = null;

    switch (period) {
      case 'tomorrow':
        startDate = new Date(today.setDate(today.getDate() + 1));
        break;
      case '3-days':
        endDate = new Date(today.setDate(today.getDate() + 2));
        break;
      case 'week':
        endDate = new Date(today.setDate(today.getDate() + 6));
        break;
      case '2-weeks':
        endDate = new Date(today.setDate(today.getDate() + 13));
        break;
      case '1-month':
        endDate = new Date(today.setMonth(today.getMonth() + 1));
        break;
    }

    return { startDate, endDate };
  }, []);

  const getPlanStyles = useCallback((plan: Plan) => {
    if (plan.is_default) {
      return 'bg-sky-600 text-gray-50 hover:bg-sky-700 ring-sky-700';
    }
    const today = new Date();
    const startDate = new Date(plan.start_date);
    const endDate = plan.end_date ? new Date(plan.end_date) : startDate;
    if (endDate < today) return 'border-2 border-red-300 bg-red-50 text-red-700 hover:bg-red-100 ring-red-700';
    if (endDate.toDateString() === today.toDateString()) return 'bg-yellow-50 text-yellow-700 ring-yellow-700 hover:bg-yellow-100';
    return 'border-2 border-sky-300 bg-sky-50 text-sky-700 ring-sky-700 hover:bg-sky-100';
  }, []);

  const handleCreatePlan = useCallback(async () => {
    if (!userId || newPlanFlashcardIds.length === 0) {
      console.log('handleCreatePlan failed: No flashcards selected or no userId', { userId, newPlanFlashcardIds });
      addToast('Please select at least one flashcard', 'error');
      onError('Please select at least one flashcard');
      return;
    }

    if (selectedPlan) {
      // Update existing plan
      const plan = plans.find((p) => p.id === selectedPlan.id);
      if (!plan) {
        addToast('Selected plan not found', 'error');
        return;
      }
      if (plan.is_default) {
        addToast('Cannot add flashcards to default plans.', 'error');
        return;
      }
      try {
        const updatedFlashcardIds = [
          ...plan.flashcard_ids,
          ...newPlanFlashcardIds.map((f) => f.id).filter((id) => !plan.flashcard_ids.includes(id)),
        ];
        console.log('Updating plan with flashcard_ids:', updatedFlashcardIds, 'planId:', plan.id);
        const { error } = await supabase
          .from('ai_card_sync_planner')
          .update({ flashcard_ids: updatedFlashcardIds })
          .eq('id', plan.id);

        if (error) {
          throw new Error('Failed to update plan: ' + error.message);
        }

        setNewPlanFlashcardIds([]);
        setIsCreatingPlan(false);
        setSelectedPlan(null);
        const data = await fetchPlans();
        setPlans(data);
        addToast(`Flashcards added to plan "${plan.label}"`, 'success');
      } catch (error: any) {
        addToast(error.message || 'Failed to update plan.', 'error');
        onError(error.message || 'Failed to update plan.');
        console.error('Update plan error:', error);
      }
    } else {
      // Create new plan
      if (!planLabel) {
        addToast('Please enter a plan label', 'error');
        onError('Please enter a plan label');
        return;
      }

      const { startDate, endDate } = getPlanDates(selectedPeriod.value);
      const name =
        selectedPeriod.value === 'custom' && customStartDate && customEndDate
          ? `${new Date(customStartDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} - ${new Date(customEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}`
          : selectedPeriod.value === 'today' || selectedPeriod.value === 'tomorrow'
          ? new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
          : `${new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} - ${new Date(endDate!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}`;

      try {
        console.log('Creating plan with flashcard_ids:', newPlanFlashcardIds.map((f) => f.id), 'label:', planLabel);
        const { error } = await supabase.from('ai_card_sync_planner').insert({
          user_id: userId,
          name,
          label: planLabel.slice(0, 20),
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate ? endDate.toISOString().split('T')[0] : null,
          flashcard_ids: newPlanFlashcardIds.map((f) => f.id),
          status: 'active',
          is_default: false,
        });

        if (error) {
          throw new Error('Failed to create plan: ' + error.message);
        }

        setNewPlanFlashcardIds([]);
        setIsCreatingPlan(false);
        setSelectedPeriod(periods[0]);
        setCustomStartDate(null);
        setCustomEndDate(null);
        setPlanLabel('');
        const data = await fetchPlans();
        setPlans(data);
        addToast('Plan created successfully', 'success');
      } catch (error: any) {
        addToast(error.message || 'Failed to create plan.', 'error');
        onError(error.message || 'Failed to create plan.');
        console.error('Create plan error:', error);
      }
    }
  }, [userId, newPlanFlashcardIds, selectedPeriod, customStartDate, customEndDate, planLabel, selectedPlan, plans, onError, fetchPlans, addToast]);

  const handleMarkDone = useCallback(async (plan: Plan) => {
    if (plan.is_default) {
      addToast('Default plans cannot be marked as done.', 'error');
      return;
    }
    console.log('handleMarkDone called for plan:', plan.id, 'with flashcard_ids:', plan.flashcard_ids);
    try {
      const planFlashcards: PlanFlashcard[] = plan.flashcard_ids.map((id) => {
        const flashcard = flashcards.find((f) => f.id === id);
        return { id, isUserFlashcard: !!flashcard?.user_id };
      });

      const allMastered = planFlashcards.every((pf) => {
        const flashcard = flashcards.find((f) => f.id === pf.id);
        return flashcard?.status === 'mastered';
      });

      if (!allMastered) {
        await Promise.all(
          planFlashcards.map(async (pf) => {
            const flashcard = flashcards.find((f) => f.id === pf.id);
            if (!flashcard) {
              console.warn(`Flashcard with id ${pf.id} not found in flashcards array`);
              return;
            }
            if (flashcard.status !== 'mastered') {
              const tableName = pf.isUserFlashcard ? 'ai_user_flashcards_id' : 'ai_default_flashcards_id';
              const { data: existingStatus, error: selectError } = await supabase
                .from('ai_flashcard_status')
                .select('id, status')
                .eq(tableName, pf.id)
                .eq('user_id', userId)
                .single();

              if (selectError && selectError.code !== 'PGRST116') {
                throw new Error(`Failed to check existing status for flashcard ${pf.id}: ${selectError.message}`);
              }

              if (existingStatus) {
                const { error: updateError } = await supabase
                  .from('ai_flashcard_status')
                  .update({ status: 'mastered', updated_at: new Date().toISOString() })
                  .eq('id', existingStatus.id);
                if (updateError) throw new Error(`Failed to update flashcard status for ${pf.id}: ${updateError.message}`);
              } else {
                const { error: insertError } = await supabase
                  .from('ai_flashcard_status')
                  .insert({ [tableName]: pf.id, user_id: userId, status: 'mastered', updated_at: new Date().toISOString() });
                if (insertError) throw new Error(`Failed to insert flashcard status for ${pf.id}: ${insertError.message}`);
              }
            }
          })
        );
      }

      const { error } = await supabase
        .from('ai_card_sync_planner')
        .delete()
        .eq('id', plan.id);

      if (error) {
        throw new Error('Failed to delete plan: ' + error.message);
      }

      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      addToast('Plan marked as done', 'success');
    } catch (error: any) {
      addToast(error.message || 'Failed to mark plan as done.', 'error');
      onError(error.message || 'Failed to mark plan as done.');
      console.error('Mark done error:', error);
    }
  }, [flashcards, userId, onError, addToast]);

  const handleRemoveFlashcard = useCallback(
    async (planId: string, flashcardId: number) => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return;

      try {
        const updatedFlashcardIds = plan.flashcard_ids.filter((id) => id !== flashcardId);
        const { error } = await supabase
          .from('ai_card_sync_planner')
          .update({ flashcard_ids: updatedFlashcardIds })
          .eq('id', planId);

        if (error) {
          throw new Error('Failed to remove flashcard from plan: ' + error.message);
        }

        setPlans((prev) =>
          prev.map((p) => (p.id === planId ? { ...p, flashcard_ids: updatedFlashcardIds } : p))
        );
        addToast('Flashcard removed from plan', 'success');
      } catch (error: any) {
        addToast(error.message || 'Failed to remove flashcard from plan.', 'error');
        onError(error.message || 'Failed to remove flashcard from plan.');
        console.error('Remove flashcard error:', error);
      }
    },
    [plans, onError, addToast]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) {
        console.log('Drag cancelled: No destination');
        return;
      }

      const sourcePlanId = result.source.droppableId;
      const destPlanId = result.destination.droppableId;
      const flashcardId = parseInt(result.draggableId.split('-')[1]);
      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;

      console.log('handleDragEnd:', { sourcePlanId, destPlanId, flashcardId, sourceIndex, destIndex });

      // Prevent dragging to default plans
      const destPlan = destPlanId === 'new-plan' ? null : plans.find((p) => p.id === destPlanId);
      if (destPlan?.is_default) {
        addToast('Cannot add flashcards to default plans.', 'error');
        return;
      }

      if (sourcePlanId === destPlanId) {
        console.log('Same plan, reordering...');
        try {
          if (sourcePlanId === 'new-plan') {
            const newIds = [...newPlanFlashcardIds];
            const [moved] = newIds.splice(sourceIndex, 1);
            if (!moved) {
              console.error('No flashcard found at source index:', sourceIndex);
              return;
            }
            newIds.splice(destIndex, 0, moved);
            console.log('Reordered new plan:', newIds);
            setNewPlanFlashcardIds(newIds);
          } else {
            const plan = plans.find((p) => p.id === sourcePlanId);
            if (!plan) {
              addToast('Source plan not found', 'error');
              return;
            }
            const updatedFlashcardIds = [...plan.flashcard_ids];
            const [moved] = updatedFlashcardIds.splice(sourceIndex, 1);
            if (!moved) {
              console.error('No flashcard found at source index:', sourceIndex);
              return;
            }
            updatedFlashcardIds.splice(destIndex, 0, moved);
            const { error } = await supabase
              .from('ai_card_sync_planner')
              .update({ flashcard_ids: updatedFlashcardIds })
              .eq('id', sourcePlanId);
            if (error) throw new Error(`Failed to reorder flashcards: ${error.message}`);
            setPlans((prev) =>
              prev.map((p) => (p.id === sourcePlanId ? { ...p, flashcard_ids: updatedFlashcardIds } : p))
            );
            addToast('Flashcard reordered', 'success');
          }
        } catch (error: any) {
          addToast(error.message || 'Failed to reorder flashcard.', 'error');
          console.error('Reorder error:', error);
        }
        return;
      }

      const sourcePlan = sourcePlanId === 'new-plan' ? null : plans.find((p) => p.id === sourcePlanId);
      const flashcard = flashcards.find((f) => f.id === flashcardId);

      if (!flashcard) {
        console.warn(`Flashcard with id ${flashcardId} not found`);
        addToast(`Flashcard ID ${flashcardId} not found`, 'error');
        return;
      }

      try {
        if (destPlanId === 'new-plan') {
          if (newPlanFlashcardIds.some((pf) => pf.id === flashcardId)) {
            addToast(`Flashcard "${flashcard.name}" is already in the new plan`, 'error');
            return;
          }
          if (sourcePlan) {
            const updatedSourceFlashcardIds = sourcePlan.flashcard_ids.filter((id) => id !== flashcardId);
            const { error: sourceError } = await supabase
              .from('ai_card_sync_planner')
              .update({ flashcard_ids: updatedSourceFlashcardIds })
              .eq('id', sourcePlanId);
            if (sourceError) throw new Error(`Failed to update source plan: ${sourceError.message}`);
            setPlans((prev) =>
              prev.map((p) => (p.id === sourcePlanId ? { ...p, flashcard_ids: updatedSourceFlashcardIds } : p))
            );
          }
          const newIds = [
            ...newPlanFlashcardIds.slice(0, destIndex),
            { id: flashcardId, isUserFlashcard: !!flashcard.user_id },
            ...newPlanFlashcardIds.slice(destIndex),
          ];
          console.log('Moved to new plan:', newIds);
          setNewPlanFlashcardIds(newIds);
          addToast(`Moved "${flashcard.name}" to new plan`, 'success');
        } else if (sourcePlanId === 'new-plan') {
          if (!destPlan) {
            console.warn(`Destination plan ${destPlanId} not found`);
            addToast(`Destination plan not found`, 'error');
            return;
          }
          if (destPlan.flashcard_ids.includes(flashcardId)) {
            addToast(`Flashcard "${flashcard.name}" is already in the destination plan`, 'error');
            return;
          }
          const updatedDestFlashcardIds = [...destPlan.flashcard_ids.slice(0, destIndex), flashcardId, ...destPlan.flashcard_ids.slice(destIndex)];
          const { error: destError } = await supabase
            .from('ai_card_sync_planner')
            .update({ flashcard_ids: updatedDestFlashcardIds })
            .eq('id', destPlanId);
          if (destError) throw new Error(`Failed to update destination plan: ${destError.message}`);
          const newIds = newPlanFlashcardIds.filter((pf) => pf.id !== flashcardId);
          console.log('Moved from new plan to plan:', newIds);
          setNewPlanFlashcardIds(newIds);
          setPlans((prev) =>
            prev.map((p) => (p.id === destPlanId ? { ...p, flashcard_ids: updatedDestFlashcardIds } : p))
          );
          addToast(`Moved "${flashcard.name}" to plan "${destPlan.label}"`, 'success');
        } else {
          if (!sourcePlan || !destPlan) {
            console.warn(`Source plan ${sourcePlanId} or destination plan ${destPlanId} not found`);
            addToast(`Source or destination plan not found`, 'error');
            return;
          }
          if (destPlan.flashcard_ids.includes(flashcardId)) {
            addToast(`Flashcard "${flashcard.name}" is already in the destination plan`, 'error');
            return;
          }
          const updatedSourceFlashcardIds = sourcePlan.flashcard_ids.filter((id) => id !== flashcardId);
          const updatedDestFlashcardIds = [...destPlan.flashcard_ids.slice(0, destIndex), flashcardId, ...destPlan.flashcard_ids.slice(destIndex)];
          const [sourceUpdate, destUpdate] = await Promise.all([
            supabase
              .from('ai_card_sync_planner')
              .update({ flashcard_ids: updatedSourceFlashcardIds })
              .eq('id', sourcePlanId),
            supabase
              .from('ai_card_sync_planner')
              .update({ flashcard_ids: updatedDestFlashcardIds })
              .eq('id', destPlanId),
          ]);
          if (sourceUpdate.error || destUpdate.error) {
            throw new Error(`Failed to move flashcard: ${sourceUpdate.error?.message || destUpdate.error?.message}`);
          }
          setPlans((prev) => {
            const newPlans = prev.map((p) =>
              p.id === sourcePlanId
                ? { ...p, flashcard_ids: updatedSourceFlashcardIds }
                : p.id === destPlanId
                ? { ...p, flashcard_ids: updatedDestFlashcardIds }
                : p
            );
            console.log('Moved between plans:', newPlans.map((p) => ({ id: p.id, flashcard_ids: p.flashcard_ids })));
            return newPlans;
          });
          addToast(`Moved "${flashcard.name}" from "${sourcePlan.label}" to "${destPlan.label}"`, 'success');
        }
      } catch (error: any) {
        addToast(error.message || 'Failed to move flashcard between plans.', 'error');
        console.error('Drag end error:', error);
      }
    },
    [plans, flashcards, newPlanFlashcardIds, onError, addToast]
  );

  const truncateLabel = useCallback((label: string) => {
    return label.length > 20 ? label.slice(0, 20) + '...' : label;
  }, []);

  const handleDisclosureToggle = (planId: string) => {
    setOpenPlanId((prev) => (prev === planId ? null : planId));
  };

  const handleAddFlashcardsClick = () => {
    setOpenPlanId(null);
    setIsCreatingPlan(true);
    setSelectedPlan(null);
    setPlanLabel('');
    setSelectedPeriod(periods[0]);
    setCustomStartDate(null);
    setCustomEndDate(null);
  };

  const closeCard = useCallback(() => {
    setSelectedCardIndex(null);
    setIsFlipped(false);
    setCurrentPlanId(null);
  }, []);

  const flipCard = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const prevCard = useCallback(async () => {
    if (flashcards.length === 0 || selectedCardIndex === null) return;

    let planFlashcardIds: number[] = [];
    if (currentPlanId) {
      const { data: plan, error } = await supabase
        .from('ai_card_sync_planner')
        .select('flashcard_ids')
        .eq('id', currentPlanId)
        .single();
      if (error) {
        addToast(`Failed to fetch plan ${currentPlanId}: ${error.message}`, 'error');
        onError(`Failed to fetch plan ${currentPlanId}: ${error.message}`);
        return;
      }
      planFlashcardIds = plan.flashcard_ids || [];
    } else {
      planFlashcardIds = flashcards.map((f) => f.id);
    }

    if (planFlashcardIds.length === 0) return;

    const currentFlashcardId = flashcards[selectedCardIndex].id;
    const currentIndexInPlan = planFlashcardIds.indexOf(currentFlashcardId);
    const prevIndexInPlan = currentIndexInPlan === 0 ? planFlashcardIds.length - 1 : currentIndexInPlan - 1;
    const prevFlashcardId = planFlashcardIds[prevIndexInPlan];
    const prevIndex = flashcards.findIndex((f) => f.id === prevFlashcardId);

    if (prevIndex !== -1) {
      setSelectedCardIndex(prevIndex);
      setIsFlipped(false);
    } else {
      addToast(`Previous flashcard ID ${prevFlashcardId} not found`, 'error');
      onError(`Previous flashcard ID ${prevFlashcardId} not found`);
    }
  }, [flashcards, selectedCardIndex, currentPlanId, addToast, onError]);

  const nextCard = useCallback(async () => {
    if (flashcards.length === 0 || selectedCardIndex === null) return;

    let planFlashcardIds: number[] = [];
    if (currentPlanId) {
      const { data: plan, error } = await supabase
        .from('ai_card_sync_planner')
        .select('flashcard_ids')
        .eq('id', currentPlanId)
        .single();
      if (error) {
        addToast(`Failed to fetch plan ${currentPlanId}: ${error.message}`, 'error');
        onError(`Failed to fetch plan ${currentPlanId}: ${error.message}`);
        return;
      }
      planFlashcardIds = plan.flashcard_ids || [];
    } else {
      planFlashcardIds = flashcards.map((f) => f.id);
    }

    if (planFlashcardIds.length === 0) return;

    const currentFlashcardId = flashcards[selectedCardIndex].id;
    const currentIndexInPlan = planFlashcardIds.indexOf(currentFlashcardId);
    const nextIndexInPlan = currentIndexInPlan === planFlashcardIds.length - 1 ? 0 : currentIndexInPlan + 1;
    const nextFlashcardId = planFlashcardIds[nextIndexInPlan];
    const nextIndex = flashcards.findIndex((f) => f.id === nextFlashcardId);

    if (nextIndex !== -1) {
      setSelectedCardIndex(nextIndex);
      setIsFlipped(false);
    } else {
      addToast(`Next flashcard ID ${nextFlashcardId} not found`, 'error');
      onError(`Next flashcard ID ${nextFlashcardId} not found`);
    }
  }, [flashcards, selectedCardIndex, currentPlanId, addToast, onError]);

  const getStatusLabel = (status: string): string => {
    const statusLabels: { [key: string]: string } = {
      learning: 'Learning',
      review: 'Review',
      mastered: 'Mastered',
      suspended: 'Suspended',
      lapsed: 'Lapsed',
      status: 'Status',
    };
    return statusLabels[status] || status;
  };

  const getNextStatus = (currentStatus: string | undefined): string => {
    const statusCycle: { [key: string]: string } = {
      learning: 'review',
      review: 'mastered',
      mastered: 'learning',
      suspended: 'learning',
      lapsed: 'learning',
    };
    return statusCycle[currentStatus || 'learning'] || 'learning';
  };

  const getStatusBackgroundClass = (status?: string) => {
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
  };

  const getStatusBorderClass = (status?: string) => {
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
  };

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
        addToast(error.message || 'Failed to update flashcard status.', 'error');
        onError(error.message || 'Failed to update flashcard status.');
        console.error('Status transition error:', error);
      }
    },
    [userId, setFlashcards, addToast, onError]
  );

  const handleOpenCard = useCallback((flashcardId: number, planId: string | null) => {
    const index = flashcards.findIndex((f) => f.id === flashcardId);
    if (index !== -1) {
      setSelectedCardIndex(index);
      setIsFlipped(false);
      setCurrentPlanId(planId);
      openCard(flashcardId, planId);
    } else {
      addToast(`Flashcard with ID ${flashcardId} not found`, 'error');
      onError(`Flashcard with ID ${flashcardId} not found`);
    }
  }, [flashcards, openCard, addToast, onError]);

  // Split plans into default and non-default
  const nonDefaultPlans = plans.filter((plan) => !plan.is_default);
  const defaultPlans = plans.filter((plan) => plan.is_default);

  return (
    <div className="-mt-2 relative">
      <div className="block items-center justify-between sm:py-0">
        <Disclosure defaultOpen>
          {({ open }) => (
            <div>
              <div className="mt-1 flex items-center justify-between mb-4">
                <DisclosureButton>
                  <span>CardSync Planner</span>
                  <span className="ml-2 font-bold text-sky-500">{open ? '−' : '+'}</span>
                </DisclosureButton>
              </div>
              <Transition
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Disclosure.Panel className="w-full sm:p-4 p-2 sm:bg-gray-50 sm:border-2 border-gray-200 rounded-xl sm:min-h-[640px] sm:max-h-[640px] flex flex-col">
                  {loading ? (
                    <div className="text-gray-700">Loading...</div>
                  ) : (
                    <DragDropContext onDragEnd={handleDragEnd}>
 
                      <div className="flex-1 overflow-y-auto">
                        {isCreatingPlan && (
                          <div className="mt-2 mb-4 p-2 sm:p-4 bg-white border-2 border-gray-200 rounded-lg flex flex-col gap-4">
                            <div className="relative flex items-center bg-white border-2 border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-transparent transition-all duration-200">
  
                              <div className="flex items-center justify-end gap-2">
                                {!selectedPlan && (
                                  <>
                                    <input
                                      type="text"
                                      value={planLabel}
                                      onChange={(e) => setPlanLabel(e.target.value.slice(0, 20))}
                                      placeholder="Enter plan label"
                                      className=" py-2 pl-3 pr-3 text-base font-light bg-transparent border-none focus:outline-none"
                                      maxLength={20}
                                    />
                                    <Listbox value={selectedPeriod} onChange={setSelectedPeriod}>
                                      {({ open }) => (
                                        <div className="relative">
                                          <Tooltip content="Select Period">
                                            <ListboxButton
                                              variant="outline"
                                              className="flex justify-center h-full py-2 sm:px-1 px-0 text-sm font-medium text-gray-900 bg-gray-50 border-none shadow-none rounded-l-lg focus:outline-none hover:bg-gray-100 min-w-[70px]"
                                            >
                                              <span className="line-clamp-1">{selectedPeriod.label}</span>
                                            </ListboxButton>
                                          </Tooltip>
                                          <Transition
                                            show={open}
                                            enter="transition ease-out duration-100"
                                            enterFrom="opacity-0 scale-95"
                                            enterTo="opacity-100 scale-100"
                                            leave="transition ease-in duration-75"
                                            leaveFrom="opacity-100 scale-100"
                                            leaveTo="opacity-0 scale-95"
                                          >
                                            <ListboxOptions className="absolute w-48 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-20">
                                              {periods.map((period) => (
                                                <ListboxOption
                                                  key={period.value}
                                                  value={period}
                                                  className={({ active }) =>
                                                    cn(
                                                      'relative cursor-pointer select-none py-3 px-4 border-gray-100',
                                                      active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
                                                    )
                                                  }
                                                >
                                                  <div className="flex items-center justify-between">
                                                    <span className="flex-grow text-sm font-medium">{period.label}</span>
                                                    {selectedPeriod.value === period.value && (
                                                      <CheckIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />
                                                    )}
                                                  </div>
                                                </ListboxOption>
                                              ))}
                                            </ListboxOptions>
                                          </Transition>
                                        </div>
                                      )}
                                    </Listbox>
                                  </>
                                )}
                                <Button
                                  variant="primary"
                                  onClick={handleCreatePlan}
                                  className="h-full py-2 px-2 sm:px-2 text-sm font-medium border-none shadow-none focus:outline-none"
                                >
                                  Save
                                </Button>

                              </div>
                            </div>
                            {!selectedPlan && selectedPeriod.value === 'custom' && (
                              <div className="flex gap-2">
                                <input
                                  type="date"
                                  value={customStartDate || ''}
                                  onChange={(e) => setCustomStartDate(e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                                />
                                <input
                                  type="date"
                                  value={customEndDate || ''}
                                  onChange={(e) => setCustomEndDate(e.target.value)}
                                  className="w-full p-2 border border-gray-200 rounded-md text-sm"
                                />
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-800 text-center">
                              Total: {newPlanFlashcardIds.length}
                            </div>
                            <div className='flex justify-between'>
                            <Listbox
                                value={selectedPlan}
                                onChange={(plan) => {
                                  setSelectedPlan(plan);
                                  if (plan) {
                                    setPlanLabel(plan.label);
                                    setSelectedPeriod(periods[0]);
                                    setCustomStartDate(null);
                                    setCustomEndDate(null);
                                  } else {
                                    setPlanLabel('');
                                  }
                                }}
                              >
                                {({ open }) => (
                                  <div className="relative flex-grow">
                                    <Tooltip content="Select Plan">
                                      <ListboxButton
                                        variant="outline"
                                        className="w-full h-full py-2 sm:px-2 px-1 text-sm font-medium text-gray-900 bg-gray-50 border-none shadow-none focus:outline-none hover:bg-gray-100"
                                      >
                                        <span className="line-clamp-1">
                                          {selectedPlan ? selectedPlan.label : 'Create New Plan'}
                                        </span>
                                      </ListboxButton>
                                    </Tooltip>
                                    <Transition
                                      show={open}
                                      enter="transition ease-out duration-100"
                                      enterFrom="opacity-0 scale-95"
                                      enterTo="opacity-100 scale-100"
                                      leave="transition ease-in duration-75"
                                      leaveFrom="opacity-100 scale-100"
                                      leaveTo="opacity-0 scale-95"
                                    >
                                      <ListboxOptions className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-20">
                                        <ListboxOption
                                          value={null}
                                          className={({ active }) =>
                                            cn(
                                              'relative cursor-pointer select-none py-3 px-4 border-gray-100',
                                              active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
                                            )
                                          }
                                        >
                                          <div className="flex items-center justify-between ">
                                            <span className="flex-grow text-sm font-medium">Create New Plan</span>
                                            {!selectedPlan && <CheckIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />}
                                          </div>
                                        </ListboxOption>
                                        {nonDefaultPlans.map((plan) => (
                                          <ListboxOption
                                            key={plan.id}
                                            value={{ id: plan.id, label: plan.label }}
                                            className={({ active }) =>
                                              cn(
                                                'relative cursor-pointer select-none py-3 px-4 border-gray-100',
                                                active ? 'bg-sky-100 text-sky-900 font-semibold' : 'text-gray-900'
                                              )
                                            }
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="flex-grow text-sm font-medium">{plan.label}</span>
                                              {selectedPlan?.id === plan.id && (
                                                <CheckIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />
                                              )}
                                            </div>
                                          </ListboxOption>
                                        ))}
                                      </ListboxOptions>
                                    </Transition>
                                  </div>
                                )}
                              </Listbox>
                                          <Button
                                  variant="outline"
                                  onClick={() => {
                                    setNewPlanFlashcardIds([]);
                                    setIsCreatingPlan(false);
                                    setSelectedPlan(null);
                                    setSelectedPeriod(periods[0]);
                                    setCustomStartDate(null);
                                    setCustomEndDate(null);
                                    setPlanLabel('');
                                  }}
                                  className="h-full py-2 px-2 sm:px-2 text-sm font-medium text-gray-900 bg-gray-50 border-none shadow-none focus:outline-none hover:bg-gray-100"
                                >
                                  <XMarkIcon className="h-5 w-5 text-gray-600" />
                                </Button>
                                </div>
                            <Droppable droppableId="new-plan">
                              {(provided) => (
                                <div
                                  className="flex flex-col gap-2 max-h-[9rem] overflow-y-auto"
                                  ref={provided.innerRef}
                                  {...provided.droppableProps}
                                >
                                  {newPlanFlashcardIds.map((pf, index) => {
                                    const flashcard = flashcards.find((f) => f.id === pf.id);
                                    return (
                                      <Draggable key={`new-plan-${pf.id}`} draggableId={`new-plan-${pf.id}`} index={index}>
                                        {(provided, snapshot) => (
                                          <a
                                            href="#"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleOpenCard(pf.id, null);
                                            }}
                                            className="hover:underline font-medium flex-grow"
                                          >
                                            <div
                                              className={cn(
                                                'flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-800 text-sm shadow-sm hover:bg-gray-100 w-full',
                                                snapshot.isDragging && 'opacity-50'
                                              )}
                                              ref={provided.innerRef}
                                              {...provided.draggableProps}
                                              {...provided.dragHandleProps}
                                            >
                                              <Tooltip content={flashcard ? flashcard.name : `Unknown (ID: ${pf.id})`} variant="info-top">
                                                <span className="line-clamp-1">{flashcard ? flashcard.name : `Unknown (ID: ${pf.id})`}</span>
                                              </Tooltip>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setNewPlanFlashcardIds(newPlanFlashcardIds.filter((f) => f.id !== pf.id));
                                                }}
                                                className="p-1 rounded-full bg-gray-200 hover:bg-red-300 text-gray-600 hover:text-red-800 transition-colors"
                                              >
                                                <XMarkIcon className="h-4 w-4" />
                                              </button>
                                            </div>
                                          </a>
                                        )}
                                      </Draggable>
                                    );
                                  })}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </div>
                        )}
                        {!isCreatingPlan && (
                          <div className="flex justify-center mb-4">
                            <Button onClick={handleAddFlashcardsClick} variant="outline">
                              <PlusIcon className="mr-2 h-5 w-5" />
                              Flashcards
                            </Button>
                          </div>
                        )}





                        
                        {nonDefaultPlans.map((plan) => (
                          <Disclosure
                            key={plan.id}
                            as="div"
                            className="mb-4 px-2"
                            defaultOpen={openPlanId === plan.id}
                          >
                            {({ open }) => (
                              <>
                                <DisclosureButton
                                  variant="card-sync-planner"
                                  className={cn(
                                    'flex justify-between items-center py-1 space-x-4 w-full',
                                    getPlanStyles(plan)
                                  )}
                                  onClick={() => handleDisclosureToggle(plan.id)}
                                >
                                  <span className="font-bold">{truncateLabel(plan.label)}</span>
                                  <span>{plan.name}</span>
                                  <span>{open ? '−' : '+'}</span>
                                </DisclosureButton>
                                <Transition
                                  enter="transition ease-out duration-100"
                                  enterFrom="opacity-0 scale-95"
                                  enterTo="opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="opacity-100 scale-100"
                                  leaveTo="opacity-0 scale-95"
                                >
                                  <Disclosure.Panel className="mt-2 p-3 bg-white border-2 border-gray-200 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium text-gray-800">{plan.name}</span>
                                      <div className="flex items-center gap-4">
                                                               <Button
                                          variant="outline"
                                          onClick={() => handleMarkDone(plan)}
                                          disabled={plan.status === 'done'}
                                        >
                                          Mark Done
                                        </Button>
                                      </div>
                                    </div>
                                    <Droppable droppableId={plan.id}>
                                      {(provided) => (
                                        <div
                                          className="mt-2 flex flex-col gap-2 max-h-[9rem] overflow-y-auto"
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                        >
                                          <div className="text-sm font-medium text-gray-800 text-center">
                                            Total: {plan.flashcard_ids.length}
                                          </div>
                                          {plan.flashcard_ids.map((id, index) => {
                                            const flashcard = flashcards.find((f) => f.id === id);
                                            return (
                                              <Draggable key={`${plan.id}-${id}`} draggableId={`${plan.id}-${id}`} index={index}>
                                                {(provided, snapshot) => (
                                                  <a
                                                    href="#"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      handleOpenCard(id, plan.id);
                                                    }}
                                                    className="hover:underline font-medium flex-grow"
                                                  >
                                                    <div
                                                      className={cn(
                                                        'flex items-center justify-between gap-2 px-3 py-2 m-1 my-1 bg-gray-50 border border-gray-200 rounded-full text-gray-800 text-sm shadow-sm hover:bg-gray-100 w-full',
                                                        snapshot.isDragging && 'opacity-50'
                                                      )}
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                    >
                                                      <Tooltip content={flashcard ? flashcard.name : `Unknown (ID: ${id})`} variant="info-top">
                                                        <span className="line-clamp-1">{flashcard ? flashcard.name : `Unknown (ID: ${id})`}</span>
                                                      </Tooltip>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleRemoveFlashcard(plan.id, id);
                                                        }}
                                                        className="p-1 rounded-full bg-gray-200 hover:bg-red-300 text-gray-600 hover:text-red-800 transition-colors"
                                                      >
                                                        <XMarkIcon className="h-4 w-4" />
                                                      </button>
                                                    </div>
                                                  </a>
                                                )}
                                              </Draggable>
                                            );
                                          })}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </Disclosure.Panel>
                                </Transition>
                              </>
                            )}
                          </Disclosure>
                        ))}






                        
                      </div>
                      <div className="px-2 h-1/4 overflow-y-auto border-t border-gray-200 pt-2">
                        {defaultPlans.length > 0 && (
                          <h3 className="text-sm font-medium text-gray-800 mb-2">Course Flashcards</h3>
                        )}
                        {defaultPlans.map((plan) => (
                          <Disclosure
                            key={plan.id}
                            as="div"
                            className="mb-4"
                            defaultOpen={openPlanId === plan.id}
                          >
                            {({ open }) => (
                              <>
                                <DisclosureButton
                                  variant="card-sync-planner"
                                  className={cn(
                                    'flex justify-between items-center py-1 space-x-4 w-full',
                                    getPlanStyles(plan)
                                  )}
                                  onClick={() => handleDisclosureToggle(plan.id)}
                                >
                                  <span className="font-bold">{truncateLabel(plan.label)}</span>
                                  <span>Topic</span>
                                  <span>{open ? '−' : '+'}</span>
                                </DisclosureButton>
                                <Transition
                                  enter="transition ease-out duration-100"
                                  enterFrom="opacity-0 scale-95"
                                  enterTo="opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="opacity-100 scale-100"
                                  leaveTo="opacity-0 scale-95"
                                >
                                  <Disclosure.Panel className="mt-2 p-3 bg-white border-2 border-gray-200 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium text-gray-800">Topic Flashcards</span>
                                                                </div>
                                    <Droppable droppableId={plan.id}>
                                      {(provided) => (
                                        <div
                                          className="mt-2 flex flex-col gap-2 max-h-[9rem] overflow-y-auto"
                                          ref={provided.innerRef}
                                          {...provided.droppableProps}
                                        >
                                          <div className="text-sm font-medium text-gray-800 text-center">
                                            Total: {plan.flashcard_ids.length}
                                          </div>
                                          {plan.flashcard_ids.map((id, index) => {
                                            const flashcard = flashcards.find((f) => f.id === id);
                                            return (
                                              <Draggable key={`${plan.id}-${id}`} draggableId={`${plan.id}-${id}`} index={index}>
                                                {(provided, snapshot) => (
                                                  <a
                                                    href="#"
                                                    onClick={(e) => {
                                                      e.preventDefault();
                                                      handleOpenCard(id, plan.id);
                                                    }}
                                                    className="hover:underline font-medium flex-grow"
                                                  >
                                                    <div
                                                      className={cn(
                                                        'flex items-center justify-between gap-2 px-3 py-2 m-1 my-1 bg-gray-50 border border-gray-200 rounded-full text-gray-800 text-sm shadow-sm hover:bg-gray-100 w-full',
                                                        snapshot.isDragging && 'opacity-50'
                                                      )}
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      {...provided.dragHandleProps}
                                                    >
                                                      <Tooltip content={flashcard ? flashcard.name : `Unknown (ID: ${id})`} variant="info-top">
                                                        <span className="line-clamp-1">{flashcard ? flashcard.name : `Unknown (ID: ${id})`}</span>
                                                      </Tooltip>
                                                    </div>
                                                  </a>
                                                )}
                                              </Draggable>
                                            );
                                          })}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </Disclosure.Panel>
                                </Transition>
                              </>
                            )}
                          </Disclosure>
                        ))}
                      </div>
                    </DragDropContext>
                  )}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      </div>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={5000}
        />
      ))}
      {selectedCardIndex !== null && flashcards[selectedCardIndex] && (
        <FlashcardModal
          flashcard={flashcards[selectedCardIndex]}
          closeCard={closeCard}
          prevCard={prevCard}
          nextCard={nextCard}
          handleStatusTransition={handleStatusTransition}
          getStatusLabel={getStatusLabel}
          getNextStatus={getNextStatus}
          getStatusBackgroundClass={getStatusBackgroundClass}
          getStatusBorderClass={getStatusBorderClass}
          isFlipped={isFlipped}
          flipCard={flipCard}
          flashcards={flashcards}
          currentPlanId={currentPlanId}
        />
      )}
    </div>
  );
}