import { RefObject, useCallback } from 'react';
import { useHtmlHistory } from './html/useHtmlHistory';
import { useHtmlValidation } from './html/useHtmlValidation';

export interface HtmlEditorUtilities {
  copyToClipboard: () => Promise<void>;
  undoHtml: () => void;
  redoHtml: () => void;
  validateHtml: () => void;
  highlightHtml: (code: string) => string;
  toggleComment: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  formatHtmlContent: () => void;
  minifyHtmlContent: () => void;
}

interface HtmlEditorUtilitiesProps {
  htmlContent: string;
  htmlHistory: string[];
  htmlHistoryIndex: number;
  htmlEditorBgColor: string;
  indentType: 'spaces' | 'tabs';
  indentSize: number;
  lineEnding: 'LF' | 'CRLF';
  setHtmlContent: (content: string) => void;
  setHtmlHistory: (history: string[] | ((prev: string[]) => string[])) => void;
  setHtmlHistoryIndex: (index: number) => void;
  setCopySuccess: (success: boolean) => void;
  setHtmlValidationErrors: (errors: string[]) => void;
  setShowValidationErrors: (show: boolean) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  onContentChange?: (content: string, type: 'html' | 'markdown') => void;
  formatHTML: (html: string, indentType: 'spaces' | 'tabs', indentSize: number, lineEnding: 'LF' | 'CRLF') => string;
}

/**
 * Composed HTML editor utilities hook
 * Orchestrates specialized hooks for history, validation, and editing
 * 
 * @performance Uses useCallback for all handlers to prevent unnecessary re-renders
 */
export function useHtmlEditorUtilitiesV2(props: HtmlEditorUtilitiesProps): HtmlEditorUtilities {
  const {
    htmlContent,
    htmlHistory,
    htmlHistoryIndex,
    htmlEditorBgColor,
    indentType,
    indentSize,
    lineEnding,
    setHtmlContent,
    setHtmlHistory,
    setHtmlHistoryIndex,
    setCopySuccess,
    setHtmlValidationErrors,
    setShowValidationErrors,
    textareaRef,
    onContentChange,
    formatHTML,
  } = props;

  // Compose specialized hooks
  const { undoHtml, redoHtml } = useHtmlHistory({
    htmlHistory,
    htmlHistoryIndex,
    setHtmlContent,
    setHtmlHistoryIndex,
    onContentChange,
  });

  const { validateHtml } = useHtmlValidation({
    htmlContent,
    setHtmlValidationErrors,
    setShowValidationErrors,
  });

  // Optimized with useCallback
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [htmlContent, setCopySuccess]);

  const highlightHtml = useCallback((code: string): string => {
    if (!code) return '';
    
    let result = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    const tagColors = htmlEditorBgColor === 'dark' ? {
      default: '#569CD6', attribute: '#9CDCFE', attributeValue: '#CE9178',
      bracket: '#808080', comment: '#6A9955',
      html: '#C586C0', div: '#4EC9B0', span: '#6DD9C0', p: '#87E8D0',
      h1: '#FF6B6B', h2: '#FF8C42', h3: '#FFA500', strong: '#DCDCAA',
    } : {
      default: '#0000FF', attribute: '#FF0000', attributeValue: '#A31515',
      bracket: '#808080', comment: '#008000',
      html: '#AF00DB', div: '#267F99', span: '#337F99', p: '#408999',
      h1: '#CC0000', h2: '#DD3300', h3: '#EE6600', strong: '#795E26',
    };
    
    result = result.replace(/(&lt;!--[\s\S]*?--&gt;)/g, 
      `<span style="color: ${tagColors.comment};">$1</span>`);
    
    result = result.replace(/(&lt;\/?)(\w+)((?:\s+[\w-]+(?:=(?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+))?)*\s*)(\/?&gt;)/g,
      (match, openBracket, tagName, attributes, closeBracket) => {
        const tagColor = (tagColors as any)[tagName.toLowerCase()] || tagColors.default;
        let highlighted = openBracket + `<span style="color: ${tagColor}; font-weight: 600;">${tagName}</span>`;
        
        if (attributes) {
          highlighted += attributes.replace(
            /([\w-]+)(=)?((?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+)?)/g,
            (_: string, name: string, eq: string, val: string) => {
              let res = `<span style="color: ${tagColors.attribute};">${name}</span>`;
              if (eq) res += eq + (val ? `<span style="color: ${tagColors.attributeValue};">${val}</span>` : '');
              return res;
            }
          );
        }
        
        return highlighted + `<span style="color: ${tagColors.bracket};">${closeBracket}</span>`;
      }
    );
    
    return result;
  }, [htmlEditorBgColor]);

  const toggleComment = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlContent.substring(start, end);
    
    let newContent: string;
    if (selectedText.trim().startsWith('<!--') && selectedText.trim().endsWith('-->')) {
      const uncommented = selectedText.replace(/<!--\s*/, '').replace(/\s*-->/, '');
      newContent = htmlContent.substring(0, start) + uncommented + htmlContent.substring(end);
    } else {
      const commented = `<!-- ${selectedText} -->`;
      newContent = htmlContent.substring(0, start) + commented + htmlContent.substring(end);
    }
    
    setHtmlContent(newContent);
    setHtmlHistory((prev) => [...prev.slice(0, htmlHistoryIndex + 1), newContent]);
    setHtmlHistoryIndex(htmlHistoryIndex + 1);
    if (onContentChange) onContentChange(newContent, 'html');
  }, [htmlContent, htmlHistoryIndex, textareaRef, setHtmlContent, setHtmlHistory, setHtmlHistoryIndex, onContentChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const indentChar = indentType === 'tabs' ? '\t' : ' '.repeat(indentSize);
      
      const newContent = htmlContent.substring(0, start) + indentChar + htmlContent.substring(end);
      setHtmlContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + indentChar.length;
      }, 0);
    }
  }, [htmlContent, indentType, indentSize, setHtmlContent]);

  const formatHtmlContent = useCallback(() => {
    const formatted = formatHTML(htmlContent, indentType, indentSize, lineEnding);
    setHtmlContent(formatted);
    if (onContentChange) onContentChange(formatted, 'html');
  }, [htmlContent, indentType, indentSize, lineEnding, formatHTML, setHtmlContent, onContentChange]);

  const minifyHtmlContent = useCallback(() => {
    const minified = htmlContent.replace(/>\s+</g, '><').trim();
    setHtmlContent(minified);
    if (onContentChange) onContentChange(minified, 'html');
  }, [htmlContent, setHtmlContent, onContentChange]);

  return {
    copyToClipboard,
    undoHtml,
    redoHtml,
    validateHtml,
    highlightHtml,
    toggleComment,
    handleKeyDown,
    formatHtmlContent,
    minifyHtmlContent,
  };
}
