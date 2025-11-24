/**
 * FormsTab - Form builder interface for FormHarmony sections
 * Allows creating and editing form questions with conditional logic
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  Bars3Icon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  AtSymbolIcon,
  DocumentIcon,
  PhoneIcon,
  LinkIcon,
  HashtagIcon,
  CalendarIcon,
  CheckCircleIcon,
  ListBulletIcon,
  Squares2X2Icon,
  ChevronDownIcon,
  StarIcon,
  PaperClipIcon,
} from '@heroicons/react/24/outline';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';

interface Question {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'tel' | 'url' | 'number' | 'date' | 'yesno' | 'multiple' | 'checkbox' | 'dropdown' | 'rating' | 'file';
  label: string;
  description?: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  logic_show_if?: string;
  logic_value?: string;
  validation?: Record<string, any>;
  order_index: number;
}

interface FormsTabProps {
  formId?: string | null;
  onFormIdChange: (formId: string | null) => void;
  onSaveForm?: () => void; // Callback to notify parent that form should be saved
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text', Icon: DocumentTextIcon, description: 'Single line text input' },
  { value: 'email', label: 'Email', Icon: AtSymbolIcon, description: 'Email address' },
  { value: 'textarea', label: 'Long Text', Icon: DocumentIcon, description: 'Multi-line text area' },
  { value: 'tel', label: 'Phone', Icon: PhoneIcon, description: 'Phone number' },
  { value: 'url', label: 'Website URL', Icon: LinkIcon, description: 'Web address' },
  { value: 'number', label: 'Number', Icon: HashtagIcon, description: 'Numeric input' },
  { value: 'date', label: 'Date', Icon: CalendarIcon, description: 'Date picker' },
  { value: 'yesno', label: 'Yes/No', Icon: CheckCircleIcon, description: 'Binary choice' },
  { value: 'multiple', label: 'Multiple Choice', Icon: ListBulletIcon, description: 'Select one option' },
  { value: 'checkbox', label: 'Checkboxes', Icon: Squares2X2Icon, description: 'Select multiple options' },
  { value: 'dropdown', label: 'Dropdown', Icon: ChevronDownIcon, description: 'Dropdown menu' },
  { value: 'rating', label: 'Rating', Icon: StarIcon, description: 'Star rating (1-5)' },
  { value: 'file', label: 'File Upload', Icon: PaperClipIcon, description: 'Upload files' },
] as const;

export default function FormsTab({ formId, onFormIdChange, onSaveForm }: FormsTabProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSettings, setFormSettings] = useState<any>({});
  const [published, setPublished] = useState(false);
  const [availableForms, setAvailableForms] = useState<any[]>([]);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'autosaving' | 'saved' | 'error'>('idle');
  const didHydrateRef = React.useRef(false);
  const autosaveTimeoutRef = React.useRef<number | null>(null);
  
  // Slash command state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
  const [showDescriptionFor, setShowDescriptionFor] = useState<Set<string>>(new Set());
  const [showLogicFor, setShowLogicFor] = useState<Set<string>>(new Set());
  const slashMenuRef = React.useRef<HTMLDivElement>(null);

  const toggleDescription = (questionId: string) => {
    setShowDescriptionFor(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  // Load all available forms
  useEffect(() => {
    loadAvailableForms();
  }, []);

  // Load form data if formId exists
  useEffect(() => {
    if (formId) {
      loadForm(formId);
      setShowFormSelector(false);
    } else {
      // Show selector for new sections or when no form is selected
      setShowFormSelector(true);
      // Initialize with empty form
      setQuestions([]);
      setFormTitle('');
      setFormDescription('');
    }
  }, [formId]);

  const loadAvailableForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setAvailableForms(data.forms || []);
      }
    } catch (error) {
      console.error('Error loading forms:', error);
    }
  };

  const loadForm = async (id: string) => {
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
        // Load design style from settings
        setDesignStyle(data.form.settings?.designStyle || 'large');
      }
    } catch (error) {
      console.error('Error loading form:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewForm = async () => {
    try {
      const response = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle || 'Untitled Form',
          description: formDescription || '',
          settings: { ...formSettings, designStyle },
          published: published,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onFormIdChange(data.form.id);
        loadAvailableForms(); // Refresh the forms list
      }
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const saveForm = async () => {
    if (!formId) {
      await createNewForm();
      return;
    }

    setLoading(true);
    try {
      // Normalize ephemeral IDs before save so logic references persist
      let normalizedQuestions = questions;
      const ephemeralIds = questions.filter(q => q.id.startsWith('q_')).map(q => q.id);
      if (ephemeralIds.length > 0) {
        const idMap: Record<string, string> = {};
        normalizedQuestions = questions.map(q => {
          if (q.id.startsWith('q_')) {
            const newId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            idMap[q.id] = newId;
            return { ...q, id: newId };
          }
          return q;
        });
        // Remap logic rule references
        normalizedQuestions = normalizedQuestions.map(q => {
          const logic = q.validation?.logic as undefined | { combinator: 'all' | 'any'; rules: { leftQuestionId: string; operator: string; value?: string }[] };
          if (logic && Array.isArray(logic.rules)) {
            const remapped = logic.rules.map((r: { leftQuestionId: string; operator: string; value?: string }) => ({ ...r, leftQuestionId: idMap[r.leftQuestionId] || r.leftQuestionId }));
            return { ...q, validation: { ...(q.validation || {}), logic: { ...logic, rules: remapped } } };
          }
          return q;
        });
        // Update local state so UI stays in sync after save
        setQuestions(normalizedQuestions);
      }
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          settings: { ...formSettings, designStyle },
          published: published,
          questions: normalizedQuestions.map((q, idx) => ({ ...q, order_index: idx })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save form');
      }
      
      loadAvailableForms(); // Refresh the forms list
    } catch (error) {
      console.error('Error saving form:', error);
      alert('Failed to save form');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = (type: Question['type']) => {
    const newQuestion: Question = {
      id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type,
      label: '',
      required: false,
      order_index: questions.length,
      options: ['multiple', 'checkbox', 'dropdown', 'rating'].includes(type) ? ['Option 1'] : undefined,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion.id);
    setDirty(true);
  };

  const addQuestionAfter = (afterId: string) => {
    const index = questions.findIndex(q => q.id === afterId);
    const newQuestion: Question = {
      id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : `uuid_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type: 'text',
      label: '',
      required: false,
      order_index: index + 1,
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setQuestions(newQuestions);
    setSelectedQuestion(newQuestion.id);
    setDirty(true);
  };

  // (addQuestionBefore removed; plus control now always inserts below using addQuestionAfter)

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
    setDirty(true);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (selectedQuestion === id) {
      setSelectedQuestion(null);
    }
    setDirty(true);
  };

  const duplicateQuestion = (id: string) => {
    const question = questions.find(q => q.id === id);
    if (question) {
      const duplicate: Question = {
        ...question,
        id: `q_${Date.now()}`,
        label: `${question.label} (Copy)`,
        order_index: questions.length,
      };
      setQuestions([...questions, duplicate]);
      setDirty(true);
    }
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const index = questions.findIndex(q => q.id === id);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    setQuestions(newQuestions);
    setDirty(true);
  };

  // Conditional Logic helpers
  type LogicOperator = 'is' | 'is_not' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'answered' | 'not_answered';
  type LogicRule = { leftQuestionId: string; operator: LogicOperator; value?: string };
  type LogicGroup = { combinator: 'all' | 'any'; rules: LogicRule[] };

  const ensureLogicGroup = (q: Question): LogicGroup => {
    const current = (q.validation?.logic as LogicGroup | undefined);
    return current && Array.isArray(current.rules)
      ? current
      : { combinator: 'all', rules: [] };
  };

  const setQuestionLogic = (questionId: string, updater: (lg: LogicGroup) => LogicGroup) => {
    const q = questions.find(x => x.id === questionId);
    if (!q) return;
    const next = updater(ensureLogicGroup(q));
    updateQuestion(questionId, { validation: { ...(q.validation || {}), logic: next } });
  };

  const toggleLogic = (questionId: string) => {
    setShowLogicFor(prev => {
      const n = new Set(prev);
      if (n.has(questionId)) n.delete(questionId); else n.add(questionId);
      return n;
    });
  };

  const logicSummary = (q: Question) => {
    const lg = ensureLogicGroup(q);
    // If no rules, return empty string so summary stays hidden
    if (!lg.rules.length) return '';
    const joiner = lg.combinator === 'all' ? 'AND' : 'OR';
    const parts = lg.rules.map(rule => {
      const ref = questions.find(x => x.id === rule.leftQuestionId);
      const refLabel = ref?.label || 'Untitled';
      const opMap: Record<LogicOperator, string> = {
        is: 'is', is_not: 'is not', contains: 'contains', not_contains: 'does not contain',
        gt: '>', lt: '<', answered: 'is answered', not_answered: 'is not answered'
      };
      const val = (rule.operator === 'answered' || rule.operator === 'not_answered') ? '' : ` "${rule.value || ''}"`;
      return `${refLabel} ${opMap[rule.operator]}${val}`;
    });
    return parts.join(` ${joiner} `);
  };

  // Slash command helpers
  // Builder Logic Preview State
  const [previewMode, setPreviewMode] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, string>>({});
  
  // Design Style State
  const [designStyle, setDesignStyle] = useState<'large' | 'compact'>('large');

  const evaluateRulePreview = (rule: { leftQuestionId: string; operator: LogicOperator; value?: string }) => {
    const refAnswer = (previewAnswers[rule.leftQuestionId] ?? '').toString();
    const value = (rule.value ?? '').toString();
    switch (rule.operator) {
      case 'is': return refAnswer === value;
      case 'is_not': return refAnswer !== value;
      case 'contains': return refAnswer.toLowerCase().includes(value.toLowerCase());
      case 'not_contains': return !refAnswer.toLowerCase().includes(value.toLowerCase());
      case 'gt': return Number(refAnswer) > Number(value);
      case 'lt': return Number(refAnswer) < Number(value);
      case 'answered': return !!refAnswer && refAnswer.length > 0;
      case 'not_answered': return !(!!refAnswer && refAnswer.length > 0);
      default: return true;
    }
  };
  const passesLogicPreview = (q: Question) => {
    const lg = q.validation?.logic as undefined | { combinator: 'all' | 'any'; rules: { leftQuestionId: string; operator: LogicOperator; value?: string }[] };
    if (lg && lg.rules.length) {
      const results = lg.rules.map(evaluateRulePreview);
      return lg.combinator === 'all' ? results.every(Boolean) : results.some(Boolean);
    }
    return true;
  };
  const filteredFieldTypes = FIELD_TYPES.filter(field => 
    field.label.toLowerCase().includes(slashFilter.toLowerCase()) ||
    field.value.toLowerCase().includes(slashFilter.toLowerCase())
  );

  const handleQuestionLabelChange = (id: string, value: string, e?: React.ChangeEvent<HTMLInputElement>) => {
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
            left: rect.left + window.scrollX
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
    
    updateQuestion(id, { label: value });
  };

  const handleSlashMenuKeyDown = (e: React.KeyboardEvent, questionId: string) => {
    if (!showSlashMenu) return;
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSlashMenuIndex(prev => Math.min(prev + 1, filteredFieldTypes.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSlashMenuIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && filteredFieldTypes.length > 0) {
      e.preventDefault();
      selectFieldType(questionId, filteredFieldTypes[slashMenuIndex].value as Question['type']);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowSlashMenu(false);
    }
  };

  const selectFieldType = (questionId: string, type: Question['type']) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Remove the slash command from label
    const slashIndex = question.label.lastIndexOf('/');
    const newLabel = slashIndex !== -1 
      ? question.label.substring(0, slashIndex).trim()
      : question.label;
    
    updateQuestion(questionId, { 
      type,
      label: newLabel,
      options: ['multiple', 'checkbox', 'dropdown', 'rating'].includes(type) ? ['Option 1'] : undefined
    });
    
    setShowSlashMenu(false);
    setSlashFilter('');
  };

  // Debounced autosave
  const saveFormSilent = async () => {
    if (!formId) {
      if (!formTitle.trim()) return; // don't create unnamed forms via autosave
      await createNewForm();
      setDirty(false);
      setSaveState('saved');
      return;
    }
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          settings: formSettings,
          published: published,
          questions: questions.map((q, idx) => ({ ...q, order_index: idx })),
        }),
      });
      if (!response.ok) throw new Error('Autosave failed');
      setDirty(false);
      setSaveState('saved');
      window.setTimeout(() => setSaveState('idle'), 1200);
    } catch (err) {
      setSaveState('error');
    }
  };

  useEffect(() => {
    // skip first mount to avoid autosaving initial load
    if (!didHydrateRef.current) {
      didHydrateRef.current = true;
      return;
    }
    // schedule autosave
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }
    setSaveState('autosaving');
    autosaveTimeoutRef.current = window.setTimeout(() => {
      if (!loading) {
        saveFormSilent();
      }
    }, 500);
    return () => {
      if (autosaveTimeoutRef.current) window.clearTimeout(autosaveTimeoutRef.current);
    };
  }, [formTitle, formDescription, questions, published, formSettings]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isMeta = navigator.platform.toLowerCase().includes('mac') ? e.metaKey : e.ctrlKey;
      if (isMeta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveForm();
      }
      if (isMeta && (e.key === 'Enter' || e.key === 'N')) {
        e.preventDefault();
        if (selectedQuestion) {
          addQuestionAfter(selectedQuestion);
        } else {
          addQuestion('text');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedQuestion, formTitle, formDescription, questions, published]);

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

  // Close slash menu when clicking outside
  React.useEffect(() => {
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

  const selectedQuestionData = questions.find(q => q.id === selectedQuestion);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // Form Selector View
  if (showFormSelector) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Select or Create a Form</h3>
            <p className="text-sm text-gray-500 mt-1">Choose an existing form or create a new one</p>
          </div>
        </div>

        {/* Existing Forms */}
        {availableForms.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Existing Forms</h4>
            <div className="grid gap-3">
              {availableForms.map((form) => (
                <button
                  key={form.id}
                  onClick={() => {
                    onFormIdChange(form.id);
                    setShowFormSelector(false);
                  }}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-gray-900 truncate">{form.title}</h5>
                      {form.published && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Published
                        </span>
                      )}
                      {!form.published && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                          Draft
                        </span>
                      )}
                    </div>
                    {form.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{form.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Created {new Date(form.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create New Form */}
        <div className="border-t pt-6">
          <button
            onClick={() => {
              setFormTitle('');
              setFormDescription('');
              setQuestions([]);
              setPublished(false);
              setShowFormSelector(false);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-gray-700 hover:text-purple-700 font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            Create New Form
          </button>
        </div>
      </div>
    );
  }

  // Form Editor View
  return (
    <div className="absolute left-0 right-0 bottom-0 flex flex-col bg-white dark:bg-gray-800" style={{ top: 0 }}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">
        {/* Minimal Header */}
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <button
              onClick={() => {
                if (dirty && !confirm('You have unsaved changes. Leave without saving?')) return;
                onFormIdChange(null);
                setShowFormSelector(true);
              }}
              className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              aria-label="Back to Forms"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Forms
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setDesignStyle(s => s === 'large' ? 'compact' : 'large');
                  setDirty(true);
                }}
                className={`text-xs px-2 py-1 rounded border transition-colors ${designStyle === 'compact' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                aria-label="Toggle design style"
                title="Toggle design style"
              >
                {designStyle === 'large' ? 'Design: Large' : 'Design: Compact'}
              </button>
              <button
                onClick={() => setPreviewMode(m => !m)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${previewMode ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}
                aria-label="Toggle logic preview"
                title="Toggle logic preview"
              >
                {previewMode ? 'Logic Preview: ON' : 'Logic Preview'}
              </button>
              {previewMode && (
                <button
                  onClick={() => setPreviewAnswers({})}
                  className="text-xs px-2 py-1 rounded border bg-gray-50 text-gray-500 hover:bg-gray-100"
                  aria-label="Clear preview answers"
                  title="Clear preview answers"
                >
                  Clear Answers
                </button>
              )}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => { setPublished(e.target.checked); setDirty(true); }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</span>
                <span className="text-xs text-gray-500">{published ? '(Live)' : '(Draft)'}</span>
              </label>
              <span className="text-sm text-gray-500">
                {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
              </span>
              <Button
                onClick={saveForm}
                disabled={!formTitle.trim() || loading}
                variant="primary"
                className="px-4 py-2"
              >
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
        {/* WYSIWYG Form Title & Description */}
        <div className="space-y-6 py-8 pl-[108px]">
          <input
            type="text"
            value={formTitle}
            onChange={(e) => { setFormTitle(e.target.value); setDirty(true); }}
            placeholder="Untitled Form"
            className={`w-full bg-transparent border-none outline-none focus:ring-0 ${designStyle === 'large' ? 'text-4xl' : 'text-2xl'}`}
            style={{ 
              padding: 0,
              fontWeight: formTitle ? 700 : 300,
              color: formTitle ? '#111827' : '#d1d5db'
            }}
          />
          <textarea
            value={formDescription}
            onChange={(e) => { setFormDescription(e.target.value); setDirty(true); }}
            placeholder="Form description (optional)"
            rows={2}
            className={`w-full bg-transparent border-none outline-none focus:ring-0 resize-none ${designStyle === 'large' ? 'text-xl' : 'text-base'}`}
            style={{ 
              padding: 0,
              fontWeight: formDescription ? 400 : 300,
              color: formDescription ? '#6b7280' : '#d1d5db'
            }}
          />
        </div>

      {/* Questions List - WYSIWYG Inline Editing */}
      <div className="space-y-8 pb-6">
        {questions.map((question, index) => {
          const hiddenByLogic = previewMode && !passesLogicPreview(question);
          return (
          <div
            key={question.id}
            className={`group relative ${hiddenByLogic ? 'opacity-40 grayscale' : ''}`}
            onMouseEnter={() => setHoveredQuestion(question.id)}
            onMouseLeave={() => setHoveredQuestion(null)}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); }}
          >
            {/* Controls divider ABOVE question */}
            <div
              className="relative mb-6 h-8"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('ring-1', 'ring-purple-300');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('ring-1', 'ring-purple-300');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('ring-1', 'ring-purple-300');
                const draggedId = e.dataTransfer.getData('text/plain');
                const draggedIndex = questions.findIndex(q => q.id === draggedId);
                const insertIndex = index; // insert BEFORE current question (drag)
                if (draggedIndex !== -1 && draggedIndex !== insertIndex) {
                  const newQuestions = [...questions];
                  const [removed] = newQuestions.splice(draggedIndex, 1);
                  newQuestions.splice(insertIndex > draggedIndex ? insertIndex - 1 : insertIndex, 0, removed);
                  setQuestions(newQuestions);
                }
              }}
            >
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-dashed border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <div className="bg-white dark:bg-gray-800 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <button
                    onClick={() => addQuestionAfter(question.id)}
                    className="p-1 text-gray-500 hover:text-purple-600"
                    title="Add question below"
                    aria-label="Add question below"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => toggleLogic(question.id)}
                    className={`p-1 rounded transition-colors ${showLogicFor.has(question.id) ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : ensureLogicGroup(question).rules.length ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-500 hover:text-blue-600'}`}
                    title={showLogicFor.has(question.id) ? 'Hide logic editor' : (ensureLogicGroup(question).rules.length ? 'Edit logic rules' : 'Add logic condition')}
                    aria-label="Add or edit logic"
                  >
                    <Cog6ToothIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="p-1 text-gray-500 hover:text-red-600"
                    title="Delete this question"
                    aria-label="Delete this question"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  <button
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', question.id);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 cursor-grab active:cursor-grabbing"
                    title="Drag to reorder"
                    aria-label="Drag to reorder"
                  >
                    <Bars3Icon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Question Content */}
            <div className="pl-[108px]">
              {previewMode && (
                <div className="absolute -left-[108px] top-0 w-[100px] pr-2 flex flex-col gap-1 items-end">
                  <input
                    type="text"
                    value={previewAnswers[question.id] || ''}
                    onChange={(e) => setPreviewAnswers(a => ({ ...a, [question.id]: e.target.value }))}
                    placeholder={hiddenByLogic ? 'Hidden' : 'Preview answer'}
                    className="w-full text-[10px] px-2 py-1 rounded border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {hiddenByLogic && (
                    <span className="text-[10px] text-red-500 font-medium">Hidden by logic</span>
                  )}
                </div>
              )}
              {/* Question Number - Always Visible */}
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-purple-50 text-purple-700 border border-purple-200/50 shadow-sm">
                  Q{index + 1}
                </span>
                
                {/* Type, Required, Description - Show on Hover */}
                {hoveredQuestion === question.id && (
                  <>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      {FIELD_TYPES.find(f => f.value === question.type)?.label}
                    </span>
                    
                    {/* Required Toggle */}
                    <button
                      onClick={() => updateQuestion(question.id, { required: !question.required })}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        question.required 
                          ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {question.required ? 'Required' : 'Optional'}
                    </button>
                    
                    {/* Description Toggle */}
                    <button
                      onClick={() => toggleDescription(question.id)}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        showDescriptionFor.has(question.id) || question.description
                          ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      Description
                    </button>
                  </>
                )}
              </div>
              
              {/* Question Label - Inline Editable */}
              <div className="relative">
                <input
                  type="text"
                  value={question.label}
                  onChange={(e) => handleQuestionLabelChange(question.id, e.target.value, e)}
                  onKeyDown={(e) => handleSlashMenuKeyDown(e, question.id)}
                  placeholder="Type your question here..."
                  className={`w-full bg-transparent border-none outline-none focus:ring-0 p-0 ${designStyle === 'large' ? 'text-3xl' : 'text-xl'}`}
                  style={{
                    fontWeight: question.label ? 600 : 300,
                    color: question.label ? '#111827' : '#d1d5db'
                  }}
                />
                
                {/* Slash Command Menu */}
                {showSlashMenu && editingQuestionId === question.id && (
                  <div
                    ref={slashMenuRef}
                    className="absolute z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200/80 overflow-hidden"
                    style={{
                      bottom: '100%',
                      left: 0,
                      marginBottom: '6px',
                      maxHeight: '70vh'
                    }}
                  >
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/80 border-b border-gray-100">
                      Question Types
                    </div>
                    <div className="py-1 max-h-80 overflow-y-auto">
                      {filteredFieldTypes.map((field, idx) => {
                        const IconComponent = field.Icon;
                        return (
                          <button
                            key={field.value}
                            onClick={() => selectFieldType(question.id, field.value as Question['type'])}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                              idx === slashMenuIndex 
                                ? 'bg-gradient-to-r from-purple-50 to-transparent border-l-2 border-purple-500' 
                                : 'hover:bg-gray-50/80'
                            }`}
                            onMouseEnter={() => setSlashMenuIndex(idx)}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                              idx === slashMenuIndex ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{field.label}</div>
                              <div className="text-xs text-gray-500 truncate">{field.description}</div>
                            </div>
                            {idx === slashMenuIndex && (
                              <kbd className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 text-gray-600 rounded border border-gray-200">⏎</kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {filteredFieldTypes.length === 0 && (
                      <div className="px-3 py-8 text-center text-sm text-gray-400">
                        No matching types
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description Field - Show when toggled or has content */}
              {(showDescriptionFor.has(question.id) || question.description) && (
                <input
                  type="text"
                  value={question.description || ''}
                  onChange={(e) => updateQuestion(question.id, { description: e.target.value })}
                  placeholder="Add helpful description text..."
                  className={`w-full bg-transparent border-none outline-none focus:ring-0 mt-2 p-0 ${designStyle === 'large' ? 'text-lg' : 'text-sm'}`}
                  style={{
                    fontWeight: question.description ? 400 : 300,
                    color: question.description ? '#6b7280' : '#d1d5db'
                  }}
                />
              )}

              {/* Logic Summary (hidden if no rules) */}
              {ensureLogicGroup(question).rules.length > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {logicSummary(question)}
                  </span>
                </div>
              )}

              {/* Logic Editor */}
              {showLogicFor.has(question.id) && (
                <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-white/70 dark:bg-gray-800/70">
                  <div className="flex items-center gap-2 text-sm text-gray-700 mb-3">
                    <span>Show this question if</span>
                    <select
                      className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                      value={ensureLogicGroup(question).combinator}
                      onChange={(e) => setQuestionLogic(question.id, lg => ({ ...lg, combinator: (e.target.value as 'all'|'any') }))}
                    >
                      <option value="all">all</option>
                      <option value="any">any</option>
                    </select>
                    <span>of the following are true:</span>
                  </div>

                  <div className="space-y-2">
                    {ensureLogicGroup(question).rules.map((rule, rIdx) => {
                      const refQ = questions.find(q => q.id === rule.leftQuestionId) || null;
                      const hasOptions = !!refQ?.options?.length;
                      const operator = rule.operator;
                      return (
                        <div key={rIdx} className="flex items-center gap-2">
                          {/* Left question select */}
                          <select
                            className="min-w-[10rem] border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                            value={rule.leftQuestionId}
                            onChange={(e) => setQuestionLogic(question.id, lg => {
                              const rules = [...lg.rules];
                              rules[rIdx] = { ...rules[rIdx], leftQuestionId: e.target.value };
                              return { ...lg, rules };
                            })}
                          >
                            <option value="" disabled>Select question…</option>
                            {questions
                              .slice(0, index) // only earlier questions
                              .map(q => (
                                <option key={q.id} value={q.id}>{q.label || 'Untitled'}</option>
                              ))}
                          </select>

                          {/* Operator */}
                          <select
                            className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                            value={operator}
                            onChange={(e) => setQuestionLogic(question.id, lg => {
                              const rules = [...lg.rules];
                              rules[rIdx] = { ...rules[rIdx], operator: e.target.value as any };
                              return { ...lg, rules };
                            })}
                          >
                            <option value="is">is</option>
                            <option value="is_not">is not</option>
                            <option value="contains">contains</option>
                            <option value="not_contains">does not contain</option>
                            <option value="gt">&gt;</option>
                            <option value="lt">&lt;</option>
                            <option value="answered">is answered</option>
                            <option value="not_answered">is not answered</option>
                          </select>

                          {/* Value */}
                          {!(operator === 'answered' || operator === 'not_answered') && (
                            hasOptions ? (
                              <select
                                className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                                value={rule.value || ''}
                                onChange={(e) => setQuestionLogic(question.id, lg => {
                                  const rules = [...lg.rules];
                                  rules[rIdx] = { ...rules[rIdx], value: e.target.value };
                                  return { ...lg, rules };
                                })}
                              >
                                <option value="" disabled>Select value…</option>
                                {(refQ?.options || []).map((opt, i) => (
                                  <option key={i} value={opt}>{opt || `Option ${i+1}`}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                className="border border-gray-300 text-sm rounded px-2 py-1 bg-white"
                                placeholder="Value…"
                                value={rule.value || ''}
                                onChange={(e) => setQuestionLogic(question.id, lg => {
                                  const rules = [...lg.rules];
                                  rules[rIdx] = { ...rules[rIdx], value: e.target.value };
                                  return { ...lg, rules };
                                })}
                              />
                            )
                          )}

                          {/* Remove rule */}
                          <button
                            className="ml-1 text-gray-400 hover:text-red-600"
                            title="Remove rule"
                            onClick={() => setQuestionLogic(question.id, lg => ({ ...lg, rules: lg.rules.filter((_, i) => i !== rIdx) }))}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="text-sm px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                      onClick={() => setQuestionLogic(question.id, lg => ({ ...lg, rules: [...lg.rules, { leftQuestionId: questions.slice(0, index)[0]?.id || '', operator: 'is', value: '' }] }))}
                    >
                      Add condition
                    </button>
                    {ensureLogicGroup(question).rules.length > 0 && (
                      <span className="text-xs text-gray-400">{ensureLogicGroup(question).rules.length} rule(s)</span>
                    )}
                  </div>
                </div>
              )}
              {/* Options Editor - Inline for choice fields */}
              {['multiple', 'checkbox', 'dropdown'].includes(question.type) && (
                <div className="mt-4 space-y-2">
                  {(question.options || []).map((option, optIdx) => (
                    <div 
                      key={optIdx} 
                      className="flex items-center gap-2 group/option"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', optIdx.toString());
                        e.currentTarget.classList.add('opacity-50');
                      }}
                      onDragEnd={(e) => {
                        e.currentTarget.classList.remove('opacity-50');
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-t-2', 'border-purple-500');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-t-2', 'border-purple-500');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-t-2', 'border-purple-500');
                        const draggedIdx = parseInt(e.dataTransfer.getData('text/plain'));
                        const targetIdx = optIdx;
                        
                        if (draggedIdx !== targetIdx) {
                          const newOptions = [...(question.options || [])];
                          const [removed] = newOptions.splice(draggedIdx, 1);
                          newOptions.splice(targetIdx, 0, removed);
                          updateQuestion(question.id, { options: newOptions });
                        }
                      }}
                    >
                      <button
                        onClick={() => {
                          const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                          updateQuestion(question.id, { options: newOptions });
                        }}
                        className="opacity-0 group-hover/option:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Delete option"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing opacity-0 group-hover/option:opacity-100 transition-opacity"
                        title="Drag to reorder"
                      >
                        <Bars3Icon className="h-4 w-4" />
                      </button>
                      <span className="text-gray-400 text-sm">{optIdx + 1}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(question.options || [])];
                          newOptions[optIdx] = e.target.value;
                          updateQuestion(question.id, { options: newOptions });
                        }}
                        className={`flex-1 text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0 ${designStyle === 'large' ? 'text-lg' : 'text-base'}`}
                        placeholder={`Option ${optIdx + 1}`}
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(question.options || []), ''];
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    className={`text-gray-400 hover:text-purple-600 transition-colors ${designStyle === 'large' ? 'text-sm' : 'text-xs'}`}
                  >
                    + Add option
                  </button>
                </div>
              )}
            </div>

          </div>
        );})}
        
        {/* Add First Question Prompt */}
        {questions.length === 0 && (
          <button
            onClick={() => addQuestion('text')}
            className={`w-full border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-all text-gray-400 hover:text-purple-600 ${designStyle === 'large' ? 'py-12' : 'py-8'}`}
          >
            <PlusIcon className={designStyle === 'large' ? 'h-8 w-8 mx-auto mb-2' : 'h-6 w-6 mx-auto mb-2'} />
            <p className={`font-medium ${designStyle === 'large' ? 'text-sm' : 'text-xs'}`}>Click to add your first question</p>
            <p className={`mt-1 ${designStyle === 'large' ? 'text-xs' : 'text-[10px]'}`}>or type / in any question field</p>
          </button>
        )}
        </div>
        </div>
      </div>

      {/* Floating save status chip */}
      {(saveState !== 'idle' || dirty) && (
        <div className="fixed bottom-4 right-6 z-20">
          <div className={`px-3 py-1.5 rounded-full text-xs font-medium shadow-md border ${
            saveState === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : saveState === 'autosaving'
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : saveState === 'saved'
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}>
            {saveState === 'autosaving' && 'Autosaving…'}
            {saveState === 'saved' && 'Saved'}
            {saveState === 'error' && 'Save failed'}
            {saveState === 'idle' && dirty && 'Unsaved changes'}
          </div>
        </div>
      )}

      {/* Footer removed in favor of minimal header (Tally-style) */}
    </div>
  );
}

