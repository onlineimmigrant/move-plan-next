/**
 * useKeyboardShortcuts - Keyboard shortcuts for form builder
 */

import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  currentStep: number;
  questionsLength: number;
  selectedQuestion: string | null;
  dirty: boolean;
  onSetCurrentStep: (step: number) => void;
  onSaveForm: () => void;
  onAddQuestion: (type: string) => void;
  onAddQuestionAfter: (afterId: string) => void;
}

export function useKeyboardShortcuts({
  currentStep,
  questionsLength,
  selectedQuestion,
  dirty,
  onSetCurrentStep,
  onSaveForm,
  onAddQuestion,
  onAddQuestionAfter,
}: UseKeyboardShortcutsProps) {
  // Keyboard navigation for stepped editor
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      
      if (e.key === 'ArrowLeft' && currentStep > 0) {
        e.preventDefault();
        onSetCurrentStep(currentStep - 1);
      } else if (e.key === 'ArrowRight' && currentStep < questionsLength - 1) {
        e.preventDefault();
        onSetCurrentStep(currentStep + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, questionsLength, onSetCurrentStep]);

  // Save and add question shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMeta = navigator.platform.toLowerCase().includes('mac') ? e.metaKey : e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSaveForm();
      }
      if (isMeta && (e.key === 'Enter' || e.key === 'N')) {
        e.preventDefault();
        if (selectedQuestion) {
          onAddQuestionAfter(selectedQuestion);
        } else {
          onAddQuestion('text');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedQuestion, onSaveForm, onAddQuestion, onAddQuestionAfter]);

  // Leave protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
