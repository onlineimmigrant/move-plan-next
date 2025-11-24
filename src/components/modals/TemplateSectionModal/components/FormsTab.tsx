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
  
  // Slash command state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [hoveredQuestion, setHoveredQuestion] = useState<string | null>(null);
  const [showDescriptionFor, setShowDescriptionFor] = useState<Set<string>>(new Set());
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
          settings: formSettings,
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
      id: `q_${Date.now()}`,
      type,
      label: '',
      required: false,
      order_index: questions.length,
      options: ['multiple', 'checkbox', 'dropdown', 'rating'].includes(type) ? ['Option 1'] : undefined,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion.id);
  };

  const addQuestionAfter = (afterId: string) => {
    const index = questions.findIndex(q => q.id === afterId);
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      type: 'text',
      label: '',
      required: false,
      order_index: index + 1,
    };
    const newQuestions = [...questions];
    newQuestions.splice(index + 1, 0, newQuestion);
    setQuestions(newQuestions);
    setSelectedQuestion(newQuestion.id);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    if (selectedQuestion === id) {
      setSelectedQuestion(null);
    }
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
  };

  // Slash command helpers
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
        {/* Back to Form Selector */}
        <div className="flex items-center gap-2 pt-6">
          <button
            onClick={() => {
              onFormIdChange(null);
              setShowFormSelector(true);
            }}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Forms
          </button>
        </div>

        {/* WYSIWYG Form Preview Style - Title & Description */}
        <div className="space-y-6 py-8">
          <input
            type="text"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            placeholder="Form title"
            className="w-full text-5xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300"
            style={{ padding: 0 }}
          />
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            placeholder="Form description (optional)"
            rows={2}
            className="w-full text-xl text-gray-600 bg-transparent border-none outline-none focus:ring-0 resize-none placeholder-gray-300"
            style={{ padding: 0 }}
          />
        </div>

      {/* Questions List - WYSIWYG Inline Editing */}
      <div className="space-y-8 pb-6">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="group relative pl-20"
            onMouseEnter={() => setHoveredQuestion(question.id)}
            onMouseLeave={() => setHoveredQuestion(null)}
          >
            {/* Hover Controls - Left Side (always 80px from left) */}
            <div className="absolute left-0 top-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => deleteQuestion(question.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete question"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => addQuestionAfter(question.id)}
                className="p-2 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors"
                title="Add question after"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
              <button
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg cursor-move transition-colors"
                title="Drag to reorder"
              >
                <Bars3Icon className="h-4 w-4" />
              </button>
            </div>

            {/* Question Content */}
            <div>
              {/* Question Number & Type - Show on Hover */}
              {hoveredQuestion === question.id && (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-gray-400">
                    Q{index + 1}
                  </span>
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
                </div>
              )}
              
              {/* Question Label - Inline Editable */}
              <div className="relative">
                <input
                  type="text"
                  value={question.label}
                  onChange={(e) => handleQuestionLabelChange(question.id, e.target.value, e)}
                  onKeyDown={(e) => handleSlashMenuKeyDown(e, question.id)}
                  placeholder="Type your question here..."
                  className="w-full text-3xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300 p-0"
                />
                
                {/* Slash Command Menu */}
                {showSlashMenu && editingQuestionId === question.id && (
                  <div
                    ref={slashMenuRef}
                    className="absolute z-50 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200/80 overflow-hidden"
                    style={{ top: '100%', right: 0 }}
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
                  className="w-full text-lg text-gray-500 bg-transparent border-none outline-none focus:ring-0 placeholder-gray-300 mt-2 p-0"
                />
              )}

              {/* Options Editor - Inline for choice fields */}
              {['multiple', 'checkbox', 'dropdown'].includes(question.type) && (
                <div className="mt-4 space-y-2">
                  {(question.options || []).map((option, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2 group/option">
                      <span className="text-gray-400 text-sm">{optIdx + 1}.</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(question.options || [])];
                          newOptions[optIdx] = e.target.value;
                          updateQuestion(question.id, { options: newOptions });
                        }}
                        className="flex-1 text-lg text-gray-700 bg-transparent border-none outline-none focus:ring-0 p-0"
                        placeholder={`Option ${optIdx + 1}`}
                      />
                      <button
                        onClick={() => {
                          const newOptions = (question.options || []).filter((_, i) => i !== optIdx);
                          updateQuestion(question.id, { options: newOptions });
                        }}
                        className="opacity-0 group-hover/option:opacity-100 p-1 text-red-400 hover:text-red-600 transition-opacity"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newOptions = [...(question.options || []), `Option ${(question.options?.length || 0) + 1}`];
                      updateQuestion(question.id, { options: newOptions });
                    }}
                    className="text-sm text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    + Add option
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {/* Add First Question Prompt */}
        {questions.length === 0 && (
          <button
            onClick={() => addQuestion('text')}
            className="w-full py-12 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50/50 transition-all text-gray-400 hover:text-purple-600"
          >
            <PlusIcon className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm font-medium">Click to add your first question</p>
            <p className="text-xs mt-1">or type / in any question field</p>
          </button>
        )}
      </div>
      </div>

      {/* Footer - Matching Template Section Edit Modal */}
      <div className="flex-shrink-0 px-6 py-4 border-t border-white/20 dark:border-gray-700/20 bg-white/30 dark:bg-gray-800/30">
        <div className="flex items-center justify-between w-full gap-3">
          {/* Left side - Published checkbox & Question count */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Published</span>
              <span className="text-xs text-gray-500">
                {published ? '(Live)' : '(Draft)'}
              </span>
            </label>
            <span className="text-sm text-gray-500">
              {questions.length} {questions.length === 1 ? 'Question' : 'Questions'}
            </span>
          </div>
          
          {/* Right side - Save Form button */}
          <div className="flex items-center gap-3 ml-auto">
            <Button
              onClick={saveForm}
              disabled={!formTitle.trim() || loading}
              variant="primary"
              className="px-6 py-2"
            >
              {loading ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
