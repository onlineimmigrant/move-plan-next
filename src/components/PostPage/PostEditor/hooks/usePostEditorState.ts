'use client';

import { useState, useRef } from 'react';
import type { EditorMode } from '../types';

interface UsePostEditorStateProps {
  initialContentType?: 'html' | 'markdown';
  initialCodeView?: boolean;
  postType?: string;
}

export const usePostEditorState = ({
  initialContentType,
  initialCodeView,
  postType = 'default'
}: UsePostEditorStateProps) => {
  // Editor mode state - Initialize based on initialContentType
  const getInitialEditorMode = (): EditorMode => {
    if (initialContentType === 'markdown') {
      return 'markdown';
    }
    if (initialCodeView !== undefined) {
      return initialCodeView ? 'html' : 'visual';
    }
    return postType === 'landing' ? 'html' : 'visual';
  };

  // UI States
  const [showTableSubmenu, setShowTableSubmenu] = useState(false);
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [htmlToolbarCollapsed, setHtmlToolbarCollapsed] = useState(false);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState<'saved' | 'saving' | null>(null);
  
  // Editor mode state
  const [editorMode, setEditorMode] = useState<EditorMode>(getInitialEditorMode());
  const hasSetInitialMode = useRef(false);
  
  // Content states
  const [htmlContent, setHtmlContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  
  // Modal states
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showVideoGallery, setShowVideoGallery] = useState(false);
  const [showCarouselGallery, setShowCarouselGallery] = useState(false);
  const [showCarouselImagePicker, setShowCarouselImagePicker] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showContentTypeModal, setShowContentTypeModal] = useState(false);
  
  // Media states
  const [carouselMediaItems, setCarouselMediaItems] = useState<Array<{
    id: number;
    type: 'image' | 'video';
    url: string;
    thumbnailUrl?: string;
    videoPlayer?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
  }>>([]);
  
  // Link states
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  
  // HTML editor states
  const [htmlEditorBgColor, setHtmlEditorBgColor] = useState<'dark' | 'light'>('dark');
  const [copySuccess, setCopySuccess] = useState(false);
  const [pendingContentType, setPendingContentType] = useState<'html' | 'markdown' | null>(null);
  const [htmlValidationErrors, setHtmlValidationErrors] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Undo/Redo state for HTML editor
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [htmlHistoryIndex, setHtmlHistoryIndex] = useState(-1);
  
  // Find & Replace states
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  
  // Beautify settings state with localStorage persistence
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
  const [lineEnding, setLineEnding] = useState<'LF' | 'CRLF'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_lineEnding');
      return (saved === 'CRLF' ? 'CRLF' : 'LF') as 'LF' | 'CRLF';
    }
    return 'LF';
  });
  
  // Syntax highlighting state
  const [syntaxHighlighting, setSyntaxHighlighting] = useState(true);
  
  // Refs
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef<string | undefined>(undefined);

  return {
    // UI States
    showTableSubmenu,
    setShowTableSubmenu,
    showFloatingToolbar,
    setShowFloatingToolbar,
    htmlToolbarCollapsed,
    setHtmlToolbarCollapsed,
    autoSaveIndicator,
    setAutoSaveIndicator,
    
    // Editor mode
    editorMode,
    setEditorMode,
    hasSetInitialMode,
    isCodeView: editorMode === 'html',
    
    // Content
    htmlContent,
    setHtmlContent,
    markdownContent,
    setMarkdownContent,
    
    // Modals
    showImageGallery,
    setShowImageGallery,
    showVideoGallery,
    setShowVideoGallery,
    showCarouselGallery,
    setShowCarouselGallery,
    showCarouselImagePicker,
    setShowCarouselImagePicker,
    showLinkModal,
    setShowLinkModal,
    showContentTypeModal,
    setShowContentTypeModal,
    
    // Media
    carouselMediaItems,
    setCarouselMediaItems,
    
    // Link
    currentLinkUrl,
    setCurrentLinkUrl,
    
    // HTML Editor
    htmlEditorBgColor,
    setHtmlEditorBgColor,
    copySuccess,
    setCopySuccess,
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
    
    // Beautify Settings
    showBeautifySettings,
    setShowBeautifySettings,
    indentType,
    setIndentType,
    indentSize,
    setIndentSize,
    lineEnding,
    setLineEnding,
    
    // Syntax
    syntaxHighlighting,
    setSyntaxHighlighting,
    
    // Refs
    lineNumbersRef,
    textareaRef,
    highlightLayerRef,
    initialContentRef,
  };
};
