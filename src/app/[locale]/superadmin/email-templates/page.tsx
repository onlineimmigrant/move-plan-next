/**
 * Email Templates Management Page (Superadmin)
 * Manages system-wide email templates (including defaults) using shared components
 */

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Button from '@/ui/Button';
import { useEmailTemplateManagement } from '@/components/EmailTemplates/_shared/hooks/useEmailTemplateManagement';
import {
  EmailLoadingSkeleton,
  EmailNotification,
  EmailConfirmationDialog,
  EmailSearchInput,
  EmailTemplateList,
  EmailFilterBar,
  EmailIcons,
  EmailTemplateEditModal,
  EmailTemplatePreviewModal,
  EmailTemplateTestSendModal,
} from '@/components/EmailTemplates/_shared';
import type { EmailTemplate, EmailTemplateForm, PlaceholderValues } from '@/components/EmailTemplates/_shared';

// Icon aliases
const PlusIcon = EmailIcons.Plus;
const EnvelopeIcon = EmailIcons.Envelope;

export default function SuperadminEmailTemplatesPage() {
  const { isAdmin, isSuperadmin, isLoading } = useAuth();
  const router = useRouter();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Use management hook (superadmin context - no org filter)
  const {
    // Data
    templates,
    selectedEditTemplate,
    newTemplate,

    // UI State
    loading,
    saving,
    error,
    successMessage,

    // Modal State
    templateEditModalOpen,
    templateEditMode,
    previewModalOpen,
    sendTestModalOpen,

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
    setPreviewModalOpen,
    setSendTestModalOpen,

    // Actions
    openAddTemplateModal,
    selectTemplateForEdit,
    closeTemplateEditModal,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    toggleTemplateActive,
    handleFieldChange,
  } = useEmailTemplateManagement({
    organizationId: null,
    context: 'superadmin',
  });

  // Check access
  useEffect(() => {
    if (isLoading) return;

    if (!isAdmin) {
      router.push('/login');
      return;
    }

    if (!isSuperadmin) {
      router.push('/admin');
      return;
    }
  }, [isAdmin, isSuperadmin, isLoading, router]);

  // Confirmation dialog handlers
  const handleDeleteWithConfirmation = (templateId: number, subject: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Email Template',
      message: `Are you sure you want to delete "${subject}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteTemplate(templateId);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewModalOpen(true);
    selectTemplateForEdit(template);
  };

  const handleTest = (template: EmailTemplate) => {
    setSendTestModalOpen(true);
    selectTemplateForEdit(template);
  };

  const handleSaveTemplate = async (formData: EmailTemplateForm) => {
    // Update the template state in the hook first
    if (templateEditMode === 'add') {
      // Set newTemplate in hook and then call addTemplate
      Object.keys(formData).forEach((key) => {
        handleFieldChange(key as keyof EmailTemplateForm, formData[key as keyof EmailTemplateForm]);
      });
      await addTemplate();
    } else {
      // For edit mode, we need to update selectedEditTemplate first
      if (selectedEditTemplate) {
        Object.keys(formData).forEach((key) => {
          handleFieldChange(key as keyof EmailTemplateForm, formData[key as keyof EmailTemplateForm]);
        });
        await updateTemplate();
      }
    }
  };

  const handleTestSend = async (
    template: EmailTemplate,
    toEmail: string,
    placeholders: PlaceholderValues
  ) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          templateId: template.id,
          placeholders,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send test email');
      }

      setSuccessMessage(`Test email sent successfully to ${toEmail}`);
    } catch (err) {
      throw err;
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <EmailLoadingSkeleton count={6} />
      </div>
    );
  }

  if (!isSuperadmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                backgroundColor: '#f3e8ff',
                border: '2px solid #c084fc',
              }}
            >
              <EnvelopeIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                System Email Templates
              </h1>
              <p className="text-gray-600">
                Manage system-wide and default email templates
              </p>
            </div>
          </div>
          <Button
            onClick={openAddTemplateModal}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Template
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6">
          <EmailNotification type="error" message={error} onDismiss={() => setError(null)} />
        </div>
      )}

      {successMessage && (
        <div className="mb-6">
          <EmailNotification
            type="success"
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <EmailSearchInput
          value={templateSearch}
          onChange={setTemplateSearch}
          placeholder="Search all templates..."
        />
      </div>

      {/* Filter Bar */}
      <EmailFilterBar
        filterCategory={filterCategory}
        filterActive={filterActive}
        filterType={filterType}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onFilterCategoryChange={setFilterCategory}
        onFilterActiveChange={setFilterActive}
        onFilterTypeChange={setFilterType}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Templates</p>
          <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Default</p>
          <p className="text-2xl font-bold text-purple-600">
            {templates.filter((t) => t.is_default).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Org Templates</p>
          <p className="text-2xl font-bold text-blue-600">
            {templates.filter((t) => !t.is_default && t.organization_id).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {templates.filter((t) => t.is_active).length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">
            {templates.filter((t) => !t.is_active).length}
          </p>
        </div>
      </div>

      {/* Template List */}
      <EmailTemplateList
        templates={templates}
        loading={loading}
        primary={{
          base: '#9333ea',
          light: '#c084fc',
          lighter: '#f3e8ff',
          dark: '#7e22ce',
          darker: '#6b21a8',
        }}
        onEdit={selectTemplateForEdit}
        onDelete={handleDeleteWithConfirmation}
        onToggleActive={toggleTemplateActive}
        onPreview={handlePreview}
        onTest={handleTest}
        context="superadmin"
      />

      {/* Confirmation Dialog */}
      <EmailConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      {/* Edit/Add Modal */}
      <EmailTemplateEditModal
        isOpen={templateEditModalOpen}
        mode={templateEditMode}
        template={templateEditMode === 'edit' ? (selectedEditTemplate ? {
          organization_id: selectedEditTemplate.organization_id,
          type: selectedEditTemplate.type,
          subject: selectedEditTemplate.subject,
          html_code: selectedEditTemplate.html_code,
          name: selectedEditTemplate.name || '',
          description: selectedEditTemplate.description || '',
          email_main_logo_image: selectedEditTemplate.email_main_logo_image || '',
          from_email_address_type: selectedEditTemplate.from_email_address_type,
          is_active: selectedEditTemplate.is_active,
          category: selectedEditTemplate.category,
        } : null) : newTemplate}
        organizationId={null}
        onClose={closeTemplateEditModal}
        onSave={handleSaveTemplate}
        saving={saving}
      />

      {/* Preview Modal */}
      <EmailTemplatePreviewModal
        isOpen={previewModalOpen}
        template={selectedEditTemplate}
        onClose={() => setPreviewModalOpen(false)}
        onTestSend={() => {
          setPreviewModalOpen(false);
          if (selectedEditTemplate) {
            setSendTestModalOpen(true);
          }
        }}
      />

      {/* Test Send Modal */}
      <EmailTemplateTestSendModal
        isOpen={sendTestModalOpen}
        template={selectedEditTemplate}
        onClose={() => setSendTestModalOpen(false)}
        onSend={handleTestSend}
      />
    </div>
  );
}
