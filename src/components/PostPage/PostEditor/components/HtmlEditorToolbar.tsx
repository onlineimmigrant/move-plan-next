'use client';

import React from 'react';
import { EditorMode } from '../types';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';

interface HtmlEditorToolbarProps {
  htmlContent: string;
  htmlHistoryIndex: number;
  htmlHistory: string[];
  htmlEditorBgColor: 'dark' | 'light';
  syntaxHighlighting: boolean;
  copySuccess: boolean;
  showFindReplace: boolean;
  showBeautifySettings: boolean;
  indentType: 'spaces' | 'tabs';
  indentSize: 2 | 4;
  lineEnding: 'LF' | 'CRLF';
  editorMode: EditorMode;
  postType: string;
  setHtmlEditorBgColor: (color: 'dark' | 'light') => void;
  setSyntaxHighlighting: (value: boolean) => void;
  setShowFindReplace: (value: boolean) => void;
  setShowBeautifySettings: (value: boolean) => void;
  setIndentType: (type: 'spaces' | 'tabs') => void;
  setIndentSize: (size: 2 | 4) => void;
  setLineEnding: (ending: 'LF' | 'CRLF') => void;
  toggleComment: () => void;
  formatHtmlContent: () => void;
  minifyHtmlContent: () => void;
  undoHtml: () => void;
  redoHtml: () => void;
  copyToClipboard: () => Promise<void>;
  validateHtml: () => void;
  toggleCodeView: () => void;
  getEditorModeLabel: (mode: EditorMode) => string;
}

export const HtmlEditorToolbar: React.FC<HtmlEditorToolbarProps> = (props) => {
  const themeColors = useThemeColors();
  
  return (
    <div className="sticky top-[69px] z-40 px-4 py-2 backdrop-blur-xl bg-white/50 dark:bg-gray-900/50 border-b border-white/20 dark:border-gray-700/20">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mx-auto max-w-5xl">
        {/* Mobile: Two lines */}
        <div className="flex md:hidden flex-col gap-2 w-full">
          {/* Top line: Title and character count */}
          <div className="flex items-center justify-between w-full">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              HTML Editor
            </span>
            <span className="text-xs text-gray-500">
              {props.htmlContent.length.toLocaleString()} chars
            </span>
          </div>
          
          {/* Bottom line: All buttons */}
          <div className="flex items-center gap-1 w-full overflow-x-auto">
            <Button
              size="sm"
              onClick={() => props.setHtmlEditorBgColor(props.htmlEditorBgColor === 'dark' ? 'light' : 'dark')}
              variant="outline"
              title={props.htmlEditorBgColor === 'dark' ? 'Switch to Light Background' : 'Switch to Dark Background'}
            >
              {props.htmlEditorBgColor === 'dark' ? '☀️' : '🌙'}
            </Button>
            
            <Button
              size="sm"
              onClick={() => props.setSyntaxHighlighting(!props.syntaxHighlighting)}
              variant={props.syntaxHighlighting ? "secondary" : "outline"}
              title={props.syntaxHighlighting ? 'Disable Syntax Highlighting' : 'Enable Syntax Highlighting'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </Button>
            
            <Button
              size="sm"
              onClick={props.toggleComment}
              variant="outline"
              title="Toggle Comment (Cmd/Ctrl + /)"
            >
              💬
            </Button>
            
            <Button
              size="sm"
              onClick={props.formatHtmlContent}
              variant="outline"
              title="Format HTML"
            >
              Format
            </Button>
            
            <Button
              size="sm"
              onClick={props.minifyHtmlContent}
              variant="outline"
              title="Minify HTML"
            >
              Minify
            </Button>
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            <Button
              size="sm"
              onClick={props.toggleCodeView}
              variant="secondary"
              title={props.postType === 'landing' ? 'Visual Editor disabled for Landing pages' : 'Switch to Visual Editor'}
              className="font-mono text-xs"
              disabled={props.postType === 'landing'}
            >
              Visual
            </Button>
          </div>
        </div>
        
        {/* Desktop: Single line with 3 groups */}
        <div className="hidden md:flex items-center justify-between w-full">
          {/* Group 1: Tools */}
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              onClick={() => props.setHtmlEditorBgColor(props.htmlEditorBgColor === 'dark' ? 'light' : 'dark')}
              variant="outline"
              title={props.htmlEditorBgColor === 'dark' ? 'Switch to Light Background' : 'Switch to Dark Background'}
            >
              {props.htmlEditorBgColor === 'dark' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={() => props.setSyntaxHighlighting(!props.syntaxHighlighting)}
              variant={props.syntaxHighlighting ? "secondary" : "outline"}
              title={props.syntaxHighlighting ? 'Disable Syntax Highlighting' : 'Enable Syntax Highlighting'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </Button>
            
            <Button
              size="sm"
              onClick={props.toggleComment}
              variant="outline"
              title="Toggle Comment (Cmd/Ctrl + /)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </Button>
            
            {/* Beautify with Settings */}
            <div className="relative inline-block">
              <div className="flex items-center gap-0">
                <Button
                  size="sm"
                  onClick={props.formatHtmlContent}
                  variant="outline"
                  title="Beautify HTML"
                  className="rounded-r-none border-r-0"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                  Beautify
                </Button>
                <Button
                  size="sm"
                  onClick={() => props.setShowBeautifySettings(!props.showBeautifySettings)}
                  variant={props.showBeautifySettings ? "secondary" : "outline"}
                  title="Beautify settings"
                  className="rounded-l-none px-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>
              </div>
              
              {props.showBeautifySettings && (
                <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[240px]">
                  <div className="space-y-3 text-sm">
                    <div className="font-semibold text-gray-700 border-b pb-2">Beautify Settings</div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Indentation Type</label>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="indentType"
                            value="spaces"
                            checked={props.indentType === 'spaces'}
                            onChange={(e) => props.setIndentType(e.target.value as 'spaces' | 'tabs')}
                            style={{ accentColor: themeColors.cssVars.primary.base }}
                          />
                          <span className="text-xs">Spaces</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="indentType"
                            value="tabs"
                            checked={props.indentType === 'tabs'}
                            onChange={(e) => props.setIndentType(e.target.value as 'spaces' | 'tabs')}
                            style={{ accentColor: themeColors.cssVars.primary.base }}
                          />
                          <span className="text-xs">Tabs</span>
                        </label>
                      </div>
                    </div>
                    
                    {props.indentType === 'spaces' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">Indent Size</label>
                        <div className="flex gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="indentSize"
                              value="2"
                              checked={props.indentSize === 2}
                              onChange={(e) => props.setIndentSize(Number(e.target.value) as 2 | 4)}
                              style={{ accentColor: themeColors.cssVars.primary.base }}
                            />
                            <span className="text-xs">2 spaces</span>
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="indentSize"
                              value="4"
                              checked={props.indentSize === 4}
                              onChange={(e) => props.setIndentSize(Number(e.target.value) as 2 | 4)}
                              style={{ accentColor: themeColors.cssVars.primary.base }}
                            />
                            <span className="text-xs">4 spaces</span>
                          </label>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">Line Endings</label>
                      <div className="flex gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="lineEnding"
                            value="LF"
                            checked={props.lineEnding === 'LF'}
                            onChange={(e) => props.setLineEnding(e.target.value as 'LF' | 'CRLF')}
                            style={{ accentColor: themeColors.cssVars.primary.base }}
                          />
                          <span className="text-xs">LF (Unix)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="lineEnding"
                            value="CRLF"
                            checked={props.lineEnding === 'CRLF'}
                            onChange={(e) => props.setLineEnding(e.target.value as 'LF' | 'CRLF')}
                            style={{ accentColor: themeColors.cssVars.primary.base }}
                          />
                          <span className="text-xs">CRLF (Windows)</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t text-xs text-gray-600">
                      <div>Current: {props.indentType === 'tabs' ? 'Tabs' : `${props.indentSize} Spaces`}, {props.lineEnding === 'LF' ? 'LF' : 'CRLF'}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              size="sm"
              onClick={props.minifyHtmlContent}
              variant="outline"
              title="Minify HTML"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
              Minify
            </Button>
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            <Button
              size="sm"
              onClick={props.undoHtml}
              variant="outline"
              title="Undo (Ctrl+Z)"
              disabled={props.htmlHistoryIndex <= 0}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </Button>
            
            <Button
              size="sm"
              onClick={props.redoHtml}
              variant="outline"
              title="Redo (Ctrl+Y)"
              disabled={props.htmlHistoryIndex >= props.htmlHistory.length - 1}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </Button>
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            <Button
              size="sm"
              onClick={props.copyToClipboard}
              variant="outline"
              title="Copy to Clipboard"
            >
              {props.copySuccess ? (
                <>
                  <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </Button>
            
            <Button
              size="sm"
              onClick={props.validateHtml}
              variant="outline"
              title="Validate HTML"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validate
            </Button>
            
            <div className="h-6 w-px bg-gray-300 mx-1"></div>
            
            <Button
              size="sm"
              onClick={() => props.setShowFindReplace(!props.showFindReplace)}
              variant={props.showFindReplace ? "secondary" : "outline"}
              title="Find & Replace (Ctrl+F)"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find
            </Button>
          </div>
          
          {/* Group 2: Title and character count */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
              HTML Editor
            </span>
            <span className="text-xs text-gray-500">
              {props.htmlContent.length.toLocaleString()} chars
            </span>
          </div>
          
          {/* Group 3: Content Type Indicator */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 font-mono">
              Type: <span className="font-semibold text-gray-700">
                {props.getEditorModeLabel(props.editorMode)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
