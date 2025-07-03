// ChatHistoryList.tsx
import React, { useState, useEffect, useRef } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import Tooltip from '@/components/Tooltip';
import { cn } from '../../../utils/cn';
import Loading from '@/ui/Loading';
import Button from '@/ui/Button';
import { PlusIcon } from 'lucide-react';

interface ChatHistory {
  id: number;
  user_id: string;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  is_default_flashcard: boolean;
}

interface ChatHistoryListProps {
  histories: ChatHistory[];
  openHistory: (index: number) => void;
  openEditModal: (history: ChatHistory) => void;
  deleteChatHistory: (historyId: number) => void;
  createFlashcard: (historyId: number) => void;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  hasMore: boolean;
  totalHistories: number;
  loading: boolean;
  creatingFlashcard: boolean; // New prop
}

export default function ChatHistoryList({
  histories,
  openHistory,
  openEditModal,
  deleteChatHistory,
  createFlashcard,
  page,
  setPage,
  hasMore,
  totalHistories,
  loading,
  creatingFlashcard,
}: ChatHistoryListProps) {
  const historiesPerPage = 3;
  const visibleHistories = histories.slice(0, page * historiesPerPage);
  const [containerHeight, setContainerHeight] = useState(400);
  const cardRef = useRef<HTMLLIElement>(null);
  const [cardHeight, setCardHeight] = useState(88);

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
        className="overflow-y-auto rounded-md bg-white ring-2 ring-gray-200 p-3 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100"
        style={{ height: `${containerHeight}px` }}
      >
        {loading || creatingFlashcard ? (
          <div
            className="flex items-center justify-center text-gray-500 text-sm"
            style={{ height: `${containerHeight}px` }}
          >
            <Loading />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-y-2 divide-y divide-gray-100">
            {visibleHistories.map((history, index) => (
              <li
                key={history.id}
                ref={index === 0 ? cardRef : null}
                className="shadow-lg my-1 rounded-xl group cursor-pointer border-2 border-gray-200 transform transition-transform hover:scale-[1.02] hover:shadow-sm"
                onClick={() => openHistory(index)}
              >
                <div className="flex flex-col py-2 px-2 hover:bg-sky-50 hover:text-sky-900 min-h-[80px]">
                  <div className="flex justify-between items-center gap-2 p-1">
                    <span className="text-sm font-light text-gray-600">
                      {history.updated_at
                        ? format(new Date(history.updated_at), 'HH:mm:ss, dd MMMM yyyy')
                        : 'N/A'}
                    </span>
                  </div>
                  <span className="text-base font-semibold text-gray-900 line-clamp-2 mt-2 p-1">
                    {history.name || 'Untitled'}
                  </span>
                  <div className="bottom-0 flex justify-between flex-col md:flex-row md:items-center gap-2 mt-3">

                    <div className='hidden space-x-2 sm:flex opacity-0 group-hover:opacity-100 transition-opacity'>
                     
                        <Button
                        title='Edit Chat History'
                        variant="badge_primary_circle"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(history);
                          }}
                                     >
                          <PencilIcon className="h-3 w-3" />
                        </Button>
                   
                   
                        <Button
                        title="Delete Chat History"
                        variant="badge_primary_circle"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChatHistory(history.id);
                          }}
                          className="cursor-pointer bg-gray-100 text-gray-600 p-2 rounded-full disabled:bg-gray-200 hover:bg-red-300 hover:shadow-md transition-all"
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                  
                      </div>
                      <div className="flex items-center gap-2">
                   
                        <Button
                          title="Create Flashcard"
                          variant="badge_primary_circle"
                          onClick={(e) => {
                            e.stopPropagation();
                            createFlashcard(history.id);
                          }}
                          
                          disabled={creatingFlashcard} // Disable button during creation
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </Button>
                     
                    </div>
                  </div>
                </div>
              </li>
            ))}
            {visibleHistories.length < historiesPerPage && visibleHistories.length < totalHistories && !loading && (
              <div
                className="flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-50 border-2 border-dashed border-gray-200 rounded-md"
                style={{ height: `${containerHeight - visibleHistories.length * cardHeight - 24}px` }}
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
                {visibleHistories.length === 0
                  ? 'No chat histories match the current filters'
                  : 'More chat histories available, click Load More'}
              </div>
            )}
          </ul>
        )}
      </div>
      <div className=" items-center gap-4">
                <div className="text-base font-medium text-gray-800 bg-gray-50 px-3 py-1 rounded-full">
          Showing {visibleHistories.length} of {totalHistories} chat histories
        </div>
        <div className="flex justify-between gap-4 my-4">
          <Button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading || creatingFlashcard}
            variant='outline'
                   >
            Previous
          </Button>
          <Button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasMore || loading || creatingFlashcard}
                     >
                      <PlusIcon className='w-5 h-5 mr-2' />
            {loading || creatingFlashcard ? 'Loading...' : 'Load More'}
            
          </Button>
        </div>

      </div>
    </div>
  );
}