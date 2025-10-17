'use client';
import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { CheckIcon, ClipboardIcon, DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Message, ChatMessagesProps } from './types';
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

export default function ChatMessages({ messages, isTyping, isFullscreen, setError, accessToken, userId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [showFilenameForm, setShowFilenameForm] = useState<number | null>(null);
  const [currentMessageIndex, setCurrentMessageIndex] = useState<number | null>(null);
  const [defaultFilename, setDefaultFilename] = useState<string>('');

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
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('[ChatMessages] Copy error:', err);
      setError('Failed to copy message');
    }
  };

  const openFilenameForm = (index: number, format: 'txt' | 'pdf' | 'json') => {
    const filename = getDefaultFilename(messages[index].content, index);
    setDefaultFilename(filename);
    setCurrentMessageIndex(index);
    setShowFilenameForm(index);
  };

  const handleSaveFile = (filename: string, format: 'txt' | 'pdf' | 'json') => {
    if (currentMessageIndex !== null) {
      saveFile(messages[currentMessageIndex].content, currentMessageIndex, format, filename);
    }
  };

  const saveFile = useCallback(async (content: string, index: number, format: 'txt' | 'pdf' | 'json', customFilename: string) => {
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
        const blob = new Blob([fileContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
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

        const elements = parseHtmlForPdf(content);
        for (const element of elements) {
          const fontSize = element.isHeading
            ? element.level === 1
              ? 16
              : element.level === 2
              ? 14
              : 12
            : 12;
          doc.setFont('Helvetica', element.isHeading ? 'bold' : 'normal');
          doc.setFontSize(fontSize);

          const lines = doc.splitTextToSize(element.text, maxWidth);
          for (const line of lines) {
            if (y + fontSize * 0.6 > pageHeight) {
              doc.addPage();
              y = 10;
            }
            doc.text(line, margin, y);
            y += fontSize * 0.6;
          }
          y += 2;
        }

        filename = `${customFilename}.pdf`;
        fileContent = doc.output('datauristring').split(',')[1];
        doc.save(filename);
      } else if (format === 'json') {
        const { firstH1, content: parsedContent } = parseHtmlForJson(content);
        const jsonContent: { [key: string]: any } = { [taskTitle || 'Document']: firstH1 || 'Untitled' };
        Object.assign(jsonContent, parsedContent);
        fileContent = JSON.stringify(jsonContent, null, 2);
        filename = `${customFilename}.json`;
        const blob = new Blob([fileContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

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
    } catch (err: any) {
      console.error('[ChatMessages] Save file error:', err);
      setError(err.message || `Failed to save message to ${format} file`);
    }
  }, [accessToken, userId, messages, setError]);

  return (
    <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${isFullscreen ? styles.centeredMessages : ''}`}>
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
            <div className="flex mb-2.5 justify-end gap-1">
              {msg.role === 'assistant' && (
                <>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Tooltip variant="info-top" content="Copy Message">
                      <button
                        onClick={() => copyMessage(msg.content, index)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label="Copy message"
                      >
                        {copiedMessageId === index ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : (
                          <ClipboardIcon className="h-4 w-4" />
                        )}
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Save as Text">
                      <button
                        onClick={() => openFilenameForm(index, 'txt')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label="Save message as text"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Save as PDF">
                      <button
                        onClick={() => openFilenameForm(index, 'pdf')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label="Save message as PDF"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Save as JSON">
                      <button
                        onClick={() => openFilenameForm(index, 'json')}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                        aria-label="Save message as JSON"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </>
              )}
            </div>
            <div className="overflow-y-auto prose prose-sm max-w-none">
              {msg.role === 'assistant' && msg.taskName && (
                <div className="inline-flex items-center gap-2 mb-3 px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-full">
                  <span className="text-xs font-medium text-blue-700">{msg.taskName}</span>
                </div>
              )}
              <div
                className={`${msg.role === 'user' ? 'text-white whitespace-pre-wrap leading-relaxed' : 'text-slate-800 leading-relaxed'}`}
                dangerouslySetInnerHTML={{
                  __html: msg.role === 'assistant' ? msg.content : msg.content.replace(/\n/g, '<br>'),
                }}
              />
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
      />
    </div>
  );
}