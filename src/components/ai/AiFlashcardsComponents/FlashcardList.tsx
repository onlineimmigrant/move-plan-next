import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { cn } from '../../../utils/cn';

interface Flashcard {
  id: number;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  topic: string;
  section: string;
  user_id?: string;
  organization_id?: string;
  status?: string;
}

interface FlashcardListProps {
  flashcards: Flashcard[];
  openCard: (index: number) => void;
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
}: FlashcardListProps) {
  const cardsPerPage = 4;
  const visibleFlashcards = flashcards.slice(0, page * cardsPerPage);
  const [containerHeight, setContainerHeight] = useState(400); // Default height
  const cardRef = useRef<HTMLLIElement>(null);
  const [cardHeight, setCardHeight] = useState(88); // Default card height (80px content + 8px margins)

  useEffect(() => {
    const updateHeight = () => {
      const newHeight = Math.min(Math.max(Math.floor(window.innerHeight * 0.5), 300), 600);
      setContainerHeight(newHeight);
    };

    const updateCardHeight = () => {
      if (cardRef.current) {
        setCardHeight(cardRef.current.offsetHeight);
      }
    };

    updateHeight();
    updateCardHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('resize', updateCardHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('resize', updateCardHeight);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="overflow-y-auto rounded-md bg-white sm:ring-2 ring-gray-200 p-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        style={{ height: `${containerHeight}px` }}
      >
        <ul className="grid grid-cols-1 gap-y-4 divide-y divide-gray-100">
          {visibleFlashcards.map((flashcard, index) => (
            <li
              key={flashcard.id}
              ref={index === 0 ? cardRef : null}
              className={cn(
                'my-1 rounded-2xl min-h-48 group cursor-pointer transform transition-transform hover:scale-[1.02] hover:shadow-sm',
                getStatusBackgroundClass(flashcard.status),
                getStatusBorderClass(flashcard.status)
              )}
              onClick={() => openCard(index)}
            >
              <div className="flex flex-col py-3 px-4 hover:bg-sky-50 hover:text-sky-900 min-h-[80px]">
                <div className="flex justify-between items-center gap-2">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-900 shadow-sm">
                    {getStatusLabel(flashcard.status || 'learning')}
                  </span>
                  <span className="text-sm font-light text-gray-600">{flashcard.topic || ''}</span>
                </div>
                <span className="text-center mt-8 text-base font-semibold text-gray-900 line-clamp-2 ">
                  {flashcard.name || 'Untitled'}
                </span>
                <div className="hidden sm:flex flex-col md:flex-row md:items-center gap-2 mt-3">
                  <div className="flex flex-wrap items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {['learning', 'review', 'mastered', 'suspended', 'lapsed']
                      .filter((status) => status !== flashcard.status)
                      .map((status) => (
                        <Tooltip key={status} content={`Change to ${getStatusLabel(status)}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateFlashcardStatus(flashcard.id, !!flashcard.user_id, status);
                            }}
                            className={cn(
                              'px-2 py-1 rounded-full text-xs font-medium cursor-pointer text-gray-800 hover:bg-gray-300 flex items-center gap-1',
                              getStatusBgClass(status)
                            )}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            {getStatusLabel(status)}
                          </button>
                        </Tooltip>
                      ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {flashcard.user_id ? (
                      <>
                        <Tooltip content="Edit Flashcard">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(flashcard);
                            }}
                            className="cursor-pointer bg-gray-100 text-gray-600 p-2.5 rounded-full disabled:bg-gray-200 hover:bg-gray-300 hover:shadow-md transition-all"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        </Tooltip>
                        <Tooltip content="Delete Flashcard">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFlashcard(flashcard.id);
                            }}
                            className="cursor-pointer bg-gray-100 text-gray-600 p-2.5 rounded-full disabled:bg-gray-200 hover:bg-red-300 hover:shadow-md transition-all"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </Tooltip>
                      </>
                    ) : (
                      <div className="h-8 w-16 md:w-20" /> // Adjusted for larger buttons and layout
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
          {visibleFlashcards.length < cardsPerPage && visibleFlashcards.length < totalFlashcards && (
            <div
              className="flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-50 border-2 border-dashed border-gray-200 rounded-md"
              style={{ height: `${containerHeight - visibleFlashcards.length * cardHeight - 24}px` }}
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
              {visibleFlashcards.length === 0 ? 'No flashcards match the current filters' : 'More flashcards available, click Load More'}
            </div>
          )}
        </ul>
      </div>
      <div className="mt-4 flex flex-col items-center gap-4">
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setPage(Math.max(page - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:bg-gray-300 shadow-md"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors disabled:bg-gray-300 shadow-md"
          >
            Load More
          </button>
        </div>
        <div className="text-base font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-full">
          Showing {visibleFlashcards.length} of {totalFlashcards} flashcards
        </div>
      </div>
    </div>
  );
}