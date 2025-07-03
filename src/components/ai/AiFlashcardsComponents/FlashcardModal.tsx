import React, { useState } from 'react';
import { XMarkIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { cn } from '../../../utils/cn';
import { Flashcard } from '../../../lib/types'; // Import from types.ts

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
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (flashcard: Flashcard) => {
    setIsSaved(true);
    handleStatusTransition(flashcard);

    // Reset "Saved!" message and move to next card after 1.5 seconds
    setTimeout(() => {
      setIsSaved(false);
      if (flashcards.length > 1) {
        nextCard();
      }
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80 p-4 sm:p-6"
      onClick={closeCard}
    >
      <div
        className={cn(
          'relative w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] rounded-xl shadow-2xl bg-white transform transition-all duration-300 overflow-hidden',
          getStatusBackgroundClass(flashcard.status),
          getStatusBorderClass(flashcard.status),
          { 'rotate-y-180': isFlipped }
        )}
        style={{ transformStyle: 'preserve-3d', touchAction: 'pan-y' }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={flipCard}
        onTouchStart={(e) => e.stopPropagation()}
      >
        <div className="relative flex flex-col h-full max-h-[90vh] touch-pan-y">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {!isFlipped ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-gray-100 text-gray-600 mb-2 sm:mb-3">
                  {flashcard.topic || 'No Topic'}
                </span>
                <p className="text-sm sm:text-base text-gray-600 mb-2">{flashcard.section || 'No Section'}</p>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 whitespace-normal px-2">
                  {flashcard.name || 'Untitled'}
                </h2>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-start min-h-[400px] text-center transform rotate-y-180">
                <div className="py-16 space-y-3 w-full">
                  {(flashcard.messages || []).map((msg, index) => (
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

          {/* Control Buttons */}
          <button
            onClick={closeCard}
            className="cursor-pointer absolute top-3 right-3 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={flipCard}
            className="cursor-pointer absolute top-3 left-3 p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            aria-label="Flip card"
          >
            <ArrowPathIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          {/* Navigation and Status Controls */}
          <div className="flex justify-between items-center p-4 sm:p-6 border-t border-gray-200 bg-white">
            <button
              onClick={prevCard}
              className="cursor-pointer p-2 rounded-full text-sky-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={flashcards.length <= 1}
              aria-label="Previous card"
            >
              <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {isSaved ? (
              <span className="px-3 py-1.5 rounded-full text-sm sm:text-base font-medium text-teal-600 bg-teal-100">
                Saved!
              </span>
            ) : (
              <button
                onClick={() => handleSave(flashcard)}
                className="cursor-pointer px-3 py-1.5 rounded-full text-sm sm:text-base font-medium text-sky-600 hover:bg-gray-100 transition-colors"
              >
                {['suspended', 'lapsed', 'mastered'].includes(flashcard.status || '') ? (
                  <span>Save to Learning</span>
                ) : (
                  <span>Save to {getStatusLabel(getNextStatus(flashcard.status))}</span>
                )}
              </button>
            )}

            <button
              onClick={nextCard}
              className="cursor-pointer p-2 rounded-full text-sky-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={flashcards.length <= 1}
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