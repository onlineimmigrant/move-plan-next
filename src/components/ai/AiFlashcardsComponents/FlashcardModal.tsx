'use client';
import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../utils/cn';
import { Flashcard } from '../../../lib/types';
import { createClient } from '@supabase/supabase-js';
import Button from '@/ui/Button';
import Tooltip from '@/components/Tooltip';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FlashcardModalProps {
  flashcard: Flashcard;
  closeCard: () => void;
  prevCard: () => void;
  nextCard: () => void;
  handleStatusTransition: (flashcard: Flashcard) => void;
  getStatusLabel: (status: string) => string;
  getNextStatus: (status?: string) => string;
  getStatusBackgroundClass: (status?: string) => string;
  getStatusBorderClass: (status?: string) => string;
  isFlipped: boolean;
  flipCard: () => void;
  flashcards: Flashcard[];
  currentPlanId: string | null;
}

export default function FlashcardModal({
  flashcard,
  closeCard,
  prevCard,
  nextCard,
  handleStatusTransition,
  getStatusLabel,
  getNextStatus,
  getStatusBackgroundClass,
  getStatusBorderClass,
  isFlipped,
  flipCard,
  flashcards,
  currentPlanId,
}: FlashcardModalProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [localIsFlipped, setLocalIsFlipped] = useState(isFlipped);
  const [currentFlashcardId, setCurrentFlashcardId] = useState(flashcard.id);
  const [planInfo, setPlanInfo] = useState<{ label: string; name: string } | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [filteredFlashcardIds, setFilteredFlashcardIds] = useState<number[]>([]);
  const [filterMessage, setFilterMessage] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [statusCounts, setStatusCounts] = useState<{ [key: string]: number }>({
    all: 0,
    learning: 0,
    review: 0,
    mastered: 0,
    suspended: 0,
    lapsed: 0,
  });

  // Status options for filtering
  const statusOptions = ['all', 'learning', 'review', 'mastered', 'suspended', 'lapsed'];

  // Sync localIsFlipped with prop
  useEffect(() => {
    setLocalIsFlipped(isFlipped);
  }, [isFlipped]);

  // Fetch plan info and initialize filtered flashcard IDs
  useEffect(() => {
    const fetchPlanInfo = async () => {
      if (!currentPlanId) {
        setPlanInfo(null);
        setFilteredFlashcardIds(flashcards.map((f) => f.id));
        console.log('Initialized filteredFlashcardIds (no plan):', flashcards.map((f) => f.id));
        if (flashcards.length > 0 && !flashcards.some((f) => f.id === currentFlashcardId)) {
          console.log('Setting currentFlashcardId to first flashcard ID:', flashcards[0].id);
          setCurrentFlashcardId(flashcards[0].id);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ai_card_sync_planner')
          .select('label, name, flashcard_ids')
          .eq('id', currentPlanId)
          .single();
        if (error) {
          console.error(`Failed to fetch plan info for ID ${currentPlanId}: ${error.message}`);
          setPlanInfo(null);
          setFilteredFlashcardIds([]);
          setFilterMessage('Failed to load plan data');
        } else {
          setPlanInfo({ label: data.label || 'Plan', name: data.name });
          const planFlashcardIds = data.flashcard_ids || [];
          const validIds = planFlashcardIds.filter((id: number) =>
            flashcards.some((f) => f.id === id)
          );
          setFilteredFlashcardIds(validIds);
          console.log('Initialized filteredFlashcardIds:', validIds);
          if (validIds.length > 0 && !validIds.includes(currentFlashcardId)) {
            console.log('Setting currentFlashcardId to first valid ID:', validIds[0]);
            setCurrentFlashcardId(validIds[0]);
          }
        }
      } catch (error: any) {
        console.error('Fetch plan info error:', error);
        setPlanInfo(null);
        setFilteredFlashcardIds([]);
        setFilterMessage('Error loading plan data');
      }
    };
    fetchPlanInfo();
  }, [currentPlanId, flashcards, currentFlashcardId]);

  // Update filtered flashcard IDs and status counts when status or plan changes
  useEffect(() => {
    const updateFilteredFlashcards = async () => {
      setIsFiltering(true);
      setFilterMessage(null);
      let validIds: number[] = [];

      if (currentPlanId) {
        try {
          const { data, error } = await supabase
            .from('ai_card_sync_planner')
            .select('flashcard_ids')
            .eq('id', currentPlanId)
            .single();
          if (error) {
            console.error(`Failed to fetch flashcard_ids for plan ${currentPlanId}: ${error.message}`);
            setFilteredFlashcardIds([]);
            setFilterMessage('Failed to load plan flashcards');
            setIsFiltering(false);
            return;
          }
          validIds = (data.flashcard_ids || []).filter((id: number) =>
            flashcards.some((f) => f.id === id)
          );
        } catch (error: any) {
          console.error('Filter error:', error);
          setFilteredFlashcardIds([]);
          setFilterMessage('Error loading plan flashcards');
          setIsFiltering(false);
          return;
        }
      } else {
        validIds = flashcards.map((f) => f.id);
      }

      // Calculate status counts
      const counts: { [key: string]: number } = {
        all: validIds.length,
        learning: 0,
        review: 0,
        mastered: 0,
        suspended: 0,
        lapsed: 0,
      };
      validIds.forEach((id) => {
        const f = flashcards.find((f) => f.id === id);
        if (f?.status) {
          counts[f.status] = (counts[f.status] || 0) + 1;
        } else {
          counts.learning = (counts.learning || 0) + 1; // Default to 'learning' if status is undefined
        }
      });
      setStatusCounts(counts);

      if (selectedStatus === 'all') {
        setFilteredFlashcardIds(validIds);
        console.log('Filtered IDs (all):', validIds);
        if (validIds.length > 0 && !validIds.includes(currentFlashcardId)) {
          console.log('Setting currentFlashcardId to first valid ID (all):', validIds[0]);
          setIsSaved(false);
          setLocalIsFlipped(false);
          setCurrentFlashcardId(validIds[0]);
        }
      } else {
        const filteredIds = validIds.filter((id: number) => {
          const f = flashcards.find((f) => f.id === id);
          return f?.status === selectedStatus;
        });
        setFilteredFlashcardIds(filteredIds);
        console.log(`Filtered IDs (${selectedStatus}):`, filteredIds);
        if (filteredIds.length === 0) {
          setFilterMessage(`No flashcards with status "${getStatusLabel(selectedStatus)}"`);
        } else if (!filteredIds.includes(currentFlashcardId)) {
          console.log('Setting currentFlashcardId to first filtered ID:', filteredIds[0]);
          setIsSaved(false);
          setLocalIsFlipped(false);
          setCurrentFlashcardId(filteredIds[0]);
        }
      }
      setIsFiltering(false);
    };
    updateFilteredFlashcards();
  }, [selectedStatus, currentPlanId, flashcards, getStatusLabel, currentFlashcardId]);

  const handleSave = (currentFlashcard: Flashcard) => {
    setIsSaved(true);
    handleStatusTransition(currentFlashcard);
    console.log('Status updated for flashcard:', currentFlashcard.id);
    setTimeout(() => {
      setIsSaved(false);
      if (filteredFlashcardIds.length > 1) {
        console.log('Triggering navigation to next card after status update');
        handleNextCard();
      }
    }, 1500);
  };

  // Check if navigation should be disabled
  const isNavigationDisabled = filteredFlashcardIds.length <= 1;

  // Navigation handlers
  const handlePrevCard = () => {
    if (isNavigationDisabled || isFiltering) return;
    const currentIndex = filteredFlashcardIds.indexOf(currentFlashcardId);
    const prevIndex = currentIndex === 0 ? filteredFlashcardIds.length - 1 : currentIndex - 1;
    const prevFlashcardId = filteredFlashcardIds[prevIndex];
    console.log('Navigating to prev card:', prevFlashcardId);
    setIsSaved(false);
    setLocalIsFlipped(false);
    setCurrentFlashcardId(prevFlashcardId);
    prevCard();
  };

  const handleNextCard = () => {
    if (isNavigationDisabled || isFiltering) return;
    const currentIndex = filteredFlashcardIds.indexOf(currentFlashcardId);
    const nextIndex = currentIndex === filteredFlashcardIds.length - 1 ? 0 : currentIndex + 1;
    const nextFlashcardId = filteredFlashcardIds[nextIndex];
    console.log('Navigating to next card:', nextFlashcardId);
    setIsSaved(false);
    setLocalIsFlipped(false);
    setCurrentFlashcardId(nextFlashcardId);
    nextCard();
  };

  // Get the current flashcard based on currentFlashcardId
  const currentFlashcard = flashcards.find((f) => f.id === currentFlashcardId) || flashcard;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white bg-opacity-80 p-4 sm:p-6"
      onClick={closeCard}
    >
      {/* Plan Label, Name, and Status Filters */}
      {planInfo && (
        <div className="fixed top-4 left-0 right-0 z-60 items-center gap-2">
          <div className="mb-2 sm:mb-4 px-4 sm:px-0 flex mx-auto max-w-xl items-center justify-between sm:justify-center text-base gap-8">
            <Tooltip content="Plan" variant='bottom'>
              <span className="font-bold text-gray-900">
                {planInfo.label.length > 12 ? planInfo.label.slice(0, 12) + '...' : planInfo.label}
              </span>
            </Tooltip>
            <Tooltip content="Dates To-Do" variant='bottom'>
              <span className="font-medium text-gray-400">{planInfo.name}</span>
            </Tooltip>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {statusOptions.map((status) => (
              <Button
                variant="badge_primary"
                key={status}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Clicked status:', status);
                  setSelectedStatus(status);
                }}
                className={cn(
                  'inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-900 shadow-sm',
                  selectedStatus === status ? 'bg-sky-100 text-sky-800' : 'hover:bg-sky-50'
                )}
                aria-label={`Filter by ${getStatusLabel(status)}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                {getStatusLabel(status)}
                <span
                  className={cn(
                    'flex items-center justify-center h-5 w-5 rounded-full text-xs font-semibold',
                    selectedStatus === status ? 'bg-sky-200 text-sky-900' : 'bg-gray-200 text-gray-800'
                  )}
                >
                  {statusCounts[status]}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
      <div
        className={cn(
          'relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-xl max-h-[90vh] rounded-xl shadow-2xl bg-white transform transition-all duration-300 overflow-hidden',
          getStatusBackgroundClass(currentFlashcard.status),
          getStatusBorderClass(currentFlashcard.status),
          { 'rotate-y-180': localIsFlipped }
        )}
        style={{ transformStyle: 'preserve-3d', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={flipCard}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-col h-full max-h-[90vh] touch-pan-y">
          {/* Close and Flip Buttons */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 bg-white">
            <button
              onClick={flipCard}
              className="z-10 cursor-pointer p-2 rounded-full bg-white text-sky-600 hover:bg-gray-100 transition-colors shadow-sm"
              aria-label="Flip card"
            >
              <ArrowPathIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <button
              onClick={closeCard}
              className="z-10 cursor-pointer p-2 rounded-full bg-white text-sky-600 hover:bg-gray-100 transition-colors shadow-sm"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-[420px] p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {filterMessage ? (
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-sm font-medium text-gray-600">{filterMessage}</span>
              </div>
            ) : !localIsFlipped ? (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="flex justify-between items-center gap-2 w-full">
                  <Button variant="badge_primary" className="bg-sky-50">
                    {getStatusLabel(currentFlashcard.status || 'learning')}
                  </Button>
                  <span className="text-base font-medium text-gray-600">{currentFlashcard.topic || 'No topic'}</span>
                </div>
                <span className="px-8 text-center mt-36 text-xl sm:text-2xl font-semibold text-gray-900 line-clamp-2">
                  {currentFlashcard.name || 'Untitled'}
                </span>
                <span className="text-base font-medium text-gray-600 mt-2">{currentFlashcard.section || 'No section'}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-start min-h-[400px] text-center transform rotate-y-180">
                <div className="py-16 space-y-3 w-full">
                  {(currentFlashcard.messages || []).map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <span
                        className={cn(
                          'inline-block p-3 sm:p-4 rounded-lg max-w-[85%] text-sm sm:text-base',
                          msg.role === 'user' ? 'bg-sky-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                        )}
                        dangerouslySetInnerHTML={{
                          __html: msg.content.replace(/\n/g, '<br>'),
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Navigation and Status Controls */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-t border-gray-200 bg-white">
            <button
              onClick={handlePrevCard}
              className="cursor-pointer p-2 rounded-full text-sky-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isNavigationDisabled || isFiltering}
              aria-label="Previous card"
            >
              <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            {isSaved ? (
              <span className="px-3 py-1.5 rounded-full text-sm sm:text-base font-medium text-sky-600 bg-sky-50">
                Saved!
              </span>
            ) : (
              <Button
                variant="badge_primary"
                onClick={() => handleSave(currentFlashcard)}
                className="py-2"
              >
                {['suspended', 'lapsed', 'mastered'].includes(currentFlashcard.status || '') ? (
                  <span>Reverse to Learning</span>
                ) : (
                  <span>Update to {getStatusLabel(getNextStatus(currentFlashcard.status))}</span>
                )}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </Button>
            )}
            <button
              onClick={handleNextCard}
              className="cursor-pointer p-2 rounded-full text-sky-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isNavigationDisabled || isFiltering}
              aria-label="Next card"
            >
              <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}