/**
 * SlashCommandMenu - Dropdown menu for selecting question types with keyboard navigation
 */

'use client';

import React from 'react';
import type { Question } from '../types';

interface FieldType {
  value: Question['type'];
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

interface SlashCommandMenuProps {
  showMenu: boolean;
  editingQuestionId: string | null;
  filteredFieldTypes: FieldType[];
  selectedIndex: number;
  menuRef: React.RefObject<HTMLDivElement>;
  questions: Question[];
  onSelectFieldType: (questionId: string, type: Question['type'], newLabel: string) => void;
  onSetShowSlashMenu: (show: boolean) => void;
  onSetSlashFilter: (filter: string) => void;
  onSetSlashMenuIndex: (index: number) => void;
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
}

export function SlashCommandMenu({
  showMenu,
  editingQuestionId,
  filteredFieldTypes,
  selectedIndex,
  menuRef,
  questions,
  onSelectFieldType,
  onSetShowSlashMenu,
  onSetSlashFilter,
  onSetSlashMenuIndex,
  onUpdateQuestion,
}: SlashCommandMenuProps) {
  if (!showMenu || !editingQuestionId) return null;

  const handleSelectType = (fieldType: FieldType) => {
    const question = questions.find((q) => q.id === editingQuestionId);
    if (!question) return;

    const slashIndex = question.label.lastIndexOf('/');
    const newLabel = slashIndex !== -1 ? question.label.substring(0, slashIndex).trim() : question.label;

    onUpdateQuestion(editingQuestionId, {
      type: fieldType.value,
      label: newLabel,
      options: ['multiple', 'checkbox', 'dropdown', 'rating'].includes(fieldType.value)
        ? ['Option 1']
        : undefined,
    });
    onSetShowSlashMenu(false);
    onSetSlashFilter('');
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden mt-2 opacity-100 sm:opacity-0 sm:group-hover/question:opacity-100 transition-opacity pointer-events-auto sm:pointer-events-none sm:group-hover/question:pointer-events-auto"
      style={{ maxHeight: '70vh' }}
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80 border-b border-gray-100">
        Question Types
      </div>
      <div className="py-1 max-h-80 overflow-y-auto">
        {filteredFieldTypes.map((field, idx: number) => {
          const IconComponent = field.Icon;
          return (
            <button
              key={field.value}
              onClick={() => handleSelectType(field)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                idx === selectedIndex
                  ? 'bg-gradient-to-r from-purple-50 to-transparent border-l-2 border-purple-500'
                  : 'hover:bg-gray-50/80'
              }`}
              onMouseEnter={() => onSetSlashMenuIndex(idx)}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  idx === selectedIndex ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                <IconComponent className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">{field.label}</div>
                <div className="text-xs text-gray-500 truncate">{field.description}</div>
              </div>
              {idx === selectedIndex && (
                <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-200">
                  ⏎
                </kbd>
              )}
            </button>
          );
        })}
      </div>
      {filteredFieldTypes.length === 0 && (
        <div className="px-3 py-8 text-center text-sm text-gray-400">No matching types</div>
      )}
    </div>
  );
}
