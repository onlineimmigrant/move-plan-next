'use client';

import React from 'react';
import type { RefObject } from 'react';
import { ArrowPathIcon, ArrowUpTrayIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';

type MediaTabToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchHint?: string;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  onRefresh: () => void;
  isRefreshing?: boolean;

  fileInputRef?: RefObject<HTMLInputElement>;
  fileAccept?: string;
  onFilePicked?: (file: File) => void;

  isUploading?: boolean;
  uploadLabel?: string;
  uploadTitle?: string;
  uploadProgress?: string;

  countsText?: string;
  extraControls?: React.ReactNode;
  uploadAdjacentControls?: React.ReactNode;
};

export default function MediaTabToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchHint,
  onSearchKeyDown,
  onRefresh,
  isRefreshing,
  fileInputRef,
  fileAccept,
  onFilePicked,
  isUploading,
  uploadLabel = 'Upload',
  uploadTitle,
  uploadProgress,
  countsText,
  extraControls,
  uploadAdjacentControls,
}: MediaTabToolbarProps) {
  const themeColors = useThemeColors();

  return (
    <div className="sticky top-0 z-10 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200/30 dark:border-gray-700/30 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all"
              style={{ '--tw-ring-color': themeColors.cssVars.primary.base } as React.CSSProperties}
            />
            {!!searchValue && !!searchHint && (
              <div
                className="hidden md:block absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                style={{ color: themeColors.cssVars.primary.base }}
              >
                {searchHint}
              </div>
            )}
          </div>

          {extraControls}

          <Button
            onClick={onRefresh}
            disabled={!!isRefreshing}
            variant="outline"
            className="whitespace-nowrap px-2 sm:px-3"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>

          {fileInputRef && fileAccept && onFilePicked && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={fileAccept}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onFilePicked(file);
                  // allow selecting the same file again
                  e.currentTarget.value = '';
                }}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!!isUploading}
                  variant="primary"
                  className="whitespace-nowrap px-2 sm:px-3"
                  title={uploadTitle}
                >
                  <ArrowUpTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 md:mr-2" />
                  <span className="hidden md:inline">{isUploading ? 'Uploading...' : uploadLabel}</span>
                </Button>
                {uploadAdjacentControls}
              </div>
            </>
          )}

          {!fileInputRef && !!uploadAdjacentControls && (
            <div className="flex items-center gap-2">
              {uploadAdjacentControls}
            </div>
          )}
        </div>

        {!!uploadProgress && (
          <div className="text-sm flex items-center gap-2 animate-fade-in" style={{ color: themeColors.cssVars.primary.base }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColors.cssVars.primary.base }} />
            {uploadProgress}
          </div>
        )}

        {!!countsText && (
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            {countsText}
          </div>
        )}
      </div>
    </div>
  );
}
