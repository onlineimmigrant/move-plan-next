/**
 * Email Template Edit Modal
 * Full form modal for creating and editing email templates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { EmailIcons } from './EmailIcons';
import Button from '@/ui/Button';
import type { EmailTemplate, EmailTemplateForm, EmailTemplateType, FromEmailAddressType, EmailTemplateCategory } from '../types/emailTemplate';
import { EMAIL_TEMPLATE_TYPES, FROM_EMAIL_OPTIONS, CATEGORY_OPTIONS } from '../types/emailTemplate';
import { validateEmailTemplateForm } from '../utils/emailTemplate.utils';

interface EmailTemplateEditModalProps {
  isOpen: boolean;
  mode: 'add' | 'edit';
  template: EmailTemplateForm | null;
  organizationId: string | null;
  onClose: () => void;
  onSave: (template: EmailTemplateForm) => void;
  saving?: boolean;
}

export const EmailTemplateEditModal: React.FC<EmailTemplateEditModalProps> = ({
  isOpen,
  mode,
  template,
  organizationId,
  onClose,
  onSave,
  saving = false,
}) => {
  const [formData, setFormData] = useState<EmailTemplateForm>({
    organization_id: organizationId,
    type: 'welcome',
    subject: '',
    html_code: '',
    name: '',
    description: '',
    email_main_logo_image: '',
    from_email_address_type: 'transactional_email',
    is_active: true,
    category: 'transactional',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      // Convert null values to empty strings for controlled inputs
      setFormData({
        organization_id: template.organization_id,
        type: template.type || 'welcome',
        subject: template.subject || '',
        html_code: template.html_code || '',
        name: template.name || '',
        description: template.description || '',
        email_main_logo_image: template.email_main_logo_image || '',
        from_email_address_type: template.from_email_address_type || 'transactional_email',
        is_active: template.is_active ?? true,
        category: template.category || 'transactional',
      });
    } else {
      setFormData({
        organization_id: organizationId,
        type: 'welcome',
        subject: '',
        html_code: '',
        name: '',
        description: '',
        email_main_logo_image: '',
        from_email_address_type: 'transactional_email',
        is_active: true,
        category: 'transactional',
      });
    }
    setErrors({});
    setTouched({});
  }, [template, organizationId, isOpen]);

  const handleChange = (field: keyof EmailTemplateForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    const { isValid, errors: validationErrors } = validateEmailTemplateForm(formData);
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    
    onSave(formData);
  };

  const handleTypeChange = (type: EmailTemplateType) => {
    const typeInfo = EMAIL_TEMPLATE_TYPES.find((t) => t.value === type);
    if (typeInfo) {
      setFormData((prev) => ({
        ...prev,
        type,
        category: typeInfo.category,
        subject: prev.subject || typeInfo.defaultSubject,
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <EmailIcons.Envelope className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {mode === 'add' ? 'Create Email Template' : 'Edit Email Template'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'add' ? 'Add a new email template' : 'Update template details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <EmailIcons.X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name & Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="e.g., Welcome Email"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type || 'welcome'}
                onChange={(e) => handleTypeChange(e.target.value as EmailTemplateType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {EMAIL_TEMPLATE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this template..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.subject || ''}
              onChange={(e) => handleChange('subject', e.target.value)}
              placeholder="e.g., Welcome to {{company_name}}!"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.subject ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject}</p>}
            <p className="text-xs text-gray-500 mt-1">Use {`{{placeholder}}`} for dynamic content</p>
          </div>

          {/* HTML Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              HTML Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.html_code || ''}
              onChange={(e) => handleChange('html_code', e.target.value)}
              placeholder="<html>...</html>"
              rows={12}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm ${
                errors.html_code ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.html_code && <p className="text-red-500 text-xs mt-1">{errors.html_code}</p>}
          </div>

          {/* Logo Image URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo Image URL
            </label>
            <input
              type="text"
              value={formData.email_main_logo_image || ''}
              onChange={(e) => handleChange('email_main_logo_image', e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Category & From Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category || 'transactional'}
                onChange={(e) => handleChange('category', e.target.value as EmailTemplateCategory)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} - {cat.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email Type
              </label>
              <select
                value={formData.from_email_address_type || 'transactional_email'}
                onChange={(e) => handleChange('from_email_address_type', e.target.value as FromEmailAddressType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {FROM_EMAIL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active (template will be used for sending emails)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {saving ? (
                <>
                  <EmailIcons.Refresh className="h-5 w-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <EmailIcons.CheckCircle className="h-5 w-5 mr-2" />
                  {mode === 'add' ? 'Create Template' : 'Save Changes'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
