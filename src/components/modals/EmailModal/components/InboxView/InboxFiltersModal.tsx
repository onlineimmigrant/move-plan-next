'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Mail,
  Paperclip,
  Tag,
  Check
} from 'lucide-react';

interface InboxFilters {
  dateFrom?: string;
  dateTo?: string;
  fromEmail?: string;
  toEmail?: string;
  hasAttachments?: boolean;
  isRead?: boolean | null;
  isStarred?: boolean | null;
  labels?: string[];
}

interface InboxFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: InboxFilters;
  onApplyFilters: (filters: InboxFilters) => void;
  primary: { base: string; hover: string };
}

export default function InboxFiltersModal({
  isOpen,
  onClose,
  currentFilters,
  onApplyFilters,
  primary
}: InboxFiltersModalProps) {
  const [filters, setFilters] = useState<InboxFilters>(currentFilters);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClear = () => {
    const emptyFilters: InboxFilters = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, dateFrom: e.target.value });
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, dateTo: e.target.value });
  };

  const handleFromEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, fromEmail: e.target.value });
  };

  const handleToEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, toEmail: e.target.value });
  };

  const toggleAttachments = () => {
    setFilters({ ...filters, hasAttachments: !filters.hasAttachments });
  };

  const handleReadFilter = (value: boolean | null) => {
    setFilters({ ...filters, isRead: value });
  };

  const handleStarredFilter = (value: boolean | null) => {
    setFilters({ ...filters, isStarred: value });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-[100]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Advanced Filters
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-140px)]">
            {/* Date Range */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={handleDateFromChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={handleDateToChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* From Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                From Email
              </label>
              <input
                type="email"
                value={filters.fromEmail || ''}
                onChange={handleFromEmailChange}
                placeholder="sender@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* To Email */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                To Email
              </label>
              <input
                type="email"
                value={filters.toEmail || ''}
                onChange={handleToEmailChange}
                placeholder="recipient@example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Has Attachments */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Paperclip className="w-4 h-4" />
                Attachments
              </label>
              <button
                onClick={toggleAttachments}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors w-full ${
                  filters.hasAttachments
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded border flex items-center justify-center ${
                    filters.hasAttachments
                      ? 'bg-primary border-primary'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {filters.hasAttachments && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm">Has attachments</span>
              </button>
            </div>

            {/* Read Status */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4" />
                Read Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReadFilter(null)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filters.isRead === null
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleReadFilter(false)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filters.isRead === false
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => handleReadFilter(true)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filters.isRead === true
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Read
                </button>
              </div>
            </div>

            {/* Starred */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Tag className="w-4 h-4" />
                Starred
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStarredFilter(null)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filters.isStarred === null
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleStarredFilter(true)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filters.isStarred === true
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Starred Only
                </button>
                <button
                  onClick={() => handleStarredFilter(false)}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    filters.isStarred === false
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  Not Starred
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Clear All
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                className="px-4 py-2 text-sm rounded-lg transition-colors font-medium"
                style={{
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white'
                }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
