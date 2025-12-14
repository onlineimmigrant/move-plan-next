'use client';

import React, { useState } from 'react';
import { useEmailBranding } from '../../hooks/useEmailBranding';
import { useSettings } from '@/context/SettingsContext';
import { 
  Palette, 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Upload,
  Eye
} from 'lucide-react';

const FONT_FAMILIES = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Helvetica, Arial, sans-serif', label: 'Helvetica' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Times New Roman, serif', label: 'Times New Roman' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: 'Roboto, sans-serif', label: 'Roboto' },
  { value: 'Open Sans, sans-serif', label: 'Open Sans' },
  { value: 'Lato, sans-serif', label: 'Lato' },
];

interface BrandingEditorProps {
  primary: { base: string; hover: string };
}

export default function BrandingEditor({ primary }: BrandingEditorProps) {
  const { branding, isLoading, updateBranding } = useEmailBranding();
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    use_primary_color: true,
    use_seo_og_image_as_logo: true,
    custom_logo_url: '',
    custom_primary_color: '#6366f1',
    font_family: 'Arial, sans-serif',
    button_border_radius: 8,
    container_max_width: 600,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  React.useEffect(() => {
    if (branding) {
      setFormData({
        use_primary_color: branding.use_primary_color ?? true,
        use_seo_og_image_as_logo: branding.use_seo_og_image_as_logo ?? true,
        custom_logo_url: branding.custom_logo_url || '',
        custom_primary_color: branding.custom_primary_color || '#6366f1',
        font_family: branding.font_family || 'Arial, sans-serif',
        button_border_radius: branding.button_border_radius ?? 8,
        container_max_width: branding.container_max_width ?? 600,
      });
    }
  }, [branding]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      await updateBranding(formData);
      setSaveResult({ success: true, message: 'Branding saved successfully' });
    } catch (error) {
      setSaveResult({ success: false, message: 'Failed to save branding' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      use_primary_color: true,
      use_seo_og_image_as_logo: true,
      custom_logo_url: '',
      custom_primary_color: '#6366f1',
      font_family: 'Arial, sans-serif',
      button_border_radius: 8,
      container_max_width: 600,
    });
    setSaveResult(null);
  };

  const getActivePrimaryColor = () => {
    if (formData.use_primary_color && settings?.primary_color) {
      return settings.primary_color;
    }
    return formData.custom_primary_color;
  };

  const getActiveLogoUrl = () => {
    if (formData.use_seo_og_image_as_logo && settings?.seo_og_image) {
      return settings.seo_og_image;
    }
    return formData.custom_logo_url;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-6 space-y-6">
          {/* Primary Color Toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use Primary Color
              </label>
              <button
                onClick={() => setFormData({ ...formData, use_primary_color: !formData.use_primary_color })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !formData.use_primary_color ? 'bg-gray-300 dark:bg-gray-600' : ''
                }`}
                style={formData.use_primary_color ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
                } : undefined}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.use_primary_color ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {formData.use_primary_color
                ? `Using brand primary color: ${settings?.primary_color || '#6366f1'}`
                : 'Using custom color below'}
            </p>
          </div>

          {/* Custom Color Picker */}
          {!formData.use_primary_color && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Primary Color
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={formData.custom_primary_color}
                  onChange={(e) => setFormData({ ...formData, custom_primary_color: e.target.value })}
                  className="h-10 w-16 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.custom_primary_color}
                  onChange={(e) => setFormData({ ...formData, custom_primary_color: e.target.value })}
                  placeholder="#6366f1"
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          {/* Logo Toggle */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use SEO Logo
              </label>
              <button
                onClick={() => setFormData({ ...formData, use_seo_og_image_as_logo: !formData.use_seo_og_image_as_logo })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  !formData.use_seo_og_image_as_logo ? 'bg-gray-300 dark:bg-gray-600' : ''
                }`}
                style={formData.use_seo_og_image_as_logo ? {
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
                } : undefined}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.use_seo_og_image_as_logo ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {formData.use_seo_og_image_as_logo
                ? 'Using SEO OG image from settings'
                : 'Using custom logo URL below'}
            </p>
          </div>

          {/* Custom Logo URL */}
          {!formData.use_seo_og_image_as_logo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Logo URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={formData.custom_logo_url}
                  onChange={(e) => setFormData({ ...formData, custom_logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="flex-1 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Font Family */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Font Family
            </label>
            <select
              value={formData.font_family}
              onChange={(e) => setFormData({ ...formData, font_family: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>

          {/* Button Border Radius */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Button Border Radius: {formData.button_border_radius}px
            </label>
            <input
              type="range"
              min="0"
              max="20"
              value={formData.button_border_radius}
              onChange={(e) => setFormData({ ...formData, button_border_radius: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Container Max Width */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Container Max Width: {formData.container_max_width}px
            </label>
            <input
              type="range"
              min="400"
              max="800"
              step="50"
              value={formData.container_max_width}
              onChange={(e) => setFormData({ ...formData, container_max_width: Number(e.target.value) })}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Save Result */}
          {saveResult && (
            <div
              className={`flex items-center gap-3 p-4 rounded-lg ${
                saveResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {saveResult.success ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <p className="text-sm">{saveResult.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              }}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Branding
            </button>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Live Preview
          </h3>
        </div>

        <div className="bg-gray-100 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          {/* Email Preview */}
          <div
            style={{
              maxWidth: `${formData.container_max_width}px`,
              fontFamily: formData.font_family,
              margin: '0 auto',
            }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
          >
            {/* Email Header */}
            <div
              style={{ backgroundColor: getActivePrimaryColor() }}
              className="p-6 text-white"
            >
              {getActiveLogoUrl() && (
                <img
                  src={getActiveLogoUrl()}
                  alt="Logo"
                  className="h-12 mb-4 object-contain"
                  style={{ maxHeight: '48px' }}
                />
              )}
              <h1 className="text-2xl font-bold">Welcome to Our Platform!</h1>
            </div>

            {/* Email Body */}
            <div className="p-6 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Hi there,
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Thank you for joining us. We're excited to have you on board. This is how your transactional emails will look with your custom branding.
              </p>

              {/* Sample Button */}
              <div className="pt-2">
                <a
                  href="#"
                  style={{
                    backgroundColor: getActivePrimaryColor(),
                    borderRadius: `${formData.button_border_radius}px`,
                  }}
                  className="inline-block px-6 py-3 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Get Started
                </a>
              </div>

              <p className="text-gray-700 dark:text-gray-300">
                If you have any questions, feel free to reach out to our support team.
              </p>

              <p className="text-gray-700 dark:text-gray-300">
                Best regards,<br />
                The Team
              </p>
            </div>

            {/* Email Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                © 2024 Your Company. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
