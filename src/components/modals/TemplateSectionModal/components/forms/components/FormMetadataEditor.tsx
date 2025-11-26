/**
 * FormMetadataEditor - Editable form title and description
 */

'use client';

import React from 'react';

interface FormMetadataEditorProps {
  title: string;
  description: string;
  designStyle: 'large' | 'compact';
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
}

export function FormMetadataEditor({
  title,
  description,
  designStyle,
  onTitleChange,
  onDescriptionChange,
}: FormMetadataEditorProps) {
  return (
    <div className="space-y-6 py-8 pl-[108px]">
      <input
        type="text"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Untitled Form"
        className={`w-full bg-transparent border-none outline-none focus:ring-0 ${
          designStyle === 'large' ? 'text-4xl' : 'text-2xl'
        }`}
        style={{
          padding: 0,
          fontWeight: title ? 700 : 300,
          color: title ? '#111827' : '#d1d5db',
        }}
      />
      <textarea
        value={description || ''}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Add a description for your form (optional)..."
        rows={2}
        className={`w-full bg-transparent border-none outline-none focus:ring-0 resize-none ${
          designStyle === 'compact' ? 'text-base' : 'text-xl'
        } text-gray-600 leading-relaxed`}
        style={{
          padding: 0,
          fontWeight: description ? 400 : 300,
          color: description ? '#6b7280' : '#d1d5db',
        }}
      />
    </div>
  );
}
