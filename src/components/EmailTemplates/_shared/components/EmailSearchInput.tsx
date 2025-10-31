/**
 * Email Search Input Component
 * Reusable search input with icon
 */

import React from 'react';
import { EmailIcons } from './EmailIcons';

interface EmailSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const EmailSearchInput: React.FC<EmailSearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search templates...',
}) => {
  return (
    <div className="relative">
      <EmailIcons.Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      />
    </div>
  );
};
