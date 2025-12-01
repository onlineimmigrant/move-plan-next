/**
 * DesignSettingsMenu - Floating menu for form design customization
 */

'use client';

import React from 'react';
import { PhotoIcon, PlayIcon } from '@heroicons/react/24/outline';

interface ContentColumn {
  position: 'left' | 'center' | 'right';
  type: 'image' | 'video' | 'text';
  content: string;
}

interface DesignSettingsMenuProps {
  showMenu: boolean;
  designStyle: 'large' | 'compact';
  designType: 'classic' | 'card';
  showCompanyLogo: boolean;
  columnLayout: 1 | 2 | 3;
  formPosition: 'left' | 'center' | 'right';
  contentColumns: ContentColumn[];
  thankYouTitle?: string;
  thankYouMessage?: string;
  thankYouContactMessage?: string;
  thankYouIcon?: 'checkmark' | 'heart' | 'star' | 'rocket' | 'trophy';
  thankYouButtonText?: string;
  thankYouButtonUrl?: string;
  primaryColor: string;
  onClose: () => void;
  onSetDesignStyle: (style: 'large' | 'compact') => void;
  onSetDesignType: (type: 'classic' | 'card') => void;
  onSetShowCompanyLogo: (show: boolean) => void;
  onSetColumnLayout: (layout: 1 | 2 | 3) => void;
  onSetFormPosition: (position: 'left' | 'center' | 'right') => void;
  onSetContentColumns: (columns: ContentColumn[]) => void;
  onSetThankYouTitle: (title: string) => void;
  onSetThankYouMessage: (message: string) => void;
  onSetThankYouContactMessage: (message: string) => void;
  onSetThankYouIcon: (icon: 'checkmark' | 'heart' | 'star' | 'rocket' | 'trophy') => void;
  onSetThankYouButtonText: (text: string) => void;
  onSetThankYouButtonUrl: (url: string) => void;
  onOpenImageGallery: (position: 'left' | 'center' | 'right') => void;
  onSetDirty: (dirty: boolean) => void;
}

export function DesignSettingsMenu({
  showMenu,
  designStyle,
  designType,
  showCompanyLogo,
  columnLayout,
  formPosition,
  contentColumns,
  thankYouTitle,
  thankYouMessage,
  thankYouContactMessage,
  thankYouIcon,
  thankYouButtonText,
  thankYouButtonUrl,
  primaryColor,
  onClose,
  onSetDesignStyle,
  onSetDesignType,
  onSetShowCompanyLogo,
  onSetColumnLayout,
  onSetFormPosition,
  onSetContentColumns,
  onSetThankYouTitle,
  onSetThankYouMessage,
  onSetThankYouContactMessage,
  onSetThankYouIcon,
  onSetThankYouButtonText,
  onSetThankYouButtonUrl,
  onOpenImageGallery,
  onSetDirty,
}: DesignSettingsMenuProps) {
  if (!showMenu) return null;

  const contentPosition = formPosition === 'left' ? 'right' : 'left';
  const existingColumn = contentColumns.find((col) => col.position === contentPosition);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[59] animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div className="fixed bottom-20 right-6 w-72 max-h-[70vh] overflow-y-auto bg-white/30 dark:bg-gray-900/30 backdrop-blur-2xl border border-white/20 dark:border-gray-700/20 shadow-2xl rounded-3xl z-[60] animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="p-3 space-y-3">
          {/* Design Style Section */}
          <div>
            <div
              className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              Design Style
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onSetDesignStyle('large');
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = designStyle === 'large' ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: designStyle === 'large' ? primaryColor : undefined,
                }}
              >
                Large
              </button>
              <button
                onClick={() => {
                  onSetDesignStyle('compact');
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = designStyle === 'compact' ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: designStyle === 'compact' ? primaryColor : undefined,
                }}
              >
                Compact
              </button>
            </div>
          </div>

          {/* Design Type Section */}
          <div className="border-t border-white/10 dark:border-gray-700/10 pt-3">
            <div
              className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              Design Type
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onSetDesignType('classic');
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = designType === 'classic' ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: designType === 'classic' ? primaryColor : undefined,
                }}
              >
                Classic
              </button>
              <button
                onClick={() => {
                  onSetDesignType('card');
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = designType === 'card' ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: designType === 'card' ? primaryColor : undefined,
                }}
              >
                Card
              </button>
            </div>
          </div>

          {/* Company Logo Section */}
          <div className="border-t border-white/10 dark:border-gray-700/10 pt-3">
            <div
              className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              Company Logo
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onSetShowCompanyLogo(false);
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = !showCompanyLogo ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: !showCompanyLogo ? primaryColor : undefined,
                }}
              >
                OFF
              </button>
              <button
                onClick={() => {
                  onSetShowCompanyLogo(true);
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = showCompanyLogo ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: showCompanyLogo ? primaryColor : undefined,
                }}
              >
                ON
              </button>
            </div>
          </div>

          {/* Column Layout Section */}
          <div className="border-t border-white/10 dark:border-gray-700/10 pt-3">
            <div
              className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              Column Layout
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onSetColumnLayout(1);
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = columnLayout === 1 ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: columnLayout === 1 ? primaryColor : undefined,
                }}
              >
                1 Column
              </button>
              <button
                onClick={() => {
                  onSetColumnLayout(2);
                  onSetDirty(true);
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = columnLayout === 2 ? primaryColor : '')
                }
                className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                style={{
                  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                  color: columnLayout === 2 ? primaryColor : undefined,
                }}
              >
                2 Columns
              </button>
            </div>
          </div>

          {/* Form Position Section (only show for 2-column layout) */}
          {columnLayout === 2 && (
            <div className="border-t border-white/10 dark:border-gray-700/10 pt-3">
              <div
                className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
              >
                Form Position
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    onSetFormPosition('left');
                    onSetDirty(true);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = formPosition === 'left' ? primaryColor : '')
                  }
                  className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                  style={{ color: formPosition === 'left' ? primaryColor : undefined }}
                >
                  Left
                </button>
                <button
                  onClick={() => {
                    onSetFormPosition('right');
                    onSetDirty(true);
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = formPosition === 'right' ? primaryColor : '')
                  }
                  className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                  style={{ color: formPosition === 'right' ? primaryColor : undefined }}
                >
                  Right
                </button>
              </div>
            </div>
          )}

          {/* Content Columns Section (only show for 2-column layout) */}
          {columnLayout === 2 && (
            <div className="border-t border-white/10 dark:border-gray-700/10 pt-3">
              <div
                className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
                style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
              >
                Content <span className="text-gray-500">•</span> {contentPosition}
              </div>
              <div className="space-y-2">
                {/* Content type selector - inline buttons */}
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      onSetDirty(true);
                      onSetContentColumns(contentColumns.filter((col) => col.position !== contentPosition));
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = !existingColumn ? primaryColor : '')
                    }
                    className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                    style={{ color: !existingColumn ? primaryColor : undefined }}
                  >
                    None
                  </button>
                  <button
                    onClick={() => {
                      onSetDirty(true);
                      const existing = contentColumns.find((col) => col.position === contentPosition);
                      if (existing) {
                        onSetContentColumns(
                          contentColumns.map((col) =>
                            col.position === contentPosition ? { ...col, type: 'image' } : col
                          )
                        );
                      } else {
                        onSetContentColumns([
                          ...contentColumns,
                          { position: contentPosition, type: 'image', content: '' },
                        ]);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        existingColumn?.type === 'image' ? primaryColor : '')
                    }
                    className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                    style={{ color: existingColumn?.type === 'image' ? primaryColor : undefined }}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => {
                      onSetDirty(true);
                      const existing = contentColumns.find((col) => col.position === contentPosition);
                      if (existing) {
                        onSetContentColumns(
                          contentColumns.map((col) =>
                            col.position === contentPosition ? { ...col, type: 'video' } : col
                          )
                        );
                      } else {
                        onSetContentColumns([
                          ...contentColumns,
                          { position: contentPosition, type: 'video', content: '' },
                        ]);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        existingColumn?.type === 'video' ? primaryColor : '')
                    }
                    className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                    style={{ color: existingColumn?.type === 'video' ? primaryColor : undefined }}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => {
                      onSetDirty(true);
                      const existing = contentColumns.find((col) => col.position === contentPosition);
                      if (existing) {
                        onSetContentColumns(
                          contentColumns.map((col) =>
                            col.position === contentPosition ? { ...col, type: 'text' } : col
                          )
                        );
                      } else {
                        onSetContentColumns([
                          ...contentColumns,
                          { position: contentPosition, type: 'text', content: '' },
                        ]);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = primaryColor)}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color =
                        existingColumn?.type === 'text' ? primaryColor : '')
                    }
                    className="flex-1 text-xs px-2 py-2 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white"
                    style={{ color: existingColumn?.type === 'text' ? primaryColor : undefined }}
                  >
                    Text
                  </button>
                </div>

                {/* Content input area */}
                {existingColumn && (
                  <div className="space-y-1">
                    {(existingColumn.type === 'image' || existingColumn.type === 'video') && (
                      <div className="space-y-1">
                        <button
                          onClick={() => onOpenImageGallery(contentPosition)}
                          className="w-full text-xs px-2 py-1.5 rounded bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 hover:bg-white/70 dark:hover:bg-gray-900/70 transition-colors flex items-center justify-center gap-1"
                        >
                          {existingColumn.type === 'image' ? (
                            <PhotoIcon className="w-3 h-3" />
                          ) : (
                            <PlayIcon className="w-3 h-3" />
                          )}
                          {existingColumn.content ? 'Change' : 'Select'} {existingColumn.type}
                        </button>
                        {existingColumn.content && (
                          <div className="text-[10px] text-gray-600 dark:text-gray-400 truncate px-1">
                            {existingColumn.content}
                          </div>
                        )}
                      </div>
                    )}
                    {existingColumn.type === 'text' && (
                      <textarea
                        value={existingColumn.content || ''}
                        onChange={(e) => {
                          onSetDirty(true);
                          onSetContentColumns(
                            contentColumns.map((col) =>
                              col.position === contentPosition
                                ? { ...col, content: e.target.value }
                                : col
                            )
                          );
                        }}
                        placeholder="Text content (Markdown supported)"
                        rows={2}
                        className="w-full text-xs px-2 py-1.5 rounded bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 resize-none"
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thank You Screen Section */}
          <div className="border-t border-white/10 dark:border-gray-700/10 pt-3">
            <div
              className="text-[14px] font-semibold text-gray-600 dark:text-gray-400 px-4 py-2 mb-1"
              style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif' }}
            >
              Thank You Screen
            </div>
            
            <div className="space-y-2 px-2">
              {/* Title Input */}
              <div>
                <label className="text-[11px] text-gray-600 dark:text-gray-400 px-2 mb-0.5 block">
                  Title
                </label>
                <input
                  type="text"
                  value={thankYouTitle || ''}
                  onChange={(e) => {
                    onSetThankYouTitle(e.target.value);
                    onSetDirty(true);
                  }}
                  placeholder="Thank You!"
                  className="w-full text-xs px-2 py-1.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="text-[11px] text-gray-600 dark:text-gray-400 px-2 mb-0.5 block">
                  Message
                </label>
                <textarea
                  value={thankYouMessage || ''}
                  onChange={(e) => {
                    onSetThankYouMessage(e.target.value);
                    onSetDirty(true);
                  }}
                  placeholder="Your response has been recorded."
                  rows={2}
                  className="w-full text-xs px-2 py-1.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="text-[11px] text-gray-600 dark:text-gray-400 px-2 mb-0.5 block">
                  Icon
                </label>
                <div className="flex gap-1">
                  {(['checkmark', 'heart', 'star', 'rocket', 'trophy'] as const).map((icon) => (
                    <button
                      key={icon}
                      onClick={() => {
                        onSetThankYouIcon(icon);
                        onSetDirty(true);
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = primaryColor)}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = thankYouIcon === icon ? primaryColor : '')
                      }
                      className="flex-1 text-[10px] px-1 py-1.5 rounded-xl transition-all duration-200 hover:bg-white/10 dark:hover:bg-gray-800/10 active:bg-white/20 dark:active:bg-gray-800/20 text-gray-900 dark:text-white border border-white/20 dark:border-gray-700/20 capitalize"
                      style={{
                        borderColor: thankYouIcon === icon ? primaryColor : undefined,
                        backgroundColor: thankYouIcon === icon ? 'rgba(255,255,255,0.1)' : undefined,
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact Message Input */}
              <div>
                <label className="text-[11px] text-gray-600 dark:text-gray-400 px-2 mb-0.5 block">
                  Contact Message (optional)
                </label>
                <textarea
                  value={thankYouContactMessage || ''}
                  onChange={(e) => {
                    onSetThankYouContactMessage(e.target.value);
                    onSetDirty(true);
                  }}
                  placeholder="We'll contact you as soon as possible!"
                  rows={2}
                  className="w-full text-xs px-2 py-1.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
                />
              </div>

              {/* Button Text Input */}
              <div>
                <label className="text-[11px] text-gray-600 dark:text-gray-400 px-2 mb-0.5 block">
                  Button Text (optional)
                </label>
                <input
                  type="text"
                  value={thankYouButtonText || ''}
                  onChange={(e) => {
                    onSetThankYouButtonText(e.target.value);
                    onSetDirty(true);
                  }}
                  placeholder="Visit Our Website"
                  className="w-full text-xs px-2 py-1.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>

              {/* Button URL Input */}
              <div>
                <label className="text-[11px] text-gray-600 dark:text-gray-400 px-2 mb-0.5 block">
                  Button URL (optional)
                </label>
                <input
                  type="url"
                  value={thankYouButtonUrl || ''}
                  onChange={(e) => {
                    onSetThankYouButtonUrl(e.target.value);
                    onSetDirty(true);
                  }}
                  placeholder="https://example.com"
                  className="w-full text-xs px-2 py-1.5 rounded-xl bg-white/50 dark:bg-gray-900/50 border border-white/20 dark:border-gray-700/20 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
