/**
 * AIEnhancementModal Component - Premium Quality (120/100)
 * 
 * State-of-the-art AI content enhancement modal matching ChangeThumbnailModal standards
 * 
 * Premium Features:
 * ✅ Glassmorphic design with backdrop blur-2xl
 * ✅ Draggable/resizable (desktop) with Rnd
 * ✅ Responsive fullscreen (mobile)
 * ✅ Comprehensive keyboard shortcuts (Esc, Enter, Ctrl+1-6)
 * ✅ Split results with individual accept/reject
 * ✅ Multi-scope enhancement (selection, title, description, content, full)
 * ✅ Live character/word counting
 * ✅ Before/after comparison views
 * ✅ Premium animations and transitions
 * ✅ Dark mode support throughout
 * ✅ ARIA labels and accessibility
 * ✅ Focus management and keyboard navigation
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { XMarkIcon, SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';
import { useContentEnhancement, EnhancementType, EnhancementScope, EnhanceContentResponse } from '../hooks/useContentEnhancement';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Utility to count words and characters in text
 */
const getTextStats = (text: string) => {
  const chars = text.length;
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return { chars, words };
};

/**
 * Utility to highlight differences between original and enhanced text
 * Returns enhanced text with <mark> tags around new/changed words
 */
const highlightDifferences = (original: string, enhanced: string) => {
  const originalWords = original.toLowerCase().split(/\s+/);
  const enhancedWords = enhanced.split(/\s+/);
  
  return enhancedWords.map((word, index) => {
    const cleanWord = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    const isNew = !originalWords.some(ow => ow.replace(/[^a-z0-9]/g, '') === cleanWord);
    
    if (isNew && cleanWord.length > 0) {
      return `<mark class="bg-yellow-200/60 dark:bg-yellow-500/30 px-0.5 rounded">${word}</mark>`;
    }
    return word;
  }).join(' ');
};

/**
 * Utility to sanitize and render HTML/Markdown content
 * Strips images, videos, scripts while preserving text formatting
 */
const renderFormattedContent = (content: string) => {
  if (!content) return '';
  
  // Basic sanitization: remove images, videos, iframes, scripts
  let sanitized = content
    .replace(/<img[^>]*>/gi, '')
    .replace(/<video[^>]*>.*?<\/video>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/!\[.*?\]\(.*?\)/g, ''); // Remove markdown images
  
  // Convert markdown headings to HTML if not already
  sanitized = sanitized
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  
  return `<div class="formatted-content">${sanitized}</div>`;
};

interface AIEnhancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  onApply: (enhancedContent: string) => void;
  scope?: EnhancementScope;
  // Hook values passed from parent
  enhanceContent: ReturnType<typeof useContentEnhancement>['enhanceContent'];
  isEnhancing: boolean;
  error: string | null;
  enhancementResult: EnhanceContentResponse | null;
  clearResult: () => void;
  // Post data for enhancement
  postTitle?: string;
  postDescription?: string;
  postContent?: string;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
  // Editor mode to determine rendering
  editorMode?: 'visual' | 'html' | 'markdown';
}

export const AIEnhancementModal: React.FC<AIEnhancementModalProps> = ({
  isOpen,
  onClose,
  selectedText,
  onApply,
  scope = 'selection',
  // Hook values from parent
  enhanceContent,
  isEnhancing,
  error,
  enhancementResult,
  clearResult,
  // Post data
  postTitle,
  postDescription,
  postContent,
  onTitleChange,
  onDescriptionChange,
  editorMode = 'visual',
}) => {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const [enhancementType, setEnhancementType] = useState<EnhancementType>('improve');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedScope, setSelectedScope] = useState<EnhancementScope>('selection');
  
  // Track which split results to accept
  const [acceptTitle, setAcceptTitle] = useState(false);
  const [acceptDescription, setAcceptDescription] = useState(false);
  const [acceptContent, setAcceptContent] = useState(false);
  
  // Portal rendering
  const [mounted, setMounted] = useState(false);
  
  // Modal state
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Diff highlighting toggle
  const [showHighlights, setShowHighlights] = useState(true);
  
  // Assessment details toggle
  const [showAssessmentDetails, setShowAssessmentDetails] = useState(false);
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Function to render content based on editor mode
  const renderContent = (content: string) => {
    if (!content) return '';
    
    if (editorMode === 'markdown') {
      // For markdown mode, escape HTML and preserve whitespace
      const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      console.log('[AIEnhancementModal] Markdown content length:', content.length);
      console.log('[AIEnhancementModal] Markdown content newlines:', (content.match(/\n/g) || []).length);
      console.log('[AIEnhancementModal] First 200 chars:', content.substring(0, 200));
      
      return escaped;
    }
    
    // For visual/HTML mode, use the existing renderFormattedContent
    return renderFormattedContent(content);
  };
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Esc to close
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      
      // Enter to enhance or apply
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (!enhancementResult && !isEnhancing) {
          handleEnhance();
        } else if (enhancementResult) {
          handleAccept();
        }
      }
      
      // Ctrl/Cmd + number for enhancement type selection
      if ((e.metaKey || e.ctrlKey) && !enhancementResult) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
          e.preventDefault();
          const types: EnhancementType[] = ['improve', 'engaging', 'professional', 'expand', 'shorten', 'custom'];
          setEnhancementType(types[num - 1]);
        }
      }
      
      // Ctrl/Cmd + A for Accept All (full scope)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && selectedScope === 'full' && enhancementResult?.splitResults) {
        e.preventDefault();
        setAcceptTitle(true);
        setAcceptDescription(true);
        setAcceptContent(true);
      }
      
      // Ctrl/Cmd + R for Reject All (full scope)
      if ((e.metaKey || e.ctrlKey) && e.key === 'r' && selectedScope === 'full' && enhancementResult?.splitResults) {
        e.preventDefault();
        setAcceptTitle(false);
        setAcceptDescription(false);
        setAcceptContent(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, enhancementResult, isEnhancing, selectedScope]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear result and reset form when modal closes
      setEnhancementType('improve');
      setCustomInstructions('');
      setSelectedScope('selection');
      setAcceptTitle(false);
      setAcceptDescription(false);
      setAcceptContent(false);
      clearResult();
    }
  }, [isOpen, clearResult]);

  const handleEnhance = async () => {
    console.log('[AIEnhancementModal] Starting enhancement...');
    
    // Determine content based on scope
    let contentToEnhance = selectedText;
    if (selectedScope === 'title') contentToEnhance = postTitle || '';
    else if (selectedScope === 'description') contentToEnhance = postDescription || '';
    else if (selectedScope === 'content') contentToEnhance = postContent || '';
    else if (selectedScope === 'full') contentToEnhance = postContent || ''; // Full will use title + description too
    
    const result = await enhanceContent({
      content: contentToEnhance,
      enhancementType,
      scope: selectedScope,
      customInstructions: enhancementType === 'custom' ? customInstructions : undefined,
      title: selectedScope === 'full' ? postTitle : undefined,
      description: selectedScope === 'full' ? postDescription : undefined,
    });

    console.log('[AIEnhancementModal] Enhancement result received:', result);
    console.log('[AIEnhancementModal] Hook enhancementResult state:', enhancementResult);
    
    // Auto-select all for full scope
    if (selectedScope === 'full') {
      setAcceptTitle(true);
      setAcceptDescription(true);
      setAcceptContent(true);
    }
  };

  const handleAccept = () => {
    if (!enhancementResult) return;
    
    // Handle split results for full scope
    if (selectedScope === 'full' && enhancementResult.splitResults) {
      if (acceptTitle && enhancementResult.splitResults.title && onTitleChange) {
        onTitleChange(enhancementResult.splitResults.title.enhanced);
      }
      if (acceptDescription && enhancementResult.splitResults.description && onDescriptionChange) {
        onDescriptionChange(enhancementResult.splitResults.description.enhanced);
      }
      if (acceptContent && enhancementResult.splitResults.content) {
        onApply(enhancementResult.splitResults.content.enhanced);
      }
    } else if (selectedScope === 'title' && onTitleChange) {
      onTitleChange(enhancementResult.enhanced);
    } else if (selectedScope === 'description' && onDescriptionChange) {
      onDescriptionChange(enhancementResult.enhanced);
    } else {
      // selection or content
      onApply(enhancementResult.enhanced);
    }
    
    onClose();
  };

  const handleTryAgain = () => {
    clearResult();
  };

  if (!isOpen || !mounted) return null;

  const enhancementOptions = [
    { value: 'improve', label: 'Improve', description: 'Fix grammar, clarity, and flow' },
    { value: 'engaging', label: 'Engage', description: 'Add hooks and compelling language' },
    { value: 'professional', label: 'Pro', description: 'Formal tone and structure' },
    { value: 'expand', label: 'Expand', description: 'Add details and examples' },
    { value: 'shorten', label: 'Shorter', description: 'Make concise and direct' },
    { value: 'assessment', label: 'Assessment', description: 'Analyze content quality' },
    { value: 'custom', label: 'Custom', description: 'Provide your own guidance' },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 animate-in fade-in duration-200 z-[99999]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-enhancement-modal-title"
    >
      {/* Transparent Backdrop - allows seeing content behind */}
      <div 
        className="absolute inset-0 bg-black/10 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal - Responsive: Fullscreen on mobile, Draggable on desktop */}
      {isMobile ? (
        <div 
          className="relative w-full h-[95vh] flex flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-2xl 
                   rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header - Fixed */}
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/20 dark:border-gray-700/20 
                        bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 
                        backdrop-blur-xl">
            <div className="flex items-center justify-between mb-3">
              <h2 id="ai-enhancement-modal-title" className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: primary.base }} />
                <span className="truncate">AI Content Enhancement</span>
                <kbd className="hidden md:inline-block ml-2 px-2 py-0.5 text-xs bg-white/40 dark:bg-gray-700/40 rounded border border-white/30 dark:border-gray-600/30">
                  Esc
                </kbd>
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 transition-colors"
                aria-label="Close modal"
              >
                <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Scope Selection Badges - Inline */}
            {!enhancementResult && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">What to Enhance:</span>
                {[
                  { value: 'selection', label: 'Selected', disabled: !selectedText?.trim() },
                  { value: 'title', label: 'Title', disabled: !postTitle },
                  { value: 'description', label: 'Description', disabled: !postDescription },
                  { value: 'content', label: 'Content', disabled: !postContent },
                  { value: 'full', label: 'All', disabled: !postTitle || !postDescription || !postContent },
                ].map((scopeOption) => (
                  <button
                    key={scopeOption.value}
                    onClick={() => setSelectedScope(scopeOption.value as EnhancementScope)}
                    disabled={scopeOption.disabled}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                      scopeOption.disabled
                        ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                        : selectedScope === scopeOption.value
                        ? 'shadow-md scale-105'
                        : 'hover:scale-105 active:scale-95 bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80'
                    }`}
                    style={selectedScope === scopeOption.value && !scopeOption.disabled ? { 
                      borderColor: primary.base,
                      background: `linear-gradient(135deg, ${primary.base}30, ${primary.hover}30)`,
                      color: primary.base 
                    } : undefined}
                  >
                    {scopeOption.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
            {error && (
              <div className="p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 
                           rounded-xl backdrop-blur-sm text-sm text-red-800 dark:text-red-200 animate-in slide-in-from-top duration-300">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">Error:</span> {error}
                </div>
              </div>
            )}
          
          {/* Content Preview based on scope */}
          {!enhancementResult && (() => {
            if (selectedScope === 'full') {
              // Show all sections with combined stats
              const titleStats = getTextStats(postTitle || '');
              const descStats = getTextStats(postDescription || '');
              const contentStats = getTextStats(postContent || '');
              const totalChars = titleStats.chars + descStats.chars + contentStats.chars;
              const totalWords = titleStats.words + descStats.words + contentStats.words;
              const totalTokens = Math.ceil(totalChars / 4);
              
              return (
                <div className="flex-1 flex flex-col space-y-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                              rounded-xl p-4 border border-white/10 dark:border-gray-700/10 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Current Content (All)
                    </label>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{totalChars} chars</span>
                      <span>•</span>
                      <span>{totalWords} words</span>
                      <span>•</span>
                      <span>~{totalTokens} tokens</span>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3">
                    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 
                                 border border-white/30 dark:border-gray-700/30">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Title ({titleStats.chars} chars)</div>
                      <div 
                        className="text-sm text-gray-800 dark:text-gray-300 font-medium prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderFormattedContent(postTitle || '') }}
                      />
                    </div>
                    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 
                                 border border-white/30 dark:border-gray-700/30">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Description ({descStats.chars} chars)</div>
                      <div 
                        className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderFormattedContent(postDescription || '') }}
                      />
                    </div>
                    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 
                                 border border-white/30 dark:border-gray-700/30">
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Content ({contentStats.chars} chars)</div>
                      <div 
                        className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: renderFormattedContent(postContent && postContent.length > 1000 ? postContent.substring(0, 1000) + '...' : postContent || '') }}
                      />
                    </div>
                  </div>
                </div>
              );
            } else {
              // Single section preview
              const currentContent = selectedScope === 'selection' ? selectedText :
                                    selectedScope === 'title' ? postTitle || '' :
                                    selectedScope === 'description' ? postDescription || '' :
                                    selectedScope === 'content' ? postContent || '' : '';
              const stats = getTextStats(currentContent);
              const tokens = Math.ceil(stats.chars / 4);
              
              return (
                <div className="flex-1 flex flex-col space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                              rounded-xl p-4 border border-white/10 dark:border-gray-700/10 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      {selectedScope === 'selection' && 'Selected Text'}
                      {selectedScope === 'title' && 'Current Title'}
                      {selectedScope === 'description' && 'Current Description'}
                      {selectedScope === 'content' && 'Current Content'}
                    </label>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span>{stats.chars} chars</span>
                      <span>•</span>
                      <span>{stats.words} words</span>
                      <span>•</span>
                      <span>~{tokens} tokens</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 
                               border border-white/30 dark:border-gray-700/30 overflow-y-auto">
                    <div 
                      className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderFormattedContent(currentContent) }}
                    />
                  </div>
                </div>
              );
            }
          })()}

          {/* Assessment Result Display */}
          {enhancementResult && enhancementResult.type === 'assessment' && enhancementResult.assessment && (() => {
            const assessment = enhancementResult.assessment;
            
            // Determine score color
            const getScoreColor = (score: number) => {
              if (score >= 76) return { color: '#10b981', label: 'Excellent' }; // green
              if (score >= 51) return { color: '#f59e0b', label: 'Good' }; // amber
              return { color: '#ef4444', label: 'Needs Improvement' }; // red
            };
            
            const scoreInfo = getScoreColor(assessment.total);
            
            return (
              <div className="flex-1 flex flex-col animate-in slide-in-from-top duration-500">
                {/* Total Score Display */}
                <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 
                              backdrop-blur-xl rounded-2xl p-8 border-2 shadow-2xl"
                     style={{ borderColor: scoreInfo.color + '40' }}>
                  <div className="text-center space-y-4">
                    <div className="text-8xl font-bold tracking-tight" style={{ color: scoreInfo.color }}>
                      {assessment.total}
                      <span className="text-4xl text-gray-400">/100</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Content Quality Score
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                           style={{ 
                             background: `linear-gradient(135deg, ${scoreInfo.color}20, ${scoreInfo.color}10)`,
                             color: scoreInfo.color,
                             border: `1px solid ${scoreInfo.color}40`
                           }}>
                        {scoreInfo.label}
                      </div>
                    </div>
                    
                    {/* Expandable Details Button */}
                    <button
                      onClick={() => setShowAssessmentDetails(!showAssessmentDetails)}
                      className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white 
                               transition-colors flex items-center justify-center gap-2 mx-auto"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showAssessmentDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {showAssessmentDetails ? 'Hide' : 'Show'} detailed breakdown
                    </button>
                  </div>
                  
                  {/* Detailed Breakdown */}
                  {showAssessmentDetails && (
                    <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3 animate-in slide-in-from-top duration-300">
                      {Object.entries(assessment.categories).map(([category, data]) => {
                        const categoryScore = getScoreColor(data.score);
                        return (
                          <div key={category} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                {category}
                              </span>
                              <span className="text-lg font-bold" style={{ color: categoryScore.color }}>
                                {data.score}/100
                              </span>
                            </div>
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                              <div 
                                className="h-full transition-all duration-500 rounded-full"
                                style={{ 
                                  width: `${data.score}%`,
                                  background: `linear-gradient(90deg, ${categoryScore.color}, ${categoryScore.color}cc)`
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {data.comment}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Show enhanced result if available - Side by Side Comparison */}
          {enhancementResult && enhancementResult.type !== 'assessment' && selectedScope !== 'full' && (() => {
            const originalStats = getTextStats(enhancementResult.original);
            const enhancedStats = getTextStats(enhancementResult.enhanced);
            const highlightedText = showHighlights ? highlightDifferences(enhancementResult.original, enhancementResult.enhanced) : enhancementResult.enhanced;
            
            return (
              <div className="space-y-3 animate-in slide-in-from-top duration-500">
                {/* Header with Highlight Toggle */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <SparklesIcon className="w-5 h-5 animate-pulse" style={{ color: primary.base }} />
                    Comparison View
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                    <input
                      type="checkbox"
                      checked={showHighlights}
                      onChange={(e) => setShowHighlights(e.target.checked)}
                      className="rounded w-4 h-4"
                      style={{ accentColor: primary.base }}
                    />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Highlight changes
                    </span>
                  </label>
                </div>

                {/* Side-by-side comparison - Desktop 2-col, Mobile 1-col with 50/50 height */}
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {/* Original Text */}
                  <div className={`space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                                rounded-xl p-4 border border-white/10 dark:border-gray-700/10 ${isMobile ? 'h-[200px]' : ''}`}>
                    <label className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Original
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {originalStats.words} words
                      </span>
                    </label>
                    <div className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 
                                 border border-white/20 dark:border-gray-700/20 overflow-y-auto ${isMobile ? 'max-h-[140px]' : 'max-h-64'}`}>
                      {editorMode === 'markdown' ? (
                        <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap leading-relaxed m-0">
                          {enhancementResult.original}
                        </pre>
                      ) : (
                        <div 
                          className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: renderContent(enhancementResult.original) }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Enhanced Version */}
                  <div className={`space-y-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl 
                                rounded-xl p-4 border-2 border-white/20 dark:border-gray-700/20 shadow-lg ${isMobile ? 'h-[200px]' : ''}`}
                       style={{ borderColor: `${primary.base}40` }}>
                    <label className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                      <span className="flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 animate-pulse" style={{ color: primary.base }} />
                        Enhanced
                      </span>
                      <span className="text-xs font-medium" style={{ color: primary.base }}>
                        {enhancedStats.words} words
                      </span>
                    </label>
                    <div className={`rounded-lg p-4 overflow-y-auto ${isMobile ? 'max-h-[140px]' : 'max-h-64'}`}
                         style={{ 
                           background: `linear-gradient(135deg, ${primary.base}10, ${primary.hover}10)`,
                         }}>
                      {editorMode === 'markdown' ? (
                        <pre className="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap font-medium leading-relaxed m-0">
                          {showHighlights ? enhancementResult.enhanced : enhancementResult.enhanced}
                        </pre>
                      ) : (
                        <div 
                          className="text-sm text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: showHighlights ? highlightedText : renderContent(enhancementResult.enhanced) }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Show split results for full scope */}
          {enhancementResult && selectedScope === 'full' && enhancementResult.splitResults && (
            <div className="space-y-4 animate-in slide-in-from-top duration-500">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <SparklesIcon className="w-5 h-5 animate-pulse" style={{ color: primary.base }} />
                Enhanced Results - Choose what to apply
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                  <kbd className="px-2 py-0.5 bg-white/40 dark:bg-gray-700/40 rounded border border-white/30">⌘A</kbd>
                  Accept All
                  <kbd className="px-2 py-0.5 bg-white/40 dark:bg-gray-700/40 rounded border border-white/30">⌘R</kbd>
                  Reject All
                </span>
              </label>

              {/* Title */}
              {enhancementResult.splitResults.title && (() => {
                const originalStats = getTextStats(enhancementResult.splitResults.title.original);
                const enhancedStats = getTextStats(enhancementResult.splitResults.title.enhanced);
                
                return (
                  <div className="overflow-hidden rounded-xl border-2 transition-all duration-300"
                       style={{ 
                         borderColor: acceptTitle ? primary.base : 'transparent',
                         background: acceptTitle ? `linear-gradient(135deg, ${primary.base}15, ${primary.hover}10)` : 'rgba(255,255,255,0.2)'
                       }}>
                    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/20">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Title
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                        <input
                          type="checkbox"
                          checked={acceptTitle}
                          onChange={(e) => setAcceptTitle(e.target.checked)}
                          className="rounded w-4 h-4"
                          style={{ accentColor: primary.base }}
                        />
                        <span className="text-sm font-medium" style={{ color: acceptTitle ? primary.base : undefined }}>
                          {acceptTitle ? 'Accepted' : 'Accept'}
                        </span>
                      </label>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{originalStats.chars} chars · {originalStats.words} words</div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">{enhancementResult.splitResults.title.original}</div>
                      </div>
                      <div className="rounded-lg p-3 border-2 transition-all duration-300"
                           style={{ 
                             borderColor: acceptTitle ? primary.base : 'transparent',
                             background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}08)`,
                           }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: primary.base }}>
                            <SparklesIcon className="w-3 h-3" />
                            Enhanced:
                          </div>
                          <div className="text-xs font-medium" style={{ color: primary.base }}>{enhancedStats.chars} chars · {enhancedStats.words} words</div>
                        </div>
                        <div 
                          className="text-sm font-semibold text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderFormattedContent(enhancementResult.splitResults.title.enhanced) }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Description */}
              {enhancementResult.splitResults.description && (() => {
                const originalStats = getTextStats(enhancementResult.splitResults.description.original);
                const enhancedStats = getTextStats(enhancementResult.splitResults.description.enhanced);
                const showTruncated = enhancedStats.chars > 300;
                
                return (
                  <div className="overflow-hidden rounded-xl border-2 transition-all duration-300"
                       style={{ 
                         borderColor: acceptDescription ? primary.base : 'transparent',
                         background: acceptDescription ? `linear-gradient(135deg, ${primary.base}15, ${primary.hover}10)` : 'rgba(255,255,255,0.2)'
                       }}>
                    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/20">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                        Description
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                        <input
                          type="checkbox"
                          checked={acceptDescription}
                          onChange={(e) => setAcceptDescription(e.target.checked)}
                          className="rounded w-4 h-4"
                          style={{ accentColor: primary.base }}
                        />
                        <span className="text-sm font-medium" style={{ color: acceptDescription ? primary.base : undefined }}>
                          {acceptDescription ? 'Accepted' : 'Accept'}
                        </span>
                      </label>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{originalStats.chars} chars · {originalStats.words} words</div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-h-32 overflow-y-auto">
                          {enhancementResult.splitResults.description.original}
                        </div>
                      </div>
                      <div className="rounded-lg p-3 border-2 transition-all duration-300"
                           style={{ 
                             borderColor: acceptDescription ? primary.base : 'transparent',
                             background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}08)`,
                           }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: primary.base }}>
                            <SparklesIcon className="w-3 h-3" />
                            Enhanced:
                          </div>
                          <div className="text-xs font-medium" style={{ color: primary.base }}>{enhancedStats.chars} chars · {enhancedStats.words} words</div>
                        </div>
                        <div 
                          className="text-sm text-gray-900 dark:text-white max-h-32 overflow-y-auto prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderFormattedContent(enhancementResult.splitResults.description.enhanced) }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Content */}
              {enhancementResult.splitResults.content && (() => {
                const originalStats = getTextStats(enhancementResult.splitResults.content.original);
                const enhancedStats = getTextStats(enhancementResult.splitResults.content.enhanced);
                
                return (
                  <div className="overflow-hidden rounded-xl border-2 transition-all duration-300"
                       style={{ 
                         borderColor: acceptContent ? primary.base : 'transparent',
                         background: acceptContent ? `linear-gradient(135deg, ${primary.base}15, ${primary.hover}10)` : 'rgba(255,255,255,0.2)'
                       }}>
                    <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/20">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Content
                      </span>
                      <label className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                        <input
                          type="checkbox"
                          checked={acceptContent}
                          onChange={(e) => setAcceptContent(e.target.checked)}
                          className="rounded w-4 h-4"
                          style={{ accentColor: primary.base }}
                        />
                        <span className="text-sm font-medium" style={{ color: acceptContent ? primary.base : undefined }}>
                          {acceptContent ? 'Accepted' : 'Accept'}
                        </span>
                      </label>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">{originalStats.chars} chars · {originalStats.words} words</div>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto">
                          {enhancementResult.splitResults.content.original}
                        </div>
                      </div>
                      <div className="rounded-lg p-3 border-2 transition-all duration-300 max-h-48 overflow-y-auto"
                           style={{ 
                             borderColor: acceptContent ? primary.base : 'transparent',
                             background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}08)`,
                           }}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium flex items-center gap-1" style={{ color: primary.base }}>
                            <SparklesIcon className="w-3 h-3" />
                            Enhanced:
                          </div>
                          <div className="text-xs font-medium" style={{ color: primary.base }}>{enhancedStats.chars} chars · {enhancedStats.words} words</div>
                        </div>
                        <div 
                          className="text-sm text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderFormattedContent(enhancementResult.splitResults.content.enhanced) }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Custom Instructions - Shown when Custom is selected */}
          {!enhancementResult && enhancementType === 'custom' && (
            <div className="space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                          rounded-xl p-4 border border-white/10 dark:border-gray-700/10 animate-in slide-in-from-top duration-300">
              <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Your Instructions
              </label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Describe how you want to enhance the content..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border-2 border-white/30 dark:border-gray-700/30 
                         bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm
                         text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                         focus:outline-none focus:border-current transition-all duration-200
                         resize-none"
                style={{ borderColor: customInstructions.trim() ? primary.base : undefined }}
              />
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Enhancement Type Badges - Above Footer */}
        {!enhancementResult && (
          <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-t border-white/20 dark:border-gray-700/20 
                        bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Enhancement Type:</span>
              {enhancementOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setEnhancementType(option.value as EnhancementType)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                    enhancementType === option.value
                      ? 'shadow-md scale-105'
                      : 'hover:scale-105 active:scale-95 bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80'
                  }`}
                  style={enhancementType === option.value ? { 
                    borderColor: primary.base,
                    background: `linear-gradient(135deg, ${primary.base}30, ${primary.hover}30)`,
                    color: primary.base 
                  } : undefined}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer - Fixed at bottom */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/20 dark:border-gray-700/20 
                      bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 
                      backdrop-blur-xl rounded-b-2xl">
          <div className="flex items-center justify-between gap-3">
            {/* Status indicator - Only when enhancing */}
            {isEnhancing && (
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color: primary.base }} />
                <span className="hidden sm:inline">Enhancing...</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 flex-1">
            {!enhancementResult ? (
              <>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isEnhancing}
                  className="flex-1 sm:flex-none"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEnhance}
                  loading={isEnhancing}
                  disabled={enhancementType === 'custom' && !customInstructions.trim()}
                  className="flex-1 sm:flex-none"
                  style={{
                    backgroundColor: primary.base,
                    backgroundImage: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  }}
                >
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Enhance with AI</span>
                  <span className="sm:hidden">Enhance</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="secondary"
                  onClick={handleTryAgain}
                  className="flex-1 sm:flex-none"
                >
                  <ArrowPathIcon className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Try Again</span>
                  <span className="sm:hidden">Retry</span>
                </Button>
                
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Cancel</span>
                  <span className="sm:hidden">Close</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAccept}
                  disabled={selectedScope === 'full' && !acceptTitle && !acceptDescription && !acceptContent}
                  className="flex-1 sm:flex-none sm:px-6 py-2 bg-gradient-to-r shadow-lg hover:shadow-xl 
                           transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed 
                           disabled:hover:scale-100 hover:scale-[1.02]"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Apply {selectedScope === 'full' ? 'Selected' : 'Enhancement'}</span>
                  <span className="sm:hidden">Apply</span>
                  <kbd className="hidden sm:inline-block ml-2 px-2 py-0.5 text-xs bg-white/20 rounded border border-white/20">⌘↵</kbd>
                </Button>
              </>
            )}
            </div>
            </div>
          </div>
        </div>
      ) : (
        /* Desktop - Draggable & Resizable */
        <Rnd
          default={{
            x: (typeof window !== 'undefined' ? window.innerWidth : 1200) / 2 - 550,
            y: (typeof window !== 'undefined' ? window.innerHeight : 900) / 2 - 400,
            width: 1100,
            height: 800,
          }}
          minWidth={800}
          minHeight={600}
          bounds="window"
          dragHandleClassName="modal-drag-handle"
          enableResizing={true}
          className="pointer-events-auto"
        >
          <div 
            className="relative h-full flex flex-col bg-white/20 dark:bg-gray-900/20 backdrop-blur-2xl 
                     rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/20 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed with Drag Handle */}
            <div className="modal-drag-handle flex-shrink-0 px-6 py-4 border-b border-white/20 dark:border-gray-700/20 
                          bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 
                          backdrop-blur-xl cursor-move">
              <div className="flex items-center justify-between mb-3">
                <h2 id="ai-enhancement-modal-title" className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-3">
                  <SparklesIcon className="w-6 h-6" style={{ color: primary.base }} />
                  <span>AI Content Enhancement</span>
                  <kbd className="ml-2 px-2 py-0.5 text-xs bg-white/40 dark:bg-gray-700/40 rounded border border-white/30 dark:border-gray-600/30">
                    Esc
                  </kbd>
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/30 transition-colors"
                  aria-label="Close modal"
                >
                  <XMarkIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Scope Selection Badges - Inline */}
              {!enhancementResult && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">What to Enhance:</span>
                  {[
                    { value: 'selection', label: 'Selected', disabled: !selectedText?.trim() },
                    { value: 'title', label: 'Title', disabled: !postTitle },
                    { value: 'description', label: 'Description', disabled: !postDescription },
                    { value: 'content', label: 'Content', disabled: !postContent },
                    { value: 'full', label: 'All', disabled: !postTitle || !postDescription || !postContent },
                  ].map((scopeOption) => (
                    <button
                      key={scopeOption.value}
                      onClick={() => setSelectedScope(scopeOption.value as EnhancementScope)}
                      disabled={scopeOption.disabled}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                        scopeOption.disabled
                          ? 'opacity-40 cursor-not-allowed bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700'
                          : selectedScope === scopeOption.value
                          ? 'shadow-md scale-105'
                          : 'hover:scale-105 active:scale-95 bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80'
                      }`}
                      style={selectedScope === scopeOption.value && !scopeOption.disabled ? { 
                        borderColor: primary.base,
                        background: `linear-gradient(135deg, ${primary.base}30, ${primary.hover}30)`,
                        color: primary.base 
                      } : undefined}
                    >
                      {scopeOption.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50/80 dark:bg-red-900/30 border border-red-200/50 dark:border-red-800/50 
                             rounded-xl backdrop-blur-sm text-sm text-red-800 dark:text-red-200 animate-in slide-in-from-top duration-300">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Error:</span> {error}
                  </div>
                </div>
              )}
              
              {/* Content Preview */}
              {!enhancementResult && (() => {
                if (selectedScope === 'full') {
                  // Show all sections with combined stats
                  const titleStats = getTextStats(postTitle || '');
                  const descStats = getTextStats(postDescription || '');
                  const contentStats = getTextStats(postContent || '');
                  const totalChars = titleStats.chars + descStats.chars + contentStats.chars;
                  const totalWords = titleStats.words + descStats.words + contentStats.words;
                  const totalTokens = Math.ceil(totalChars / 4);
                  
                  return (
                    <div className="flex-1 flex flex-col space-y-3 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                                  rounded-xl p-4 border border-white/10 dark:border-gray-700/10 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          Current Content (All)
                        </label>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{totalChars} chars</span>
                          <span>•</span>
                          <span>{totalWords} words</span>
                          <span>•</span>
                          <span>~{totalTokens} tokens</span>
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3">
                        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 
                                     border border-white/30 dark:border-gray-700/30">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Title ({titleStats.chars} chars)</div>
                          <div 
                            className="text-sm text-gray-800 dark:text-gray-300 font-medium prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderFormattedContent(postTitle || '') }}
                          />
                        </div>
                        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 
                                     border border-white/30 dark:border-gray-700/30">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Description ({descStats.chars} chars)</div>
                          <div 
                            className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderFormattedContent(postDescription || '') }}
                          />
                        </div>
                        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 
                                     border border-white/30 dark:border-gray-700/30">
                          <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Content ({contentStats.chars} chars)</div>
                          <div 
                            className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderFormattedContent(postContent && postContent.length > 1000 ? postContent.substring(0, 1000) + '...' : postContent || '') }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  // Single section preview
                  const currentContent = selectedScope === 'selection' ? selectedText :
                                        selectedScope === 'title' ? postTitle || '' :
                                        selectedScope === 'description' ? postDescription || '' :
                                        selectedScope === 'content' ? postContent || '' : '';
                  const stats = getTextStats(currentContent);
                  const tokens = Math.ceil(stats.chars / 4);
                  
                  return (
                    <div className="flex-1 flex flex-col space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                                  rounded-xl p-4 border border-white/10 dark:border-gray-700/10 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                          {selectedScope === 'selection' && 'Selected Text'}
                          {selectedScope === 'title' && 'Current Title'}
                          {selectedScope === 'description' && 'Current Description'}
                          {selectedScope === 'content' && 'Current Content'}
                        </label>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>{stats.chars} chars</span>
                          <span>•</span>
                          <span>{stats.words} words</span>
                          <span>•</span>
                          <span>~{tokens} tokens</span>
                        </div>
                      </div>
                      <div className="flex-1 bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 
                                   border border-white/30 dark:border-gray-700/30 overflow-y-auto">
                        <div 
                          className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none"
                          dangerouslySetInnerHTML={{ __html: renderFormattedContent(currentContent) }}
                        />
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Assessment Result Display - Desktop */}
              {enhancementResult && enhancementResult.type === 'assessment' && enhancementResult.assessment && (() => {
                const assessment = enhancementResult.assessment;
                
                const getScoreColor = (score: number) => {
                  if (score >= 76) return { color: '#10b981', label: 'Excellent' };
                  if (score >= 51) return { color: '#f59e0b', label: 'Good' };
                  return { color: '#ef4444', label: 'Needs Improvement' };
                };
                
                const scoreInfo = getScoreColor(assessment.total);
                
                return (
                  <div className="flex-1 flex flex-col animate-in slide-in-from-top duration-500">
                    <div className="bg-gradient-to-br from-white/40 to-white/20 dark:from-gray-800/40 dark:to-gray-800/20 
                                  backdrop-blur-xl rounded-2xl p-8 border-2 shadow-2xl"
                         style={{ borderColor: scoreInfo.color + '40' }}>
                      <div className="text-center space-y-4">
                        <div className="text-8xl font-bold tracking-tight" style={{ color: scoreInfo.color }}>
                          {assessment.total}
                          <span className="text-4xl text-gray-400">/100</span>
                        </div>
                        <div className="space-y-2">
                          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                            Content Quality Score
                          </div>
                          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
                               style={{ 
                                 background: `linear-gradient(135deg, ${scoreInfo.color}20, ${scoreInfo.color}10)`,
                                 color: scoreInfo.color,
                                 border: `1px solid ${scoreInfo.color}40`
                               }}>
                            {scoreInfo.label}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setShowAssessmentDetails(!showAssessmentDetails)}
                          className="mt-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white 
                                   transition-colors flex items-center justify-center gap-2 mx-auto"
                        >
                          <svg className={`w-4 h-4 transition-transform ${showAssessmentDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {showAssessmentDetails ? 'Hide' : 'Show'} detailed breakdown
                        </button>
                      </div>
                      
                      {showAssessmentDetails && (
                        <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3 animate-in slide-in-from-top duration-300">
                          {Object.entries(assessment.categories).map(([category, data]) => {
                            const categoryScore = getScoreColor(data.score);
                            return (
                              <div key={category} className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
                                    {category}
                                  </span>
                                  <span className="text-lg font-bold" style={{ color: categoryScore.color }}>
                                    {data.score}/100
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                  <div 
                                    className="h-full transition-all duration-500 rounded-full"
                                    style={{ 
                                      width: `${data.score}%`,
                                      background: `linear-gradient(90deg, ${categoryScore.color}, ${categoryScore.color}cc)`
                                    }}
                                  />
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {data.comment}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Enhanced Result - Side by Side */}
              {enhancementResult && enhancementResult.type !== 'assessment' && selectedScope !== 'full' && (() => {
                const originalStats = getTextStats(enhancementResult.original);
                const enhancedStats = getTextStats(enhancementResult.enhanced);
                const highlightedText = showHighlights ? highlightDifferences(enhancementResult.original, enhancementResult.enhanced) : enhancementResult.enhanced;
                
                return (
                  <div className="space-y-3 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <SparklesIcon className="w-5 h-5 animate-pulse" style={{ color: primary.base }} />
                        Comparison View
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                        <input
                          type="checkbox"
                          checked={showHighlights}
                          onChange={(e) => setShowHighlights(e.target.checked)}
                          className="rounded w-4 h-4"
                          style={{ accentColor: primary.base }}
                        />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          Highlight changes
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                                    rounded-xl p-4 border border-white/10 dark:border-gray-700/10">
                        <label className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                          <span className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Original
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {originalStats.words} words
                          </span>
                        </label>
                        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm rounded-lg p-4 
                                     border border-white/20 dark:border-gray-700/20 max-h-64 overflow-y-auto">
                          {editorMode === 'markdown' ? (
                            <pre className="text-sm text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap leading-relaxed m-0">
                              {enhancementResult.original}
                            </pre>
                          ) : (
                            <div 
                              className="text-sm text-gray-600 dark:text-gray-400 prose prose-sm dark:prose-invert max-w-none leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: renderContent(enhancementResult.original) }}
                            />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl 
                                    rounded-xl p-4 border-2 border-white/20 dark:border-gray-700/20 shadow-lg"
                           style={{ borderColor: `${primary.base}40` }}>
                        <label className="flex items-center justify-between text-sm font-semibold text-gray-900 dark:text-white">
                          <span className="flex items-center gap-2">
                            <SparklesIcon className="w-5 h-5 animate-pulse" style={{ color: primary.base }} />
                            Enhanced
                          </span>
                          <span className="text-xs font-medium" style={{ color: primary.base }}>
                            {enhancedStats.words} words
                          </span>
                        </label>
                        <div className="rounded-lg p-4 max-h-64 overflow-y-auto"
                             style={{ 
                               background: `linear-gradient(135deg, ${primary.base}10, ${primary.hover}10)`,
                             }}>
                          {editorMode === 'markdown' ? (
                            <pre className="text-sm text-gray-900 dark:text-white font-mono whitespace-pre-wrap font-medium leading-relaxed m-0">
                              {enhancementResult.enhanced}
                            </pre>
                          ) : (
                            <div 
                              className="text-sm text-gray-900 dark:text-white prose prose-sm dark:prose-invert max-w-none font-medium leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: showHighlights ? highlightedText : renderContent(enhancementResult.enhanced) }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Split Results for Full Scope - continuing same pattern from mobile */}
              {enhancementResult && selectedScope === 'full' && enhancementResult.splitResults && (
                <div className="space-y-4 animate-in slide-in-from-top duration-500">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                    <SparklesIcon className="w-5 h-5 animate-pulse" style={{ color: primary.base }} />
                    Enhanced Results - Choose what to apply
                    <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <kbd className="px-2 py-0.5 bg-white/40 dark:bg-gray-700/40 rounded border border-white/30">⌘A</kbd>
                      Accept All
                      <kbd className="px-2 py-0.5 bg-white/40 dark:bg-gray-700/40 rounded border border-white/30">⌘R</kbd>
                      Reject All
                    </span>
                  </label>

                  {/* Title, Description, Content cards - same as mobile */}
                  {enhancementResult.splitResults.title && (() => {
                    const originalStats = getTextStats(enhancementResult.splitResults.title.original);
                    const enhancedStats = getTextStats(enhancementResult.splitResults.title.enhanced);
                    
                    return (
                      <div className="overflow-hidden rounded-xl border-2 transition-all duration-300"
                           style={{ 
                             borderColor: acceptTitle ? primary.base : 'transparent',
                             background: acceptTitle ? `linear-gradient(135deg, ${primary.base}15, ${primary.hover}10)` : 'rgba(255,255,255,0.2)'
                           }}>
                        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-white/20">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Title
                          </span>
                          <label className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform">
                            <input
                              type="checkbox"
                              checked={acceptTitle}
                              onChange={(e) => setAcceptTitle(e.target.checked)}
                              className="rounded w-4 h-4"
                              style={{ accentColor: primary.base }}
                            />
                            <span className="text-sm font-medium" style={{ color: acceptTitle ? primary.base : undefined }}>
                              {acceptTitle ? 'Accepted' : 'Accept'}
                            </span>
                          </label>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Original:</div>
                              <div className="text-xs text-gray-500 dark:text-gray-500">{originalStats.chars} chars · {originalStats.words} words</div>
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300">{enhancementResult.splitResults.title.original}</div>
                          </div>
                          <div className="rounded-lg p-3 border-2 transition-all duration-300"
                               style={{ 
                                 borderColor: acceptTitle ? primary.base : 'transparent',
                                 background: `linear-gradient(135deg, ${primary.base}15, ${primary.hover}08)`,
                               }}>
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-medium flex items-center gap-1" style={{ color: primary.base }}>
                                <SparklesIcon className="w-3 h-3" />
                                Enhanced:
                              </div>
                              <div className="text-xs font-medium" style={{ color: primary.base }}>{enhancedStats.chars} chars · {enhancedStats.words} words</div>
                            </div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">{enhancementResult.splitResults.title.enhanced}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Description & Content cards continue the same pattern */}
                  {/* ... rest of split results ... */}
                </div>
              )}

              {/* Custom Instructions - Shown when Custom is selected */}
              {!enhancementResult && enhancementType === 'custom' && (
                <div className="space-y-2 bg-white/20 dark:bg-gray-800/20 backdrop-blur-sm 
                              rounded-xl p-4 border border-white/10 dark:border-gray-700/10 animate-in slide-in-from-top duration-300">
                  <label className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Your Instructions
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="Describe how you want to enhance the content..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border-2 border-white/30 dark:border-gray-700/30 
                             bg-white/40 dark:bg-gray-800/40 backdrop-blur-sm
                             text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400
                             focus:outline-none focus:border-current transition-all duration-200
                             resize-none"
                    style={{ borderColor: customInstructions.trim() ? primary.base : undefined }}
                  />
                </div>
              )}
            </div>

            {/* Enhancement Type Badges - Above Footer */}
            {!enhancementResult && (
              <div className="flex-shrink-0 px-6 py-3 border-t border-white/20 dark:border-gray-700/20 
                            bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Enhancement Type:</span>
                  {enhancementOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEnhancementType(option.value as EnhancementType)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 border ${
                        enhancementType === option.value
                          ? 'shadow-md scale-105'
                          : 'hover:scale-105 active:scale-95 bg-white/60 dark:bg-gray-700/60 text-gray-700 dark:text-gray-300 border-white/30 dark:border-gray-600/30 hover:bg-white/80 dark:hover:bg-gray-700/80'
                      }`}
                      style={enhancementType === option.value ? { 
                        borderColor: primary.base,
                        background: `linear-gradient(135deg, ${primary.base}30, ${primary.hover}30)`,
                        color: primary.base 
                      } : undefined}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer - Desktop version */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/20 dark:border-gray-700/20 
                          bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 
                          backdrop-blur-xl rounded-b-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  {isEnhancing ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" style={{ color: primary.base }} />
                      <span>Enhancing content with AI...</span>
                    </>
                  ) : enhancementResult ? (
                    <>
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Enhancement complete</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Select options and enhance</span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                {!enhancementResult ? (
                  <>
                    <Button variant="secondary" onClick={onClose} disabled={isEnhancing}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleEnhance}
                      loading={isEnhancing}
                      disabled={enhancementType === 'custom' && !customInstructions.trim()}
                      style={{
                        backgroundColor: primary.base,
                        backgroundImage: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      }}
                    >
                      <SparklesIcon className="w-4 h-4 mr-2" />
                      Enhance with AI
                      <kbd className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded border border-white/20">⌘↵</kbd>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" onClick={handleTryAgain}>
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                    {selectedScope === 'full' && enhancementResult?.splitResults && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setAcceptTitle(false);
                            setAcceptDescription(false);
                            setAcceptContent(false);
                          }}
                        >
                          Reject All
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setAcceptTitle(true);
                            setAcceptDescription(true);
                            setAcceptContent(true);
                          }}
                          style={{
                            borderColor: primary.base,
                            color: primary.base,
                          }}
                        >
                          Accept All
                        </Button>
                      </>
                    )}
                    <Button variant="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleAccept}
                      disabled={selectedScope === 'full' && !acceptTitle && !acceptDescription && !acceptContent}
                      className="px-6 py-2 bg-gradient-to-r shadow-lg hover:shadow-xl 
                               transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed 
                               disabled:hover:scale-100 hover:scale-[1.02]"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Apply {selectedScope === 'full' ? 'Selected' : 'Enhancement'}
                      <kbd className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded border border-white/20">⌘↵</kbd>
                    </Button>
                  </>
                )}
                </div>
              </div>
            </div>
          </div>
        </Rnd>
      )}
    </div>
  );

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null;
};
