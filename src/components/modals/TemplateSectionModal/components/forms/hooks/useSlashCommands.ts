/**
 * useSlashCommands - Slash command functionality for quick field type selection
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Question } from '../types';

export interface FieldType {
  value: Question['type'];
  label: string;
  Icon: any;
  description: string;
}

interface UseSlashCommandsProps {
  fieldTypes: readonly FieldType[];
  onSelectFieldType: (questionId: string, type: Question['type'], newLabel: string) => void;
}

interface UseSlashCommandsReturn {
  showSlashMenu: boolean;
  slashMenuPosition: { top: number; left: number };
  slashFilter: string;
  slashMenuIndex: number;
  editingQuestionId: string | null;
  filteredFieldTypes: FieldType[];
  slashMenuRef: React.RefObject<HTMLDivElement>;
  handleQuestionLabelChange: (id: string, value: string, e?: React.ChangeEvent<HTMLInputElement>) => void;
  handleSlashMenuKeyDown: (e: React.KeyboardEvent, questionId: string) => void;
  setShowSlashMenu: (show: boolean) => void;
  setSlashFilter: (filter: string) => void;
  setSlashMenuIndex: (index: number) => void;
}

export function useSlashCommands({
  fieldTypes,
  onSelectFieldType,
}: UseSlashCommandsProps): UseSlashCommandsReturn {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);

  const filteredFieldTypes = fieldTypes.filter(
    field =>
      field.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
      field.value.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const handleQuestionLabelChange = useCallback(
    (id: string, value: string, e?: React.ChangeEvent<HTMLInputElement>) => {
      // Detect slash command
      if (value.includes('/') && !showSlashMenu) {
        const slashIndex = value.lastIndexOf('/');
        const afterSlash = value.substring(slashIndex + 1);

        // Show menu if slash is at start or after space
        if (slashIndex === 0 || value[slashIndex - 1] === ' ') {
          setSlashFilter(afterSlash);
          setSlashMenuIndex(0);
          setEditingQuestionId(id);

          // Position menu near input
          if (e?.target) {
            const rect = e.target.getBoundingClientRect();
            setSlashMenuPosition({
              top: rect.bottom + window.scrollY + 4,
              left: rect.left + window.scrollX,
            });
          }
          setShowSlashMenu(true);
        }
      } else if (showSlashMenu && editingQuestionId === id) {
        // Update filter as user types
        const slashIndex = value.lastIndexOf('/');
        if (slashIndex !== -1) {
          const afterSlash = value.substring(slashIndex + 1);
          setSlashFilter(afterSlash);
        } else {
          setShowSlashMenu(false);
        }
      }
    },
    [showSlashMenu, editingQuestionId]
  );

  const handleSlashMenuKeyDown = useCallback(
    (e: React.KeyboardEvent, questionId: string) => {
      if (!showSlashMenu) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashMenuIndex(prev => Math.min(prev + 1, filteredFieldTypes.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashMenuIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredFieldTypes.length > 0) {
        e.preventDefault();
        const selectedType = filteredFieldTypes[slashMenuIndex].value as Question['type'];
        
        // Get current label and remove slash command
        const inputElement = e.currentTarget as HTMLInputElement;
        const currentLabel = inputElement.value;
        const slashIndex = currentLabel.lastIndexOf('/');
        const newLabel = slashIndex !== -1 ? currentLabel.substring(0, slashIndex).trim() : currentLabel;
        
        onSelectFieldType(questionId, selectedType, newLabel);
        setShowSlashMenu(false);
        setSlashFilter('');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setShowSlashMenu(false);
      }
    },
    [showSlashMenu, filteredFieldTypes, slashMenuIndex, onSelectFieldType]
  );

  // Close slash menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (slashMenuRef.current && !slashMenuRef.current.contains(e.target as Node)) {
        setShowSlashMenu(false);
      }
    };

    if (showSlashMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSlashMenu]);

  return {
    showSlashMenu,
    slashMenuPosition,
    slashFilter,
    slashMenuIndex,
    editingQuestionId,
    filteredFieldTypes,
    slashMenuRef,
    handleQuestionLabelChange,
    handleSlashMenuKeyDown,
    setShowSlashMenu,
    setSlashFilter,
    setSlashMenuIndex,
  };
}
