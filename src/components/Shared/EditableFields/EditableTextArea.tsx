// components/Shared/EditableFields/EditableTextArea.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface EditableTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  helperText?: string;
  rows?: number;
  autoResize?: boolean;
  className?: string;
}

export default function EditableTextArea({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  maxLength,
  helperText,
  rows = 4,
  autoResize = true,
  className,
}: EditableTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const remainingChars = maxLength ? maxLength - value.length : null;

  // Auto-resize textarea based on content
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value, autoResize]);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        rows={autoResize ? undefined : rows}
        className={cn(
          'w-full px-3 py-2 rounded-lg border transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-sky-500 focus:border-sky-500',
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          !autoResize && 'resize-y'
        )}
        style={autoResize ? { minHeight: `${rows * 24}px` } : undefined}
      />

      <div className="flex items-center justify-between min-h-[20px]">
        {error ? (
          <span className="text-xs text-red-600">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-gray-500">{helperText}</span>
        ) : (
          <span />
        )}

        {maxLength && (
          <span
            className={cn(
              'text-xs',
              remainingChars && remainingChars < maxLength * 0.1
                ? 'text-orange-600 font-medium'
                : 'text-gray-400'
            )}
          >
            {remainingChars} characters remaining
          </span>
        )}
      </div>
    </div>
  );
}
