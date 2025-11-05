'use client';
import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { createPortal } from 'react-dom';
import { CheckIcon, ClipboardIcon, EyeIcon, PencilIcon, ArrowDownTrayIcon, XMarkIcon, TrashIcon, ArrowDownOnSquareIcon, LinkIcon, ListBulletIcon, CodeBracketIcon, PhotoIcon, Bars3BottomLeftIcon, DocumentIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import Tooltip from '@/components/Tooltip';
import { useToast } from '@/components/Shared/ToastContainer';
import { Message, ChatMessagesProps, ChatFile } from './types';
import styles from './ChatWidget.module.css';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';
import SaveFileModal from './SaveFileModal';

// Types for better type safety
interface HtmlElement {
  text: string;
  isHeading: boolean;
  level: number;
}

interface ProcessedText {
  key: string | null;
  value: string;
}

interface ParsedJsonContent {
  firstH1: string | null;
  content: { [key: string]: any };
}

// Optimized Supabase client with better configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

// Helper function to convert hex color to RGB for jsPDF
const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 240, g: 240, b: 240 }; // default light gray
};

// Interface for markdown elements
interface MarkdownElement {
  text: string;
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'paragraph' | 'list-item' | 'quote' | 'code-block' | 'horizontal-rule';
  formatting?: Array<{
    type: 'bold' | 'italic' | 'code';
    start: number;
    end: number;
  }>;
}

// Parse markdown text into structured elements for PDF
const parseMarkdownForPdf = (markdown: string): MarkdownElement[] => {
  const lines = markdown.split('\n');
  const elements: MarkdownElement[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push({
          text: codeBlockLines.join('\n'),
          type: 'code-block',
        });
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Skip empty lines
    if (!line.trim()) {
      continue;
    }

    // Parse horizontal rules (---, ___, ***)
    if (line.trim().match(/^([-_*]){3,}$/)) {
      elements.push({
        text: '',
        type: 'horizontal-rule',
      });
      continue;
    }

    // Parse headers
    if (line.startsWith('#### ')) {
      elements.push({
        text: line.substring(5).trim(),
        type: 'h4',
      });
    } else if (line.startsWith('### ')) {
      elements.push({
        text: line.substring(4).trim(),
        type: 'h3',
      });
    } else if (line.startsWith('## ')) {
      elements.push({
        text: line.substring(3).trim(),
        type: 'h2',
      });
    } else if (line.startsWith('# ')) {
      elements.push({
        text: line.substring(2).trim(),
        type: 'h1',
      });
    } 
    // Parse list items
    else if (line.trim().match(/^[-*+]\s/) || line.trim().match(/^\d+\.\s/)) {
      const text = line.trim().replace(/^[-*+]\s/, '').replace(/^\d+\.\s/, '');
      elements.push({
        text,
        type: 'list-item',
        formatting: parseInlineFormatting(text),
      });
    }
    // Parse blockquotes
    else if (line.trim().startsWith('> ')) {
      elements.push({
        text: line.trim().substring(2),
        type: 'quote',
        formatting: parseInlineFormatting(line.trim().substring(2)),
      });
    }
    // Regular paragraph
    else {
      elements.push({
        text: line.trim(),
        type: 'paragraph',
        formatting: parseInlineFormatting(line.trim()),
      });
    }
  }

  return elements;
};

// Parse inline markdown formatting (bold, italic, code)
const parseInlineFormatting = (text: string): Array<{ type: 'bold' | 'italic' | 'code'; start: number; end: number }> => {
  const formatting: Array<{ type: 'bold' | 'italic' | 'code'; start: number; end: number }> = [];
  
  // Find **bold** text
  let boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    formatting.push({
      type: 'bold',
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Find *italic* or _italic_ text
  let italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)|_(.+?)_/g;
  while ((match = italicRegex.exec(text)) !== null) {
    formatting.push({
      type: 'italic',
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Find `code` text
  let codeRegex = /`(.+?)`/g;
  while ((match = codeRegex.exec(text)) !== null) {
    formatting.push({
      type: 'code',
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return formatting;
};

// Strip markdown syntax from text
const stripMarkdownSyntax = (text: string): string => {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Bold
    .replace(/\*(.+?)\*/g, '$1')     // Italic
    .replace(/_(.+?)_/g, '$1')       // Italic underscore
    .replace(/`(.+?)`/g, '$1')       // Code
    .replace(/\[(.+?)\]\(.+?\)/g, '$1'); // Links
};

// Render text with inline formatting for preview
const renderFormattedText = (text: string): JSX.Element[] => {
  const parts: JSX.Element[] = [];
  let currentPos = 0;
  let keyCounter = 0;

  // Process code, bold, and italic text
  const codeRegex = /`(.+?)`/g;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  
  // Find all markers
  const markers: Array<{ start: number; end: number; type: 'bold' | 'italic' | 'code'; content: string }> = [];
  
  let match: RegExpExecArray | null;
  
  // Find code markers first (highest priority)
  while ((match = codeRegex.exec(text)) !== null) {
    markers.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'code',
      content: match[1]
    });
  }
  
  // Find bold markers
  while ((match = boldRegex.exec(text)) !== null) {
    const isInCode = markers.some(m => 
      m.type === 'code' && match!.index >= m.start && match!.index < m.end
    );
    if (!isInCode) {
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'bold',
        content: match[1]
      });
    }
  }
  
  // Find italic markers (avoiding bold and code regions)
  while ((match = italicRegex.exec(text)) !== null) {
    const isInOther = markers.some(m => 
      (m.type === 'bold' || m.type === 'code') && match!.index >= m.start && match!.index < m.end
    );
    if (!isInOther) {
      markers.push({
        start: match.index,
        end: match.index + match[0].length,
        type: 'italic',
        content: match[1]
      });
    }
  }
  
  // Sort markers by position
  markers.sort((a, b) => a.start - b.start);
  
  // Build the parts array with formatted segments
  markers.forEach((marker) => {
    // Add text before this marker
    if (currentPos < marker.start) {
      const plainText = text.substring(currentPos, marker.start);
      if (plainText) {
        parts.push(<span key={keyCounter++}>{plainText}</span>);
      }
    }
    
    // Add formatted text
    if (marker.type === 'code') {
      parts.push(
        <code key={keyCounter++} className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs font-mono">
          {marker.content}
        </code>
      );
    } else if (marker.type === 'bold') {
      parts.push(<strong key={keyCounter++}>{marker.content}</strong>);
    } else if (marker.type === 'italic') {
      parts.push(<em key={keyCounter++}>{marker.content}</em>);
    }
    
    currentPos = marker.end;
  });
  
  // Add remaining text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      parts.push(<span key={keyCounter++}>{remainingText}</span>);
    }
  }
  
  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
};

// Split text into segments with formatting information for PDF rendering
interface TextSegment {
  text: string;
  style: 'normal' | 'bold' | 'italic' | 'code';
}

const splitTextByFormatting = (text: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let currentPos = 0;
  
  // Find all formatting markers in order
  const markers: Array<{ pos: number; end: number; type: 'bold' | 'italic' | 'code'; length: number }> = [];
  
  // Find `code` text first (highest priority)
  let codeRegex = /`(.+?)`/g;
  let match;
  while ((match = codeRegex.exec(text)) !== null) {
    markers.push({
      pos: match.index,
      end: match.index + match[0].length,
      type: 'code',
      length: match[1].length,
    });
  }
  
  // Find **bold** text
  let boldRegex = /\*\*(.+?)\*\*/g;
  while ((match = boldRegex.exec(text)) !== null) {
    // Check if this overlaps with a code marker
    const overlaps = markers.some(m => 
      m.type === 'code' && (
        (match!.index >= m.pos && match!.index < m.end) ||
        (match!.index + match![0].length > m.pos && match!.index + match![0].length <= m.end)
      )
    );
    if (!overlaps) {
      markers.push({
        pos: match.index,
        end: match.index + match[0].length,
        type: 'bold',
        length: match[1].length,
      });
    }
  }
  
  // Find *italic* text
  let italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  while ((match = italicRegex.exec(text)) !== null) {
    // Check if this overlaps with a bold or code marker
    const overlaps = markers.some(m => 
      (match!.index >= m.pos && match!.index < m.end) ||
      (match!.index + match![0].length > m.pos && match!.index + match![0].length <= m.end)
    );
    if (!overlaps) {
      markers.push({
        pos: match.index,
        end: match.index + match[0].length,
        type: 'italic',
        length: match[1].length,
      });
    }
  }
  
  // Sort markers by position
  markers.sort((a, b) => a.pos - b.pos);
  
  // Build segments
  for (const marker of markers) {
    // Add normal text before this marker
    if (currentPos < marker.pos) {
      const normalText = text.substring(currentPos, marker.pos);
      if (normalText) {
        segments.push({ text: normalText, style: 'normal' });
      }
    }
    
    // Add formatted text (strip the markers)
    let markerLength = 1; // default for italic and code (*, `)
    if (marker.type === 'bold') {
      markerLength = 2; // ** on each side
    }
    const formattedText = text.substring(
      marker.pos + markerLength,
      marker.end - markerLength
    );
    segments.push({ text: formattedText, style: marker.type });
    
    currentPos = marker.end;
  }
  
  // Add remaining normal text
  if (currentPos < text.length) {
    const remainingText = text.substring(currentPos);
    if (remainingText) {
      segments.push({ text: remainingText, style: 'normal' });
    }
  }
  
  // If no formatting found, return the whole text as normal
  if (segments.length === 0) {
    segments.push({ text, style: 'normal' });
  }
  
  return segments;
};

// Optimized HTML parser for PDF with better type safety
const parseHtmlForPdf = (html: string): HtmlElement[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements: HtmlElement[] = [];

  const traverse = (node: Node, currentLevel: number = 0): void => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      elements.push({
        text: node.textContent.trim(),
        isHeading: currentLevel > 0 && ['H1', 'H2', 'H3'].includes(node.parentElement?.tagName || ''),
        level: currentLevel,
      });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = (node as Element).tagName;
      const newLevel = ['H1', 'H2', 'H3'].includes(tagName) ? parseInt(tagName.replace('H', '')) : currentLevel;
      node.childNodes.forEach((child) => traverse(child, newLevel));
    }
  };

  traverse(doc.body);
  return elements;
};

// Optimized HTML parser for JSON with proper type safety
const parseHtmlForJson = (html: string): ParsedJsonContent => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const jsonOutput: { [key: string]: any } = {};
  let currentH2: string | null = null;
  let currentH3: { [key: string]: any } | null = null;
  let currentList: any[] | null = null;
  let firstH1: string | null = null;
  let h3Content: string[] = [];

  const processText = (text: string, isH3: boolean = false): ProcessedText => {
    if (isH3) {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length > 1) {
        const key = lines[0];
        const value = lines.slice(1).join(' ');
        return { key, value };
      }
      return { key: null, value: text };
    }
    const parts = text.split(':').map(part => part.trim());
    if (parts.length > 1) {
      const key = parts[0];
      const value = parts.slice(1).join(':');
      return { key, value };
    }
    return { key: null, value: text };
  };

  const processParagraphs = (node: Node) => {
    const paragraphs: string[] = [];
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'P') {
        const text = child.textContent?.trim();
        if (text) paragraphs.push(text);
      }
    });
    return paragraphs;
  };

  const traverse = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = (node as Element).tagName;
      const text = node.textContent?.trim();

      if (tagName === 'H1' && text && !firstH1) {
        firstH1 = text;
      } else if (tagName === 'H2' && text) {
        if (currentH3 && h3Content.length) {
          const { key, value } = processText(h3Content.join(' '), true);
          if (key && value) {
            currentH3[key] = value;
          } else {
            currentH3[Object.keys(currentH3)[0]] = h3Content.join(' ');
          }
          h3Content = [];
        }
        currentH2 = text;
        currentH3 = null;
        currentList = null;
        jsonOutput[currentH2] = [];
      } else if (tagName === 'H3' && text && currentH2) {
        if (currentH3 && h3Content.length) {
          const { key, value } = processText(h3Content.join(' '), true);
          if (key && value) {
            currentH3[key] = value;
          } else {
            currentH3[Object.keys(currentH3)[0]] = h3Content.join(' ');
          }
          h3Content = [];
        }
        currentH3 = { [text]: null };
        jsonOutput[currentH2].push(currentH3);
        currentList = null;
      } else if (tagName === 'UL' || tagName === 'OL') {
        currentList = [];
        if (currentH3 && currentH2) {
          currentH3["Items"] = currentList;
        } else if (currentH2) {
          jsonOutput[currentH2] = currentList;
        }
      } else if (tagName === 'LI' && text && currentList) {
        const { key, value } = processText(text);
        if (key && value) {
          if (currentH3 && currentH2) {
            currentH3[key] = value;
          } else if (currentH2) {
            jsonOutput[currentH2].push({ [key]: value });
          }
        } else {
          currentList.push(text);
        }
      } else if (tagName === 'P' && text && currentH2) {
        if (currentH3) {
          h3Content.push(text);
        } else {
          const paragraphs = processParagraphs(node.parentNode!);
          if (paragraphs.length > 1) {
            paragraphs.forEach((pText) => {
              const { key, value } = processText(pText);
              if (key && value && currentH2) {
                if (Array.isArray(jsonOutput[currentH2])) {
                  jsonOutput[currentH2].push({ [key]: value });
                } else {
                  jsonOutput[currentH2] = [{ [key]: value }];
                }
              } else if (currentH2) {
                if (Array.isArray(jsonOutput[currentH2])) {
                  jsonOutput[currentH2].push({ "Details": pText });
                } else {
                  jsonOutput[currentH2] = [{ "Details": pText }];
                }
              }
            });
          } else {
            const { key, value } = processText(text);
            if (key && value && currentH2) {
              if (Array.isArray(jsonOutput[currentH2])) {
                jsonOutput[currentH2].push({ [key]: value });
              } else {
                jsonOutput[currentH2] = [{ [key]: value }];
              }
            } else if (currentH2) {
              jsonOutput[currentH2] = text; // Single paragraph
            }
          }
        }
      }

      node.childNodes.forEach((child) => traverse(child));

      if (currentH3 && h3Content.length) {
        const { key, value } = processText(h3Content.join(' '), true);
        if (key && value) {
          currentH3[key] = value;
        } else {
          currentH3[Object.keys(currentH3)[0]] = h3Content.join(' ');
        }
        h3Content = [];
      }
    }
  };

  traverse(doc.body);
  return { firstH1, content: jsonOutput };
};

// Parse markdown content for JSON format
const parseMarkdownForJson = (markdown: string): ParsedJsonContent => {
  const lines = markdown.split('\n');
  const jsonOutput: { [key: string]: any } = {};
  let firstH1: string | null = null;
  let currentH2: string | null = null;
  let currentH3: string | null = null;
  let currentContent: string[] = [];

  const saveCurrentContent = () => {
    if (currentContent.length === 0) return;

    const content = currentContent.join('\n').trim();
    if (!content) return;

    if (currentH3 && currentH2) {
      // Content under H3
      if (!Array.isArray(jsonOutput[currentH2])) {
        jsonOutput[currentH2] = [];
      }
      
      // Check if content has key-value pairs
      const keyValueMatch = content.match(/^(.+?):\s*(.+)$/);
      if (keyValueMatch) {
        const [, key, value] = keyValueMatch;
        jsonOutput[currentH2].push({ [currentH3]: { [key.trim()]: value.trim() } });
      } else {
        jsonOutput[currentH2].push({ [currentH3]: content });
      }
    } else if (currentH2) {
      // Content directly under H2
      if (jsonOutput[currentH2] === undefined) {
        jsonOutput[currentH2] = content;
      } else if (typeof jsonOutput[currentH2] === 'string') {
        jsonOutput[currentH2] = [jsonOutput[currentH2], content];
      } else if (Array.isArray(jsonOutput[currentH2])) {
        jsonOutput[currentH2].push(content);
      }
    }

    currentContent = [];
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();

    // Check for headers
    if (trimmedLine.startsWith('# ') && !firstH1) {
      firstH1 = trimmedLine.substring(2).trim();
    } else if (trimmedLine.startsWith('## ')) {
      saveCurrentContent();
      currentH2 = trimmedLine.substring(3).trim();
      currentH3 = null;
      jsonOutput[currentH2] = [];
    } else if (trimmedLine.startsWith('### ')) {
      saveCurrentContent();
      currentH3 = trimmedLine.substring(4).trim();
    } else if (trimmedLine.startsWith('#### ')) {
      // Treat H4 as content
      currentContent.push(trimmedLine.substring(5).trim());
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // List item
      currentContent.push(trimmedLine.substring(2).trim());
    } else if (trimmedLine.startsWith('> ')) {
      // Quote
      currentContent.push(trimmedLine.substring(2).trim());
    } else if (trimmedLine.length > 0) {
      // Regular content
      currentContent.push(trimmedLine);
    }
  });

  // Save any remaining content
  saveCurrentContent();

  return { firstH1, content: jsonOutput };
};

export default function ChatMessages({ messages, isTyping, isFullscreen, setError, accessToken, userId, onDeleteMessage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [showFilenameForm, setShowFilenameForm] = useState<number | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState<number | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
  const [defaultFilename, setDefaultFilename] = useState<string>('');
  
  // New states for different modals
  const [showPreviewModal, setShowPreviewModal] = useState<number | null>(null);
  const [showEditModal, setShowEditModal] = useState<number | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [previewFormat, setPreviewFormat] = useState<'txt' | 'md' | 'pdf' | 'json'>('md');
  const [previewContent, setPreviewContent] = useState<string>('');
  
  // Color customization states
  const [inlineCodeBgColor, setInlineCodeBgColor] = useState<string>('#f0f0f0'); // light gray
  const [inlineCodeTextColor, setInlineCodeTextColor] = useState<string>('#000000'); // black
  const [codeBlockBgColor, setCodeBlockBgColor] = useState<string>('#f0f0f0'); // light gray
  const [codeBlockTextColor, setCodeBlockTextColor] = useState<string>('#000000'); // black

  // File attachment states
  const [fileDetails, setFileDetails] = useState<{ [key: string]: ChatFile }>({});
  const [loadingFiles, setLoadingFiles] = useState<Set<string>>(new Set());
  const [previewFileIndex, setPreviewFileIndex] = useState<{ [messageIndex: number]: number }>({});
  const [fullscreenFile, setFullscreenFile] = useState<{ fileId: string; messageIndex: number } | null>(null);

  // Textarea ref for markdown editor
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch file details for attached files
  const fetchFileDetails = useCallback(async (fileId: string) => {
    if (fileDetails[fileId] || loadingFiles.has(fileId)) return;

    setLoadingFiles(prev => new Set([...prev, fileId]));

    try {
      const response = await fetch('/api/chat/files/upload', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const file = data.files?.find((f: ChatFile) => f.id === fileId);
        
        if (file) {
          setFileDetails(prev => ({ ...prev, [fileId]: file }));
        }
      }
    } catch (error) {
      console.error('Error fetching file details:', error);
    } finally {
      setLoadingFiles(prev => {
        const newSet = new Set([...prev]);
        newSet.delete(fileId);
        return newSet;
      });
    }
  }, [fileDetails, loadingFiles, accessToken]);

  // Download file
  const handleDownloadAttachment = useCallback(async (fileId: string) => {
    const file = fileDetails[fileId];
    if (!file) return;

    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
  }, [fileDetails, toast]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on mime type
  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return DocumentIcon;
    if (mimeType.includes('pdf')) return DocumentIcon;
    if (mimeType.includes('word') || mimeType.includes('wordprocessingml')) return DocumentIcon;
    if (mimeType.includes('image')) return PhotoIcon;
    if (mimeType.includes('text')) return Bars3BottomLeftIcon;
    return DocumentIcon;
  };

  // Navigate between attached files
  const navigateFile = (messageIndex: number, direction: 'prev' | 'next', totalFiles: number) => {
    setPreviewFileIndex(prev => {
      const currentIndex = prev[messageIndex] || 0;
      let newIndex;
      
      if (direction === 'prev') {
        newIndex = currentIndex === 0 ? totalFiles - 1 : currentIndex - 1;
      } else {
        newIndex = currentIndex === totalFiles - 1 ? 0 : currentIndex + 1;
      }
      
      return { ...prev, [messageIndex]: newIndex };
    });
  };

  // Check if file can be previewed
  const canPreviewFile = (mimeType?: string) => {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType === 'application/pdf';
  };

  // Open fullscreen preview
  const openFullscreenPreview = (fileId: string, messageIndex: number) => {
    setFullscreenFile({ fileId, messageIndex });
  };

  // Close fullscreen preview
  const closeFullscreenPreview = () => {
    setFullscreenFile(null);
  };

  // Navigate in fullscreen mode
  const navigateFullscreen = (direction: 'prev' | 'next', messageIndex: number, totalFiles: number) => {
    navigateFile(messageIndex, direction, totalFiles);
  };

  // Markdown formatting helpers
  const insertMarkdown = (before: string, after: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editContent.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      editContent.substring(0, start) + 
      before + textToInsert + after + 
      editContent.substring(end);
    
    setEditContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const newText = 
      editContent.substring(0, lineStart) + 
      prefix + 
      editContent.substring(lineStart);
    
    setEditContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertList = (ordered: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = editContent.lastIndexOf('\n', start - 1) + 1;
    const prefix = ordered ? '1. ' : '- ';
    
    const newText = 
      editContent.substring(0, lineStart) + 
      prefix + 
      editContent.substring(lineStart);
    
    setEditContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilenameForm !== null) {
        setShowFilenameForm(null);
        setDefaultFilename('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFilenameForm]);

  // Keyboard navigation for fullscreen preview
  useEffect(() => {
    if (!fullscreenFile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const messageIndex = fullscreenFile.messageIndex;
      const message = messages[messageIndex];
      const fileIds = message.attachedFileIds || [];

      if (e.key === 'Escape') {
        closeFullscreenPreview();
      } else if (e.key === 'ArrowLeft' && fileIds.length > 1) {
        navigateFullscreen('prev', messageIndex, fileIds.length);
      } else if (e.key === 'ArrowRight' && fileIds.length > 1) {
        navigateFullscreen('next', messageIndex, fileIds.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenFile, messages]);

  const getDefaultFilename = (content: string, index: number) => {
    const textContent = content.replace(/<[^>]+>/g, '');
    const firstLine = textContent.split('\n')[0]?.trim() || 'message';
    const words = firstLine.split(/\s+/).filter(Boolean);
    const prefix = words.length >= 3 ? words.slice(0, 3).join('_') : words.slice(0, 2).join('_') || 'message';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}-${timestamp}-${index}`;
  };

  const copyMessage = async (content: string, index: number) => {
    try {
      const textContent = content.replace(/<[^>]+>/g, '');
      await navigator.clipboard.writeText(textContent);
      setCopiedMessageId(index);
      setError(null);
      toast.success('Message copied to clipboard!');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('[ChatMessages] Copy error:', err);
      toast.error('Failed to copy message');
    }
  };

  const openFilenameForm = (index: number, format: 'txt' | 'pdf' | 'json' | 'md') => {
    const filename = getDefaultFilename(messages[index].content, index);
    setDefaultFilename(filename);
    setCurrentMessageIndex(index);
    setShowFilenameForm(index);
  };

  const openDownloadModal = (index: number) => {
    const filename = getDefaultFilename(messages[index].content, index);
    setDefaultFilename(filename);
    setCurrentMessageIndex(index);
    setShowDownloadModal(index);
  };

  const handleSaveFile = (filename: string, format: 'txt' | 'pdf' | 'json' | 'md') => {
    if (currentMessageIndex !== null) {
      saveFileToDatabase(messages[currentMessageIndex].content, currentMessageIndex, format, filename);
    }
  };

  const handleDownloadFile = (filename: string, format: 'txt' | 'pdf' | 'json' | 'md') => {
    if (currentMessageIndex !== null) {
      downloadFileToLocal(messages[currentMessageIndex].content, currentMessageIndex, format, filename);
    }
  };

  // Handler for preview button
  const openPreviewModal = (index: number) => {
    const content = messages[index].content.replace(/<[^>]+>/g, '');
    setPreviewContent(content);
    setCurrentMessageIndex(index);
    setShowPreviewModal(index);
  };

  // Handler for edit button
  const openEditModal = (index: number) => {
    const content = messages[index].content.replace(/<[^>]+>/g, '');
    setEditContent(content);
    setCurrentMessageIndex(index);
    setShowEditModal(index);
  };

  // Handler for saving edited content
  const handleSaveEdit = () => {
    if (currentMessageIndex !== null) {
      // Update the message content
      messages[currentMessageIndex].content = editContent;
      setShowEditModal(null);
      setEditContent('');
    }
  };

  // Handler for deleting a message
  const handleDeleteMessage = (index: number) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage?.(index);
      toast.success('Message deleted successfully!');
    }
  };

  const saveFileToDatabase = useCallback(async (content: string, index: number, format: 'txt' | 'pdf' | 'json' | 'md', customFilename: string) => {
    if (!accessToken || !userId) {
      setError('Please log in to save files.');
      return;
    }

    try {
      const textContent = content.replace(/<[^>]+>/g, '');
      const taskTitle = messages[index].taskName || '';
      let fileContent: string = '';
      let filename: string = '';

      if (format === 'txt') {
        fileContent = taskTitle ? `${taskTitle}\n\n${textContent}` : textContent;
        filename = `${customFilename}.txt`;
      } else if (format === 'md') {
        fileContent = taskTitle ? `# ${taskTitle}\n\n${textContent}` : textContent;
        filename = `${customFilename}.md`;
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        let y = 10;
        const pageHeight = 277;
        const margin = 10;
        const maxWidth = 190;

        if (taskTitle) {
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(10);
          const taskLines = doc.splitTextToSize(taskTitle, maxWidth);
          doc.text(taskLines, margin, y);
          y += taskLines.length * 6 + 4;
        }

        // Parse markdown content
        const elements = parseMarkdownForPdf(textContent);
        
        for (const element of elements) {
          let fontSize = 12;
          let fontStyle: 'normal' | 'bold' | 'italic' = 'normal';
          let leftMargin = margin;
          
          // Handle horizontal rules
          if (element.type === 'horizontal-rule') {
            // Add spacing before the line
            y += 4;
            
            // Check if we need a new page
            if (y + 2 > pageHeight) {
              doc.addPage();
              y = 10;
            }
            
            // Draw horizontal line
            doc.setLineWidth(0.5);
            doc.setDrawColor(150, 150, 150); // Gray color
            doc.line(margin, y, margin + maxWidth, y);
            
            // Add spacing after the line
            y += 6;
            continue;
          }
          
          switch (element.type) {
            case 'h1':
              fontSize = 18;
              fontStyle = 'bold';
              break;
            case 'h2':
              fontSize = 16;
              fontStyle = 'bold';
              break;
            case 'h3':
              fontSize = 14;
              fontStyle = 'bold';
              break;
            case 'h4':
              fontSize = 13;
              fontStyle = 'bold';
              break;
            case 'list-item':
              leftMargin = margin + 5;
              break;
            case 'quote':
              leftMargin = margin + 5;
              fontStyle = 'italic';
              break;
            case 'code-block':
              fontSize = 10;
              leftMargin = margin + 3;
              break;
          }

          doc.setFontSize(fontSize);
          
          if (element.type === 'code-block') {
            const codeLines = element.text.split('\n');
            const lineHeight = fontSize * 0.5;
            
            // Calculate available width for code block
            const codeBlockWidth = maxWidth - (leftMargin - margin) - 4;
            
            // Process each line and wrap if necessary
            const wrappedLines: string[] = [];
            doc.setFont('Courier', 'normal');
            
            for (const line of codeLines) {
              const lineWidth = doc.getTextWidth(line);
              if (lineWidth > codeBlockWidth) {
                // Line is too long, need to wrap it
                const wrapped = doc.splitTextToSize(line, codeBlockWidth);
                wrappedLines.push(...wrapped);
              } else {
                wrappedLines.push(line);
              }
            }
            
            const blockHeight = wrappedLines.length * lineHeight + 4;
            
            if (y + blockHeight > pageHeight) {
              doc.addPage();
              y = 10;
            }
            
            // Use custom code block background color
            const codeBlockBg = hexToRgb(codeBlockBgColor);
            doc.setFillColor(codeBlockBg.r, codeBlockBg.g, codeBlockBg.b);
            // Use rounded rectangle for code blocks with 1px radius
            doc.roundedRect(leftMargin - 2, y - 3, codeBlockWidth + 4, blockHeight, 1, 1, 'F');
            
            // Use custom code block text color
            const codeBlockText = hexToRgb(codeBlockTextColor);
            doc.setTextColor(codeBlockText.r, codeBlockText.g, codeBlockText.b);
            
            for (const line of wrappedLines) {
              doc.text(line, leftMargin, y);
              y += lineHeight;
            }
            
            // Reset text color to black for other content
            doc.setTextColor(0, 0, 0);
            y += 4;
            continue;
          }
          
          doc.setFont('Helvetica', fontStyle);
          
          if (element.type === 'h1') {
            y += 10;
          } else if (element.type === 'h2') {
            y += 8;
          } else if (element.type === 'h3') {
            y += 6;
          } else if (element.type === 'h4') {
            y += 5;
          }
          
          // Handle text with inline formatting
          const displayText = element.type === 'list-item' ? `• ${element.text}` : element.text;
          
          // Check if element has inline formatting
          const hasInlineFormatting = element.text.includes('**') || element.text.includes('*') || element.text.includes('`');
          
          // Track starting Y position for quote borders
          let startY = y;
          
          if (hasInlineFormatting && element.type !== 'h1' && element.type !== 'h2' && element.type !== 'h3' && element.type !== 'h4') {
            // Split into segments with formatting
            const segments = splitTextByFormatting(displayText);
            let currentX = leftMargin;
            const lineMaxX = margin + maxWidth;
            
            for (const segment of segments) {
              // Check if we need a new page
              if (y + fontSize * 0.6 > pageHeight) {
                doc.addPage();
                y = 10;
                currentX = leftMargin;
              }
              
              // Set font for this segment
              if (segment.style === 'code') {
                doc.setFont('Courier', 'normal');
              } else {
                doc.setFont('Helvetica', segment.style === 'bold' ? 'bold' : segment.style === 'italic' ? 'italic' : 'normal');
              }
              
              // Split segment into words for proper wrapping
              const words = segment.text.split(' ');
              
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const wordWithSpace = i < words.length - 1 ? word + ' ' : word;
                const wordWidth = doc.getTextWidth(wordWithSpace);
                
                // Check if word fits on current line
                if (currentX + wordWidth > lineMaxX) {
                  // Word doesn't fit, move to next line
                  y += fontSize * 0.5;
                  currentX = leftMargin;
                  
                  // Check page overflow
                  if (y + fontSize * 0.6 > pageHeight) {
                    doc.addPage();
                    y = 10;
                    currentX = leftMargin;
                  }
                }
                
                // For inline code, draw tight background with rounded corners
                if (segment.style === 'code') {
                  const padding = 1;
                  // Reduced top padding and minimal height
                  const bgHeight = fontSize * 0.5;
                  const bgY = y - fontSize * 0.35; // Reduced from 0.4 to 0.35 for less top padding
                  const bgX = currentX - padding;
                  const bgWidth = wordWidth + padding * 2;
                  const radius = 1; // subtle rounded corner radius
                  
                  // Use custom inline code background color
                  const inlineCodeBg = hexToRgb(inlineCodeBgColor);
                  doc.setFillColor(inlineCodeBg.r, inlineCodeBg.g, inlineCodeBg.b);
                  // Draw rounded rectangle using lines and arcs
                  doc.roundedRect(bgX, bgY, bgWidth, bgHeight, radius, radius, 'F');
                }
                
                // Use custom inline code text color if this is code
                if (segment.style === 'code') {
                  const inlineCodeText = hexToRgb(inlineCodeTextColor);
                  doc.setTextColor(inlineCodeText.r, inlineCodeText.g, inlineCodeText.b);
                }
                
                // Render the word
                doc.text(wordWithSpace, currentX, y);
                
                // Reset text color if it was code
                if (segment.style === 'code') {
                  doc.setTextColor(0, 0, 0);
                }
                currentX += wordWidth;
              }
            }
            
            // Move to next line after finishing all segments
            y += fontSize * 0.5;
            
            // Draw quote border if element is a quote
            if (element.type === 'quote') {
              const quoteHeight = y - startY + 2;
              doc.setDrawColor(100, 100, 100);
              doc.setLineWidth(2);
              doc.line(margin + 2, startY - fontSize * 0.7, margin + 2, startY - fontSize * 0.7 + quoteHeight);
            }
          } else {
            // No inline formatting, use original approach
            const cleanText = stripMarkdownSyntax(displayText);
            const lines = doc.splitTextToSize(cleanText, maxWidth - (leftMargin - margin));
            
            // Track starting position for quote border
            startY = y;
            
            for (const line of lines) {
              if (y + fontSize * 0.6 > pageHeight) {
                doc.addPage();
                y = 10;
                startY = y;
              }
              
              doc.text(line, leftMargin, y);
              y += fontSize * 0.5;
            }
            
            // Draw quote border if element is a quote
            if (element.type === 'quote') {
              const quoteHeight = y - startY + 2;
              doc.setDrawColor(100, 100, 100);
              doc.setLineWidth(2);
              doc.line(margin + 2, startY - fontSize * 0.7, margin + 2, startY - fontSize * 0.7 + quoteHeight);
            }
          }
          
          if (element.type === 'h1' || element.type === 'h2' || element.type === 'h3' || element.type === 'h4') {
            y += 3;
          } else {
            y += 2;
          }
        }

        filename = `${customFilename}.pdf`;
        fileContent = doc.output('datauristring').split(',')[1];
      } else if (format === 'json') {
        const { firstH1, content: parsedContent } = parseMarkdownForJson(content);
        const jsonContent: { [key: string]: any } = { [taskTitle || 'Document']: firstH1 || 'Untitled' };
        Object.assign(jsonContent, parsedContent);
        fileContent = JSON.stringify(jsonContent, null, 2);
        filename = `${customFilename}.json`;
      }

      // Save to database only
      const data = await supabase
        .from('ai_user_settings')
        .select('files')
        .eq('user_id', userId)
        .single();

      const { error: settingsError } = data;
      if (settingsError) {
        throw new Error('Failed to fetch user settings: ' + settingsError.message);
      }

      const existingFiles = Array.isArray(data?.data?.files) ? data.data.files : [];
      const newFile = {
        filename,
        format,
        content: fileContent,
        created_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: [...existingFiles, newFile] })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to save file to database: ' + updateError.message);
      }

      setError(null);
      setShowFilenameForm(null);
      // Show success message
      toast.success(`File saved successfully to /account/files!`);
    } catch (err: any) {
      console.error('[ChatMessages] Save file error:', err);
      toast.error(err.message || `Failed to save file`);
    }
  }, [accessToken, userId, messages, toast]);

  const downloadFileToLocal = useCallback(async (content: string, index: number, format: 'txt' | 'pdf' | 'json' | 'md', customFilename: string) => {
    try {
      const textContent = content.replace(/<[^>]+>/g, '');
      const taskTitle = messages[index].taskName || '';
      let fileContent: string = '';
      let filename: string = '';
      let mimeType: string = '';

      if (format === 'txt') {
        fileContent = taskTitle ? `${taskTitle}\n\n${textContent}` : textContent;
        filename = `${customFilename}.txt`;
        mimeType = 'text/plain';
      } else if (format === 'md') {
        fileContent = taskTitle ? `# ${taskTitle}\n\n${textContent}` : textContent;
        filename = `${customFilename}.md`;
        mimeType = 'text/markdown';
      } else if (format === 'pdf') {
        const doc = new jsPDF();
        let y = 10;
        const pageHeight = 277;
        const margin = 10;
        const maxWidth = 190;

        if (taskTitle) {
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(10);
          const taskLines = doc.splitTextToSize(taskTitle, maxWidth);
          doc.text(taskLines, margin, y);
          y += taskLines.length * 6 + 4;
        }

        const elements = parseMarkdownForPdf(textContent);
        
        for (const element of elements) {
          let fontSize = 12;
          let fontStyle: 'normal' | 'bold' | 'italic' = 'normal';
          let leftMargin = margin;
          
          // Handle horizontal rules
          if (element.type === 'horizontal-rule') {
            y += 4;
            
            if (y + 2 > pageHeight) {
              doc.addPage();
              y = 10;
            }
            
            doc.setLineWidth(0.5);
            doc.setDrawColor(150, 150, 150);
            doc.line(margin, y, margin + maxWidth, y);
            
            y += 6;
            continue;
          }
          
          switch (element.type) {
            case 'h1':
              fontSize = 18;
              fontStyle = 'bold';
              break;
            case 'h2':
              fontSize = 16;
              fontStyle = 'bold';
              break;
            case 'h3':
              fontSize = 14;
              fontStyle = 'bold';
              break;
            case 'h4':
              fontSize = 13;
              fontStyle = 'bold';
              break;
            case 'list-item':
              leftMargin = margin + 5;
              break;
            case 'quote':
              leftMargin = margin + 5;
              fontStyle = 'italic';
              break;
            case 'code-block':
              fontSize = 10;
              leftMargin = margin + 3;
              break;
          }

          doc.setFontSize(fontSize);
          
          if (element.type === 'code-block') {
            const codeLines = element.text.split('\n');
            const lineHeight = fontSize * 0.5;
            
            // Calculate available width for code block
            const codeBlockWidth = maxWidth - (leftMargin - margin) - 4;
            
            // Process each line and wrap if necessary
            const wrappedLines: string[] = [];
            doc.setFont('Courier', 'normal');
            
            for (const line of codeLines) {
              const lineWidth = doc.getTextWidth(line);
              if (lineWidth > codeBlockWidth) {
                // Line is too long, need to wrap it
                const wrapped = doc.splitTextToSize(line, codeBlockWidth);
                wrappedLines.push(...wrapped);
              } else {
                wrappedLines.push(line);
              }
            }
            
            const blockHeight = wrappedLines.length * lineHeight + 4;
            
            if (y + blockHeight > pageHeight) {
              doc.addPage();
              y = 10;
            }
            
            // Use custom code block background color
            const codeBlockBg = hexToRgb(codeBlockBgColor);
            doc.setFillColor(codeBlockBg.r, codeBlockBg.g, codeBlockBg.b);
            // Use rounded rectangle for code blocks with 1px radius
            doc.roundedRect(leftMargin - 2, y - 3, codeBlockWidth + 4, blockHeight, 1, 1, 'F');
            
            // Use custom code block text color
            const codeBlockText = hexToRgb(codeBlockTextColor);
            doc.setTextColor(codeBlockText.r, codeBlockText.g, codeBlockText.b);
            
            for (const line of wrappedLines) {
              doc.text(line, leftMargin, y);
              y += lineHeight;
            }
            
            // Reset text color to black for other content
            doc.setTextColor(0, 0, 0);
            y += 4;
            continue;
          }
          
          doc.setFont('Helvetica', fontStyle);
          
          if (element.type === 'h1') {
            y += 10;
          } else if (element.type === 'h2') {
            y += 8;
          } else if (element.type === 'h3') {
            y += 6;
          } else if (element.type === 'h4') {
            y += 5;
          }
          
          // Handle text with inline formatting
          const displayText = element.type === 'list-item' ? `• ${element.text}` : element.text;
          
          // Check if element has inline formatting
          const hasInlineFormatting = element.text.includes('**') || element.text.includes('*') || element.text.includes('`');
          
          // Track starting Y position for quote borders
          let startY = y;
          
          if (hasInlineFormatting && element.type !== 'h1' && element.type !== 'h2' && element.type !== 'h3' && element.type !== 'h4') {
            // Split into segments with formatting
            const segments = splitTextByFormatting(displayText);
            let currentX = leftMargin;
            const lineMaxX = margin + maxWidth;
            
            for (const segment of segments) {
              // Check if we need a new page
              if (y + fontSize * 0.6 > pageHeight) {
                doc.addPage();
                y = 10;
                currentX = leftMargin;
              }
              
              // Set font for this segment
              if (segment.style === 'code') {
                doc.setFont('Courier', 'normal');
              } else {
                doc.setFont('Helvetica', segment.style === 'bold' ? 'bold' : segment.style === 'italic' ? 'italic' : 'normal');
              }
              
              // Split segment into words for proper wrapping
              const words = segment.text.split(' ');
              
              for (let i = 0; i < words.length; i++) {
                const word = words[i];
                const wordWithSpace = i < words.length - 1 ? word + ' ' : word;
                const wordWidth = doc.getTextWidth(wordWithSpace);
                
                // Check if word fits on current line
                if (currentX + wordWidth > lineMaxX) {
                  // Word doesn't fit, move to next line
                  y += fontSize * 0.5;
                  currentX = leftMargin;
                  
                  // Check page overflow
                  if (y + fontSize * 0.6 > pageHeight) {
                    doc.addPage();
                    y = 10;
                    currentX = leftMargin;
                  }
                }
                
                // For inline code, draw tight background with rounded corners
                if (segment.style === 'code') {
                  const padding = 1;
                  // Reduced top padding and minimal height
                  const bgHeight = fontSize * 0.5;
                  const bgY = y - fontSize * 0.35; // Reduced from 0.4 to 0.35 for less top padding
                  const bgX = currentX - padding;
                  const bgWidth = wordWidth + padding * 2;
                  const radius = 1; // subtle rounded corner radius
                  
                  // Use custom inline code background color
                  const inlineCodeBg = hexToRgb(inlineCodeBgColor);
                  doc.setFillColor(inlineCodeBg.r, inlineCodeBg.g, inlineCodeBg.b);
                  // Draw rounded rectangle using lines and arcs
                  doc.roundedRect(bgX, bgY, bgWidth, bgHeight, radius, radius, 'F');
                }
                
                // Use custom inline code text color if this is code
                if (segment.style === 'code') {
                  const inlineCodeText = hexToRgb(inlineCodeTextColor);
                  doc.setTextColor(inlineCodeText.r, inlineCodeText.g, inlineCodeText.b);
                }
                
                // Render the word
                doc.text(wordWithSpace, currentX, y);
                
                // Reset text color if it was code
                if (segment.style === 'code') {
                  doc.setTextColor(0, 0, 0);
                }
                currentX += wordWidth;
              }
            }
            
            // Move to next line after finishing all segments
            y += fontSize * 0.5;
            
            // Draw quote border if element is a quote
            if (element.type === 'quote') {
              const quoteHeight = y - startY + 2;
              doc.setDrawColor(100, 100, 100);
              doc.setLineWidth(2);
              doc.line(margin + 2, startY - fontSize * 0.7, margin + 2, startY - fontSize * 0.7 + quoteHeight);
            }
          } else {
            // No inline formatting, use original approach
            const cleanText = stripMarkdownSyntax(displayText);
            const lines = doc.splitTextToSize(cleanText, maxWidth - (leftMargin - margin));
            
            // Track starting position for quote border
            startY = y;
            
            for (const line of lines) {
              if (y + fontSize * 0.6 > pageHeight) {
                doc.addPage();
                y = 10;
                startY = y;
              }
              
              doc.text(line, leftMargin, y);
              y += fontSize * 0.5;
            }
            
            // Draw quote border if element is a quote
            if (element.type === 'quote') {
              const quoteHeight = y - startY + 2;
              doc.setDrawColor(100, 100, 100);
              doc.setLineWidth(2);
              doc.line(margin + 2, startY - fontSize * 0.7, margin + 2, startY - fontSize * 0.7 + quoteHeight);
            }
          }
          
          if (element.type === 'h1' || element.type === 'h2' || element.type === 'h3' || element.type === 'h4') {
            y += 3;
          } else {
            y += 2;
          }
        }

        filename = `${customFilename}.pdf`;
        doc.save(filename);
        setShowDownloadModal(null);
        toast.success('PDF downloaded successfully!');
        return;
      } else if (format === 'json') {
        const { firstH1, content: parsedContent } = parseMarkdownForJson(content);
        const jsonContent: { [key: string]: any } = { [taskTitle || 'Document']: firstH1 || 'Untitled' };
        Object.assign(jsonContent, parsedContent);
        fileContent = JSON.stringify(jsonContent, null, 2);
        filename = `${customFilename}.json`;
        mimeType = 'application/json';
      }

      // Download for non-PDF formats
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowDownloadModal(null);
      toast.success(`${format.toUpperCase()} file downloaded successfully!`);
    } catch (err: any) {
      console.error('[ChatMessages] Download file error:', err);
      toast.error(err.message || `Failed to download file`);
    }
  }, [messages, toast]);

  return (
    <div className={`flex-1 overflow-y-auto p-2 sm:p-6 space-y-4 ${isFullscreen ? styles.centeredMessages : ''}`}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
        >
          <div
            className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-2xl rounded-tr-sm shadow-md px-4 py-3'
                : 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3'
            } relative group hover:shadow-lg transition-all duration-200`}
          >
            <div className="flex mb-2.5 justify-end gap-1 sticky top-0 z-10 py-1 -mt-1">
              {msg.role === 'assistant' && (
                <>
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                    <Tooltip variant="info-top" content="Save to Files">
                      <button
                        onClick={() => openFilenameForm(index, 'md')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
                        aria-label="Save to files"
                      >
                        <ArrowDownOnSquareIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Download to Computer">
                      <button
                        onClick={() => openDownloadModal(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label="Download to computer"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Preview">
                      <button
                        onClick={() => openPreviewModal(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-green-600 hover:bg-green-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                        aria-label="Preview message"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Edit">
                      <button
                        onClick={() => openEditModal(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-opacity-50"
                        aria-label="Edit message"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Delete">
                      <button
                        onClick={() => handleDeleteMessage(index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        aria-label="Delete message"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </>
              )}
              {msg.role === 'user' && (
                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                  <Tooltip variant="info-top" content="Delete">
                    <button
                      onClick={() => handleDeleteMessage(index)}
                      className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-opacity-50"
                      aria-label="Delete message"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className="overflow-y-auto prose prose-sm max-w-none dark:prose-invert">
              {msg.role === 'assistant' && msg.taskName && (
                <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{msg.taskName}</span>
                </div>
              )}
              {msg.role === 'assistant' ? (
                <div className="text-slate-800 dark:text-slate-200 leading-relaxed">
                  <ReactMarkdown>{msg.content.replace(/<[^>]+>/g, '')}</ReactMarkdown>
                </div>
              ) : (
                <div>
                  {/* Display attached files if any */}
                  {msg.attachedFileIds && msg.attachedFileIds.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-white/20">
                      {(() => {
                        const currentIndex = previewFileIndex[index] || 0;
                        const currentFileId = msg.attachedFileIds[currentIndex];
                        const currentFile = fileDetails[currentFileId];
                        const isLoading = loadingFiles.has(currentFileId);

                        // Fetch file details if not already loaded
                        if (!currentFile && !isLoading) {
                          fetchFileDetails(currentFileId);
                        }

                        // Check if current file can be previewed
                        const showPreview = currentFile && canPreviewFile(currentFile.mime_type);

                        return (
                          <div className="space-y-2">
                            {/* File Preview */}
                            {showPreview && (
                              <div 
                                className="relative bg-black/20 rounded-lg overflow-hidden cursor-pointer group/preview"
                                onDoubleClick={() => openFullscreenPreview(currentFileId, index)}
                                title="Double-click to view fullscreen"
                              >
                                {currentFile.mime_type?.startsWith('image/') ? (
                                  <img
                                    src={currentFile.url}
                                    alt={currentFile.file_name}
                                    className="w-full max-h-64 object-contain"
                                    loading="lazy"
                                  />
                                ) : currentFile.mime_type === 'application/pdf' ? (
                                  <div className="w-full h-64 flex items-center justify-center">
                                    <iframe
                                      src={currentFile.url}
                                      className="w-full h-full"
                                      title={currentFile.file_name}
                                    />
                                  </div>
                                ) : null}
                                
                                {/* Fullscreen button - visible on mobile, hover on desktop */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openFullscreenPreview(currentFileId, index);
                                  }}
                                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-all z-10 sm:opacity-0 sm:group-hover/preview:opacity-100"
                                  title="View fullscreen"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                  </svg>
                                </button>
                                
                                {/* Fullscreen hint overlay - desktop only */}
                                <div className="hidden sm:flex absolute inset-0 bg-black/0 group-hover/preview:bg-black/30 transition-all items-center justify-center opacity-0 group-hover/preview:opacity-100">
                                  <div className="bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg text-white text-sm">
                                    Double-click to enlarge
                                  </div>
                                </div>
                                
                                {/* Navigation arrows for multiple files */}
                                {msg.attachedFileIds.length > 1 && (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigateFile(index, 'prev', msg.attachedFileIds!.length);
                                      }}
                                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                                      title="Previous file"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigateFile(index, 'next', msg.attachedFileIds!.length);
                                      }}
                                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                                      title="Next file"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                    {/* File counter */}
                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full z-10">
                                      {currentIndex + 1} / {msg.attachedFileIds.length}
                                    </div>
                                  </>
                                )}
                              </div>
                            )}

                            {/* File Info Bar */}
                            <div className="flex flex-wrap gap-1.5">
                              {msg.attachedFileIds.map((fileId, idx) => {
                                const file = fileDetails[fileId];
                                const isFileLoading = loadingFiles.has(fileId);
                                const FileIcon = getFileIcon(file?.mime_type);
                                const isActive = idx === currentIndex;

                                // Fetch file details if not already loaded
                                if (!file && !isFileLoading) {
                                  fetchFileDetails(fileId);
                                }

                                return (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      if (msg.attachedFileIds!.length > 1) {
                                        setPreviewFileIndex(prev => ({ ...prev, [index]: idx }));
                                      } else if (file) {
                                        handleDownloadAttachment(fileId);
                                      }
                                    }}
                                    disabled={!file}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                                      isActive 
                                        ? 'bg-white/30 ring-2 ring-white/40' 
                                        : 'bg-white/10 hover:bg-white/20'
                                    } ${
                                      file 
                                        ? 'cursor-pointer active:scale-95' 
                                        : 'opacity-50 cursor-wait'
                                    }`}
                                    title={
                                      msg.attachedFileIds!.length > 1 
                                        ? `Click to preview ${file?.file_name || 'file'}` 
                                        : file 
                                        ? `Click to download ${file.file_name}` 
                                        : 'Loading file details...'
                                    }
                                  >
                                    <FileIcon className="h-3.5 w-3.5 flex-shrink-0" />
                                    {isFileLoading ? (
                                      <span className="opacity-70">Loading...</span>
                                    ) : file ? (
                                      <div className="flex items-center gap-2">
                                        <span className="opacity-90 font-medium truncate max-w-[150px]">
                                          {file.file_name}
                                        </span>
                                        <span className="opacity-60 text-[10px]">
                                          ({formatFileSize(file.file_size)})
                                        </span>
                                        {msg.attachedFileIds!.length === 1 && (
                                          <ArrowDownTrayIcon className="h-3 w-3 opacity-70" />
                                        )}
                                      </div>
                                    ) : (
                                      <span className="opacity-70">File attached</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className="text-white whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm px-4 py-3 max-w-[85%] sm:max-w-[75%] lg:max-w-[65%]">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
              <span className="text-sm text-slate-500 font-medium">Thinking...</span>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
      <SaveFileModal
        isOpen={showFilenameForm !== null}
        onClose={() => setShowFilenameForm(null)}
        onSave={handleSaveFile}
        defaultFilename={defaultFilename}
        modalType="save"
      />

      {/* Download Modal */}
      <SaveFileModal
        isOpen={showDownloadModal !== null}
        onClose={() => setShowDownloadModal(null)}
        onSave={handleDownloadFile}
        defaultFilename={defaultFilename}
        modalType="download"
      />

      {/* Preview Modal */}
      {showPreviewModal !== null && createPortal(
        <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
          <div 
            style={{ 
              zIndex: 10000011, 
              maxWidth: '800px',
              width: '95vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '1rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden'
            }}
            className="dark:bg-gray-900/50"
          >
            <div 
              style={{ 
                flexShrink: 0,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'rgba(255, 255, 255, 0.3)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem 1rem 0 0'
              }}
              className="dark:bg-gray-900/30 dark:border-slate-700/50"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                    <h2 className={styles.modalTitle}>Preview</h2>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPreviewFormat('md')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${previewFormat === 'md' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                    >
                      .md
                    </button>
                    <button
                      onClick={() => setPreviewFormat('txt')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${previewFormat === 'txt' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                    >
                      .txt
                    </button>
                    <button
                      onClick={() => setPreviewFormat('pdf')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${previewFormat === 'pdf' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                    >
                      .pdf
                    </button>
                    <button
                      onClick={() => setPreviewFormat('json')}
                      className={`px-2 py-1 text-xs rounded transition-colors ${previewFormat === 'json' ? 'bg-blue-500/30 text-blue-700 dark:text-blue-300' : 'bg-white/20 hover:bg-white/30 text-slate-600 dark:text-slate-300'}`}
                    >
                      .json
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreviewModal(null)}
                  className={styles.modalCloseButton}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              <div className="max-h-full overflow-y-auto bg-white/30 dark:bg-slate-800/30 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  {previewFormat === 'md' && (
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{previewContent}</ReactMarkdown>
                    </div>
                  )}
                  {previewFormat === 'txt' && (
                    <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                      {previewContent}
                    </pre>
                  )}
                  {previewFormat === 'json' && (
                    <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                      {(() => {
                        const { firstH1, content: parsedContent } = parseMarkdownForJson(previewContent);
                        const taskTitle = showPreviewModal !== null ? messages[showPreviewModal].taskName || '' : '';
                        const jsonContent: { [key: string]: any } = { [taskTitle || 'Document']: firstH1 || 'Untitled' };
                        Object.assign(jsonContent, parsedContent);
                        return JSON.stringify(jsonContent, null, 2);
                      })()}
                    </pre>
                  )}
                  {previewFormat === 'pdf' && (
                    <div className="space-y-4">
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        {parseMarkdownForPdf(previewContent).map((element, idx) => {
                          if (element.type === 'horizontal-rule') {
                            return (
                              <hr key={idx} className="my-4 border-t-2 border-slate-300 dark:border-slate-600" />
                            );
                          }
                          
                          const displayText = element.type === 'list-item' ? element.text : element.text;
                          const hasInlineFormatting = element.text.includes('**') || element.text.includes('*') || element.text.includes('`');
                          
                          return (
                            <div key={idx} className={`
                              ${element.type === 'h1' ? 'text-xl font-bold mt-4 mb-2' : ''}
                              ${element.type === 'h2' ? 'text-lg font-bold mt-6 mb-2' : ''}
                              ${element.type === 'h3' ? 'text-base font-bold mt-4 mb-2' : ''}
                              ${element.type === 'h4' ? 'text-sm font-bold mt-3 mb-2' : ''}
                              ${element.type === 'paragraph' ? 'text-sm mb-2' : ''}
                              ${element.type === 'list-item' ? 'text-sm ml-4 mb-1' : ''}
                              ${element.type === 'quote' ? 'text-sm italic ml-4 mb-2 border-l-4 border-slate-400 dark:border-slate-500 pl-3' : ''}
                              ${element.type === 'code-block' ? 'text-xs font-mono bg-slate-100 dark:bg-slate-700 p-3 rounded mb-2 whitespace-pre-wrap' : ''}
                            `}>
                              {element.type === 'list-item' && '• '}
                              {element.type === 'code-block' ? (
                                element.text
                              ) : hasInlineFormatting && element.type !== 'h1' && element.type !== 'h2' && element.type !== 'h3' && element.type !== 'h4' ? (
                                renderFormattedText(displayText)
                              ) : (
                                stripMarkdownSyntax(displayText)
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Modal */}
      {showEditModal !== null && createPortal(
        <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
          <div 
            style={{ 
              zIndex: 10000011, 
              maxWidth: '1200px', 
              width: '95vw',
              height: '90vh', 
              display: 'flex', 
              flexDirection: 'column',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '1rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
              overflow: 'hidden'
            }}
            className="dark:bg-gray-900/50"
          >
            {/* Fixed Header */}
            <div 
              style={{ 
                flexShrink: 0,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                background: 'rgba(255, 255, 255, 0.3)',
                borderBottom: '1px solid rgba(226, 232, 240, 0.5)',
                padding: '0.75rem 1.5rem',
                borderRadius: '1rem 1rem 0 0'
              }}
              className="dark:bg-gray-900/30 dark:border-slate-700/50"
            >
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-2">
                  <PencilIcon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  <h2 className={styles.modalTitle}>Edit</h2>
                </div>
                <button
                  onClick={() => setShowEditModal(null)}
                  className={styles.modalCloseButton}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Markdown Toolbar Panel */}
            <div className="px-4 sm:px-6 pt-4 pb-2 border-b border-white/20" style={{ flexShrink: 0, overflowX: 'auto' }}>
              <div className="flex flex-wrap gap-1 p-2 backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 rounded-lg border border-slate-300/50 dark:border-slate-600/50 min-w-max sm:min-w-0">
                {/* Headings */}
                <button
                  onClick={() => insertHeading(1)}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Heading 1"
                >
                  <span className="font-bold text-sm">H1</span>
                </button>
                <button
                  onClick={() => insertHeading(2)}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Heading 2"
                >
                  <span className="font-bold text-sm">H2</span>
                </button>
                <button
                  onClick={() => insertHeading(3)}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Heading 3"
                >
                  <span className="font-bold text-sm">H3</span>
                </button>
                
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                
                {/* Text Formatting */}
                <button
                  onClick={() => insertMarkdown('**', '**', 'bold text')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Bold"
                >
                  <span className="font-bold">B</span>
                </button>
                <button
                  onClick={() => insertMarkdown('*', '*', 'italic text')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Italic"
                >
                  <span className="italic">I</span>
                </button>
                <button
                  onClick={() => insertMarkdown('~~', '~~', 'strikethrough')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Strikethrough"
                >
                  <span className="line-through">S</span>
                </button>
                <button
                  onClick={() => insertMarkdown('`', '`', 'code')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Inline Code"
                >
                  <CodeBracketIcon className="h-4 w-4" />
                </button>
                
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                
                {/* Lists */}
                <button
                  onClick={() => insertList(false)}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Bullet List"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => insertList(true)}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Numbered List"
                >
                  <Bars3BottomLeftIcon className="h-4 w-4" />
                </button>
                
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                
                {/* Links & Images */}
                <button
                  onClick={() => insertMarkdown('[', '](url)', 'link text')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Link"
                >
                  <LinkIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => insertMarkdown('![', '](url)', 'alt text')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Image"
                >
                  <PhotoIcon className="h-4 w-4" />
                </button>
                
                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                
                {/* Quote & Code Block */}
                <button
                  onClick={() => insertMarkdown('> ', '', 'quote')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Quote"
                >
                  <span className="font-bold">"</span>
                </button>
                <button
                  onClick={() => insertMarkdown('```\n', '\n```', 'code block')}
                  className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                  title="Code Block"
                >
                  <CodeBracketIcon className="h-4 w-4" />
                </button>
                
                <div className="hidden sm:block flex-1"></div>
                
                {/* Color Pickers */}
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-slate-300 dark:border-slate-600">
                  <span className="text-xs text-slate-600 dark:text-slate-400 hidden sm:inline">Colors:</span>
                  <div className="flex gap-1">
                    <input
                      type="color"
                      value={inlineCodeBgColor}
                      onChange={(e) => setInlineCodeBgColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600"
                      title="Inline Code Background"
                    />
                    <input
                      type="color"
                      value={inlineCodeTextColor}
                      onChange={(e) => setInlineCodeTextColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600"
                      title="Inline Code Text"
                    />
                    <input
                      type="color"
                      value={codeBlockBgColor}
                      onChange={(e) => setCodeBlockBgColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600"
                      title="Code Block Background"
                    />
                    <input
                      type="color"
                      value={codeBlockTextColor}
                      onChange={(e) => setCodeBlockTextColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer border border-slate-300 dark:border-slate-600"
                      title="Code Block Text"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Scrollable Body */}
            <div 
              className="flex-1 px-4 sm:px-6 py-4" 
              style={{ 
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1" style={{ minHeight: 0 }}>
                <div className="flex flex-col" style={{ minHeight: 0 }}>
                  <h3 className={styles.modalSectionTitle} style={{ flexShrink: 0, marginBottom: '0.5rem' }}>Editor</h3>
                  <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 w-full px-4 py-3 bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/20 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Edit your markdown content here..."
                    style={{ minHeight: 0, height: '100%' }}
                  />
                </div>
                
                <div className="flex flex-col" style={{ minHeight: 0 }}>
                  <h3 className={styles.modalSectionTitle} style={{ flexShrink: 0, marginBottom: '0.5rem' }}>Preview</h3>
                  <div 
                    className="flex-1 overflow-y-auto bg-white/30 dark:bg-slate-800/30 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-3" 
                    style={{ minHeight: 0, height: '100%' }}
                  >
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown>{editContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Bottom Panel with Buttons */}
            <div 
              className="px-4 sm:px-6 py-4 border-t border-white/20 bg-white/10 dark:bg-slate-800/10" 
              style={{ 
                flexShrink: 0,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)'
              }}
            >
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowEditModal(null)}
                  className={styles.modalBadge}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className={`${styles.modalBadge} ${styles.selected}`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen File Preview Modal */}
      {fullscreenFile && (() => {
        const messageIndex = fullscreenFile.messageIndex;
        const currentIndex = previewFileIndex[messageIndex] || 0;
        const message = messages[messageIndex];
        const fileIds = message.attachedFileIds || [];
        const currentFileId = fileIds[currentIndex];
        const currentFile = fileDetails[currentFileId];

        return createPortal(
          <div 
            className="fixed inset-0 z-[10000003] bg-black/95 flex items-center justify-center"
            onClick={closeFullscreenPreview}
          >
            {/* Close button */}
            <button
              onClick={closeFullscreenPreview}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
              title="Close (Esc)"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {/* Download button */}
            {currentFile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadAttachment(currentFileId);
                }}
                className="absolute top-4 right-16 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                title="Download"
              >
                <ArrowDownTrayIcon className="w-6 h-6" />
              </button>
            )}

            {/* File info */}
            {currentFile && (
              <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg text-white">
                <div className="text-sm font-medium">{currentFile.file_name}</div>
                <div className="text-xs text-white/70">{formatFileSize(currentFile.file_size)}</div>
              </div>
            )}

            {/* Navigation arrows for multiple files */}
            {fileIds.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateFullscreen('prev', messageIndex, fileIds.length);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                  title="Previous file (←)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateFullscreen('next', messageIndex, fileIds.length);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
                  title="Next file (→)"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* File counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                  {currentIndex + 1} / {fileIds.length}
                </div>
              </>
            )}

            {/* Main content */}
            <div 
              className="max-w-[95vw] max-h-[95vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {currentFile ? (
                currentFile.mime_type?.startsWith('image/') ? (
                  <img
                    src={currentFile.url}
                    alt={currentFile.file_name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : currentFile.mime_type === 'application/pdf' ? (
                  <iframe
                    src={currentFile.url}
                    className="w-[90vw] h-[90vh] bg-white rounded-lg"
                    title={currentFile.file_name}
                  />
                ) : null
              ) : (
                <div className="text-white">Loading...</div>
              )}
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}