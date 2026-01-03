/**
 * CaptionEditor Component
 * 
 * Manual caption/subtitle editor with import/export.
 */

'use client';

import React, { useState } from 'react';
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, ClockIcon } from '@heroicons/react/24/outline';
import type { Caption } from './types';

interface CaptionEditorProps {
  captions: Caption[];
  onUpdate: (captions: Caption[]) => void;
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function CaptionEditor({ captions, onUpdate, currentTime, onSeek }: CaptionEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      const [mins, secs] = parts;
      return parseInt(mins) * 60 + parseFloat(secs);
    }
    return 0;
  };

  const handleAddCaption = () => {
    // Find the last caption by end time
    const lastCaption = captions.length > 0 
      ? captions.reduce((latest, caption) => caption.end > latest.end ? caption : latest)
      : null;
    
    // Start new caption right after the last one ends, or at current time if no captions exist
    const startTime = lastCaption ? lastCaption.end : currentTime;
    
    const newCaption: Caption = {
      id: `caption-${Date.now()}`,
      start: startTime,
      end: startTime + 3,
      text: '',
    };
    onUpdate([...captions, newCaption]);
    setEditingId(newCaption.id);
  };

  const handleUpdateCaption = (id: string, updates: Partial<Caption>) => {
    onUpdate(captions.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleDeleteCaption = (id: string) => {
    onUpdate(captions.filter(c => c.id !== id));
  };

  const handleExportSRT = () => {
    let srt = '';
    captions.sort((a, b) => a.start - b.start).forEach((caption, index) => {
      srt += `${index + 1}\n`;
      srt += `${formatTime(caption.start)} --> ${formatTime(caption.end)}\n`;
      srt += `${caption.text}\n\n`;
    });

    const blob = new Blob([srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'captions.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSRT = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      const importedCaptions: Caption[] = [];

      let i = 0;
      while (i < lines.length) {
        // Skip index line
        if (lines[i].match(/^\d+$/)) {
          i++;
          // Parse time line
          const timeLine = lines[i];
          const match = timeLine.match(/(\d{2}:\d{2}.\d{3}) --> (\d{2}:\d{2}.\d{3})/);
          if (match) {
            const start = parseTime(match[1]);
            const end = parseTime(match[2]);
            i++;
            // Get text lines until empty line
            const textLines: string[] = [];
            while (i < lines.length && lines[i].trim() !== '') {
              textLines.push(lines[i]);
              i++;
            }
            importedCaptions.push({
              id: `caption-${Date.now()}-${importedCaptions.length}`,
              start,
              end,
              text: textLines.join('\n'),
            });
          }
        }
        i++;
      }

      onUpdate([...captions, ...importedCaptions]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Captions ({captions.length})
        </h4>
        <div className="flex gap-2">
          <label className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded cursor-pointer transition-colors">
            <ArrowUpTrayIcon className="w-4 h-4 inline mr-1" />
            Import SRT
            <input
              type="file"
              accept=".srt"
              onChange={handleImportSRT}
              className="hidden"
            />
          </label>
          <button
            onClick={handleExportSRT}
            disabled={captions.length === 0}
            className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-4 h-4 inline mr-1" />
            Export SRT
          </button>
          <button
            onClick={handleAddCaption}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <PlusIcon className="w-4 h-4 inline mr-1" />
            Add
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
        {captions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No captions yet. Click "Add" to create one.
          </div>
        ) : (
          captions.sort((a, b) => a.start - b.start).map((caption) => (
            <div
              key={caption.id}
              className={`p-2 rounded border transition-colors ${
                editingId === caption.id
                  ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2 text-xs items-center">
                    <div className="flex items-center gap-1">
                      <label className="text-gray-600 dark:text-gray-400 text-[10px] font-medium">START</label>
                      <input
                        type="text"
                        value={formatTime(caption.start)}
                        onChange={(e) => handleUpdateCaption(caption.id, { start: parseTime(e.target.value) })}
                        onClick={() => onSeek(caption.start)}
                        className="w-24 px-2 py-1 font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                        title="Click to seek to this time"
                      />
                      <button
                        onClick={() => handleUpdateCaption(caption.id, { start: currentTime })}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Set to current time"
                      >
                        <ClockIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </button>
                    </div>
                    <span className="py-1 text-gray-400">→</span>
                    <div className="flex items-center gap-1">
                      <label className="text-gray-600 dark:text-gray-400 text-[10px] font-medium">END</label>
                      <input
                        type="text"
                        value={formatTime(caption.end)}
                        onChange={(e) => handleUpdateCaption(caption.id, { end: parseTime(e.target.value) })}
                        className="w-24 px-2 py-1 font-mono bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                      />
                      <button
                        onClick={() => handleUpdateCaption(caption.id, { end: currentTime })}
                        className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        title="Set to current time"
                      >
                        <ClockIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={caption.text}
                    onChange={(e) => handleUpdateCaption(caption.id, { text: e.target.value })}
                    onFocus={() => setEditingId(caption.id)}
                    onBlur={() => setEditingId(null)}
                    placeholder="Enter caption text..."
                    rows={2}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded resize-none"
                  />
                </div>
                <button
                  onClick={() => handleDeleteCaption(caption.id)}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Delete caption"
                >
                  <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
