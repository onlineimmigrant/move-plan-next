'use client';
import { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import { CheckIcon, ClipboardIcon, DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Message, ChatMessagesProps } from './types';
import styles from './ChatWidget.module.css';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';

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
  const [filenameInput, setFilenameInput] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'txt' | 'pdf' | 'json'>('txt');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showFilenameForm !== null) {
        setShowFilenameForm(null);
        setFilenameInput('');
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
    const defaultFilename = getDefaultFilename(messages[index].content, index);
    setFilenameInput(defaultFilename);
    setFileFormat(format);
    setShowFilenameForm(index);
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
      setFilenameInput('');
    } catch (err: any) {
      console.error('[ChatMessages] Save file error:', err);
      setError(err.message || `Failed to save message to ${format} file`);
    }
  }, [accessToken, userId, messages, setError, setShowFilenameForm, setFilenameInput]);

  return (
    <div className={`flex-1 overflow-y-auto mb-4 p-4 ${isFullscreen ? styles.centeredMessages : ''}`}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`mb-2 mx-auto max-w-4xl ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div
            className={`relative inline-block p-4 rounded ${
              msg.role === 'user' ? 'bg-sky-100' : 'bg-gray-50 px-8 sm:px-12 pb-16 rounded-xl border border-gray-100'
            }`}
          >
            <div className="flex mb-2 sticky top-0 justify-end">
              {msg.role === 'assistant' && (
                <>
                  <div className="space-x-2 opacity-90 z-10 bg-gray-50">
                    <Tooltip variant="info-top" content="Copy Message">
                      <button
                        onClick={() => copyMessage(msg.content, index)}
                        className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-500"
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
                        className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-500"
                        aria-label="Save message as text"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Save as PDF">
                      <button
                        onClick={() => openFilenameForm(index, 'pdf')}
                        className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-500"
                        aria-label="Save message as PDF"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                    <Tooltip variant="info-top" content="Save as JSON">
                      <button
                        onClick={() => openFilenameForm(index, 'json')}
                        className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-500"
                        aria-label="Save message as JSON"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                  {showFilenameForm === index && (
                    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50">
                      <div className="p-4 bg-white border-2 rounded-lg shadow-md border-gray-200 transition-all duration-300 max-w-md w-full">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Save File</h3>
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={filenameInput}
                            onChange={(e) => setFilenameInput(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent text-gray-800 text-sm"
                            placeholder="Enter filename"
                            aria-label="Filename"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => setFileFormat('txt')}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                fileFormat === 'txt'
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              aria-label="Select TXT format"
                            >
                              TXT
                            </button>
                            <button
                              onClick={() => setFileFormat('pdf')}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                fileFormat === 'pdf'
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              aria-label="Select PDF format"
                            >
                              PDF
                            </button>
                            <button
                              onClick={() => setFileFormat('json')}
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                fileFormat === 'json'
                                  ? 'bg-sky-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                              aria-label="Select JSON format"
                            >
                              JSON
                            </button>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setShowFilenameForm(null)}
                              className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm font-medium"
                              aria-label="Cancel save file"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => saveFile(msg.content, index, fileFormat, filenameInput)}
                              className="px-3 py-1 bg-sky-500 text-white rounded-lg hover:bg-sky-600 text-sm font-medium"
                              aria-label="Save file"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="overflow-y-auto">
              {msg.role === 'assistant' && msg.taskName && (
                <h1 className="text-gray-900 text-base italic mb-4">{msg.taskName}</h1>
              )}
              <span
                dangerouslySetInnerHTML={{
                  __html: msg.role === 'assistant' ? msg.content : msg.content.replace(/\n/g, '<br>'),
                }}
              />
            </div>
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className="text-left mb-2">
          <span className="inline-block p-2 rounded bg-gray-100">
            <span className={styles.typingDots}>
              Typing<span>.</span><span>.</span><span>.</span>
            </span>
          </span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}