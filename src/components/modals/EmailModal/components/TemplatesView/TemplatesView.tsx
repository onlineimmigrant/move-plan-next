'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/ui/Button';
import TemplatesList from './TemplatesList';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';

interface TemplatesViewProps {
  primary: { base: string; hover: string };
  globalSearchQuery?: string;
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

export default function TemplatesView({ primary, globalSearchQuery = '', onMobileActionsChange }: TemplatesViewProps) {
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);

  // Provide action button for footer panel
  useEffect(() => {
    if (onMobileActionsChange) {
      onMobileActionsChange(
        <div className="flex lg:justify-end">
          <Button
            onClick={() => setEditingTemplateId(0)}
            variant="primary"
            size="sm"
            className="w-full lg:w-auto flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      );
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [onMobileActionsChange]);

  const handleEdit = (id: number) => {
    setEditingTemplateId(id);
  };

  const handlePreview = (id: number) => {
    setPreviewTemplateId(id);
  };

  const handleCloseEditor = () => {
    setEditingTemplateId(null);
  };

  const handleClosePreview = () => {
    setPreviewTemplateId(null);
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6">
      <TemplatesList onEdit={handleEdit} onPreview={handlePreview} primary={primary} searchQuery={globalSearchQuery} />

      {/* Editor Modal */}
      {editingTemplateId !== null && (
        <TemplateEditor
          templateId={editingTemplateId}
          onClose={handleCloseEditor}
          primary={primary}
        />
      )}

      {/* Preview Modal */}
      {previewTemplateId !== null && (
        <TemplatePreview
          templateId={previewTemplateId}
          onClose={handleClosePreview}
        />
      )}
    </div>
  );
}
