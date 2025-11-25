import { RefObject } from 'react';

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

export function useHtmlEditorUtilities(props: HtmlEditorUtilitiesProps): HtmlEditorUtilities {
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

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Undo function
  const undoHtml = () => {
    if (htmlHistoryIndex > 0) {
      const newIndex = htmlHistoryIndex - 1;
      setHtmlHistoryIndex(newIndex);
      const newContent = htmlHistory[newIndex];
      setHtmlContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'html');
      }
    }
  };

  // Redo function
  const redoHtml = () => {
    if (htmlHistoryIndex < htmlHistory.length - 1) {
      const newIndex = htmlHistoryIndex + 1;
      setHtmlHistoryIndex(newIndex);
      const newContent = htmlHistory[newIndex];
      setHtmlContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'html');
      }
    }
  };

  // HTML Validation function
  const validateHtml = () => {
    const errors: string[] = [];
    const tagStack: { tag: string; position: number }[] = [];
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    // Find all tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(htmlContent)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const position = match.index;
      
      // Skip self-closing tags
      if (selfClosingTags.includes(tagName) || fullTag.endsWith('/>')) {
        continue;
      }
      
      // Closing tag
      if (fullTag.startsWith('</')) {
        if (tagStack.length === 0) {
          errors.push(`Closing tag </${tagName}> has no matching opening tag at position ${position}`);
        } else {
          const lastOpen = tagStack[tagStack.length - 1];
          if (lastOpen.tag === tagName) {
            tagStack.pop();
          } else {
            errors.push(`Expected closing tag </${lastOpen.tag}> but found </${tagName}> at position ${position}`);
          }
        }
      } 
      // Opening tag
      else {
        tagStack.push({ tag: tagName, position });
      }
    }
    
    // Check for unclosed tags
    tagStack.forEach(({ tag, position }) => {
      errors.push(`Unclosed tag <${tag}> at position ${position}`);
    });
    
    setHtmlValidationErrors(errors);
    setShowValidationErrors(true);
    
    // Auto-hide after 5 seconds if no errors
    if (errors.length === 0) {
      setTimeout(() => setShowValidationErrors(false), 3000);
    }
  };

  // Syntax highlighting function for HTML
  const highlightHtml = (code: string): string => {
    if (!code) return '';
    
    // Escape HTML for safe rendering
    let result = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Define specific colors for individual tags
    const tagColors = htmlEditorBgColor === 'dark' ? {
      // Structural tags
      html: '#C586C0',
      head: '#C586C0',
      body: '#C586C0',
      header: '#B267C0',
      footer: '#B267C0',
      main: '#D19CD9',
      nav: '#D19CD9',
      aside: '#D19CD9',
      section: '#E0B3E8',
      article: '#E0B3E8',
      
      // Headings - Different shades of red/orange
      h1: '#FF6B6B',
      h2: '#FF8C42',
      h3: '#FFA500',
      h4: '#FFB84D',
      h5: '#FFC266',
      h6: '#FFD699',
      
      // Content containers - Different shades of teal/cyan
      div: '#4EC9B0',
      span: '#6DD9C0',
      p: '#87E8D0',
      blockquote: '#5DD5BE',
      pre: '#46B89C',
      code: '#3FA68A',
      
      // Text formatting
      strong: '#DCDCAA',
      em: '#E8E8BB',
      b: '#D4D49A',
      i: '#E0E0AA',
      u: '#C8C888',
      s: '#B8B877',
      small: '#F0F0CC',
      mark: '#FFFF99',
      del: '#C0C090',
      ins: '#D8D8A0',
      sub: '#E4E4B0',
      sup: '#E4E4B0',
      
      // Lists
      ul: '#9CDCFE',
      ol: '#80C8FF',
      li: '#B0E0FF',
      dl: '#8CD4FF',
      dt: '#A0DCFF',
      dd: '#B8E4FF',
      
      // Tables
      table: '#CE9178',
      thead: '#D8A588',
      tbody: '#E2B998',
      tfoot: '#ECCDA8',
      tr: '#D49F88',
      th: '#DA9B80',
      td: '#E0AA90',
      caption: '#C88868',
      colgroup: '#C28060',
      col: '#BC7858',
      
      // Form elements
      form: '#4FC1FF',
      input: '#5FCCFF',
      textarea: '#6FD7FF',
      select: '#7FE2FF',
      option: '#8FEDFF',
      button: '#40B6EE',
      label: '#9FF8FF',
      fieldset: '#30ABDD',
      legend: '#20A0CC',
      
      // Media tags
      img: '#FF77FF',
      video: '#C586C0',
      audio: '#D19CD9',
      source: '#E0B3E8',
      picture: '#FF99FF',
      figure: '#CC77CC',
      figcaption: '#DD88DD',
      svg: '#EE99EE',
      canvas: '#BB66BB',
      
      // Links
      a: '#4EC9B0',
      link: '#5DD5BE',
      
      // Meta tags
      meta: '#808080',
      title: '#909090',
      style: '#A0A0A0',
      script: '#B0B0B0',
      noscript: '#707070',
      base: '#888888',
      
      // Default
      default: '#569CD6',
      attribute: '#9CDCFE',
      attributeValue: '#CE9178',
      bracket: '#808080',
      comment: '#6A9955',
    } : {
      // Light theme colors
      html: '#AF00DB',
      head: '#AF00DB',
      body: '#AF00DB',
      header: '#9900BB',
      footer: '#9900BB',
      main: '#BB11DD',
      nav: '#BB11DD',
      aside: '#BB11DD',
      section: '#CC22EE',
      article: '#CC22EE',
      
      // Headings
      h1: '#CC0000',
      h2: '#DD3300',
      h3: '#EE6600',
      h4: '#FF8800',
      h5: '#FF9933',
      h6: '#FFAA55',
      
      // Content containers
      div: '#267F99',
      span: '#337F99',
      p: '#408999',
      blockquote: '#2A7589',
      pre: '#206979',
      code: '#185569',
      
      // Text formatting
      strong: '#795E26',
      em: '#896E36',
      b: '#695E16',
      i: '#896E36',
      u: '#997E46',
      s: '#887744',
      small: '#AA9966',
      mark: '#BB8800',
      del: '#666633',
      ins: '#777744',
      sub: '#888855',
      sup: '#888855',
      
      // Lists
      ul: '#0070C1',
      ol: '#0060B1',
      li: '#0080D1',
      dl: '#0068BB',
      dt: '#0074C5',
      dd: '#0084D5',
      
      // Tables
      table: '#A31515',
      thead: '#B32525',
      tbody: '#C33535',
      tfoot: '#D34545',
      tr: '#BB2020',
      th: '#AA1010',
      td: '#CC2828',
      caption: '#991010',
      colgroup: '#880000',
      col: '#770000',
      
      // Form elements
      form: '#0000FF',
      input: '#1111FF',
      textarea: '#2222FF',
      select: '#3333FF',
      option: '#4444FF',
      button: '#0000EE',
      label: '#5555FF',
      fieldset: '#0000DD',
      legend: '#0000CC',
      
      // Media tags
      img: '#FF00FF',
      video: '#AF00DB',
      audio: '#BB11DD',
      source: '#CC22EE',
      picture: '#EE44FF',
      figure: '#DD33EE',
      figcaption: '#CC22DD',
      svg: '#FF55FF',
      canvas: '#AA00CC',
      
      // Links
      a: '#267F99',
      link: '#337F99',
      
      // Meta tags
      meta: '#808080',
      title: '#707070',
      style: '#606060',
      script: '#505050',
      noscript: '#909090',
      base: '#757575',
      
      // Default
      default: '#0000FF',
      attribute: '#FF0000',
      attributeValue: '#A31515',
      bracket: '#808080',
      comment: '#008000',
    };
    
    // Helper function to get color for tag
    const getTagColor = (tagName: string): string => {
      const lowerTag = tagName.toLowerCase();
      return tagColors[lowerTag as keyof typeof tagColors] || tagColors.default;
    };
    
    // Apply syntax highlighting
    // Comments
    result = result.replace(
      /(&lt;!--[\s\S]*?--&gt;)/g,
      `<span style="color: ${tagColors.comment};">$1</span>`
    );
    
    // Opening/Closing tags with attributes
    result = result.replace(
      /(&lt;\/?)(\w+)((?:\s+[\w-]+(?:=(?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+))?)*\s*)(\/?&gt;)/g,
      (match, openBracket, tagName, attributes, closeBracket) => {
        const tagColor = getTagColor(tagName);
        let highlighted = openBracket + `<span style="color: ${tagColor}; font-weight: 600;">${tagName}</span>`;
        
        // Highlight attributes
        if (attributes) {
          highlighted += attributes.replace(
            /([\w-]+)(=)?((?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+)?)/g,
            (_attrMatch: string, attrName: string, equals: string, attrValue: string) => {
              let result = `<span style="color: ${tagColors.attribute};">${attrName}</span>`;
              if (equals) {
                result += equals;
                if (attrValue) {
                  result += `<span style="color: ${tagColors.attributeValue};">${attrValue}</span>`;
                }
              }
              return result;
            }
          );
        }
        
        highlighted += `<span style="color: ${tagColors.bracket};">${closeBracket}</span>`;
        return highlighted;
      }
    );
    
    return result;
  };

  // Toggle HTML comment
  const toggleComment = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlContent.substring(start, end);

    let newContent: string;
    let newCursorPos: number;

    if (selectedText) {
      // Check if selected text is already commented
      const isCommented = selectedText.startsWith('<!--') && selectedText.endsWith('-->');
      
      if (isCommented) {
        // Uncomment: remove <!-- and -->
        const uncommented = selectedText.substring(4, selectedText.length - 3);
        newContent = htmlContent.substring(0, start) + uncommented + htmlContent.substring(end);
        newCursorPos = start + uncommented.length;
      } else {
        // Comment: wrap with <!-- -->
        const commented = `<!-- ${selectedText} -->`;
        newContent = htmlContent.substring(0, start) + commented + htmlContent.substring(end);
        newCursorPos = start + commented.length;
      }
    } else {
      // No selection: insert comment template at cursor
      const comment = '<!-- comment -->';
      newContent = htmlContent.substring(0, start) + comment + htmlContent.substring(end);
      newCursorPos = start + 5; // Position cursor after "<!-- "
    }

    setHtmlContent(newContent);
    if (onContentChange) {
      onContentChange(newContent, 'html');
    }

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        if (selectedText && !selectedText.startsWith('<!--')) {
          // If we just commented, select the commented text
          textarea.setSelectionRange(start, newCursorPos);
        } else {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
        textarea.focus();
      }
    }, 0);
  };

  // Handle keyboard shortcuts and auto-complete in HTML editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Cmd+/ or Ctrl+/ to toggle comment
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      toggleComment();
      return;
    }

    // Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      
      const selectedText = htmlContent.substring(start, end);
      const indent = indentType === 'tabs' ? '\t' : ' '.repeat(indentSize);
      
      if (e.shiftKey) {
        // Shift+Tab: decrease indent for each line
        const lines = selectedText.split('\n');
        const unindentedLines = lines.map(line => {
          if (line.startsWith(indent)) {
            return line.substring(indent.length);
          }
          return line;
        });
        
        const newText = unindentedLines.join('\n');
        const newContent = htmlContent.substring(0, start) + newText + htmlContent.substring(end);
        
        setHtmlContent(newContent);
        if (onContentChange) {
          onContentChange(newContent, 'html');
        }
        
        // Restore selection
        setTimeout(() => {
          textarea.setSelectionRange(start, start + newText.length);
        }, 0);
      } else {
        // Tab: increase indent for each line
        if (selectedText.includes('\n')) {
          const lines = selectedText.split('\n');
          const indentedLines = lines.map(line => indent + line);
          const newText = indentedLines.join('\n');
          const newContent = htmlContent.substring(0, start) + newText + htmlContent.substring(end);
          
          setHtmlContent(newContent);
          if (onContentChange) {
            onContentChange(newContent, 'html');
          }
          
          // Restore selection
          setTimeout(() => {
            textarea.setSelectionRange(start, start + newText.length);
          }, 0);
        } else {
          // Single line or no selection: insert indent at cursor
          const newContent = htmlContent.substring(0, start) + indent + htmlContent.substring(end);
          setHtmlContent(newContent);
          if (onContentChange) {
            onContentChange(newContent, 'html');
          }
          
          setTimeout(() => {
            textarea.setSelectionRange(start + indent.length, start + indent.length);
          }, 0);
        }
      }
      return;
    }

    // Auto-close tags
    if (e.key === '>') {
      const textBeforeCursor = htmlContent.substring(0, start);
      const tagMatch = textBeforeCursor.match(/<(\w+)(?:\s+[^>]*)?$/);
      
      if (tagMatch) {
        const tagName = tagMatch[1];
        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
        
        if (!selfClosingTags.includes(tagName.toLowerCase())) {
          e.preventDefault();
          const closingTag = `</${tagName}>`;
          const newContent = htmlContent.substring(0, start) + '>' + closingTag + htmlContent.substring(end);
          
          setHtmlContent(newContent);
          if (onContentChange) {
            onContentChange(newContent, 'html');
          }
          
          setTimeout(() => {
            textarea.setSelectionRange(start + 1, start + 1);
          }, 0);
          return;
        }
      }
    }

    // Auto-close quotes
    if (e.key === '"' || e.key === "'") {
      const textBeforeCursor = htmlContent.substring(0, start);
      const textAfterCursor = htmlContent.substring(end);
      
      // Check if we're inside a tag
      const lastOpenBracket = textBeforeCursor.lastIndexOf('<');
      const lastCloseBracket = textBeforeCursor.lastIndexOf('>');
      
      if (lastOpenBracket > lastCloseBracket) {
        e.preventDefault();
        const quote = e.key;
        const newContent = htmlContent.substring(0, start) + quote + quote + htmlContent.substring(end);
        
        setHtmlContent(newContent);
        if (onContentChange) {
          onContentChange(newContent, 'html');
        }
        
        setTimeout(() => {
          textarea.setSelectionRange(start + 1, start + 1);
        }, 0);
        return;
      }
    }

    // Enter key: auto-indent new line
    if (e.key === 'Enter') {
      const textBeforeCursor = htmlContent.substring(0, start);
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Count leading whitespace
      const match = currentLine.match(/^(\s+)/);
      const currentIndent = match ? match[1] : '';
      
      e.preventDefault();
      const newLine = '\n' + currentIndent;
      const newContent = htmlContent.substring(0, start) + newLine + htmlContent.substring(end);
      
      setHtmlContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'html');
      }
      
      setTimeout(() => {
        textarea.setSelectionRange(start + newLine.length, start + newLine.length);
      }, 0);
    }
  };

  const formatHtmlContent = () => {
    const formatted = formatHTML(htmlContent, indentType, indentSize, lineEnding);
    setHtmlContent(formatted);
    if (onContentChange) {
      onContentChange(formatted, 'html');
    }
  };

  const minifyHtmlContent = () => {
    // Remove extra whitespace and line breaks
    const minified = htmlContent
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .trim();
    setHtmlContent(minified);
    if (onContentChange) {
      onContentChange(minified, 'html');
    }
  };

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
