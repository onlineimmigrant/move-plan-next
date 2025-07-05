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
  const cardRef = useRef<HTMLLIElement>(null);
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' }[]>([]);
  const toastIdRef = useRef(0);

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
      if (prev === null || prev === visibleFlashcards.length - 1) {
        if (hasMore) {
          setPage(page + 1);
          return 0;
        }
        return 0;
      }
      return prev + 1;
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
        return visibleFlashcards.length - 1;
      }
      return prev - 1;
    });
    setFlippedCards({});
  };

  const displayedFlashcards = selectedCardIndex !== null ? [visibleFlashcards[selectedCardIndex]] : visibleFlashcards;

  return (
    <div className="flex flex-col gap-4 border-gray-200">
      <div
        className="overflow-y-auto rounded-md p-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        style={{ height: `${containerHeight}px` }}
      >
        <ul className="grid grid-cols-1 gap-y-4 divide-y divide-gray-100">
          {displayedFlashcards.map((flashcard) => (
            <li
              key={flashcard.id}
              ref={cardRef}
              className={cn(
                'my-1 shadow rounded-2xl group cursor-pointer transform transition-transform hover:scale-[1.02] hover:shadow-sm relative',
                getStatusBackgroundClass(flashcard.status),
                getStatusBorderClass(flashcard.status),
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
                    <div className="flex justify-between items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-900 shadow-sm">
                        {getStatusLabel(flashcard.status || 'learning')}
                      </span>
                      <span className="text-sm font-medium text-gray-600">{flashcard.topic || 'No topic'}</span>
                    </div>
                    <span className="px-8 text-center mt-36 text-xl sm:text-2xl font-semibold text-gray-900 line-clamp-2">
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
                    <ArrowPathIcon className="h-5 w-5" />
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
        </ul>
      </div>
      <div className="flex flex-col items-between gap-4">
        <div className="flex justify-center text-base font-medium text-gray-800 px-3 py-1 rounded-full">
          <div className="flex gap-2">
            <Tooltip content="Previous Card">
              <Button
                variant="badge_primary_circle"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevCard();
                }}
                disabled={visibleFlashcards.length <= 1}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
            </Tooltip>
            <Tooltip content="Next Card">
              <Button
                variant="badge_primary_circle"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextCard();
                }}
                disabled={visibleFlashcards.length <= 1}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="flex justify-between my-2 mb-4 items-center gap-2">
          <Button
            variant="primary"
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
          >
            <span className="hidden sm:flex ml-2">Load More</span>
            <PlusIcon className="w-5 h-5 mx-2" />
            {visibleFlashcards.length} of {totalFlashcards}
          </Button>
          <Button
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleAddAllToPlannerWithToast();
            }}
            disabled={filteredFlashcards.length === 0}
            className="flex justify-between line-clamp-1"
          >
           
            Add <span>{filteredFlashcards.length} to Planner</span>
          </Button>
        </div>
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