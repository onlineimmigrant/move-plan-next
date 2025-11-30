/**
 * QuestionTypeSelector - Reusable question type selector
 * Can be used in both regular form creation and library question creation
 */

'use client';

import React from 'react';
import type { Question } from '../types';
import { FIELD_TYPES } from '../constants';

interface QuestionTypeSelectorProps {
  selectedType: Question['type'];
  onSelectType: (type: Question['type']) => void;
  primaryColor?: string;
  className?: string;
}

export function QuestionTypeSelector({
  selectedType,
  onSelectType,
  primaryColor = '#8B5CF6',
  className = '',
}: QuestionTypeSelectorProps) {
  return (
    <div className={`py-1 max-h-96 overflow-y-auto ${className}`}>
      {FIELD_TYPES.map((field) => {
        const IconComponent = field.Icon;
        const isSelected = selectedType === field.value;
        
        return (
          <button
            key={field.value}
            onClick={() => onSelectType(field.value as Question['type'])}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
              isSelected
                ? 'bg-gradient-to-r from-purple-50 to-transparent dark:from-purple-900/20 border-l-2'
                : 'hover:bg-gray-50/80 dark:hover:bg-gray-800/50'
            }`}
            style={isSelected ? { borderLeftColor: primaryColor } : {}}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                isSelected 
                  ? 'text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
              style={isSelected ? { backgroundColor: primaryColor } : {}}
            >
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${
                isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {field.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {field.description}
              </div>
            </div>
            {isSelected && (
              <div 
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: primaryColor }}
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
