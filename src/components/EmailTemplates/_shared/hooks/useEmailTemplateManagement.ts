/**
 * Email Template Management Hook
 * Handles CRUD operations, validation, filtering for email templates
 * Shared between admin and superadmin contexts
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  EmailTemplate,
  EmailTemplateForm,
  TabType,
  FilterCategoryType,
  FilterActiveType,
  FilterTypeType,
  SortByType,
  SortOrderType,
  FieldErrors,
  TouchedFields,
} from '../types/emailTemplate';
import {
  validateEmailTemplateForm,
  createEmptyTemplateForm,
  templateToForm,
  sortTemplates,
  filterTemplatesBySearch,
} from '../utils/emailTemplate.utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UseEmailTemplateManagementConfig {
  organizationId: string | null;
  context?: 'admin' | 'superadmin';
}

export function useEmailTemplateManagement({
  organizationId,
  context = 'admin',
}: UseEmailTemplateManagementConfig) {
  // Data State
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedEditTemplate, setSelectedEditTemplate] = useState<EmailTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState<EmailTemplateForm>(
    createEmptyTemplateForm(organizationId)
  );

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('templates');

  // Modal State
  const [templateEditModalOpen, setTemplateEditModalOpen] = useState(false);
  const [templateEditMode, setTemplateEditMode] = useState<'add' | 'edit'>('add');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [sendTestModalOpen, setSendTestModalOpen] = useState(false);

  // Validation State
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Search & Filters
  const [templateSearch, setTemplateSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<FilterCategoryType>('all');
  const [filterActive, setFilterActive] = useState<FilterActiveType>('all');
  const [filterType, setFilterType] = useState<FilterTypeType>('all');
  const [sortBy, setSortBy] = useState<SortByType>('created');
  const [sortOrder, setSortOrder] = useState<SortOrderType>('desc');

  // Auto-hide messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, error]);

  // ============================================================================
  // Data Fetching
  // ============================================================================

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // For admin context, wait for organizationId to be loaded
      if (context === 'admin' && !organizationId) {
        setLoading(false);
        return; // Don't fetch yet, wait for organizationId
      }

      const params: any = {};

      // Superadmin sees all, admin sees only org templates
      if (context === 'admin' && organizationId) {
        params.organization_id = organizationId;
      }

      // Build query parameters
      const queryParams = new URLSearchParams(params).toString();
      const url = `/api/email-templates${queryParams ? `?${queryParams}` : ''}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (err: any) {
      console.error('Failed to fetch templates:', err);
      setError(err.message || 'Failed to load email templates');
    } finally {
      setLoading(false);
    }
  }, [organizationId, context]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ============================================================================
  // Filtering and Sorting
  // ============================================================================

  const filteredTemplates = templates.filter((template) => {
    // Category filter
    if (filterCategory !== 'all' && template.category !== filterCategory) return false;

    // Active filter
    if (filterActive === 'active' && !template.is_active) return false;
    if (filterActive === 'inactive' && template.is_active) return false;

    // Type filter
    if (filterType !== 'all' && template.type !== filterType) return false;

    return true;
  });

  const searchedTemplates = filterTemplatesBySearch(filteredTemplates, templateSearch);
  const sortedTemplates = sortTemplates(searchedTemplates, sortBy, sortOrder);

  // ============================================================================
  // Form Handlers
  // ============================================================================

  const handleFieldChange = useCallback(
    (field: keyof EmailTemplateForm, value: any, isEdit: boolean = false) => {
      if (isEdit && selectedEditTemplate) {
        setSelectedEditTemplate({ ...selectedEditTemplate, [field]: value });
        setHasUnsavedChanges(true);
      } else {
        setNewTemplate((prev) => ({ ...prev, [field]: value }));
      }

      // Clear error when user types
      if (fieldErrors[field]) {
        setFieldErrors((prev) => {
          const updated = { ...prev };
          delete updated[field];
          return updated;
        });
      }
    },
    [selectedEditTemplate, fieldErrors]
  );

  const handleFieldBlur = useCallback(
    (field: keyof EmailTemplateForm) => {
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
    },
    []
  );

  // ============================================================================
  // CRUD Operations
  // ============================================================================

  const addTemplate = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      // Validate
      const { isValid, errors } = validateEmailTemplateForm(newTemplate);
      if (!isValid) {
        setFieldErrors(errors);
        setError('Please fix validation errors');
        setSaving(false);
        return;
      }

      // Add org ID if admin context
      const templateData = {
        ...newTemplate,
        organization_id: context === 'admin' ? organizationId : newTemplate.organization_id,
      };

      const response = await fetch('/api/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create template');
      }

      const created = await response.json();
      setTemplates((prev) => [created, ...prev]);
      setSuccessMessage('Template created successfully');
      setNewTemplate(createEmptyTemplateForm(organizationId));
      setFieldErrors({});
      setTouchedFields({});
      setTemplateEditModalOpen(false);
      setActiveTab('templates');
    } catch (err: any) {
      console.error('Failed to add template:', err);
      setError(err.message || 'Failed to create template');
    } finally {
      setSaving(false);
    }
  }, [newTemplate, organizationId, context]);

  const updateTemplate = useCallback(async () => {
    if (!selectedEditTemplate) return;

    try {
      setSaving(true);
      setError(null);

      const formData = templateToForm(selectedEditTemplate);
      const { isValid, errors } = validateEmailTemplateForm(formData);

      if (!isValid) {
        setFieldErrors(errors);
        setError('Please fix validation errors');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/email-templates/${selectedEditTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update template');
      }

      const updated = await response.json();
      setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSuccessMessage('Template updated successfully');
      setSelectedEditTemplate(null);
      setFieldErrors({});
      setTouchedFields({});
      setHasUnsavedChanges(false);
      setTemplateEditModalOpen(false);
      setActiveTab('templates');
    } catch (err: any) {
      console.error('Failed to update template:', err);
      setError(err.message || 'Failed to update template');
    } finally {
      setSaving(false);
    }
  }, [selectedEditTemplate]);

  const deleteTemplate = useCallback(async (templateId: number) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }

      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      setSuccessMessage('Template deleted successfully');
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      setError(err.message || 'Failed to delete template');
    } finally {
      setSaving(false);
    }
  }, []);

  const toggleTemplateActive = useCallback(
    async (templateId: number, currentActive: boolean) => {
      try {
        const response = await fetch(`/api/email-templates/${templateId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: !currentActive }),
        });

        if (!response.ok) {
          throw new Error('Failed to toggle template status');
        }

        const updated = await response.json();
        setTemplates((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSuccessMessage(
          `Template ${!currentActive ? 'activated' : 'deactivated'} successfully`
        );
      } catch (err: any) {
        console.error('Failed to toggle template:', err);
        setError(err.message || 'Failed to toggle template status');
      }
    },
    []
  );

  // ============================================================================
  // Modal Handlers
  // ============================================================================

  const openAddTemplateModal = useCallback(() => {
    setNewTemplate(createEmptyTemplateForm(organizationId));
    setSelectedEditTemplate(null);
    setTemplateEditMode('add');
    setFieldErrors({});
    setTouchedFields({});
    setTemplateEditModalOpen(true);
    setActiveTab('add');
  }, [organizationId]);

  const selectTemplateForEdit = useCallback((template: EmailTemplate) => {
    setSelectedEditTemplate(template);
    setTemplateEditMode('edit');
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
    setTemplateEditModalOpen(true);
    setActiveTab('edit');
  }, []);

  const closeTemplateEditModal = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    setTemplateEditModalOpen(false);
    setSelectedEditTemplate(null);
    setNewTemplate(createEmptyTemplateForm(organizationId));
    setFieldErrors({});
    setTouchedFields({});
    setHasUnsavedChanges(false);
    setActiveTab('templates');
  }, [hasUnsavedChanges, organizationId]);

  return {
    // Data
    templates: sortedTemplates,
    selectedEditTemplate,
    newTemplate,

    // UI State
    loading,
    saving,
    error,
    successMessage,
    activeTab,

    // Modal State
    templateEditModalOpen,
    templateEditMode,
    previewModalOpen,
    sendTestModalOpen,

    // Validation
    fieldErrors,
    touchedFields,
    hasUnsavedChanges,

    // Filters
    templateSearch,
    filterCategory,
    filterActive,
    filterType,
    sortBy,
    sortOrder,

    // Setters
    setError,
    setSuccessMessage,
    setTemplateSearch,
    setFilterCategory,
    setFilterActive,
    setFilterType,
    setSortBy,
    setSortOrder,
    setActiveTab,
    setPreviewModalOpen,
    setSendTestModalOpen,
    setHasUnsavedChanges,

    // Actions
    openAddTemplateModal,
    selectTemplateForEdit,
    closeTemplateEditModal,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    handleFieldChange,
    handleFieldBlur,
    fetchTemplates,
  };
}
