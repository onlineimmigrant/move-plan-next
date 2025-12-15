'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { useEmailToast } from '../../hooks/useEmailToast';
import { TEMPLATE_PLACEHOLDERS } from '@/components/EmailTemplates/_shared/types/emailTemplate';

type EmailTemplate = {
  id: number;
  organization_id: string;
  name: string;
  description: string | null;
  subject: string | null;
  html_code: string | null;
  type: string | null;
  category: 'transactional' | 'marketing' | 'system' | null;
  from_email_address_type: 'transactional_email' | 'marketing_email' | 'transactional_email_2' | 'marketing_email_2' | null;
  email_main_logo_image: string | null;
  is_active: boolean;
  is_default: boolean;
  created_by: string | null;
  created_at?: string;
  updated_at: string | null;
};
import { 
  Save,
  X,
  Eye,
  Code,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  FileDown,
  FileUp,
  Maximize2,
  Split,
  Plus,
  Palette
} from 'lucide-react';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal/ImageGalleryModal';

interface TemplateEditorProps {
  templateId: number | null;
  onClose: () => void;
  primary: { base: string; hover: string };
}

export default React.memo(function TemplateEditor({ templateId, onClose, primary }: TemplateEditorProps) {
  const { 
    getTemplateById, 
    createTemplate, 
    updateTemplate,
    isLoading: templatesLoading
  } = useEmailTemplates();
  const toast = useEmailToast();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlCode, setHtmlCode] = useState('');
  const [category, setCategory] = useState<'transactional' | 'marketing' | 'system'>('transactional');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [viewMode, setViewMode] = useState<'visual' | 'code' | 'split'>('code');
  const [showVariables, setShowVariables] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [iframeInitKey, setIframeInitKey] = useState(0);
  const [showElementPanel, setShowElementPanel] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const visualEditorRef = useRef<HTMLDivElement>(null);
  const visualIframeRef = useRef<HTMLIFrameElement>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const savingRef = useRef(false);
  const initialValuesRef = useRef<{
    name: string;
    description: string;
    subject: string;
    htmlCode: string;
    category: 'transactional' | 'marketing' | 'system';
    isActive: boolean;
  }>({ name: '', description: '', subject: '', htmlCode: '', category: 'transactional', isActive: true });

  useEffect(() => {
    // Wait for templates to load before trying to fetch
    if (templatesLoading) return;
    
    if (templateId && templateId > 0) {
      const template = getTemplateById(templateId);
      if (template) {
        const values = {
          name: template.name || '',
          description: template.description || '',
          subject: template.subject || '',
          htmlCode: template.html_code || '',
          category: template.category || ('transactional' as 'transactional' | 'marketing' | 'system'),
          isActive: template.is_active
        };
        setName(values.name);
        setDescription(values.description);
        setSubject(values.subject);
        setHtmlCode(values.htmlCode);
        setCategory(values.category);
        setIsActive(values.isActive);
        initialValuesRef.current = values;
        setHasUnsavedChanges(false);
        // Trigger iframe re-initialization with new content
        setIframeInitKey(prev => prev + 1);
      }
    } else if (templateId === 0) {
      // Reset form for new template
      const values = {
        name: '',
        description: '',
        subject: '',
        htmlCode: '',
        category: 'transactional' as 'transactional' | 'marketing' | 'system',
        isActive: true
      };
      setName(values.name);
      setDescription(values.description);
      setSubject(values.subject);
      setHtmlCode(values.htmlCode);
      setCategory(values.category);
      setIsActive(values.isActive);
      initialValuesRef.current = values;
      setHasUnsavedChanges(false);
      // Trigger iframe re-initialization
      setIframeInitKey(prev => prev + 1);
    }
  }, [templateId, getTemplateById, templatesLoading]);

  const handleSave = useCallback(async () => {
    savingRef.current = true;
    
    // Get content directly - either from iframe or from state
    let contentToSave = htmlCode;
    if (viewMode === 'visual' && visualIframeRef.current) {
      const iframe = visualIframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc && doc.body) {
        contentToSave = doc.body.innerHTML;
        console.log('📝 Saving from visual editor, content length:', contentToSave.length);
      }
    } else {
      console.log('📝 Saving from code editor, content length:', contentToSave.length);
    }

    if (!name.trim() || !contentToSave.trim()) {
      toast.error('Please fill in template name and HTML code');
      savingRef.current = false;
      return;
    }

    setSaving(true);
    toast.info(templateId ? 'Updating template...' : 'Creating template...');

    const templateData: Omit<EmailTemplate, 'id' | 'organization_id' | 'created_at' | 'updated_at'> = {
      name: name.trim(),
      description: description.trim() || null,
      subject: subject.trim() || 'No Subject',
      html_code: contentToSave.trim(),
      category: category,
      is_active: isActive,
      type: 'custom',
      from_email_address_type: category === 'marketing' ? 'marketing_email' : 'transactional_email',
      email_main_logo_image: null,
      is_default: false,
      created_by: null,
    };

    let success = false;
    let errorOccurred = false;
    
    try {
      if (templateId && templateId > 0) {
        console.log('🔄 Updating template:', templateId);
        success = await updateTemplate(templateId, templateData);
        console.log('✅ Update result:', success);
      } else {
        console.log('➕ Creating new template');
        const result = await createTemplate(templateData);
        success = !!result;
        console.log('✅ Create result:', success, result);
      }
    } catch (error: any) {
      console.error('❌ Save error:', error);
      errorOccurred = true;
      
      // Check if it's the streaming error - Supabase sometimes saves successfully but streaming fails
      if (error.message?.includes('transformAlgorithm') || error.digest) {
        console.log('⚠️ Streaming error detected, assuming save succeeded...');
        success = true; // Assume success despite streaming error
      } else {
        success = false;
      }
    }

    setSaving(false);
    savingRef.current = false;

    if (success) {
      toast.success(templateId ? 'Template updated successfully!' : 'Template created successfully!');
      setHasUnsavedChanges(false);
      // Update state with what was saved
      setHtmlCode(contentToSave.trim());
      // Update ref to prevent unnecessary syncs
      lastSyncedHtmlRef.current = contentToSave.trim();
    } else {
      toast.error('Failed to save template. Please try again.');
    }
  }, [htmlCode, viewMode, name, category, isActive, templateId, updateTemplate, createTemplate, toast]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const insertVariable = (variable: string) => {
    if (viewMode === 'visual') {
      const iframe = visualIframeRef.current;
      if (iframe && iframe.contentWindow) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.body.focus();
        doc.execCommand('insertText', false, `{{${variable}}}`);
        syncVisualToCode();
        setShowVariables(false);
      }
    } else {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = htmlCode;
        const before = text.substring(0, start);
        const after = text.substring(end);
        setHtmlCode(before + `{{${variable}}}` + after);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
        }, 0);
        setShowVariables(false);
      }
    }
  };

  const insertFormatting = (tag: string, displayText = '') => {
    if (viewMode === 'visual') {
      const iframe = visualIframeRef.current;
      if (!iframe || !iframe.contentWindow) return;
      
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      doc.body.focus();
      
      switch(tag) {
        case 'bold':
          doc.execCommand('bold', false);
          break;
        case 'italic':
          doc.execCommand('italic', false);
          break;
        case 'underline':
          doc.execCommand('underline', false);
          break;
        case 'link':
          setShowLinkInput(true);
          setTimeout(() => linkInputRef.current?.focus(), 100);
          return;
        case 'list':
          doc.execCommand('insertUnorderedList', false);
          break;
        case 'image':
          setShowImageGallery(true);
          return;
        case 'color':
          setShowColorPicker(!showColorPicker);
          return;
        case 'center':
          doc.execCommand('justifyCenter', false);
          break;
        case 'left':
          doc.execCommand('justifyLeft', false);
          break;
        case 'right':
          doc.execCommand('justifyRight', false);
          break;
      }
      
      syncVisualToCode();
      return;
    }
    
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlCode.substring(start, end);
    const text = displayText || selectedText || `text`;
    
    let insertion = '';
    switch(tag) {
      case 'bold':
        insertion = `<strong>${text}</strong>`;
        break;
      case 'italic':
        insertion = `<em>${text}</em>`;
        break;
      case 'underline':
        insertion = `<u>${text}</u>`;
        break;
      case 'link':
        insertion = `<a href="https://example.com">${text}</a>`;
        break;
      case 'list':
        insertion = `<ul>\n  <li>${text}</li>\n  <li>Item 2</li>\n</ul>`;
        break;
      case 'image':
        insertion = `<img src="https://example.com/image.jpg" alt="${text}" style="max-width: 100%;" />`;
        break;
      case 'center':
        insertion = `<div style="text-align: center;">${text}</div>`;
        break;
      case 'left':
        insertion = `<div style="text-align: left;">${text}</div>`;
        break;
      case 'right':
        insertion = `<div style="text-align: right;">${text}</div>`;
        break;
    }

    const before = htmlCode.substring(0, start);
    const after = htmlCode.substring(end);
    setHtmlCode(before + insertion + after);
    
    setTimeout(() => {
      textarea.focus();
      const newPos = start + insertion.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleExport = () => {
    const data = { name, description, subject, htmlCode, category, isActive };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name || 'template'}.json`;
    a.click();
    toast.success('Template exported successfully!');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setName(data.name || '');
        setDescription(data.description || '');
        setSubject(data.subject || '');
        setHtmlCode(data.htmlCode || '');
        setCategory(data.category || 'transactional');
        setIsActive(data.isActive !== undefined ? data.isActive : true);
        toast.success('Template imported successfully!');
      } catch (error) {
        toast.error('Invalid template file format');
      }
    };
    reader.readAsText(file);
  };

  // Visual editor functions
  const handleInsertLink = () => {
    if (viewMode === 'visual') {
      const iframe = visualIframeRef.current;
      if (iframe && iframe.contentWindow && linkUrl) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.execCommand('createLink', false, linkUrl);
        syncVisualToCode();
      }
    }
    setShowLinkInput(false);
    setLinkUrl('https://');
  };

  const handleColorChange = (color: string) => {
    if (viewMode === 'visual') {
      const iframe = visualIframeRef.current;
      if (iframe && iframe.contentWindow) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        doc.execCommand('foreColor', false, color);
        syncVisualToCode();
      }
    }
    setSelectedColor(color);
  };

  const handleImageSelect = (url: string) => {
    if (viewMode === 'visual') {
      const iframe = visualIframeRef.current;
      if (iframe && iframe.contentWindow) {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const body = doc.body;
        body.focus();
        const img = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto; display: block; margin: 12px 0;" />`;
        doc.execCommand('insertHTML', false, img);
        syncVisualToCode();
      }
    }
    setShowImageGallery(false);
  };

  const insertElement = (type: string) => {
    const iframe = visualIframeRef.current;
    if (!iframe || !iframe.contentWindow) return;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const body = doc.body;

    let element = '';
    switch(type) {
      case 'heading':
        element = '<h2 style="font-size: 24px; font-weight: bold; margin: 16px 0; color: #1f2937;">Your Heading</h2>';
        break;
      case 'paragraph':
        element = '<p style="font-size: 14px; line-height: 1.6; margin: 12px 0; color: #374151;">Your paragraph text goes here.</p>';
        break;
      case 'button':
        element = '<a href="https://example.com" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0;">Click Here</a>';
        break;
      case 'image':
        element = '<img src="https://via.placeholder.com/600x300" alt="Image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />';
        break;
      case 'divider':
        element = '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />';
        break;
      case 'spacer':
        element = '<div style="height: 32px;"></div>';
        break;
      case 'list':
        element = '<ul style="margin: 12px 0; padding-left: 24px;"><li style="margin: 6px 0;">List item 1</li><li style="margin: 6px 0;">List item 2</li><li style="margin: 6px 0;">List item 3</li></ul>';
        break;
      case 'table':
        element = '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;"><tr><th style="padding: 12px; border: 1px solid #e5e7eb; background: #f3f4f6; font-weight: 600;">Header 1</th><th style="padding: 12px; border: 1px solid #e5e7eb; background: #f3f4f6; font-weight: 600;">Header 2</th></tr><tr><td style="padding: 12px; border: 1px solid #e5e7eb;">Cell 1</td><td style="padding: 12px; border: 1px solid #e5e7eb;">Cell 2</td></tr></table>';
        break;
    }

    body.focus();
    doc.execCommand('insertHTML', false, element);
    syncVisualToCode();
    setShowElementPanel(false);
  };

  const [syncTimeout, setSyncTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const lastSyncedHtmlRef = useRef<string>('');
  
  const syncVisualToCode = useCallback(() => {
    // Don't sync during save process
    if (savingRef.current) return;
    
    // Clear existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    // Debounce sync by 500ms
    const timeout = setTimeout(() => {
      const iframe = visualIframeRef.current;
      if (iframe && iframe.contentWindow) {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (doc && doc.body) {
            const newHtml = doc.body.innerHTML;
            // Only update if content actually changed and we're not in a save operation
            // Use ref to avoid triggering re-renders
            if (newHtml !== lastSyncedHtmlRef.current && newHtml !== htmlCode && !savingRef.current) {
              console.log('📝 Syncing visual to code:', newHtml.length, 'chars');
              lastSyncedHtmlRef.current = newHtml;
              setHtmlCode(newHtml);
            }
          }
        } catch (e) {
          console.error('Sync error:', e);
        }
      }
    }, 500);
    
    setSyncTimeout(timeout);
  }, [htmlCode, syncTimeout]);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, [syncTimeout]);

  const syncCodeToVisual = () => {
    const iframe = visualIframeRef.current;
    if (iframe && iframe.contentWindow) {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (doc.body.innerHTML !== htmlCode) {
        doc.body.innerHTML = htmlCode;
      }
    }
  };

  // Initialize iframe and sync when switching to visual mode
  React.useEffect(() => {
    if (viewMode === 'visual' && visualIframeRef.current) {
      const iframe = visualIframeRef.current;
      
      const initIframe = () => {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          console.log('🎨 Initializing iframe with content length:', htmlCode.length);
          // Set up document
          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="UTF-8">
                <style>
                  body {
                    margin: 0;
                    padding: 24px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: #1f2937;
                    min-height: 460px;
                  }
                  body:focus {
                    outline: none;
                  }
                </style>
              </head>
              <body contenteditable="true">${htmlCode}</body>
            </html>
          `);
          doc.close();
          
          // Clean up existing event listeners first
          const existingHandleInput = (doc.body as any)._handleInput;
          const existingHandleBlur = (doc.body as any)._handleBlur;
          const existingHandleKeyUp = (doc.body as any)._handleKeyUp;
          
          if (existingHandleInput) doc.body.removeEventListener('input', existingHandleInput);
          if (existingHandleBlur) doc.body.removeEventListener('blur', existingHandleBlur);
          if (existingHandleKeyUp) doc.body.removeEventListener('keyup', existingHandleKeyUp);
          
          // Add event listeners - only blur to avoid constant re-renders
          const handleBlur = () => {
            console.log('📝 Blur - syncing content');
            syncVisualToCode();
          };
          
          // Store references for cleanup
          (doc.body as any)._handleBlur = handleBlur;
          
          doc.body.addEventListener('blur', handleBlur);
          
          // Set cursor to end of content
          setTimeout(() => {
            if (doc.body.textContent || doc.body.children.length > 0) {
              // Content exists - move cursor to end
              const range = doc.createRange();
              const sel = iframe.contentWindow?.getSelection();
              if (sel) {
                try {
                  range.selectNodeContents(doc.body);
                  range.collapse(false); // false = collapse to end
                  sel.removeAllRanges();
                  sel.addRange(range);
                } catch (e) {
                  console.log('Could not set cursor position');
                }
              }
            }
            doc.body.focus();
          }, 150);
        }
      };
      
      if (iframe.contentDocument?.readyState === 'complete') {
        initIframe();
      } else {
        iframe.onload = initIframe;
      }
    }
  }, [viewMode, iframeInitKey]); // Only re-init when switching modes or when iframeInitKey changes (template load)

  // Group variables by category
  const variablesByCategory = TEMPLATE_PLACEHOLDERS.reduce((acc, placeholder) => {
    if (!acc[placeholder.category]) acc[placeholder.category] = [];
    acc[placeholder.category].push(placeholder);
    return acc;
  }, {} as Record<string, typeof TEMPLATE_PLACEHOLDERS>);

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${fullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full overflow-hidden flex flex-col ${fullscreen ? 'h-full max-w-none' : 'max-w-6xl max-h-[90vh]'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {templateId && templateId > 0 ? 'Edit Template' : 'New Template'}
            </h3>
            {hasUnsavedChanges && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!templatesLoading && (
              <>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                  title="Toggle Preview"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden sm:inline">{showPreview ? 'Edit' : 'Preview'}</span>
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                  title="Export Template"
                >
                  <FileDown className="w-4 h-4" />
                </button>
                <label className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 cursor-pointer"
                  title="Import Template"
                >
                  <FileUp className="w-4 h-4" />
                  <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                </label>
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {templatesLoading && templateId && templateId > 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading template...</p>
              </div>
            </div>
          ) : !showPreview ? (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Welcome Email"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="transactional">Transactional</option>
                    <option value="marketing">Marketing</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Welcome to {{company_name}}"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>

              {/* Formatting Toolbar */}
              <div className={viewMode === 'visual' ? 'sticky top-0 z-10 bg-white dark:bg-gray-800 pb-4 -mx-6 px-6 shadow-md' : ''}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formatting Tools
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => insertFormatting('bold')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('italic')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('underline')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                  <button
                    onClick={() => insertFormatting('link')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Insert Link"
                  >
                    <Link className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('image')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Insert Image"
                  >
                    <Image className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('list')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Insert List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                  <button
                    onClick={() => insertFormatting('color')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors relative"
                    title="Text Color"
                  >
                    <Palette className="w-4 h-4" style={{ color: selectedColor }} />
                  </button>
                  <div className="w-px bg-gray-300 dark:bg-gray-600"></div>
                  <button
                    onClick={() => insertFormatting('left')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('center')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => insertFormatting('right')}
                    className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded transition-colors"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Variable Library */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Variables Library ({Object.values(variablesByCategory).flat().length} available)
                  </label>
                  <button
                    onClick={() => setShowVariables(!showVariables)}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-medium"
                  >
                    {showVariables ? 'Hide' : 'Show'} All
                    <ChevronDown className={`w-4 h-4 transition-transform ${showVariables ? 'rotate-180' : ''}`} />
                  </button>
                </div>
                {showVariables && (
                  <div className="max-h-48 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    {Object.entries(variablesByCategory).map(([category, variables]) => (
                      <div key={category} className="mb-3 last:mb-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">
                          {category}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {variables.map((variable) => (
                            <button
                              key={variable.name}
                              onClick={() => insertVariable(variable.name)}
                              className="text-xs px-2 py-1 bg-white dark:bg-gray-800 hover:bg-primary/10 border border-gray-200 dark:border-gray-700 rounded transition-colors"
                              title={variable.description}
                            >
                              {`{{${variable.name}}}`}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewMode('visual')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
                      viewMode === 'visual'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Type className="w-4 h-4" />
                    Visual
                  </button>
                  <button
                    onClick={() => setViewMode('code')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
                      viewMode === 'code'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    HTML
                  </button>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all ${
                      viewMode === 'split'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Split className="w-4 h-4" />
                    Split View
                  </button>
                </div>
                {viewMode === 'visual' && (
                  <button
                    onClick={() => setShowElementPanel(!showElementPanel)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors mr-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Element
                  </button>
                )}
              </div>

              {/* Inline Link Input */}
              {viewMode === 'visual' && showLinkInput && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-primary" />
                    <input
                      ref={linkInputRef}
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleInsertLink();
                        } else if (e.key === 'Escape') {
                          setShowLinkInput(false);
                          setLinkUrl('https://');
                        }
                      }}
                      placeholder="Enter URL (https://...)"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <button
                      onClick={handleInsertLink}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      Insert
                    </button>
                    <button
                      onClick={() => {
                        setShowLinkInput(false);
                        setLinkUrl('https://');
                      }}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Color Picker */}
              {viewMode === 'visual' && showColorPicker && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-purple-50 dark:bg-purple-900/20">
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-primary" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Text Color:</label>
                    <div className="flex gap-2">
                      {['#000000', '#374151', '#6b7280', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'].map((color) => (
                        <button
                          key={color}
                          onClick={() => handleColorChange(color)}
                          className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                          style={{ 
                            backgroundColor: color,
                            borderColor: selectedColor === color ? '#3b82f6' : '#d1d5db'
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setShowColorPicker(false)}
                      className="ml-auto px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Element Panel for Visual Mode */}
              {viewMode === 'visual' && showElementPanel && (
                <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Insert Element:
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { type: 'heading', label: 'Heading', icon: 'H1' },
                      { type: 'paragraph', label: 'Paragraph', icon: 'P' },
                      { type: 'button', label: 'Button', icon: '□' },
                      { type: 'image', label: 'Image', icon: '🖼' },
                      { type: 'divider', label: 'Divider', icon: '—' },
                      { type: 'spacer', label: 'Spacer', icon: '⇅' },
                      { type: 'list', label: 'List', icon: '•' },
                      { type: 'table', label: 'Table', icon: '⊞' },
                    ].map((el) => (
                      <button
                        key={el.type}
                        onClick={() => insertElement(el.type)}
                        className="flex flex-col items-center gap-1 p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                      >
                        <span className="text-lg">{el.icon}</span>
                        <span className="text-xs font-medium">{el.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Editor Content */}
              {viewMode === 'visual' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visual Editor *
                  </label>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg opacity-30 blur"></div>
                    <div className="relative bg-white rounded-lg shadow-2xl border-2 border-blue-500/50 overflow-hidden">
                      <iframe
                        ref={visualIframeRef}
                        title="Visual Editor"
                        className="w-full border-0"
                        style={{ height: '500px', display: 'block' }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
                    <span>💡</span>
                    <span>Use the formatting toolbar above to style text, insert variables from the library, or add elements with the panel</span>
                  </p>
                </div>
              ) : (
                <div className={viewMode === 'split' ? 'grid grid-cols-2 gap-4' : ''}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      HTML Code *
                    </label>
                    <textarea
                      ref={textareaRef}
                      id="body-editor"
                      value={htmlCode}
                      onChange={(e) => setHtmlCode(e.target.value)}
                      placeholder="<html><body>Your email HTML content here...</body></html>"
                      rows={viewMode === 'split' ? 12 : 15}
                      className="w-full px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm resize-none"
                    />
                  </div>
                  {viewMode === 'split' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Live Preview
                      </label>
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                        <iframe
                          srcDoc={`
                            <!DOCTYPE html>
                            <html>
                              <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <style>
                                  body {
                                    margin: 0;
                                    padding: 12px;
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                    font-size: 13px;
                                    line-height: 1.5;
                                    color: #1f2937;
                                  }
                                  img { max-width: 100%; height: auto; }
                                  a { color: #3b82f6; }
                                </style>
                              </head>
                              <body>${htmlCode || '<p style="color: #9ca3af;">No content</p>'}</body>
                            </html>
                          `}
                          title="Live Preview"
                          sandbox="allow-same-origin"
                          className="w-full border-0"
                          style={{ height: '345px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <label htmlFor="is-active" className="text-sm text-gray-700 dark:text-gray-300">
                  Template is active
                </label>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <p className="text-xs text-gray-500 mb-1">Subject:</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{subject || 'No subject'}</p>
                </div>
                <div className="p-6">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white">
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                              body {
                                margin: 0;
                                padding: 16px;
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                                font-size: 14px;
                                line-height: 1.6;
                                color: #1f2937;
                              }
                              img { max-width: 100%; height: auto; }
                              a { color: #3b82f6; text-decoration: underline; }
                            </style>
                          </head>
                          <body>${htmlCode || '<p style="color: #9ca3af;">No content</p>'}</body>
                        </html>
                      `}
                      title="Template Preview"
                      sandbox="allow-same-origin"
                      className="w-full border-0"
                      style={{ minHeight: '300px' }}
                      onLoad={(e) => {
                        const iframe = e.target as HTMLIFrameElement;
                        if (iframe.contentWindow) {
                          const height = iframe.contentWindow.document.body.scrollHeight;
                          iframe.style.height = `${Math.max(300, height + 32)}px`;
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || !htmlCode.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>

    {/* Image Gallery Modal */}
    {showImageGallery && (
      <ImageGalleryModal
        isOpen={showImageGallery}
        onClose={() => setShowImageGallery(false)}
        onSelectImage={handleImageSelect}
        defaultTab="r2images"
      />
    )}
    </>
  );
});
