'use client';
import { useState, useEffect, useCallback, useContext } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { PlusIcon, CheckIcon, XMarkIcon, ChevronDownIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Listbox } from '@headlessui/react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@supabase/supabase-js';
import Tooltip from '@/components/Tooltip';
//import HelpModal from './HelpModal';
import { cn } from '../../utils/cn';
import { PlannerContext } from '../../lib/context';
import { Flashcard, PlanFlashcard } from '../../lib/types';
import Button from '@/ui/Button';
import DisclosureButton from '@/ui/DisclosureButton';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Plan {
  id: string;
  name: string;
  start_date: string;
  end_date?: string | null;
  flashcard_ids: number[];
  status: string;
  user_id: string;
}

interface CardSyncPlannerProps {
  userId: string | null;
  onError: (error: string) => void;
  flashcards: Flashcard[];
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
}: CardSyncPlannerProps) {
  const { newPlanFlashcardIds, setNewPlanFlashcardIds } = useContext(PlannerContext);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(periods[0]);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [openPlanId, setOpenPlanId] = useState<string | null>(null);
  //const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  useEffect(() => {
    console.log('CardSyncPlanner rendered:', { userId, plansLength: plans.length, flashcardsLength: flashcards.length, newPlanFlashcardIds });
  }, [userId, plans, flashcards, newPlanFlashcardIds]);

 const fetchPlans = useCallback(async (): Promise<Plan[]> => {
  if (!userId) {
    setLoading(false);
    return [];
  }
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('ai_card_sync_planner')
      .select('id, name, start_date, end_date, flashcard_ids, status, user_id')
      .eq('user_id', userId) as { data: Plan[] | null; error: any }; // Type assertion
    if (error) {
      throw new Error('Failed to fetch plans: ' + error.message);
    }
    const validPlans = (data || []).map((plan) => ({
      ...plan,
      flashcard_ids: [...new Set(plan.flashcard_ids.filter((id) =>
        flashcards.some((f) => f.id === id)
      ))] as number[], // Ensure flashcard_ids is number[]
    }));
    return validPlans;
  } catch (error: any) {
    onError(error.message || 'Failed to fetch plans.');
    console.error('Fetch plans error:', error);
    return [];
  } finally {
    setLoading(false);
  }
}, [userId, onError, flashcards]);

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
    const today = new Date();
    const startDate = new Date(plan.start_date);
    const endDate = plan.end_date ? new Date(plan.end_date) : startDate;
    if (endDate < today) return 'bg-red-50 text-red-700 hover:bg-red-100 ring-red-700';
    if (endDate.toDateString() === today.toDateString()) return 'bg-yellow-50 text-yellow-700 ring-yellow-700 hover:bg-yellow-100';
    return 'bg-green-50 text-green-700 ring-green-700 hover:bg-green-100';
  }, []);

  const handleCreatePlan = useCallback(async () => {
    if (!userId || newPlanFlashcardIds.length === 0) {
      console.log('handleCreatePlan failed: No flashcards selected or no userId', { userId, newPlanFlashcardIds });
      onError('Please select at least one flashcard');
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
      console.log('Creating plan with flashcard_ids:', newPlanFlashcardIds.map((f) => f.id));
      const { error } = await supabase.from('ai_card_sync_planner').insert({
        user_id: userId,
        name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate ? endDate.toISOString().split('T')[0] : null,
        flashcard_ids: newPlanFlashcardIds.map((f) => f.id),
        status: 'active',
      });

      if (error) {
        throw new Error('Failed to create plan: ' + error.message);
      }

      setNewPlanFlashcardIds([]);
      setIsCreatingPlan(false);
      setSelectedPeriod(periods[0]);
      setCustomStartDate(null);
      setCustomEndDate(null);

      const data = await fetchPlans();
      setPlans(data);
    } catch (error: any) {
      onError(error.message || 'Failed to create plan.');
      console.error('Create plan error:', error);
    }
  }, [userId, newPlanFlashcardIds, selectedPeriod, customStartDate, customEndDate, onError, fetchPlans]);

  const handleMarkDone = useCallback(async (plan: Plan) => {
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
    } catch (error: any) {
      onError(error.message || 'Failed to mark plan as done.');
      console.error('Mark done error:', error);
    }
  }, [flashcards, userId, onError]);

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
      } catch (error: any) {
        onError(error.message || 'Failed to remove flashcard from plan.');
        console.error('Remove flashcard error:', error);
      }
    },
    [plans, onError]
  );

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;
      const sourcePlanId = result.source.droppableId;
      const destPlanId = result.destination.droppableId;
      if (sourcePlanId === destPlanId) return;

      const sourcePlan = plans.find((p) => p.id === sourcePlanId);
      const destPlan = plans.find((p) => p.id === destPlanId);
      if (!sourcePlan || !destPlan) return;

      const flashcardId = parseInt(result.draggableId.split('-')[1]);
      const flashcard = flashcards.find((f) => f.id === flashcardId);
      if (!flashcard) {
        console.warn(`Flashcard with id ${flashcardId} not found during drag`);
        return;
      }

      if (destPlan.flashcard_ids.includes(flashcardId)) {
        onError(`Flashcard "${flashcard.name}" is already in the destination plan.`);
        return;
      }

      const updatedSourceFlashcardIds = sourcePlan.flashcard_ids.filter((id) => id !== flashcardId);
      const updatedDestFlashcardIds = [...destPlan.flashcard_ids, flashcardId];

      try {
        const { error: sourceError } = await supabase
          .from('ai_card_sync_planner')
          .update({ flashcard_ids: updatedSourceFlashcardIds })
          .eq('id', sourcePlanId);

        const { error: destError } = await supabase
          .from('ai_card_sync_planner')
          .update({ flashcard_ids: updatedDestFlashcardIds })
          .eq('id', destPlanId);

        if (sourceError || destError) {
          throw new Error('Failed to move flashcard between plans: ' + (sourceError || destError)?.message);
        }

        setPlans((prev) =>
          prev.map((p) =>
            p.id === sourcePlanId
              ? { ...p, flashcard_ids: updatedSourceFlashcardIds }
              : p.id === destPlanId
              ? { ...p, flashcard_ids: updatedDestFlashcardIds }
              : p
          )
        );
      } catch (error: any) {
        onError(error.message || 'Failed to move flashcard between plans.');
        console.error('Drag end error:', error);
      }
    },
    [plans, flashcards, onError]
  );

  const truncateName = useCallback((name: string) => {
    return name.split(' ').slice(0, 3).join(' ') + (name.split(' ').length > 3 ? '...' : '');
  }, []);

  const handleDisclosureToggle = (planId: string) => {
    setOpenPlanId((prev) => (prev === planId ? null : planId));
  };

  const handleNewPlanClick = () => {
    setOpenPlanId(null); // Close all plan panels
    setIsCreatingPlan(true);
  };

  return (
    <div className="relative  ">
      <div className="block items-center justify-between sm:py-0 py-16 ">
        <Disclosure defaultOpen>
          {({ open }) => (
            <div>
              <div className="mt-1 flex items-center justify-between mb-4 ">
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
                <Disclosure.Panel className=" w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl sm:min-h-[700px] sm:max-h-[700px] overflow-y-auto pb-16 ">
                  {loading ? (
                    <div className="text-gray-700">Loading...</div>
                  ) : (
                    <>
                      <DragDropContext onDragEnd={handleDragEnd}>
{plans.map((plan) => (
  <Disclosure
    key={plan.id}
    as="div"
    className="mb-4"
    defaultOpen={openPlanId === plan.id} // Use defaultOpen instead of open
  >
    {({ open }) => (
      <>
        <DisclosureButton
        variant='card-sync-planner'
          className={cn(
            "flex justify-between items-center py-1 space-x-4",
            getPlanStyles(plan)
          )}
          onClick={() => handleDisclosureToggle(plan.id)} // Change "Contract" 
        >
            <span className="font-bold">Contract</span> 
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
              <Button
                variant="outline"
                onClick={() => handleMarkDone(plan)}
                disabled={plan.status === 'done'}
              >
                Mark Done
              </Button>
            </div>
            <Droppable droppableId={plan.id}>
              {(provided) => (
                <div
                  className="mt-2"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {plan.flashcard_ids.length === 0 && (
                    <p className="text-gray-500">No flashcards in this plan</p>
                  )}
                  {plan.flashcard_ids.map((id, index) => {
                    const flashcard = flashcards.find((f) => f.id === id);
                    return (
                      <Draggable key={`${plan.id}-${id}`} draggableId={`${plan.id}-${id}`} index={index}>
                        {(provided) => (
                          <div
                            className="inline-flex items-center gap-1 px-2 py-1 m-1 rounded-full bg-gray-100 text-gray-800 text-xs"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                const index = flashcards.findIndex((f) => f.id === id);
                                if (index !== -1) {
                                  console.log('Open flashcard:', id);
                                  // TODO: Implement openCard callback
                                }
                              }}
                              className="hover:underline"
                            >
                              {flashcard ? truncateName(flashcard.name) : `Unknown (ID: ${id})`}
                            </a>
                            <button
                              onClick={() => handleRemoveFlashcard(plan.id, id)}
                              className="p-1 rounded-full hover:bg-red-200"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
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
                      </DragDropContext>
                      {isCreatingPlan && (
                        <div className="mt-4 p-4 bg-white border-2 border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Listbox value={selectedPeriod} onChange={setSelectedPeriod}>
                              <div className="relative flex-1">
                                <Listbox.Button>     
                                    <Button
                                  variant='outline'
                                  >
                                  <span>{selectedPeriod.label}</span>
                                  <ChevronDownIcon className="ml-2 h-3 w-3" />
                                  </Button>
                                </Listbox.Button>
                                <Transition
                                  enter="transition ease-out duration-100"
                                  enterFrom="opacity-0 scale-95"
                                  enterTo="opacity-100 scale-100"
                                  leave="transition ease-in duration-75"
                                  leaveFrom="opacity-100 scale-100"
                                  leaveTo="opacity-0 scale-95"
                                >
                            <Listbox.Options className="absolute w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto z-10">
                            {periods.map((period) => (
                                <Listbox.Option
                                key={period.value}
                                value={period}
                                className={({ active, selected }) =>
                                    cn(
                                    'relative cursor-pointer select-none py-2 px-4',
                                    active ? 'bg-sky-100 text-sky-900' : 'text-gray-700',
                                    selected ? 'bg-sky-50 font-semibold' : ''
                                    )
                                }
                                >
                                {({ selected }) => (
                                    <div className="flex items-center justify-between text-sm">
                                    <span>{period.label}</span>
                                    {selected && <CheckIcon className="h-5 w-5 text-sky-500" aria-hidden="true" />}
                                    </div>
                                )}
                                </Listbox.Option>
                            ))}
                            </Listbox.Options>
                                </Transition>
                              </div>
                            </Listbox>
                            <Button
                              onClick={handleCreatePlan}

                            >
                              Save
                            </Button>
                            <Button
                            variant='outline'
                              onClick={() => {
                                setIsCreatingPlan(false);
                                setNewPlanFlashcardIds([]);
                                setSelectedPeriod(periods[0]);
                                setCustomStartDate(null);
                                setCustomEndDate(null);
                              }}
                                      >
                              Cancel
                            </Button>
                          </div>
                          {selectedPeriod.value === 'custom' && (
                            <div className="flex gap-2 mt-2">
                              <input
                                type="date"
                                value={customStartDate || ''}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-md"
                              />
                              <input
                                type="date"
                                value={customEndDate || ''}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="w-full p-2 border border-gray-200 rounded-md"
                              />
                            </div>
                          )}
                          <div className="mt-2">
                            {newPlanFlashcardIds.length === 0 && (
                              <p className="text-gray-500">No flashcards selected</p>
                            )}
                            {newPlanFlashcardIds.map((pf) => {
                              const flashcard = flashcards.find((f) => f.id === pf.id);
                              return (
                                <div
                                  key={pf.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 m-1 rounded-full bg-gray-100 text-gray-800 text-xs"
                                >
                                  <span>{flashcard ? truncateName(flashcard.name) : `Unknown (ID: ${pf.id})`}</span>
                                  <button
                                    onClick={() => setNewPlanFlashcardIds(newPlanFlashcardIds.filter((f) => f.id !== pf.id))}
                                    className="p-1 rounded-full hover:bg-red-200"
                                  >
                                    <XMarkIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="absolute sm:bottom-8 sm:right-4 right-2 mt-4  gap-4">
                        <div className='text-center'>
                        <Button
                          onClick={handleNewPlanClick}
                          
                                         >
                          <PlusIcon className="mr-2 h-5 w-5" />
                          New Plan
                        </Button>
                      </div>
                      </div>
                    </>
                  )}
                </Disclosure.Panel>
              </Transition>
            </div>
          )}
        </Disclosure>
      
      </div>
    </div>
  );
}