'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '@/ui/Button';
import { 
  Save, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Code,
  RotateCcw
} from 'lucide-react';

interface SignatureData {
  id?: number;
  signature_html: string;
  is_organization_wide: boolean;
}

interface SignatureEditorProps {
  primary: { base: string; hover: string };
  onMobileActionsChange?: (actions: React.ReactNode) => void;
}

export default function SignatureEditor({ primary, onMobileActionsChange }: SignatureEditorProps) {
  const [signature, setSignature] = useState<SignatureData>({
    signature_html: '',
    is_organization_wide: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showHtml, setShowHtml] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load signature on mount

  // Provide mobile action buttons (Reset and Save)
  useEffect(() => {
    if (onMobileActionsChange) {
      onMobileActionsChange(
        <div className="flex gap-2 lg:justify-end">
          <Button
            onClick={handleReset}
            variant="light-outline"
            className="flex-1 lg:flex-initial flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="primary"
            className="flex-1 lg:flex-initial flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save
          </Button>
        </div>
      );
    }
    return () => {
      if (onMobileActionsChange) {
        onMobileActionsChange(null);
      }
    };
  }, [isSaving, primary, onMobileActionsChange]);
  React.useEffect(() => {
    loadSignature();
  }, []);

  const loadSignature = async () => {
    setIsLoading(true);
    // TODO: Load from Supabase
    setTimeout(() => {
      setSignature({
        signature_html: `<div style="font-family: Arial, sans-serif; color: #333;">
  <p>Best regards,</p>
  <p style="margin-top: 10px;"><strong>{name}</strong><br/>
  {title}<br/>
  {company}</p>
  <p style="margin-top: 10px; font-size: 12px; color: #666;">
    📧 {email}<br/>
    📱 {phone}
  </p>
</div>`,
        is_organization_wide: false,
      });
      setIsLoading(false);
    }, 500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);
    try {
      // TODO: Save to Supabase
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSaveResult({ success: true, message: 'Signature saved successfully' });
    } catch (error) {
      setSaveResult({ success: false, message: 'Failed to save signature' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSignature({
      signature_html: '',
      is_organization_wide: false,
    });
    setSaveResult(null);
  };

  const insertMergeField = (field: string) => {
    const editor = editorRef.current;
    if (editor) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const node = document.createTextNode(`{${field}}`);
        range.insertNode(node);
        setSignature({ ...signature, signature_html: editor.innerHTML });
      }
    }
  };

  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      setSignature({ ...signature, signature_html: editorRef.current.innerHTML });
    }
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      document.execCommand('createLink', false, url);
      if (editorRef.current) {
        setSignature({ ...signature, signature_html: editorRef.current.innerHTML });
      }
    }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) {
      document.execCommand('insertImage', false, url);
      if (editorRef.current) {
        setSignature({ ...signature, signature_html: editorRef.current.innerHTML });
      }
    }
  };

  const renderPreview = () => {
    return signature.signature_html
      .replace(/{name}/g, 'John Doe')
      .replace(/{title}/g, 'Sales Manager')
      .replace(/{company}/g, 'Acme Corporation')
      .replace(/{email}/g, 'john.doe@acme.com')
      .replace(/{phone}/g, '+1 (555) 123-4567');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization-wide Toggle */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Organization-Wide Signature
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {signature.is_organization_wide
                ? 'This signature will be used by all team members'
                : 'This is your personal signature'}
            </p>
          </div>
          <button
            onClick={() =>
              setSignature({ ...signature, is_organization_wide: !signature.is_organization_wide })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              !signature.is_organization_wide ? 'bg-gray-300 dark:bg-gray-600' : ''
            }`}
            style={signature.is_organization_wide ? {
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`
            } : undefined}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                signature.is_organization_wide ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Merge Fields */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
          Insert Merge Fields
        </label>
        <div className="flex flex-wrap gap-2">
          {['name', 'title', 'company', 'email', 'phone'].map((field) => (
            <button
              key={field}
              onClick={() => insertMergeField(field)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              {'{'}
              {field}
              {'}'}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          These fields will be automatically replaced with user information
        </p>
      </div>

      {/* Editor */}
      <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-white/20 p-3 flex items-center gap-2 flex-wrap">
          <button
            onClick={() => applyFormat('bold')}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('italic')}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => applyFormat('underline')}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
            title="Underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={insertLink}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
            title="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            onClick={insertImage}
            className="p-2 hover:bg-white/50 dark:hover:bg-gray-700/50 rounded transition-colors"
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
          <button
            onClick={() => setShowHtml(!showHtml)}
            className={`p-2 rounded transition-colors ${
              !showHtml
                ? 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                : ''
            }`}
            style={showHtml ? {
              backgroundColor: `${primary.base}1A`,
              color: primary.base
            } : undefined}
            title="View HTML"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-2 rounded transition-colors ${
              !showPreview
                ? 'hover:bg-white/50 dark:hover:bg-gray-700/50'
                : ''
            }`}
            style={showPreview ? {
              backgroundColor: `${primary.base}1A`,
              color: primary.base
            } : undefined}
            title="Toggle Preview"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {/* Editor/HTML View */}
        {showHtml ? (
          <textarea
            value={signature.signature_html}
            onChange={(e) => setSignature({ ...signature, signature_html: e.target.value })}
            className="w-full p-4 bg-transparent border-0 focus:outline-none focus:ring-0 font-mono text-sm min-h-[200px] resize-none"
            placeholder="Enter HTML..."
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={(e) =>
              setSignature({ ...signature, signature_html: e.currentTarget.innerHTML })
            }
            dangerouslySetInnerHTML={{ __html: signature.signature_html }}
            className="w-full p-4 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px] prose prose-sm dark:prose-invert max-w-none"
          />
        )}
      </div>

      {/* Preview */}
      {showPreview && (
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
            Preview (with sample data)
          </label>
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
            <div
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
              className="prose prose-sm dark:prose-invert max-w-none"
            />
          </div>
        </div>
      )}

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
    </div>
  );
}
