/**
 * QuestionEditor - Single question editor with all controls
 */

'use client';

import React from 'react';
import type { Question, QuestionLibraryItem } from '../types';
import { FieldPreview } from './FieldPreview';
import { LogicEditor } from './LogicEditor';
import { SlashCommandMenu } from './SlashCommandMenu';
import { QuestionLibrarySuggestions } from './QuestionLibrarySuggestions';
import { QuestionDescriptionEditor } from './QuestionDescriptionEditor';
import { NavigationButtons } from './NavigationButtons';
import { ensureLogicGroup as ensureLogicGroupUtil } from '../logicUtils';

interface QuestionEditorProps {
  formId?: string | null;
  question: Question;
  currentStep: number;
  totalSteps: number;
  designStyle: 'large' | 'compact';
  showLogicFor: Set<string>;
  questions: Question[];
  slashCommands: {
    showSlashMenu: boolean;
    editingQuestionId: string | null;
    filteredFieldTypes: any[];
    slashMenuIndex: number;
    slashMenuRef: React.RefObject<HTMLDivElement>;
    setShowSlashMenu: (show: boolean) => void;
    setSlashFilter: (filter: string) => void;
    setSlashMenuIndex: (index: number) => void;
  };
  librarySuggestions?: {
    showSuggestions: boolean;
    activeQuestionId: string | null;
    searchQuery: string;
    selectedIndex: number;
    suggestionsMenuRef: React.RefObject<HTMLDivElement>;
    existingQuestionLibraryIds: Set<string>;
    onSelectLibraryQuestion: (question: QuestionLibraryItem) => void;
    onCloseSuggestions: () => void;
    onSuggestionsCountChange?: (count: number) => void;
    onAvailableCountChange?: (count: number) => void;
  };
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onAddQuestionAfter: (afterId: string) => void;
  onToggleLogic: (questionId: string) => void;
  onDuplicateQuestion: (id: string) => void;
  onDeleteQuestion: (id: string) => void;
  onSetCurrentStep: (step: number) => void;
  onSetDirty: (dirty: boolean) => void;
  onHandleLabelChange: (id: string, value: string, e?: React.ChangeEvent<HTMLInputElement>) => void;
  onHandleSlashMenuKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, questionId: string) => void;
  onSetQuestionLogic: (questionId: string, updater: (lg: any) => any) => void;
}

export function QuestionEditor({
  formId,
  question,
  currentStep,
  totalSteps,
  designStyle,
  showLogicFor,
  questions,
  slashCommands,
  librarySuggestions,
  onUpdateQuestion,
  onAddQuestionAfter,
  onToggleLogic,
  onDuplicateQuestion,
  onDeleteQuestion,
  onSetCurrentStep,
  onSetDirty,
  onHandleLabelChange,
  onHandleSlashMenuKeyDown,
  onSetQuestionLogic,
}: QuestionEditorProps) {
  const showLibrarySuggestions = librarySuggestions?.showSuggestions && 
    librarySuggestions?.activeQuestionId === question.id;

  return (
    <div key={question.id} className="relative group/question">
      {/* Editable Question Label */}
      <div className="relative">
        <input
          type="text"
          value={question.label}
          onChange={(e) => {
            onHandleLabelChange(question.id, e.target.value, e);
            onSetDirty(true);
          }}
          onKeyDown={(e) => onHandleSlashMenuKeyDown(e, question.id)}
          placeholder="Type your question here..."
          className={`w-full bg-transparent border-none outline-none focus:ring-0 p-0 ${designStyle === 'compact' ? 'text-2xl' : 'text-5xl'} font-bold text-gray-900 leading-tight`}
          style={{
            fontWeight: question.label ? 700 : 300,
            color: question.label ? '#111827' : '#d1d5db'
          }}
        />

        {/* Question Library Suggestions */}
        {librarySuggestions && showLibrarySuggestions && (
          <QuestionLibrarySuggestions
            formId={formId}
            searchQuery={librarySuggestions.searchQuery}
            isVisible={showLibrarySuggestions}
            selectedIndex={librarySuggestions.selectedIndex}
            menuRef={librarySuggestions.suggestionsMenuRef}
            existingQuestionLibraryIds={librarySuggestions.existingQuestionLibraryIds}
            onSelectQuestion={librarySuggestions.onSelectLibraryQuestion}
            onClose={librarySuggestions.onCloseSuggestions}
            onSuggestionsCountChange={librarySuggestions.onSuggestionsCountChange}
            onAvailableCountChange={librarySuggestions.onAvailableCountChange}
          />
        )}
      </div>

      {/* Slash Command Menu */}
      <SlashCommandMenu
        showMenu={slashCommands.showSlashMenu}
        editingQuestionId={slashCommands.editingQuestionId}
        filteredFieldTypes={slashCommands.filteredFieldTypes}
        selectedIndex={slashCommands.slashMenuIndex}
        menuRef={slashCommands.slashMenuRef}
        questions={questions}
        onSelectFieldType={(questionId, type, newLabel) => {
          onUpdateQuestion(questionId, { 
            type,
            label: newLabel,
            options: ['multiple', 'checkbox', 'dropdown', 'rating'].includes(type) ? ['Option 1'] : undefined
          });
        }}
        onSetShowSlashMenu={slashCommands.setShowSlashMenu}
        onSetSlashFilter={slashCommands.setSlashFilter}
        onSetSlashMenuIndex={slashCommands.setSlashMenuIndex}
        onUpdateQuestion={onUpdateQuestion}
      />

      {/* Description Toggle & Editor */}
      <QuestionDescriptionEditor
        description={question.description}
        designStyle={designStyle}
        onUpdate={(desc) => {
          onUpdateQuestion(question.id, { description: desc });
          onSetDirty(true);
        }}
        onRemove={() => {
          const { description, ...rest } = question;
          onUpdateQuestion(question.id, rest);
        }}
      />

      {/* Logic Editor (inline when toggled) */}
      {showLogicFor.has(question.id) && (
        <LogicEditor
          question={question}
          questions={questions}
          currentStep={currentStep}
          onSetQuestionLogic={onSetQuestionLogic}
          onEnsureLogicGroup={ensureLogicGroupUtil}
        />
      )}

      {/* Field Preview (styled to match actual form) */}
      <FieldPreview
        question={question}
        designStyle={designStyle}
        onUpdateQuestion={onUpdateQuestion}
        onSetDirty={onSetDirty}
      />

      {/* Navigation */}
      <NavigationButtons
        currentStep={currentStep}
        totalSteps={totalSteps}
        designStyle={designStyle}
        onPrevious={() => onSetCurrentStep(Math.max(0, currentStep - 1))}
        onNext={() => onSetCurrentStep(Math.min(totalSteps - 1, currentStep + 1))}
      />
    </div>
  );
}
