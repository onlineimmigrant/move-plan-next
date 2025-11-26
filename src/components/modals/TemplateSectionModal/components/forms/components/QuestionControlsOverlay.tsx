/**
 * QuestionControlsOverlay - Floating action buttons for question management
 */

'use client';

import React from 'react';
import {
  PlusIcon,
  TrashIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import type { Question, LogicGroup } from '../types';

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

            {/* Question Type Selector */}
      <select
        value={question.type}
        onChange={(e) =>
          onUpdateQuestion(question.id, { type: e.target.value as Question['type'] })
        }
        className="text-xs px-2 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
        title="Question type"
      >
        <option value="text">Text</option>
        <option value="email">Email</option>
        <option value="tel">Phone</option>
        <option value="url">URL</option>
        <option value="number">Number</option>
        <option value="textarea">Long Text</option>
        <option value="multiple">Multiple Choice</option>
        <option value="checkbox">Checkboxes</option>
        <option value="dropdown">Dropdown</option>
        <option value="yesno">Yes/No</option>
        <option value="rating">Rating</option>
      </select>


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
