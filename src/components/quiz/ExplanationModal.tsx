// src/components/quiz/ExplanationModal.tsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Choice, Question } from './Types';

interface ExplanationModalProps {
  question: Question;
  examMode?: boolean;
  randomizeChoices?: boolean;
  closeModal: (modalId: string, videoId?: string) => void;
  isOpen?: boolean; // New prop from QuizResults
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({
  question,
  examMode,
  randomizeChoices,
  closeModal,
  isOpen: externalIsOpen = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isOpen, setIsOpen] = useState(externalIsOpen); // Sync with external prop
  const position = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  // Center modal
  const centerModal = () => {
    if (modalContentRef.current) {
      const rect = modalContentRef.current.getBoundingClientRect();
      const x = (window.innerWidth - rect.width) / 2;
      const y = (window.innerHeight - rect.height) / 2;
      position.current = { x, y };
      modalContentRef.current.style.left = `${x}px`;
      modalContentRef.current.style.top = `${y}px`;
    }
  };

  // Sync isOpen with externalIsOpen
  useEffect(() => {
    setIsOpen(externalIsOpen);
  }, [externalIsOpen]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll('button');
    const first = focusable[0] as HTMLElement;

    // Dragging functionality
    const handleMouseDown = (e: MouseEvent) => {
      if (e.target === dragHandleRef.current || dragHandleRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        setIsDragging(true);
        dragStart.current = {
          x: e.clientX - position.current.x,
          y: e.clientY - position.current.y,
        };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && modalContentRef.current) {
        e.preventDefault();
        const newX = e.clientX - dragStart.current.x;
        const newY = e.clientY - dragStart.current.y;

        // Constrain within viewport
        const rect = modalContentRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        position.current = {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        };

        modalContentRef.current.style.left = `${position.current.x}px`;
        modalContentRef.current.style.top = `${position.current.y}px`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Touch support
    const handleTouchStart = (e: TouchEvent) => {
      if (e.target === dragHandleRef.current || dragHandleRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        setIsDragging(true);
        const touch = e.touches[0];
        dragStart.current = {
          x: touch.clientX - position.current.x,
          y: touch.clientY - position.current.y,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && modalContentRef.current) {
        e.preventDefault();
        const touch = e.touches[0];
        const newX = touch.clientX - dragStart.current.x;
        const newY = touch.clientY - dragStart.current.y;

        // Constrain within viewport
        const rect = modalContentRef.current.getBoundingClientRect();
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;
        position.current = {
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        };

        modalContentRef.current.style.left = `${position.current.x}px`;
        modalContentRef.current.style.top = `${position.current.y}px`;
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        closeModal(`modal-${question.id}`, `video-${question.id}`);
      }
      if (e.key === 'Tab') {
        const last = focusable[focusable.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Attach event listeners
    modal.addEventListener('keydown', handleKeyDown);
    dragHandleRef.current?.addEventListener('mousedown', handleMouseDown);
    dragHandleRef.current?.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('resize', centerModal);
    first?.focus();

    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      dragHandleRef.current?.removeEventListener('mousedown', handleMouseDown);
      dragHandleRef.current?.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('resize', centerModal);
    };
  }, [question.id, closeModal]);

  // Handle modal visibility
  useEffect(() => {
    const modal = modalRef.current;
    if (modal) {
      if (isOpen) {
        modal.classList.remove('hidden');
        centerModal(); // Center when opening
      } else {
        modal.classList.add('hidden');
      }
    }
  }, [isOpen]);

  if (!question.explanation) return null;

  return (
    <div
      id={`modal-${question.id}`}
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/40 min-h-screen animate-fade-in hidden"
      aria-labelledby={`modal-title-${question.id}`}
    >
      <div
        id={`modal-content-${question.id}`}
        ref={modalContentRef}
        className="absolute bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh]"
        style={{ position: 'absolute' }}
      >
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          className="w-full p-4 bg-gray-700 rounded-t-xl cursor-move"
        >
          <span className="text-base font-medium pl-4 text-white">Response</span>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            setIsOpen(false);
            closeModal(`modal-${question.id}`, `video-${question.id}`);
          }}
          className="absolute top-4 right-4 text-gray-100 hover:text-gray-400 z-10"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="p-8 sm:py-4 overflow-y-auto max-h-[70vh]">
          <h2 id={`modal-title-${question.id}`} className="text-sm font-semibold text-gray-900 mb-4">
            <span dangerouslySetInnerHTML={{ __html: question.question_text }} />
          </h2>

          {question.video_player && question.links_to_video && (
            <div className="mb-4 aspect-video">
              <iframe
                id={`video-${question.id}`}
                className="rounded-lg w-full h-full"
                src={
                  question.video_player === 'youtube'
                    ? `https://www.youtube.com/embed/${question.links_to_video}`
                    : `https://player.vimeo.com/video/${question.links_to_video}?badge=0&autopause=0`
                }
                title={question.question_text}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="mb-4 space-y-2">
            {question.choices
              .filter((choice) => choice.is_correct)
              .map((choice) => (
                <p key={choice.id} className="p-3 rounded-lg bg-sky-50 text-sky-600 font-medium">
                  {choice.choice_text}
                </p>
              ))}
          </div>
          <div className="pb-4">
            <button
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="w-full flex justify-between items-center px-3 py-2 bg-yellow-100 text-gray-700 rounded-lg hover:bg-yellow-200"
            >
              <span className="text-base font-semibold">Explanation</span>
              <svg
                className={`w-5 h-5 transform ${isExplanationOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExplanationOpen && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: question.explanation ?? '' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;