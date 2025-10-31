/**
 * Email Template Card Component
 * Displays email template with preview, edit, delete, and toggle actions
 * Matches AI ModelCard styling patterns
 */

'use client';

import React from 'react';
import { EmailIcons } from './EmailIcons';
import type { EmailTemplate } from '../types/emailTemplate';
import { 
  getCategoryColor, 
  getTypeColor, 
  formatDateTime, 
  truncateText, 
  stripHtmlTags 
} from '../utils/emailTemplate.utils';

interface EmailTemplateCardProps {
  template: EmailTemplate;
  primary?: {
    base: string;
    light: string;
    lighter: string;
    dark: string;
    darker: string;
  };
  onEdit?: (template: EmailTemplate) => void;
  onDelete?: (id: number, subject: string) => void;
  onToggleActive?: (id: number, currentActive: boolean) => void;
  onPreview?: (template: EmailTemplate) => void;
  onTest?: (template: EmailTemplate) => void;
  context?: 'admin' | 'superadmin';
}

export const EmailTemplateCard: React.FC<EmailTemplateCardProps> = ({
  template,
  primary,
  onEdit,
  onDelete,
  onToggleActive,
  onPreview,
  onTest,
  context = 'admin',
}) => {
  // Default primary colors
  const primaryColors = primary || {
    base: '#9333ea',
    light: '#c084fc',
    lighter: '#f3e8ff',
    dark: '#7e22ce',
    darker: '#6b21a8',
  };

  // Check if template is default
  const isDefaultTemplate = template.is_default;

  // Handlers
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(template);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(template.id, template.subject);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleActive) onToggleActive(template.id, template.is_active);
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) onPreview(template);
  };

  const handleTest = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTest) onTest(template);
  };

  // Get preview text
  const previewText = stripHtmlTags(template.html_code);

  return (
    <li
      className="relative bg-white rounded-2xl group overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        border: `2px solid ${isDefaultTemplate ? primaryColors.base : primaryColors.lighter}`,
        boxShadow: isDefaultTemplate
          ? `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.base}`
          : `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.lighter}`,
      }}
      onMouseEnter={(e) => {
        if (isDefaultTemplate) {
          e.currentTarget.style.borderColor = primaryColors.base;
          e.currentTarget.style.boxShadow = `0 12px 32px -8px ${primaryColors.base}35, 0 0 0 1px ${primaryColors.base}`;
        } else {
          e.currentTarget.style.borderColor = primaryColors.light;
          e.currentTarget.style.boxShadow = `0 12px 32px -8px ${primaryColors.base}25, 0 0 0 1px ${primaryColors.light}`;
        }
      }}
      onMouseLeave={(e) => {
        if (isDefaultTemplate) {
          e.currentTarget.style.borderColor = primaryColors.base;
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.base}`;
        } else {
          e.currentTarget.style.borderColor = primaryColors.lighter;
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.lighter}`;
        }
      }}
    >
      {/* Main Content */}
      <div className="flex items-start justify-between py-3 sm:py-4 px-4 sm:px-5">
        {/* Left: Icon + Subject */}
        <div className="flex items-center gap-3 sm:gap-4 flex-grow min-w-0">
          {/* Email Icon */}
          <div
            className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.08] shadow-md"
            style={{
              backgroundColor: primaryColors.lighter,
              border: `2px solid ${primaryColors.light}`,
            }}
          >
            <EmailIcons.Envelope className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" style={{ color: primaryColors.base }} />
            
            {/* Animated glow */}
            <div
              className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `radial-gradient(circle at center, ${primaryColors.base} 0%, transparent 70%)`,
                filter: 'blur(12px)',
              }}
            />
          </div>

          {/* Subject and Badges */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-base sm:text-lg truncate tracking-tight text-gray-900">
                {template.subject}
              </h3>
              
              {isDefaultTemplate && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex-shrink-0">
                  Default
                </span>
              )}
            </div>

            {/* Type and Category Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              {template.type && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(template.type)}`}>
                  {template.type.replace(/_/g, ' ')}
                </span>
              )}
              {template.category && (
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryColor(template.category)}`}>
                  {template.category}
                </span>
              )}
              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {template.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {/* Preview Button */}
          {onPreview && (
            <button
              onClick={handlePreview}
              className="h-9 w-9 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center transition-colors"
              title="Preview Template"
            >
              <EmailIcons.Eye className="h-5 w-5 text-gray-600" />
            </button>
          )}

          {/* Test Send Button */}
          {onTest && template.is_active && (
            <button
              onClick={handleTest}
              className="h-9 w-9 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center transition-colors"
              title="Send Test Email"
            >
              <EmailIcons.Send className="h-5 w-5 text-blue-600" />
            </button>
          )}

          {/* Edit Button */}
          {onEdit && !isDefaultTemplate && (
            <button
              onClick={handleEdit}
              className="h-9 w-9 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 flex items-center justify-center transition-colors"
              title="Edit Template"
            >
              <EmailIcons.Edit className="h-5 w-5 text-purple-600" />
            </button>
          )}

          {/* Toggle Active Button */}
          {onToggleActive && !isDefaultTemplate && (
            <button
              onClick={handleToggleActive}
              className={`h-9 w-9 rounded-lg border flex items-center justify-center transition-colors ${
                template.is_active
                  ? 'bg-green-50 hover:bg-green-100 border-green-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
              }`}
              title={template.is_active ? 'Deactivate' : 'Activate'}
            >
              <EmailIcons.CheckCircle
                className={`h-5 w-5 ${template.is_active ? 'text-green-600' : 'text-gray-400'}`}
              />
            </button>
          )}

          {/* Delete Button */}
          {onDelete && !isDefaultTemplate && (
            <button
              onClick={handleDelete}
              className="h-9 w-9 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-colors"
              title="Delete Template"
            >
              <EmailIcons.Trash className="h-5 w-5 text-red-600" />
            </button>
          )}
        </div>
      </div>

      {/* Body Preview */}
      <div className="px-4 sm:px-5 pb-3">
        <p className="text-sm text-gray-600 line-clamp-2">
          {template.html_code ? truncateText(previewText, 150) : 'No content'}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-4 px-4 sm:px-5 py-3 border-t border-gray-100 text-xs text-gray-500">
        {template.from_email_address_type && (
          <span>From: {template.from_email_address_type.replace(/_/g, ' ')}</span>
        )}
        {template.created_by_profile && (
          <span>By: {template.created_by_profile.full_name}</span>
        )}
        {template.updated_at && (
          <span>Updated: {formatDateTime(template.updated_at)}</span>
        )}
      </div>
    </li>
  );
};
