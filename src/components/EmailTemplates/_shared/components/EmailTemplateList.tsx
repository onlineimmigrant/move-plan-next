/**
 * Email Template List Component
 * Renders list of email template cards
 */

'use client';

import React from 'react';
import { EmailTemplateCard } from './EmailTemplateCard';
import { EmailLoadingSkeleton } from './EmailLoadingSkeleton';
import type { EmailTemplate } from '../types/emailTemplate';

interface EmailTemplateListProps {
  templates: EmailTemplate[];
  loading?: boolean;
  primary?: any;
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (id: number, subject: string) => void;
  onToggleActive?: (id: number, currentActive: boolean) => void;
  onPreview?: (template: EmailTemplate) => void;
  onTest?: (template: EmailTemplate) => void;
  context?: 'admin' | 'superadmin';
}

export const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
  templates,
  loading,
  primary,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview,
  onTest,
  context,
}) => {
  if (loading) {
    return <EmailLoadingSkeleton count={6} />;
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No email templates found</p>
        <p className="text-gray-400 text-sm mt-2">Create a new template to get started</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 sm:space-y-3">
      {templates.map((template) => (
        <EmailTemplateCard
          key={template.id}
          template={template}
          primary={primary}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleActive={onToggleActive}
          onPreview={onPreview}
          onTest={onTest}
          context={context}
        />
      ))}
    </ul>
  );
};
