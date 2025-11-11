/**
 * TagEditorModal Component
 * 
 * Modal for creating and editing ticket tags.
 * Includes name input, color picker, and optional icon selector.
 */

import React, { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';
import { TicketTag } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';

interface TagEditorModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Callback when tag is saved (create or update) */
  onSave: (name: string, color: string, icon?: string) => Promise<void>;
  /** Existing tag to edit (if undefined, creating new tag) */
  existingTag?: TicketTag;
  /** Whether the save operation is in progress */
  isSaving?: boolean;
}

// Predefined color palette
const COLOR_PALETTE = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#84CC16', // lime
  '#06B6D4', // cyan
  '#6366F1', // indigo
  '#A855F7', // violet
  '#64748B', // slate
  '#6B7280', // gray
];

export const TagEditorModal: React.FC<TagEditorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingTag,
  isSaving = false
}) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLOR_PALETTE[0]);
  const [icon, setIcon] = useState<string | undefined>();

  // Initialize form with existing tag data
  useEffect(() => {
    if (existingTag) {
      setName(existingTag.name);
      setColor(existingTag.color);
      setIcon(existingTag.icon);
    } else {
      // Reset form for new tag
      setName('');
      setColor(COLOR_PALETTE[0]);
      setIcon(undefined);
    }
  }, [existingTag, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    
    await onSave(name.trim(), color, icon);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10004] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="border-b border-white/10 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30 backdrop-blur-md px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 dark:bg-gray-700/20 rounded-full flex items-center justify-center">
                <Tag className="h-5 w-5" style={{ color: primary.base }} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {existingTag ? 'Edit Tag' : 'Create New Tag'}
              </h3>
            </div>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 bg-white/20 dark:bg-gray-900/20">
          {/* Tag Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Tag Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Bug, Feature Request, Urgent"
              className="w-full px-3 py-2 border border-white/20 dark:border-gray-700/20 rounded-lg focus:outline-none focus:ring-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              style={{ '--focus-ring-color': primary.base } as React.CSSProperties}
              disabled={isSaving}
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Tag Color
            </label>
            <div className="grid grid-cols-7 gap-2">
              {COLOR_PALETTE.map((paletteColor) => (
                <button
                  key={paletteColor}
                  onClick={() => setColor(paletteColor)}
                  disabled={isSaving}
                  className="relative w-full aspect-square rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
                  style={{ 
                    backgroundColor: paletteColor,
                    '--focus-ring-color': primary.base 
                  } as React.CSSProperties}
                  title={paletteColor}
                >
                  {color === paletteColor && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="h-4 w-4 text-white drop-shadow-md" strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border shadow-sm"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: `${color}40`,
                  color: color
                }}
              >
                {icon && <span>{icon}</span>}
                {name || 'Tag Name'}
              </span>
              <span className="text-xs text-gray-500">
                This is how your tag will appear
              </span>
            </div>
          </div>

          {/* Icon Input (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              Icon (Optional)
            </label>
            <input
              type="text"
              value={icon || ''}
              onChange={(e) => setIcon(e.target.value || undefined)}
              placeholder="e.g., 🐛 🚀 ⚡ (emoji or text)"
              className="w-full px-3 py-2 border border-white/20 dark:border-gray-700/20 rounded-lg focus:outline-none focus:ring-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              style={{ '--focus-ring-color': primary.base } as React.CSSProperties}
              disabled={isSaving}
              maxLength={2}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Add an emoji or short icon to make your tag more recognizable
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-md px-6 py-4 flex items-center justify-end gap-3 border-t border-white/10 dark:border-gray-700/20">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ 
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            }}
          >
            {isSaving ? 'Saving...' : existingTag ? 'Update Tag' : 'Create Tag'}
          </button>
        </div>
      </div>
    </div>
  );
};
