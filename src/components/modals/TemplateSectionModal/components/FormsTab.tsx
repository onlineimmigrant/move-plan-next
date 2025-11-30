/**
 * FormsTab - Form builder interface for FormHarmony sections
 * Allows creating and editing form questions with conditional logic
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal/ImageGalleryModal';
import { useSettings } from '@/context/SettingsContext';

// Import shared types and utilities
import type { Question, FormSettings } from './forms/types';
import { FIELD_TYPES, requiresOptions } from './forms/constants';
import {
  addQuestion as addQuestionUtil,
  addQuestionAfter as addQuestionAfterUtil,
  updateQuestion as updateQuestionUtil,
  deleteQuestion as deleteQuestionUtil,
  duplicateQuestion as duplicateQuestionUtil,
  moveQuestion as moveQuestionUtil,
} from './forms/questionUtils';
import {
  ensureLogicGroup,
  updateQuestionLogic,
  getLogicSummary,
} from './forms/logicUtils';
import { QuestionControlsOverlay } from './forms/components/QuestionControlsOverlay';
import { useFormHistory } from './forms/hooks/useFormHistory';
import { useFormAPI } from './forms/hooks/useFormAPI';
import { useSlashCommands } from './forms/hooks/useSlashCommands';
import { useDesignSettings } from './forms/hooks/useDesignSettings';
import { useKeyboardShortcuts } from './forms/hooks/useKeyboardShortcuts';
import { useAutoSave } from './forms/hooks/useAutoSave';
import { useQuestionLibrarySuggestions } from './forms/hooks/useQuestionLibrarySuggestions';
import type { QuestionLibraryItem } from './forms/types';
import { QuestionNavigationSidebar } from './forms/components/QuestionNavigationSidebar';
import { FormHeader } from './forms/components/FormHeader';
import { SlashCommandMenu } from './forms/components/SlashCommandMenu';
import { FormSelectorButton } from './forms/components/FormSelectorButton';
import { EmptyQuestionsState } from './forms/components/EmptyQuestionsState';
import { SaveStatusIndicator } from './forms/components/SaveStatusIndicator';
import { BottomControlPanel } from './forms/components/BottomControlPanel';
import { DesignSettingsMenu } from './forms/components/DesignSettingsMenu';
import { QuestionEditor } from './forms/components/QuestionEditor';
import { CompanyLogo } from './forms/components/CompanyLogo';
import { DesignSettingsButton } from './forms/components/DesignSettingsButton';
import { LoadingSpinner } from './forms/components/LoadingSpinner';
import { getBackgroundStyle } from '@/utils/gradientHelper';
import type { GradientStyle } from '@/types/settings';

interface FormsTabProps {
  formId?: string | null;
  onFormIdChange: (formId: string | null) => void;
  onSaveForm?: () => void; // Callback to notify parent that form should be saved
  backgroundColor?: string; // Template section background color
  isGradient?: boolean;
  gradient?: GradientStyle | null;
}

export default function FormsTab({ formId, onFormIdChange, onSaveForm, backgroundColor = 'white', isGradient = false, gradient = null }: FormsTabProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  const { settings: appSettings } = useSettings();
  
  // Get background style (handles both gradients and solid colors)
  const backgroundStyle = getBackgroundStyle(isGradient, gradient, backgroundColor);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSettings, setFormSettings] = useState<FormSettings>({});
  const [published, setPublished] = useState(false);
  const [showFormSelector, setShowFormSelector] = useState(false);
  const [formSelectorOpen, setFormSelectorOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const updateQuestionTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  
  // Design menu state
  const [showDesignMenu, setShowDesignMenu] = useState(false);
  
  const [showLogicFor, setShowLogicFor] = useState<Set<string>>(new Set());
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  
  // Design settings hook
  const {
    designSettings,
    setDesignStyle,
    setDesignType,
    setShowCompanyLogo,
    setColumnLayout,
    setFormPosition,
    setContentColumns,
    loadDesignSettings,
  } = useDesignSettings();
  
  // Undo/Redo using hook
  const { addToHistory, undo, redo, canUndo, canRedo } = useFormHistory(questions, setQuestions);
  
  // Form API hook
  const {
    loading,
    saveState,
    availableForms,
    loadAvailableForms,
    loadForm: loadFormAPI,
    createNewForm,
    saveForm: saveFormAPI,
    saveFormSilent,
    deleteForm,
    setSaveState,
  } = useFormAPI({
    formId: formId || null,
    formTitle,
    formDescription,
    formSettings: { ...formSettings, ...designSettings },
    published,
    questions,
    onFormIdChange,
    setFormTitle,
    setFormDescription,
    setFormSettings,
    setPublished,
    setQuestions,
  });
  
  // Slash commands using hook
  const slashCommands = useSlashCommands({
    fieldTypes: FIELD_TYPES,
    onSelectFieldType: (questionId, type, newLabel) => {
      updateQuestion(questionId, { 
        type,
        label: newLabel,
        options: requiresOptions(type) ? ['Option 1'] : undefined
      });
    },
  });

  // Question Library Suggestions
  const librarySuggestions = useQuestionLibrarySuggestions({
    onSelectLibraryQuestion: (libraryQuestion: QuestionLibraryItem, questionId: string) => {
      // Update question with library data
      updateQuestion(questionId, {
        question_library_id: libraryQuestion.id,
        type: libraryQuestion.type,
        label: libraryQuestion.label,
        description: libraryQuestion.description,
        placeholder: libraryQuestion.placeholder,
        options: libraryQuestion.options,
        validation: libraryQuestion.validation,
        // Clear any overrides since we're using library defaults
        label_override: null,
        description_override: null,
        placeholder_override: null,
        options_override: null,
        validation_override: null,
      });
      setDirty(true);
    },
  });

  // Compute existing library question IDs in this form
  const existingQuestionLibraryIds = React.useMemo(() => {
    const ids = new Set<string>();
    questions.forEach(q => {
      if (q.question_library_id) {
        ids.add(q.question_library_id);
      }
    });
    return ids;
  }, [questions]);

  // Initialize history when questions load
  useEffect(() => {
    if (questions.length > 0) {
      addToHistory(questions);
    }
  }, [questions.length]);

  // Load all available forms
  useEffect(() => {
    loadAvailableForms();
  }, [loadAvailableForms]);

  // Load form data if formId exists
  useEffect(() => {
    if (formId) {
      loadFormAPI(formId);
    } else {
      setQuestions([]);
      setFormTitle('');
      setFormDescription('');
    }
  }, [formId, loadFormAPI]);

  // Load design settings when formSettings updates
  useEffect(() => {
    if (formId && formSettings && Object.keys(formSettings).length > 0) {
      loadDesignSettings(formSettings);
    }
  }, [formId, formSettings, loadDesignSettings]);

  // Wrapper to mark form as dirty after save operations
  const saveForm = async () => {
    await saveFormAPI();
    setDirty(false);
  };

  const addQuestion = (type: Question['type']) => {
    const newQuestions = addQuestionUtil(questions, type);
    setQuestions(newQuestions);
    addToHistory(newQuestions);
    setSelectedQuestion(newQuestions[newQuestions.length - 1].id);
    setDirty(true);
  };

  const addQuestionAfter = (afterId: string) => {
    const newQuestions = addQuestionAfterUtil(questions, afterId);
    setQuestions(newQuestions);
    addToHistory(newQuestions);
    const index = questions.findIndex(q => q.id === afterId);
    setSelectedQuestion(newQuestions[index + 1]?.id || null);
    setDirty(true);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    const newQuestions = updateQuestionUtil(questions, id, updates);
    setQuestions(newQuestions);
    // Debounce history updates for text input to avoid excessive history entries
    if (updateQuestionTimerRef.current) {
      clearTimeout(updateQuestionTimerRef.current);
    }
    updateQuestionTimerRef.current = setTimeout(() => {
      addToHistory(newQuestions);
    }, 500);
    setDirty(true);
  };

  const deleteQuestion = (id: string) => {
    const newQuestions = deleteQuestionUtil(questions, id);
    setQuestions(newQuestions);
    if (selectedQuestion === id) {
      setSelectedQuestion(null);
    }
    addToHistory(newQuestions);
    setDirty(true);
  };

  const duplicateQuestion = (id: string) => {
    const newQuestions = duplicateQuestionUtil(questions, id);
    setQuestions(newQuestions);
    addToHistory(newQuestions);
    setDirty(true);
  };

  const moveQuestion = (id: string, direction: 'up' | 'down') => {
    const newQuestions = moveQuestionUtil(questions, id, direction);
    setQuestions(newQuestions);
    addToHistory(newQuestions);
    setDirty(true);
  };

  // Conditional Logic helpers
  const setQuestionLogic = (questionId: string, updater: (lg: any) => any) => {
    const q = questions.find(x => x.id === questionId);
    if (!q) return;
    const updated = updateQuestionLogic(q, updater);
    updateQuestion(questionId, { validation: updated.validation });
  };

  const toggleLogic = (questionId: string) => {
    setShowLogicFor(prev => {
      const n = new Set(prev);
      if (n.has(questionId)) n.delete(questionId); else n.add(questionId);
      return n;
    });
  };

  const logicSummary = (q: Question) => {
    return getLogicSummary(q, questions);
  };

  // Image gallery state for design settings
  const [imageGalleryOpen, setImageGalleryOpen] = useState(false);
  const [selectedColumnPosition, setSelectedColumnPosition] = useState<'left' | 'center' | 'right' | null>(null);

  // Slash command handling
  const handleQuestionLabelChange = (id: string, value: string, e?: React.ChangeEvent<HTMLInputElement>) => {
    slashCommands.handleQuestionLabelChange(id, value, e);
    librarySuggestions.handleInputChange(id, value);
    updateQuestion(id, { label: value });
  };

  const handleSlashMenuKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, questionId: string) => {
    // First check if library suggestions are showing and handle navigation
    const suggestionsHandled = librarySuggestions.handleSuggestionsKeyDown(e, questionId);
    if (suggestionsHandled) {
      return; // Library suggestions handled the key event
    }
    
    // Otherwise, handle slash commands
    slashCommands.handleSlashMenuKeyDown(e, questionId);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    currentStep,
    questionsLength: questions.length,
    selectedQuestion,
    dirty,
    onSetCurrentStep: setCurrentStep,
    onSaveForm: saveForm,
    onAddQuestion: (type) => addQuestion(type as Question['type']),
    onAddQuestionAfter: addQuestionAfter,
  });



  // Autosave hook
  useAutoSave({
    formTitle,
    formDescription,
    questions,
    published,
    formSettings,
    dirty,
    loading,
    saveFormSilent,
    setSaveState,
    setDirty,
  });

  const selectedQuestionData = questions.find(q => q.id === selectedQuestion);

  if (loading) {
    return <LoadingSpinner />;
  }

  // Form Editor View
  return (
    <div className="absolute left-0 right-0 bottom-0 flex flex-col" style={{ top: 0, ...backgroundStyle, fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 space-y-6">
        {/* Company Logo */}
      
        {designSettings.showCompanyLogo && appSettings.image && (
          <CompanyLogo imageUrl={appSettings.image} designStyle={designSettings.designStyle} />
        )}
       



        {/* Question Navigation Sidebar */}
        <QuestionNavigationSidebar
          questions={questions}
          currentStep={currentStep}
          showQuestionNav={showQuestionNav}
          formTitle={formTitle}
          formDescription={formDescription}
          primaryColor={primary.base}
          onToggleNav={() => setShowQuestionNav(!showQuestionNav)}
          onSelectQuestion={(index) => setCurrentStep(index)}
          onTitleChange={(title) => { setFormTitle(title); setDirty(true); }}
          onDescriptionChange={(desc) => { setFormDescription(desc); setDirty(true); }}
          onReorderQuestions={(reordered) => {
            setQuestions(reordered);
            addToHistory(reordered);
            setDirty(true);
          }}
        />
        
        {/* Header */}
        <FormHeader
          published={published}
          questionCount={questions.length}
          onTogglePublished={() => { setPublished(!published); setDirty(true); }}
          primaryColor={primary.base}
        />

        <div className="max-w-2xl mx-auto pb-20">
          {/* Questions - Stepped Editor (WYSIWYG) */}
          <div className="space-y-2">
          {questions.length > 0 ? (
            <>
              {/* Progress */}
              <div className={`${designSettings.designStyle === 'compact' ? 'text-xs' : 'text-sm'} font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider`}>
                Question {currentStep + 1} of {questions.length}
              </div>

              {/* Question Controls */}
              {(() => {
                const question = questions[currentStep];
                if (!question) return null;
                return (
                  <QuestionControlsOverlay
                    question={question}
                    currentStep={currentStep}
                    showLogicFor={showLogicFor}
                    onUpdateQuestion={updateQuestion}
                    onAddQuestionAfter={addQuestionAfter}
                    onToggleLogic={toggleLogic}
                    onDuplicateQuestion={duplicateQuestion}
                    onDeleteQuestion={deleteQuestion}
                    onEnsureLogicGroup={ensureLogicGroup}
                    onSetCurrentStep={setCurrentStep}
                  />
                );
              })()}

              {/* Current Question */}
              {(() => {
                const question = questions[currentStep];
                if (!question) return null;
                return (
                  <QuestionEditor
                    question={question}
                    currentStep={currentStep}
                    totalSteps={questions.length}
                    designStyle={designSettings.designStyle}
                    showLogicFor={showLogicFor}
                    questions={questions}
                    slashCommands={slashCommands}
                    librarySuggestions={{
                      showSuggestions: librarySuggestions.showSuggestions,
                      activeQuestionId: librarySuggestions.activeQuestionId,
                      searchQuery: librarySuggestions.searchQuery,
                      selectedIndex: librarySuggestions.selectedIndex,
                      suggestionsMenuRef: librarySuggestions.suggestionsMenuRef,
                      existingQuestionLibraryIds,
                      onSelectLibraryQuestion: (question: QuestionLibraryItem) => {
                        librarySuggestions.selectLibraryQuestion(question, questions[currentStep].id);
                      },
                      onCloseSuggestions: librarySuggestions.closeSuggestions,
                      onSuggestionsCountChange: librarySuggestions.setSuggestionsCount,
                      onAvailableCountChange: librarySuggestions.setAvailableSuggestionsCount,
                    }}
                    onUpdateQuestion={updateQuestion}
                    onAddQuestionAfter={addQuestionAfter}
                    onToggleLogic={toggleLogic}
                    onDuplicateQuestion={duplicateQuestion}
                    onDeleteQuestion={deleteQuestion}
                    onSetCurrentStep={setCurrentStep}
                    onSetDirty={setDirty}
                    onHandleLabelChange={handleQuestionLabelChange}
                    onHandleSlashMenuKeyDown={handleSlashMenuKeyDown}
                    onSetQuestionLogic={setQuestionLogic}
                  />
                );
              })()}
            </>
          ) : (
            <EmptyQuestionsState
              onAddFirst={() => {
                addQuestion('text');
                setCurrentStep(0);
              }}
            />
            )}
          </div>
        </div>

        {/* Floating Design Settings Button */}
        <DesignSettingsButton
        isOpen={showDesignMenu}
        primaryColor={primary.base}
        onClick={() => setShowDesignMenu(!showDesignMenu)}
      />

      {/* Form Selector Button */}
      <FormSelectorButton
        isOpen={formSelectorOpen}
        currentFormId={formId || null}
        availableForms={availableForms}
        primaryColor={primary.base}
        onToggle={() => setFormSelectorOpen(!formSelectorOpen)}
        onSelectForm={(id) => onFormIdChange(id)}
        onCreateNew={() => createNewForm()}
        onDeleteForm={deleteForm}
      />

      {/* Floating save status chip */}
      <SaveStatusIndicator saveState={saveState} dirty={dirty} />

      {/* Design Settings Menu */}
      <DesignSettingsMenu
        showMenu={showDesignMenu}
        designStyle={designSettings.designStyle}
        designType={designSettings.designType}
        showCompanyLogo={designSettings.showCompanyLogo}
        columnLayout={designSettings.columnLayout}
        formPosition={designSettings.formPosition}
        contentColumns={designSettings.contentColumns}
        primaryColor={primary.base}
        onClose={() => setShowDesignMenu(false)}
        onSetDesignStyle={setDesignStyle}
        onSetDesignType={setDesignType}
        onSetShowCompanyLogo={setShowCompanyLogo}
        onSetColumnLayout={setColumnLayout}
        onSetFormPosition={setFormPosition}
        onSetContentColumns={setContentColumns}
        onOpenImageGallery={(position) => {
          setSelectedColumnPosition(position);
          setImageGalleryOpen(true);
        }}
        onSetDirty={setDirty}
      />

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={imageGalleryOpen}
        onClose={() => {
          setImageGalleryOpen(false);
          setSelectedColumnPosition(null);
        }}
        onSelectImage={(url, attribution, isVideo) => {
          if (selectedColumnPosition) {
            setDirty(true);
            const existingColumn = designSettings.contentColumns.find(col => col.position === selectedColumnPosition);
            if (existingColumn) {
              setContentColumns(designSettings.contentColumns.map(col =>
                col.position === selectedColumnPosition ? { ...col, content: url } : col
              ));
            }
          }
          setImageGalleryOpen(false);
          setSelectedColumnPosition(null);
        }}
        defaultTab={designSettings.contentColumns.find(col => col.position === selectedColumnPosition)?.type === 'video' ? 'youtube' : 'r2images'}
      />

      {/* Form Selector Button */}
      <FormSelectorButton
        isOpen={formSelectorOpen}
        currentFormId={formId || null}
        availableForms={availableForms}
        primaryColor={primary.base}
        onToggle={() => setFormSelectorOpen(!formSelectorOpen)}
        onSelectForm={(id) => onFormIdChange(id)}
        onCreateNew={() => createNewForm()}
        onDeleteForm={deleteForm}
      />

      {/* Fixed Bottom Panel with Controls */}
      <BottomControlPanel
        formId={formId || null}
        dirty={dirty}
        formTitle={formTitle}
        loading={loading}
        onBack={null}
        onSave={saveForm}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
      />
      </div>
    </div>
  );
}

