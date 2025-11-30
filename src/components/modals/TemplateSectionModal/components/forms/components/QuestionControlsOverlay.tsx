/**
 * QuestionControlsOverlay - Floating action buttons for question management
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import type { Question, LogicGroup } from '../types';
import { FIELD_TYPES } from '../constants';
import { QuestionTypeSelector } from './QuestionTypeSelector';

interface QuestionControlsOverlayProps {
  question: Question;
  currentStep: number;
  showLogicFor: Set<string>;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onAddQuestionAfter: (afterId: string) => void;
  onToggleLogic: (questionId: string) => void;
  onDuplicateQuestion: (questionId: string) => void;
  onDeleteQuestion: (id: string) => void;
  onEnsureLogicGroup: (question: Question) => LogicGroup;
  onSetCurrentStep: (step: number) => void;
}

export function QuestionControlsOverlay({
  question,
  currentStep,
  showLogicFor,
  onUpdateQuestion,
  onAddQuestionAfter,
  onToggleLogic,
  onDuplicateQuestion,
  onDeleteQuestion,
  onEnsureLogicGroup,
  onSetCurrentStep,
}: QuestionControlsOverlayProps) {
  const logicGroup = onEnsureLogicGroup(question);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(event.target as Node)) {
        setShowTypeMenu(false);
      }
    };

    if (showTypeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeMenu]);

  const currentFieldType = FIELD_TYPES.find(f => f.value === question.type);

  return (
    <div className="flex items-center justify-start gap-2   ">

      {/* Required Toggle */}
      <button
        onClick={() => onUpdateQuestion(question.id, { required: !question.required })}
        className={`text-xs px-2 py-1 rounded transition-colors ${
          question.required
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
        title={question.required ? 'Required' : 'Optional'}
      >
        {question.required ? '* Required' : 'Optional'}
      </button>

      {/* Add Question After */}
      <button
        onClick={() => {
          onAddQuestionAfter(question.id);
          onSetCurrentStep(currentStep + 1);
        }}
        className="p-1 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
        title="Add question after"
      >
        <PlusIcon className="h-4 w-4" />
      </button>

      {/* Logic Editor Toggle */}
      <button
        onClick={() => onToggleLogic(question.id)}
        className={`p-1 rounded transition-colors ${
          showLogicFor.has(question.id)
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            : logicGroup.rules.length > 0
            ? 'text-blue-600 hover:bg-blue-50'
            : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
        }`}
        title={
          showLogicFor.has(question.id)
            ? 'Hide logic'
            : logicGroup.rules.length > 0
            ? 'Edit logic'
            : 'Add logic'
        }
      >
        <Cog6ToothIcon className="h-4 w-4" />
      </button>

      {/* Duplicate Question */}
      <button
        onClick={() => {
          onDuplicateQuestion(question.id);
          onSetCurrentStep(currentStep + 1);
        }}
        className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
        title="Duplicate question"
      >
        <DocumentDuplicateIcon className="h-4 w-4" />
      </button>

      {/* Question Type Selector - Dropdown */}
      <div className="relative" ref={typeMenuRef}>
        <button
          onClick={() => setShowTypeMenu(!showTypeMenu)}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          title="Question type"
        >
          {currentFieldType && (
            <currentFieldType.Icon className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" />
          )}
          <span className="text-gray-700 dark:text-gray-300">{currentFieldType?.label || question.type}</span>
          <ChevronDownIcon className="h-3 w-3 text-gray-400" />
        </button>

        {showTypeMenu && (
          <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-[100]">
            <div className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              Select Question Type
            </div>
            <QuestionTypeSelector
              selectedType={question.type}
              onSelectType={(type) => {
                const updates: Partial<Question> = { type };
                // Add default options for types that require them
                if (['multiple', 'checkbox', 'dropdown', 'rating'].includes(type)) {
                  if (!question.options || question.options.length === 0) {
                    updates.options = ['Option 1'];
                  }
                }
                onUpdateQuestion(question.id, updates);
                setShowTypeMenu(false);
              }}
              primaryColor="#8B5CF6"
            />
          </div>
        )}
      </div>

      {/* Delete Question */}
      <button
        onClick={() => {
          if (confirm('Delete this question?')) {
            onDeleteQuestion(question.id);
            onSetCurrentStep(Math.max(0, currentStep - 1));
          }
        }}
        className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        title="Delete question"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
