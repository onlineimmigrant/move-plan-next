/**
 * FieldPreview - Preview of form field styled to match actual form
 */

'use client';

import React from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Bars3Icon } from '@heroicons/react/24/solid';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Question } from '../types';

interface FieldPreviewProps {
  question: Question;
  designStyle: 'large' | 'compact';
  onUpdateQuestion: (id: string, updates: Partial<Question>) => void;
  onSetDirty: (dirty: boolean) => void;
}

interface SortableOptionProps {
  id: string;
  option: string;
  index: number;
  designStyle: 'large' | 'compact';
  questionType: string;
  onUpdate: (newValue: string) => void;
  onDelete: () => void;
}

function SortableOption({ id, option, index, designStyle, questionType, onUpdate, onDelete }: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center ${
        designStyle === 'compact' ? 'p-4 space-x-3' : 'p-5 space-x-4'
      } border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all group cursor-pointer`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>
      <input
        type={questionType === 'checkbox' ? 'checkbox' : 'radio'}
        disabled
        className={`${
          designStyle === 'compact' ? 'w-5 h-5' : 'w-6 h-6'
        } pointer-events-none text-purple-600 border-gray-300 dark:border-gray-600`}
      />
      <input
        type="text"
        value={option}
        onChange={(e) => onUpdate(e.target.value)}
        className={`flex-1 bg-transparent border-none outline-none focus:ring-0 p-0 ${
          designStyle === 'compact' ? 'text-base' : 'text-lg'
        } text-gray-900 dark:text-white`}
        placeholder={`Option ${index + 1}`}
      />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
      >
        <TrashIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

interface SortableDropdownOptionProps {
  id: string;
  option: string;
  index: number;
  designStyle: 'large' | 'compact';
  onUpdate: (newValue: string) => void;
  onDelete: () => void;
}

function SortableDropdownOption({ id, option, index, designStyle, onUpdate, onDelete }: SortableDropdownOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 group">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Bars3Icon className="h-4 w-4" />
      </button>
      <span className="text-gray-400 text-sm w-6">{index + 1}.</span>
      <input
        type="text"
        value={option}
        onChange={(e) => onUpdate(e.target.value)}
        className={`flex-1 ${
          designStyle === 'compact' ? 'text-base' : 'text-lg'
        } px-3 py-2 border rounded-lg border-gray-300 bg-white`}
        placeholder={`Option ${index + 1}`}
      />
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 transition-all"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

export function FieldPreview({
  question,
  designStyle,
  onUpdateQuestion,
  onSetDirty,
}: FieldPreviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const options = question.options || [];
      const oldIndex = options.findIndex((_, i) => `option-${i}` === active.id);
      const newIndex = options.findIndex((_, i) => `option-${i}` === over.id);

      const newOptions = arrayMove(options, oldIndex, newIndex);
      onUpdateQuestion(question.id, { options: newOptions });
      onSetDirty(true);
    }
  };

  return (
    <div className="group mt-2">
      {/* Text-based inputs */}
      {['text', 'email', 'tel', 'url', 'number'].includes(question.type) && (
        <input
          type={question.type}
          disabled
          className={`w-full ${
            designStyle === 'compact' 
              ? 'text-base h-12 px-4' 
              : 'text-lg h-14 px-5'
          } border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
          placeholder="Type your answer here..."
        />
      )}

      {/* Textarea */}
      {question.type === 'textarea' && (
        <textarea
          disabled
          rows={designStyle === 'compact' ? 4 : 5}
          className={`w-full ${
            designStyle === 'compact' ? 'text-base px-4 py-3' : 'text-lg px-5 py-4'
          } border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none`}
          placeholder="Type your answer here..."
        />
      )}

      {/* Multiple choice, Yes/No, Checkboxes */}
      {(question.type === 'multiple' ||
        question.type === 'yesno' ||
        question.type === 'checkbox') && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-3 pointer-events-auto">
            {question.type === 'yesno' ? (
              // Yes/No - not sortable
              ['Yes', 'No'].map((opt, i) => (
                <div
                  key={i}
                  className={`flex items-center ${
                    designStyle === 'compact' ? 'p-4 space-x-3' : 'p-5 space-x-4'
                  } border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all group cursor-pointer`}
                >
                  <input
                    type="radio"
                    disabled
                    className={`${
                      designStyle === 'compact' ? 'w-5 h-5' : 'w-6 h-6'
                    } pointer-events-none text-purple-600 border-gray-300 dark:border-gray-600`}
                  />
                  <span className={`${
                    designStyle === 'compact' ? 'text-base' : 'text-lg'
                  } text-gray-900 dark:text-white font-medium`}>
                    {opt}
                  </span>
                </div>
              ))
            ) : (
              // Multiple choice and Checkboxes - sortable
              <SortableContext
                items={(question.options || []).map((_, i) => `option-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {(question.options || ['Option 1', 'Option 2']).map((opt, i) => (
                  <SortableOption
                    key={`option-${i}`}
                    id={`option-${i}`}
                    option={opt}
                    index={i}
                    designStyle={designStyle}
                    questionType={question.type}
                    onUpdate={(newValue) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[i] = newValue;
                      onUpdateQuestion(question.id, { options: newOptions });
                      onSetDirty(true);
                    }}
                    onDelete={() => {
                      const newOptions = (question.options || []).filter((_, idx) => idx !== i);
                      onUpdateQuestion(question.id, {
                        options: newOptions.length > 0 ? newOptions : ['Option 1'],
                      });
                      onSetDirty(true);
                    }}
                  />
                ))}
              </SortableContext>
            )}
            {question.type !== 'yesno' && (
              <button
                onClick={() => {
                  const newOptions = [...(question.options || []), ''];
                  onUpdateQuestion(question.id, { options: newOptions });
                  onSetDirty(true);
                }}
                className={`w-full ${
                  designStyle === 'compact' ? 'p-3' : 'p-4'
                } border border-dashed rounded-xl border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2`}
              >
                <PlusIcon className="h-5 w-5" />
                <span className={designStyle === 'compact' ? 'text-sm' : 'text-base'}>
                  Add option
                </span>
              </button>
            )}
          </div>
        </DndContext>
      )}

      {/* Dropdown */}
      {question.type === 'dropdown' && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="space-y-4 pointer-events-auto">
            <select
              disabled
              className={`w-full ${
                designStyle === 'compact' ? 'text-base h-12 px-4' : 'text-lg h-14 px-5'
              } border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all pointer-events-none`}
            >
              <option>Select an option...</option>
              {(question.options || []).map((opt, i) => (
                <option key={i}>{opt || `Option ${i + 1}`}</option>
              ))}
            </select>

            {/* Editable options list */}
            <div className="space-y-2 mt-4">
              <p className="text-sm text-gray-500 font-medium">Dropdown Options:</p>
              <SortableContext
                items={(question.options || []).map((_, i) => `option-${i}`)}
                strategy={verticalListSortingStrategy}
              >
                {(question.options || ['Option 1', 'Option 2']).map((opt, i) => (
                  <SortableDropdownOption
                    key={`option-${i}`}
                    id={`option-${i}`}
                    option={opt}
                    index={i}
                    designStyle={designStyle}
                    onUpdate={(newValue) => {
                      const newOptions = [...(question.options || [])];
                      newOptions[i] = newValue;
                      onUpdateQuestion(question.id, { options: newOptions });
                      onSetDirty(true);
                    }}
                    onDelete={() => {
                      const newOptions = (question.options || []).filter((_, idx) => idx !== i);
                      onUpdateQuestion(question.id, {
                        options: newOptions.length > 0 ? newOptions : ['Option 1'],
                      });
                      onSetDirty(true);
                    }}
                  />
                ))}
              </SortableContext>
              <button
                onClick={() => {
                  const newOptions = [...(question.options || []), ''];
                  onUpdateQuestion(question.id, { options: newOptions });
                  onSetDirty(true);
                }}
                className="text-sm text-gray-400 hover:text-purple-600 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add option
              </button>
            </div>
          </div>
        </DndContext>
      )}

      {/* Rating */}
      {question.type === 'rating' && (
        <div className="flex gap-3 justify-center">
          {Array.from({ length: 5 }, (_, i) => i + 1).map((rating) => (
            <button
              key={rating}
              disabled
              className={`${
                designStyle === 'compact' ? 'w-14 h-14 text-lg' : 'w-16 h-16 text-xl'
              } border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all`}
            >
              {rating}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
