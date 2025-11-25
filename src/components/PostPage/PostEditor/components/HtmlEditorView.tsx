'use client';

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';

interface HtmlEditorViewProps {
  htmlContent: string;
  htmlEditorBgColor: 'dark' | 'light';
  syntaxHighlighting: boolean;
  showFindReplace: boolean;
  findText: string;
  replaceText: string;
  currentMatchIndex: number;
  totalMatches: number;
  caseSensitive: boolean;
  validationErrors: string[];
  showValidationErrors: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  highlightLayerRef: React.RefObject<HTMLDivElement>;
  lineNumbersRef: React.RefObject<HTMLDivElement>;
  setHtmlContent: (value: string) => void;
  setShowFindReplace: (value: boolean) => void;
  setFindText: (value: string) => void;
  setReplaceText: (value: string) => void;
  setCurrentMatchIndex: (value: number) => void;
  setCaseSensitive: (value: boolean) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  findNext: () => void;
  findPrevious: () => void;
  replaceCurrent: () => void;
  replaceAll: () => void;
  highlightHtml: (code: string) => string;
  onContentChange?: (content: string, contentType: 'html' | 'markdown') => void;
  onEditorChange?: () => void;
  setShowValidationErrors: (value: boolean) => void;
}

export const HtmlEditorView: React.FC<HtmlEditorViewProps> = (props) => {
  const themeColors = useThemeColors();
  
  return (
    <div className="html-code-editor-section">
      <div className="px-4 pb-6">
        {/* Validation Errors */}
        {props.showValidationErrors && (
          props.validationErrors.length === 0 ? (
            <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-700 font-medium">HTML is valid! No errors found.</span>
              <button 
                onClick={() => props.setShowValidationErrors(false)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="mb-4 bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="font-semibold text-red-800">
                    {props.validationErrors.length} HTML {props.validationErrors.length === 1 ? 'Error' : 'Errors'} Found
                  </h4>
                </div>
                <button 
                  onClick={() => props.setShowValidationErrors(false)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <ul className="list-none space-y-1">
                  {props.validationErrors.map((error, idx) => (
                    <li key={idx} className="text-xs text-red-600">
                      • {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        )}
        
        {/* Find & Replace Panel */}
        {props.showFindReplace && (
          <div className="mb-4 bg-gray-50 border-2 border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-start gap-3 p-3">
              {/* Search and Replace Controls */}
              <div className="flex-1 flex flex-col gap-2">
                {/* Find Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={props.findText}
                    onChange={(e) => {
                      props.setFindText(e.target.value);
                      props.setCurrentMatchIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          props.findPrevious();
                        } else {
                          props.findNext();
                        }
                      }
                    }}
                    placeholder="Find..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2"
                    style={{
                      '--tw-ring-color': themeColors.cssVars.primary.base
                    } as React.CSSProperties}
                  />
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {props.totalMatches > 0 ? `${props.currentMatchIndex + 1} of ${props.totalMatches}` : '0 of 0'}
                  </span>
                </div>
                
                {/* Replace Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={props.replaceText}
                    onChange={(e) => props.setReplaceText(e.target.value)}
                    placeholder="Replace with..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2"
                    style={{
                      '--tw-ring-color': themeColors.cssVars.primary.base
                    } as React.CSSProperties}
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={props.findPrevious}
                    variant="outline"
                    disabled={props.totalMatches === 0}
                    title="Previous match (Shift+Enter)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </Button>
                  <Button
                    size="sm"
                    onClick={props.findNext}
                    variant="outline"
                    disabled={props.totalMatches === 0}
                    title="Next match (Enter)"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                  
                  <div className="h-5 w-px bg-gray-300 mx-1"></div>
                  
                  <Button
                    size="sm"
                    onClick={props.replaceCurrent}
                    variant="outline"
                    disabled={props.totalMatches === 0}
                    title="Replace current match"
                  >
                    Replace
                  </Button>
                  <Button
                    size="sm"
                    onClick={props.replaceAll}
                    variant="outline"
                    disabled={props.totalMatches === 0}
                    title="Replace all matches"
                  >
                    Replace All
                  </Button>
                  
                  <div className="h-5 w-px bg-gray-300 mx-1"></div>
                  
                  <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={props.caseSensitive}
                      onChange={(e) => {
                        props.setCaseSensitive(e.target.checked);
                        props.setCurrentMatchIndex(0);
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>Case sensitive</span>
                  </label>
                </div>
              </div>
              
              {/* Close Button */}
              <button
                onClick={() => props.setShowFindReplace(false)}
                className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title="Close (Esc)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Editor with Line Numbers and Scroll Sync */}
        <div 
          className={`relative rounded-lg ${
            props.htmlEditorBgColor === 'dark' 
              ? 'border border-gray-700' 
              : 'border-2 border-gray-300'
          }`}
          style={{
            maxHeight: '600px',
            minHeight: '600px',
            overflow: 'auto',
            backgroundColor: props.htmlEditorBgColor === 'dark' ? '#1e1e1e' : '#ffffff',
          }}
          onScroll={(e) => {
            // Sync line numbers scroll by setting scrollTop directly
            if (props.lineNumbersRef.current) {
              props.lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
        >
          <div className="flex min-w-max" style={{ position: 'relative' }}>
            {/* Line Numbers - Hidden scrollbar, synced with parent */}
            <div 
              className={`sticky left-0 select-none text-right font-mono text-sm z-10 ${
                props.htmlEditorBgColor === 'dark' 
                  ? 'bg-gray-800 text-gray-500 border-r border-gray-700' 
                  : 'bg-gray-100 text-gray-500 border-r-2 border-gray-300'
              }`}
              style={{
                lineHeight: '1.8',
                fontSize: '13px',
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
                userSelect: 'none',
                pointerEvents: 'none',
                paddingTop: '16px',
                paddingBottom: '16px',
                paddingLeft: window.innerWidth < 768 ? '4px' : '12px',
                paddingRight: window.innerWidth < 768 ? '6px' : '16px',
                minWidth: window.innerWidth < 768 ? '40px' : '60px',
                overflow: 'hidden',
                height: `${Math.max(600, (props.htmlContent.split('\n').length * 1.8 * 13) + 32)}px`,
              }}
              ref={props.lineNumbersRef}
            >
              {props.htmlContent.split('\n').map((_, index) => (
                <div key={index}>{index + 1}</div>
              ))}
            </div>
            
            {/* Syntax Highlighting Layer */}
            {props.syntaxHighlighting && (
              <div
                ref={props.highlightLayerRef}
                className="absolute pointer-events-none font-mono text-sm"
                style={{
                  left: window.innerWidth < 768 ? '40px' : '60px',
                  top: 0,
                  fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
                  lineHeight: '1.8',
                  fontSize: '13px',
                  padding: '16px',
                  whiteSpace: 'pre',
                  wordWrap: 'normal',
                  width: 'max-content',
                  minWidth: 'calc(100% - ' + (window.innerWidth < 768 ? '40' : '60') + 'px)',
                  height: `${Math.max(600, (props.htmlContent.split('\n').length * 1.8 * 13) + 32)}px`,
                  overflow: 'visible',
                }}
                dangerouslySetInnerHTML={{ __html: props.highlightHtml(props.htmlContent) }}
              />
            )}
            
            {/* Code Editor - Natural height, no internal scrolling */}
            <textarea
              ref={props.textareaRef}
              value={props.htmlContent}
              onChange={(e) => {
                const newValue = e.target.value;
                props.setHtmlContent(newValue);
                // Notify parent immediately with the new value
                if (props.onContentChange) {
                  props.onContentChange(newValue, 'html');
                }
                // Notify parent about editor changes
                if (props.onEditorChange) {
                  props.onEditorChange();
                }
              }}
              onKeyDown={props.handleKeyDown}
              className="flex-1 font-mono text-sm focus:ring-2 focus:outline-none resize-none border-0 block relative z-10"
              style={{
                backgroundColor: props.syntaxHighlighting ? 'transparent' : (props.htmlEditorBgColor === 'dark' ? '#1e1e1e' : '#ffffff'),
                color: props.syntaxHighlighting ? 'transparent' : (props.htmlEditorBgColor === 'dark' ? '#d4d4d4' : '#1f2937'),
                fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
                lineHeight: '1.8',
                tabSize: 2,
                fontSize: '13px',
                height: `${Math.max(600, (props.htmlContent.split('\n').length * 1.8 * 13) + 32)}px`,
                overflow: 'visible',
                whiteSpace: 'pre',
                wordWrap: 'normal',
                padding: '16px',
                width: 'max-content',
                minWidth: '100%',
                caretColor: props.htmlEditorBgColor === 'dark' ? '#d4d4d4' : '#1f2937',
                WebkitTextFillColor: props.syntaxHighlighting ? 'transparent' : undefined,
                '--tw-ring-color': themeColors.cssVars.primary.base,
              } as React.CSSProperties}
              placeholder="Enter HTML content..."
              spellCheck={false}
            />
          </div>
        </div>

        {/* HTML Editor Stats Bar - Bottom of editor */}
        <div className="backdrop-blur-xl bg-white/70 dark:bg-gray-800/70 border-t border-white/30 dark:border-gray-700/30 px-4 py-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
              HTML Editor
            </span>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 dark:text-gray-400">
                {props.htmlContent.length.toLocaleString()} <span className="text-gray-500">chars</span>
              </span>
              <span className="text-gray-400 dark:text-gray-600">•</span>
              <span className="text-gray-600 dark:text-gray-400">
                {props.htmlContent.trim().split(/\s+/).filter(w => w.length > 0).length} <span className="text-gray-500">words</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
