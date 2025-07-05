'use client';
import { useState, useEffect, useRef, useContext } from 'react';
import { PencilIcon, TrashIcon, CalendarIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import Toast from '@/components/Toast';
import { cn } from '../../../utils/cn';
import { Flashcard, PlanFlashcard } from '../../../lib/types';
import { PlannerContext } from '../../../lib/context';
import Button from '@/ui/Button';

interface FlashcardListProps {
  flashcards: Flashcard[];
  openCard: (flashcardId: number) => void;
  openEditModal: (flashcard: Flashcard) => void;
  deleteFlashcard: (flashcardId: number) => void;
  updateFlashcardStatus: (flashcardId: number, isUserFlashcard: boolean, newStatus: string) => void;
  getStatusLabel: (status: string) => string;
  getStatusBgClass: (status?: string) => string;
  getStatusBorderClass: (status?: string) => string;
  getStatusBackgroundClass: (status?: string) => string;
  page: number;
  setPage: (page: number) => void;
  hasMore: boolean;
  totalFlashcards: number;
  handleAddAllToPlanner: () => void;
  filteredFlashcards: Flashcard[];
  onError: (error: string) => void;
  setFlashcards: (flashcards: Flashcard[]) => void;
}

export default function FlashcardList({
  flashcards,
  openCard,
  openEditModal,
  deleteFlashcard,
  updateFlashcardStatus,
  getStatusLabel,
  getStatusBgClass,
  getStatusBorderClass,
  getStatusBackgroundClass,
  page,
  setPage,
  hasMore,
  totalFlashcards,
  handleAddAllToPlanner,
  filteredFlashcards,
  onError,
  setFlashcards,
}: FlashcardListProps) {
  const { addFlashcardToPlanner, newPlanFlashcardIds } = useContext(PlannerContext);
  const cardsPerPage = 4;
  const visibleFlashcards = flashcards.slice(0, page * cardsPerPage);
  const [containerHeight, setContainerHeight] = useState(400);
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const toastIdRef = useRef(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      const newHeight = Math.min(Math.max(Math.floor(window.innerHeight * 0.5), 300), 600);
      setContainerHeight(newHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  // Infinite scroll effect for multi-card view
  useEffect(() => {
    if (!sentinelRef.current || !hasMore || selectedCardIndex !== null) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current && sentinelRef.current) {
        observerRef.current.unobserve(sentinelRef.current);
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, page, setPage, selectedCardIndex]);

  // Handle page increment when reaching the end in single-card view
  useEffect(() => {
    if (
      selectedCardIndex !== null &&
      selectedCardIndex >= visibleFlashcards.length - 1 &&
      hasMore
    ) {
      setPage(page + 1);
    }
  }, [selectedCardIndex, visibleFlashcards.length, hasMore, page, setPage]);

  // Reset selectedCardIndex if it becomes invalid due to flashcards changes
  useEffect(() => {
    if (
      selectedCardIndex !== null &&
      (selectedCardIndex >= visibleFlashcards.length || visibleFlashcards[selectedCardIndex] === undefined)
    ) {
      setSelectedCardIndex(visibleFlashcards.length > 0 ? visibleFlashcards.length - 1 : null);
    }
  }, [visibleFlashcards.length, selectedCardIndex]);

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const moveFlashcardToEnd = (flashcardId: number) => {
    console.log('Attempting to move flashcard to end:', flashcardId);
    const flashcardIndex = flashcards.findIndex((f) => f.id === flashcardId);
    if (flashcardIndex !== -1) {
      const flashcard = flashcards[flashcardIndex];
      const updatedFlashcards = [
        ...flashcards.filter((f) => f.id !== flashcardId),
        flashcard,
      ];
      console.log('Before setFlashcards:', updatedFlashcards.map(f => f.id));
      setFlashcards(updatedFlashcards);
      console.log('setFlashcards called with:', updatedFlashcards.map(f => f.id));
    } else {
      console.warn('Flashcard not found for ID:', flashcardId);
    }
  };

  const handleNextCard = () => {
    if (visibleFlashcards.length === 0) return;
    setSelectedCardIndex((prev) => {
      if (prev === null) {
        // From multi-card view, start at first card
        return 0;
      }
      if (prev < visibleFlashcards.length - 1) {
        // Move to next card in current page
        return prev + 1;
      }
      // If at the end, rely on useEffect to increment page if hasMore
      return prev;
    });
    setFlippedCards({});
  };

  const handleAddToPlanner = (flashcard: Flashcard) => {
    if (newPlanFlashcardIds.some((pf: PlanFlashcard) => pf.id === flashcard.id)) {
      addToast(`Flashcard "${flashcard.name || `ID: ${flashcard.id}`}" is already in the planner`, 'error');
      onError(`Flashcard "${flashcard.name || `ID: ${flashcard.id}`}" is already in the planner`);
    } else {
      addFlashcardToPlanner(flashcard.id, !!flashcard.user_id);
      addToast(`Added "${flashcard.name || `ID: ${flashcard.id}`}" to planner`, 'success');
      moveFlashcardToEnd(flashcard.id);
      handleNextCard();
    }
  };

  const handleAddAllToPlannerWithToast = () => {
    const added: number[] = [];
    const skipped: string[] = [];
    filteredFlashcards.forEach((f) => {
      if (newPlanFlashcardIds.some((pf: PlanFlashcard) => pf.id === f.id)) {
        skipped.push(f.name || `Flashcard ID: ${f.id}`);
      } else {
        addFlashcardToPlanner(f.id, !!f.user_id);
        added.push(f.id);
      }
    });
    if (added.length > 0) {
      addToast(`Added ${added.length} flashcard${added.length > 1 ? 's' : ''} to planner`, 'success');
      added.forEach((id) => moveFlashcardToEnd(id));
      handleNextCard();
    }
    if (skipped.length > 0) {
      const errorMessage = `Skipped ${skipped.length} duplicate flashcard${skipped.length > 1 ? 's' : ''}: ${skipped.join(', ')}`;
      addToast(errorMessage, 'error');
      onError(errorMessage);
    }
  };

  const toggleFlip = (flashcardId: number) => {
    setFlippedCards((prev) => ({
      ...prev,
      [flashcardId]: !prev[flashcardId],
    }));
  };

  const handlePrevCard = () => {
    if (visibleFlashcards.length === 0) return;
    setSelectedCardIndex((prev) => {
      if (prev === null || prev === 0) {
        return prev === null ? visibleFlashcards.length - 1 : 0;
      }
      return prev - 1;
    });
    setFlippedCards({});
  };

  const displayedFlashcards = selectedCardIndex !== null && visibleFlashcards[selectedCardIndex]
    ? [visibleFlashcards[selectedCardIndex]]
    : visibleFlashcards;

  return (
    <div className="flex flex-col gap-4 border-gray-200 relative">
      <div
        className="overflow-y-auto rounded-md p-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        style={{ height: `${containerHeight}px` }}
      >
        <ul className="grid grid-cols-1 gap-y-4 divide-y divide-gray-100">
          {displayedFlashcards.map((flashcard) => (
            <li
              key={flashcard.id}
              className={cn(
                'my-1 shadow rounded-2xl group cursor-pointer transform transition-transform hover:scale-[1.02] hover:shadow-sm relative',
                getStatusBackgroundClass(flashcard.status || 'learning'),
                getStatusBorderClass(flashcard.status || 'learning'),
                { 'rotate-y-180': flippedCards[flashcard.id] }
              )}
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.3s ease',
                height: `${containerHeight - 24}px`,
                overflowY: 'auto',
              }}
              onClick={() => openCard(flashcard.id)}
            >
              <div className="flex flex-col py-3 px-4 hover:opacity-95 hover:text-sky-900 min-h-full">
                {!flippedCards[flashcard.id] ? (
                  <>
                    <div className="flex justify-between items-center space-x-8">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-900 shadow-sm">
                        {getStatusLabel(flashcard.status || 'learning')}
                      </span>
                      <span className="text-base font-medium text-gray-600">{flashcard.topic || 'No topic'}</span>
                    </div>
                    <span className="px-8 text-center mt-28 sm:mt-36 text-xl sm:text-2xl font-semibold text-gray-900 line-clamp-2">
                      {flashcard.name || 'Untitled'}
                    </span>
                    <div className="hidden sm:flex flex-col justify-center md:flex-row md:items-center gap-2 mt-3">
                      <div className="flex flex-wrap items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {['learning', 'review', 'mastered', 'suspended', 'lapsed']
                          .filter((status) => status !== flashcard.status)
                          .map((status) => (
                            <Tooltip key={status} content={`Change to ${getStatusLabel(status)}`}>
                              <Button
                                variant="badge_primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateFlashcardStatus(flashcard.id, !!flashcard.user_id, status);
                                }}
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                                {getStatusLabel(status)}
                              </Button>
                            </Tooltip>
                          ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-start min-h-full text-center transform rotate-y-180">
                    <div className="py-4 space-y-3 w-full">
                      {(flashcard.messages || []).map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <span
                            className={cn(
                              'inline-block p-2 sm:p-3 rounded-lg max-w-[85%] text-sm sm:text-base',
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
                {flashcard.user_id && (
                  <div className="mt-4 hidden sm:flex space-x-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      title="Edit Flashcard"
                      variant="badge_primary_circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(flashcard);
                      }}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </Button>
                      <Button
                        title="Delete Flashcard"
                        variant="badge_primary_circle"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFlashcard(flashcard.id);
                        }}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </Button>
                    </div>
                  )}
                </div>
                <div className="p-2 bottom-2 items-center gap-2 absolute bottom-0 w-full">
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      title="Flip Flashcard"
                      variant="badge_primary_circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFlip(flashcard.id);
                      }}
                    >
                      <ArrowPathIcon className="h-5  w-5" />
                    </Button>
                    <Button
                      title="Add to Planner"
                      variant="badge_primary_circle"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPlanner(flashcard);
                      }}
                    >
                      <CalendarIcon className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
            {displayedFlashcards.length === 0 && visibleFlashcards.length < totalFlashcards && (
              <div
                className="flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-50 border-2 border-dashed border-gray-200 rounded-md"
                style={{ height: `${containerHeight - 24}px` }}
                aria-live="polite"
                role="status"
              >
                <svg
                  className="h-6 w-6 text-gray-400 mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                No flashcards match the current filters
              </div>
            )}
            {/* Sentinel element for infinite scroll */}
            {hasMore && selectedCardIndex === null && (
              <div ref={sentinelRef} className="h-1 w-full"></div>
            )}
          </ul>
        </div>
        {/* Navigation buttons positioned on the sides */}
        <div className="absolute top-1/3 -translate-y-1/2 sm:-left-16 left-0 right-0 sm:-right-16 flex justify-between px-0">
         
            <Button
            aria-label='Previous Card'
              variant="badge_primary_circle"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevCard();
              }}
              disabled={visibleFlashcards.length <= 1}
              className="shadow-md hover:shadow-lg"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </Button>
        
         
            <Button
            aria-label='Next Card'
              variant="badge_primary_circle"
              onClick={(e) => {
                e.stopPropagation();
                handleNextCard();
              }}
              disabled={visibleFlashcards.length <= 1}
              className="shadow-md hover:shadow-lg"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </Button>
         
        </div>
        <div className="flex justify-center my-2 mb-4 items-center gap-2">
          <Button
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleAddAllToPlannerWithToast();
            }}
            disabled={filteredFlashcards.length === 0}
            className=""
          >
             <PlusIcon className='w-5 h-5 mr-2' />
            {filteredFlashcards.length} to Planner
          </Button>
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
      </div>
    );
  }