
import React, { useState } from 'react';
import { XMarkIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
}: FlashcardModalProps) {
  return (
    <div
      className="m-2 fixed inset-0 z-70 flex items-center justify-center rounded-lg shadow-lg bg-gray-200 bg-opacity-50"
      onClick={closeCard}
    >
      <div
        className={cn(
          'relative w-full md:w-[28rem] h-full md:h-[28rem] rounded-lg shadow-lg transform transition-all duration-300',
          getStatusBackgroundClass(flashcard.status),
          getStatusBorderClass(flashcard.status),
          { 'rotate-y-180': isFlipped }
        )}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={flipCard}
      >
        <div className="absolute inset-0 flex flex-col p-6 py-8 overflow-y-auto">
          {!isFlipped ? (
            <div className="flex flex-col items-center justify-center flex-grow text-center">
              <p className="px-3 py-1 rounded-full text-sm font-medium text-gray-400 my-2">
                {flashcard.topic || ''}
              </p>
              <p className="text-base text-gray-600">{flashcard.section || ''}</p>
              <h2 className="text-2xl font-semibold text-gray-800 whitespace-normal">
                {flashcard.name || 'Untitled'}
              </h2>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-start flex-grow text-center overflow-y-auto transform rotate-y-180">
              <div className="space-y-2 w-full">
                {(flashcard.messages || []).map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`inline-block p-4 rounded max-w-[80%] ${
                        msg.role === 'user' ? 'bg-sky-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: msg.content.replace(/\n/g, '<br>'),
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={closeCard}
            className="absolute top-4 right-2 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <button
            onClick={flipCard}
            className="absolute top-4 left-2 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
          <button
            onClick={prevCard}
            className="p-2 rounded-full text-sky-500 text-sm font-medium hover:shadow-sm disabled:bg-gray-300 transition-colors cursor-pointer"
            disabled={flashcards.length <= 1}
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>

          <button
            onClick={() => handleStatusTransition(flashcard)}
            className="p-2 rounded-full text-sky-600 hover:bg-gray-100 cursor-pointer"
          >
            {['suspended', 'lapsed', 'mastered'].includes(flashcard.status || '') ? (
              <span className="text-sm font-medium">Change to Learning</span>
            ) : (
              <span className="text-sm font-medium">
                Change to {getStatusLabel(getNextStatus(flashcard.status))}
              </span>
            )}
          </button>

          <button
            onClick={nextCard}
            className="p-2 rounded-full text-sky-500 text-sm font-medium hover:shadow-sm disabled:bg-gray-300 transition-colors cursor-pointer"
            disabled={flashcards.length <= 1}
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
