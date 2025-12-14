'use client';

import React, { useState } from 'react';
import TemplatesList from './TemplatesList';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';

interface TemplatesViewProps {
  primary: { base: string; hover: string };
  globalSearchQuery?: string;
}

export default function TemplatesView({ primary, globalSearchQuery = '' }: TemplatesViewProps) {
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);

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
    <div className="h-full flex flex-col">
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
