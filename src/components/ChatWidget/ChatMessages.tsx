'use client';
import { useRef, useEffect, useState } from 'react';
import { CheckIcon, ClipboardIcon, DocumentArrowDownIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Message, ChatMessagesProps } from './types';
import styles from './ChatWidget.module.css';
import { jsPDF } from 'jspdf';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Simple HTML parser for PDF
const parseHtmlForPdf = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const elements: { text: string; isHeading: boolean; level: number }[] = [];

  const traverse = (node: Node, currentLevel: number = 0) => {
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

export default function ChatMessages({ messages, isTyping, isFullscreen, setError, accessToken, userId }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const [showFilenameModal, setShowFilenameModal] = useState<number | null>(null);
  const [filenameInput, setFilenameInput] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'txt' | 'pdf'>('txt');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  const openFilenameModal = (index: number, format: 'txt' | 'pdf') => {
    const defaultFilename = getDefaultFilename(messages[index].content, index);
    setFilenameInput(defaultFilename);
    setFileFormat(format);
    setShowFilenameModal(index);
  };

  const saveFile = async (content: string, index: number, format: 'txt' | 'pdf', customFilename: string) => {
    if (!accessToken || !userId) {
      setError('Please log in to save files.');
      return;
    }

    try {
      const textContent = content.replace(/<[^>]+>/g, '');
      const taskTitle = messages[index].taskName || '';
      let fileContent: string;
      let filename: string;

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
      } else {
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
      }

      const { data: settingsData, error: settingsError } = await supabase
        .from('ai_user_settings')
        .select('files')
        .eq('user_id', userId)
        .single();

      if (settingsError) {
        throw new Error('Failed to fetch user settings: ' + settingsError.message);
      }

      const existingFiles = Array.isArray(settingsData?.files) ? settingsData.files : [];
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
      setShowFilenameModal(null);
      setFilenameInput('');
    } catch (err: any) {
      console.error('[ChatMessages] Save file error:', err);
      setError(err.message || `Failed to save message to ${format} file`);
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto mb-4 p-4 ${isFullscreen ? styles.centeredMessages : ''}`}>
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`mb-2 mx-auto max-w-4xl ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
        >
          <div
            className={`inline-block p-4 rounded ${
              msg.role === 'user' ? 'bg-sky-100 ' : 'bg-gray-50 px-8 sm:px-12 pb-16 rounded-xl border border-gray-100'
            }`}
          >
            {msg.role === 'assistant' && msg.taskName && (
              <h1 className="text-gray-900 text-base italic mb-4">{msg.taskName}</h1>
            )}
            {msg.role === 'assistant' && (
              <div className="sticky top-0 flex justify-end mb-2 ">
                <div className='space-x-2 rounded bg-gray-50 opacity-90 '>
                <Tooltip variant="info-top" content="Copy Message">
                  <button
                    onClick={() => copyMessage(msg.content, index)}
                    className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform"
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
                    onClick={() => openFilenameModal(index, 'txt')}
                    className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                  </button>
                </Tooltip>
                <Tooltip variant="info-top" content="Save as PDF">
                  <button
                    onClick={() => openFilenameModal(index, 'pdf')}
                    className="cursor-pointer text-sky-500 hover:text-sky-700 p-1 hover:scale-110 transition-transform"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4" />
                  </button>
                </Tooltip>
              </div>
              </div>
            )}
            <span
              dangerouslySetInnerHTML={{
                __html: msg.role === 'assistant' ? msg.content : msg.content.replace(/\n/g, '<br>'),
              }}
            />
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
      {showFilenameModal !== null && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-medium mb-2">Save File</h3>
            <input
              type="text"
              value={filenameInput}
              onChange={(e) => setFilenameInput(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
              className="w-full p-2 border rounded mb-2"
              placeholder="Enter filename"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowFilenameModal(null)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => saveFile(messages[showFilenameModal].content, showFilenameModal, fileFormat, filenameInput)}
                className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}