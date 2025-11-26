/**
 * QuestionNavigationSidebar - Navigation panel for form questions
 */

'use client';

import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Question } from '../types';
import { ensureLogicGroup } from '../logicUtils';
import { FIELD_TYPES } from '../constants';

interface QuestionNavigationSidebarProps {
  questions: Question[];
  currentStep: number;
  showQuestionNav: boolean;
  formTitle: string;
  formDescription: string;
  primaryColor: string;
  onToggleNav: () => void;
  onSelectQuestion: (index: number) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onReorderQuestions: (questions: Question[]) => void;
}

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  currentStep: number;
  primaryColor: string;
  onSelectQuestion: (index: number) => void;
}

function SortableQuestionItem({ question, index, currentStep, primaryColor, onSelectQuestion }: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = currentStep === index;

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <button
        onClick={() => onSelectQuestion(index)}
        className={`w-full text-left px-3 py-2.5 rounded-2xl transition-all group ${
          isActive
            ? 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-md'
            : 'hover:bg-white/40 dark:hover:bg-gray-800/40 backdrop-blur-sm'
        }`}
        style={isActive ? { borderColor: primaryColor, borderWidth: '1px' } : {}}
      >
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing py-1 px-1 -ml-1 hover:bg-white/20 dark:hover:bg-gray-700/20 rounded transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <svg className="w-3 h-4 text-gray-400 dark:text-gray-500" viewBox="0 0 12 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5" />
              <circle cx="9" cy="3" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="9" cy="8" r="1.5" />
              <circle cx="3" cy="13" r="1.5" />
              <circle cx="9" cy="13" r="1.5" />
            </svg>
          </div>

          <span 
            className="text-xs font-bold mt-0.5 min-w-[20px]"
            style={isActive ? { color: primaryColor } : {}}
          >
            {index + 1}.
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate text-gray-900 dark:text-white">
              {question.label || 'Untitled'}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
              <span>{FIELD_TYPES.find(f => f.value === question.type)?.label || question.type}</span>
              {question.required && <span className="text-red-500">*</span>}
              {ensureLogicGroup(question).rules.length > 0 && (
                <span title="Has conditional logic">🔀</span>
              )}
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export function QuestionNavigationSidebar({
  questions,
  currentStep,
  showQuestionNav,
  formTitle,
  formDescription,
  primaryColor,
  onToggleNav,
  onSelectQuestion,
  onTitleChange,
  onDescriptionChange,
  onReorderQuestions,
}: QuestionNavigationSidebarProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = questions.findIndex((q) => q.id === active.id);
      const newIndex = questions.findIndex((q) => q.id === over.id);
      
      const reordered = arrayMove(questions, oldIndex, newIndex);
      onReorderQuestions(reordered);
    }
  };

  return (
    <>
      {/* Floating Glassmorphism Toggle Button */}
      <button
        onClick={onToggleNav}
        className={`
          fixed bottom-24 left-6 z-[70]
          w-12 h-12
          rounded-full
          bg-white/50 dark:bg-gray-900/50
          backdrop-blur-3xl
          border border-white/20 dark:border-gray-700/20
          shadow-xl hover:shadow-2xl
          hover:scale-105 active:scale-95
          hover:bg-white/60 dark:hover:bg-gray-900/60
          transition-all duration-300
          flex items-center justify-center
          ${showQuestionNav ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
        `}
        aria-label={showQuestionNav ? 'Close navigation' : 'Open navigation'}
        aria-expanded={showQuestionNav}
        style={{ color: primaryColor }}
      >
        <Bars3Icon className={`h-6 w-6 transition-all duration-300 ${showQuestionNav ? 'rotate-90' : ''}`} />
      </button>

      {/* Backdrop */}
      {showQuestionNav && (
        <div
          className="fixed inset-0 z-[59] animate-in fade-in duration-200"
          onClick={onToggleNav}
          aria-hidden="true"
        />
      )}

      {/* Sliding Glassmorphism Panel */}
      {showQuestionNav && (
        <div className="fixed bottom-20 left-6 w-80 max-h-[70vh] overflow-y-auto bg-white/30 dark:bg-gray-900/30 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl z-[60] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
          <div className="p-3 space-y-3">
            {/* Form Title & Description - Inline Editing */}
            <div className="px-4 py-3 space-y-2">
              <input
                type="text"
                value={formTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Form Title"
                className="w-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-gray-600/50 transition-all"
              />
              <textarea
                value={formDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Form Description"
                rows={2}
                className="w-full bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm border border-white/30 dark:border-gray-700/30 rounded-xl px-3 py-2 text-xs text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-gray-600/50 transition-all resize-none"
              />
            </div>

            {/* Questions Section */}
            {questions.length > 0 && (
              <div>
                <div
                  className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
                  style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
                >
                  Questions
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {questions.map((q, idx) => (
                        <SortableQuestionItem
                          key={q.id}
                          question={q}
                          index={idx}
                          currentStep={currentStep}
                          primaryColor={primaryColor}
                          onSelectQuestion={onSelectQuestion}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
