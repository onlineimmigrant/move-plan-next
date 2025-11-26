/**
 * QuestionDescriptionEditor - Toggle and edit optional question descriptions
 */

'use client';

import React, { useState } from 'react';

interface QuestionDescriptionEditorProps {
  description: string | undefined;
  designStyle: 'large' | 'compact';
  onUpdate: (description: string) => void;
  onRemove: () => void;
}

export function QuestionDescriptionEditor({
  description,
  designStyle,
  onUpdate,
  onRemove,
}: QuestionDescriptionEditorProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (description === undefined) {
    return (
      <div className="mt-2">
        <button
          onClick={() => onUpdate('')}
          className="text-sm text-gray-400 hover:text-purple-600 transition-colors"
        >
          + Add description
        </button>
      </div>
    );
  }

  return (
    <div 
      className="mt-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative transition-opacity duration-200 ${isHovered || description ? 'opacity-100' : 'opacity-0'}`}>
        <textarea
          value={description || ''}
          onChange={(e) => onUpdate(e.target.value)}
          placeholder="Add helpful description text (optional)..."
          rows={1}
          className={`w-full bg-transparent border-none outline-none focus:ring-0 resize-none p-0 ${
            designStyle === 'compact' ? 'text-base' : 'text-xl'
          } text-gray-600 dark:text-gray-400 max-w-3xl leading-relaxed`}
          style={{
            fontWeight: description ? 400 : 300,
            color: description ? '#6b7280' : '#d1d5db',
          }}
        />
        {(isHovered || description === '') && (
          <button
            onClick={onRemove}
            className="absolute right-0 top-0 text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
