'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Choice, Question } from './Types';

interface ExplanationModalProps {
  question: Question;
  examMode: boolean;
  closeModal: (modalId: string) => void;
}

const ExplanationModal: React.FC<ExplanationModalProps> = ({ question, examMode, closeModal }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const [isExplanationOpen, setIsExplanationOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const position = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const focusable = modal.querySelectorAll('button');
    const first = focusable[0] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal(`modal-${question.id}`);
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
        position.current = {
          x: e.clientX - dragStart.current.x,
          y: e.clientY - dragStart.current.y,
        };
        modalContentRef.current.style.left = `${position.current.x}px`;
        modalContentRef.current.style.top = `${position.current.y}px`;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    // Prevent dragging when scrolling content
    const handleContentMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
    };

    modal.addEventListener('keydown', handleKeyDown);
    dragHandleRef.current?.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    modalContentRef.current?.addEventListener('mousedown', handleContentMouseDown);
    first?.focus();

    // Center modal initially
    if (modalContentRef.current) {
      const rect = modalContentRef.current.getBoundingClientRect();
      position.current = {
        x: (window.innerWidth - rect.width) / 2,
        y: (window.innerHeight - rect.height) / 2,
      };
      modalContentRef.current.style.left = `${position.current.x}px`;
      modalContentRef.current.style.top = `${position.current.y}px`;
    }

    return () => {
      modal.removeEventListener('keydown', handleKeyDown);
      dragHandleRef.current?.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      modalContentRef.current?.removeEventListener('mousedown', handleContentMouseDown);
    };
  }, [question.id, closeModal, isDragging]);

  if (!question.explanation || examMode) return null;

  return (
   
    <div
      id={`modal-${question.id}`}
      ref={modalRef}
      className="fixed inset-0 z-50 bg-black/40 min-h-screen animate-fade-in"
      aria-labelledby={`modal-title-${question.id}`}
    >
      <div
        id={`modal-content-${question.id}`}
        ref={modalContentRef}
        className="absolute bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[85vh] mx-auto my-auto"
        style={{ position: 'absolute' }}
      >
        {/* Drag Handle */}
        <div
          ref={dragHandleRef}
          className="w-full p-4 bg-sky-500 rounded-t-xl cursor-move"
        >
         <span className="text-base font-semibold text-white">Explanation</span>
        </div>

        {/* Close Button */}
        <button
          onClick={() => closeModal(`modal-${question.id}`)}
          className="absolute top-3 right-3 text-gray-100 hover:text-sky-600 z-10"
          aria-label="Close modal"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Scrollable Content */}
        <div className="p-8 sm:py-4 overflow-y-auto max-h-[70vh]">


          <h2 id={`modal-title-${question.id}`} className="text-base font-semibold text-gray-900 mb-4">
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
              className="w-full flex justify-between items-center px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-700"
            >
              <span className="text-base font-semibold">Details</span>
              <svg
                className={`w-5 h-5 transform ${isExplanationOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isExplanationOpen && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700" dangerouslySetInnerHTML={{ __html: question.explanation }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  
  );
};

export default ExplanationModal;