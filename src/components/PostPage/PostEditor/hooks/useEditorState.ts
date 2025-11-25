import { useState, useRef } from 'react';
import type { EditorMode } from '../types';

interface UseEditorStateProps {
  initialContentType?: 'html' | 'markdown';
  initialCodeView?: boolean;
  postType?: 'default' | 'minimal' | 'landing' | 'doc_set';
}

export function useEditorState({ initialContentType, initialCodeView, postType = 'default' }: UseEditorStateProps) {
  // Editor mode state
  const getInitialEditorMode = (): EditorMode => {
    if (initialContentType === 'markdown') {
      return 'markdown';
    }
    if (initialCodeView !== undefined) {
      return initialCodeView ? 'html' : 'visual';
    }
    return postType === 'landing' ? 'html' : 'visual';
  };
  
  const [editorMode, setEditorMode] = useState<EditorMode>(getInitialEditorMode());
  const hasSetInitialMode = useRef(false);
  
  // UI state
  const [showTableSubmenu, setShowTableSubmenu] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [htmlToolbarCollapsed, setHtmlToolbarCollapsed] = useState(false);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState<'saved' | 'saving' | null>(null);
  
  // Content state
  const [htmlContent, setHtmlContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  
  // Gallery modals
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showVideoGallery, setShowVideoGallery] = useState(false);
  const [showCarouselGallery, setShowCarouselGallery] = useState(false);
  const [showCarouselImagePicker, setShowCarouselImagePicker] = useState(false);
  const [carouselMediaItems, setCarouselMediaItems] = useState<Array<{
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    videoPlayer?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
  }>>([]);
  
  // Link modal
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  
  // HTML editor settings
  const [htmlEditorBgColor, setHtmlEditorBgColor] = useState<'dark' | 'light'>('dark');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showContentTypeModal, setShowContentTypeModal] = useState(false);
  const [pendingContentType, setPendingContentType] = useState<'html' | 'markdown' | null>(null);
  const [htmlValidationErrors, setHtmlValidationErrors] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Undo/Redo state for HTML editor
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [htmlHistoryIndex, setHtmlHistoryIndex] = useState(-1);
  
  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  
  // Beautify settings with localStorage persistence
  const [showBeautifySettings, setShowBeautifySettings] = useState(false);
  const [indentType, setIndentType] = useState<'spaces' | 'tabs'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_indentType');
      return (saved === 'tabs' ? 'tabs' : 'spaces') as 'spaces' | 'tabs';
    }
    return 'spaces';
  });
  const [indentSize, setIndentSize] = useState<2 | 4>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_indentSize');
      return (saved === '4' ? 4 : 2) as 2 | 4;
    }
    return 2;
  });
  const [lineEnding, setLineEnding] = useState<'lf' | 'crlf'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_lineEnding');
      return (saved === 'crlf' ? 'crlf' : 'lf') as 'lf' | 'crlf';
    }
    return 'lf';
  });
  const [syntaxHighlighting, setSyntaxHighlighting] = useState(true);
  
  // Backward compatibility
  const isCodeView = editorMode === 'html';
  
  return {
    // Editor mode
    editorMode,
    setEditorMode,
    hasSetInitialMode,
    isCodeView,
    
    // UI state
    showTableSubmenu,
    setShowTableSubmenu,
    showFloatingToolbar,
    setShowFloatingToolbar,
    htmlToolbarCollapsed,
    setHtmlToolbarCollapsed,
    autoSaveIndicator,
    setAutoSaveIndicator,
    
    // Content
    htmlContent,
    setHtmlContent,
    markdownContent,
    setMarkdownContent,
    
    // Galleries
    showImageGallery,
    setShowImageGallery,
    showVideoGallery,
    setShowVideoGallery,
    showCarouselGallery,
    setShowCarouselGallery,
    showCarouselImagePicker,
    setShowCarouselImagePicker,
    carouselMediaItems,
    setCarouselMediaItems,
    
    // Link
    showLinkModal,
    setShowLinkModal,
    currentLinkUrl,
    setCurrentLinkUrl,
    
    // HTML editor
    htmlEditorBgColor,
    setHtmlEditorBgColor,
    copySuccess,
    setCopySuccess,
    showContentTypeModal,
    setShowContentTypeModal,
    pendingContentType,
    setPendingContentType,
    htmlValidationErrors,
    setHtmlValidationErrors,
    showValidationErrors,
    setShowValidationErrors,
    
    // History
    htmlHistory,
    setHtmlHistory,
    htmlHistoryIndex,
    setHtmlHistoryIndex,
    
    // Find & Replace
    showFindReplace,
    setShowFindReplace,
    findText,
    setFindText,
    replaceText,
    setReplaceText,
    caseSensitive,
    setCaseSensitive,
    currentMatchIndex,
    setCurrentMatchIndex,
    totalMatches,
    setTotalMatches,
    
    // Beautify settings
    showBeautifySettings,
    setShowBeautifySettings,
    indentType,
    setIndentType,
    indentSize,
    setIndentSize,
    lineEnding,
    setLineEnding,
    syntaxHighlighting,
    setSyntaxHighlighting,
  };
}
