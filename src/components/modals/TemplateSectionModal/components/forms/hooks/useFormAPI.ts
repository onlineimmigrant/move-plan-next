/**
 * useFormAPI - API operations for loading and saving forms
 */

import { useState, useCallback } from 'react';
import type { Question, FormSettings } from '../types';
import { remapEphemeralIds } from '../questionUtils';

interface UseFormAPIProps {
  formId: string | null;
  formTitle: string;
  formDescription: string;
  formSettings: FormSettings;
  published: boolean;
  questions: Question[];
  onFormIdChange: (id: string) => void;
  setFormTitle: (title: string) => void;
  setFormDescription: (description: string) => void;
  setFormSettings: (settings: FormSettings) => void;
  setPublished: (published: boolean) => void;
  setQuestions: (questions: Question[]) => void;
}

interface UseFormAPIReturn {
  loading: boolean;
  saveState: 'idle' | 'autosaving' | 'saved' | 'error';
  availableForms: any[];
  loadAvailableForms: () => Promise<void>;
  loadForm: (id: string) => Promise<void>;
  createNewForm: () => Promise<void>;
  saveForm: () => Promise<void>;
  saveFormSilent: () => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  setSaveState: (state: 'idle' | 'autosaving' | 'saved' | 'error') => void;
}

export function useFormAPI({
  formId,
  formTitle,
  formDescription,
  formSettings,
  published,
  questions,
  onFormIdChange,
  setFormTitle,
  setFormDescription,
  setFormSettings,
  setPublished,
  setQuestions,
}: UseFormAPIProps): UseFormAPIReturn {
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'autosaving' | 'saved' | 'error'>('idle');
  const [availableForms, setAvailableForms] = useState<any[]>([]);

  const loadAvailableForms = useCallback(async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setAvailableForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  }, []);

  const loadForm = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setFormTitle(data.form.title || '');
        setFormDescription(data.form.description || '');
        setFormSettings(data.form.settings || {});
        setPublished(data.form.published || false);
        setQuestions(data.form.questions || []);
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  }, []); // React setState functions are stable, no need to include them in deps

  const createNewForm = useCallback(async () => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle || 'Untitled Form',
          description: formDescription || '',
          settings: formSettings,
          published: published,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onFormIdChange(data.form.id);
        await loadAvailableForms();
      }
    } catch (error) {
      console.error('Error creating form:', error);
    }
  }, [formTitle, formDescription, formSettings, published, onFormIdChange, loadAvailableForms]);

  const saveForm = useCallback(async () => {
    if (!formId) {
      await createNewForm();
      return;
    }

    setLoading(true);
    try {
      // Remap ephemeral IDs to permanent UUIDs
      const { questions: normalizedQuestions } = remapEphemeralIds(questions);

      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          settings: formSettings,
          published: published,
          questions: normalizedQuestions.map((q, idx) => ({ ...q, order_index: idx })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }

      // Update local state with normalized IDs
      setQuestions(normalizedQuestions);
      await loadAvailableForms();
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    } finally {
      setLoading(false);
    }
  }, [
    formId,
    formTitle,
    formDescription,
    formSettings,
    published,
    questions,
    createNewForm,
    setQuestions,
    loadAvailableForms,
  ]);

  const saveFormSilent = useCallback(async () => {
    if (!formId) {
      if (!formTitle.trim()) return;
      await createNewForm();
      setSaveState('saved');
      return;
    }

    try {
      const questionsToSave = questions.map((q, idx) => ({ ...q, order_index: idx }));
      console.log('💾 Saving form with questions:', questionsToSave.map(q => ({ 
        id: q.id, 
        type: q.type, 
        label: q.label, 
        options: q.options,
        question_library_id: q.question_library_id
      })));
      
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          settings: formSettings,
          published: published,
          questions: questionsToSave,
        }),
      });

      if (!response.ok) throw new Error('Autosave failed');

      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1200);
    } catch (err) {
      console.error('Autosave failed:', err);
      setSaveState('error');
    }
  }, [formId, formTitle, formDescription, formSettings, published, questions, createNewForm]);

  const deleteForm = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadAvailableForms();
        // If deleting current form, clear it
        if (id === formId) {
          onFormIdChange('');
          setQuestions([]);
          setFormTitle('');
          setFormDescription('');
        }
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  }, [formId, loadAvailableForms, onFormIdChange, setQuestions, setFormTitle, setFormDescription]);

  return {
    loading,
    saveState,
    availableForms,
    loadAvailableForms,
    loadForm,
    createNewForm,
    saveForm,
    saveFormSilent,
    deleteForm,
    setSaveState,
  };
}
