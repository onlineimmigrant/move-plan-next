'use client';

import React, { useState } from 'react';
import {
  XMarkIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { usePanelManagement } from '../hooks/usePanelManagement';

interface TaskResult {
  taskId: string;
  taskName: string;
  result: string;
  timestamp: Date;
  tokensUsed: number;
  error?: string;
}

interface AnalysisResult {
  tasks: TaskResult[];
  totalTokensUsed: number;
  analysisTime: number;
}

interface AIAnalysisPanelProps {
  showAnalysis: boolean;
  isMobile: boolean;
  analysisResult: AnalysisResult | null;
  isAnalyzing: boolean;
  error: string | null;
  selectedModelName?: string;
  onClose: () => void;
  onReanalyze?: () => void;
  panelManagement: ReturnType<typeof usePanelManagement>;
}

export default function AIAnalysisPanel({
  showAnalysis,
  isMobile,
  analysisResult,
  isAnalyzing,
  error,
  selectedModelName,
  onClose,
  onReanalyze,
  panelManagement,
}: AIAnalysisPanelProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const { panels, startDrag, bringToFront } = panelManagement;
  const panelState = panels['analysis'];

  const isMinimized = panelState?.isMinimized || false;
  const isDragging = panelState?.isDragging || false;
  const position = panelState?.position || { x: 432, y: 120 };
  const zIndex = panelState?.zIndex || 50;

  if (!showAnalysis) return null;

  const toggleTask = (taskId: string) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      className={`bg-gray-800 rounded-lg shadow-xl ${
        isMobile ? 'fixed inset-x-4 bottom-4 top-20' : 'fixed'
      } ${isDragging ? 'cursor-grabbing' : ''}`}
      style={
        isMobile
          ? {}
          : {
              left: position.x,
              top: position.y,
              width: '450px',
              maxHeight: '600px',
              zIndex,
            }
      }
      onMouseDown={() => bringToFront('analysis')}
    >
      {/* Header */}
      <div 
        className="panel-header flex items-center justify-between p-4 border-b border-gray-700 cursor-move"
        onMouseDown={(e) => {
          if (!isMobile) {
            e.preventDefault();
            startDrag('analysis', e);
          }
        }}
      >
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-purple-400" />
          <h3 className="text-white font-semibold">AI Analysis</h3>
          {isAnalyzing && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400">Analyzing...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onReanalyze && analysisResult && !isAnalyzing && (
            <button
              onClick={onReanalyze}
              className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
            >
              Reanalyze
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col h-full">
        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Analysis Display */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-3"
          style={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : '500px' }}
        >
          {isAnalyzing ? (
            // Loading State
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <SparklesIcon className="h-12 w-12 mb-2 opacity-50 animate-pulse" />
              <p className="text-sm">Analyzing conversation with AI...</p>
              {selectedModelName && (
                <p className="text-xs text-gray-500 mt-1">{selectedModelName}</p>
              )}
            </div>
          ) : !analysisResult ? (
            // Empty State
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <SparklesIcon className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm text-center">
                Click "Analyze" to get AI-powered insights
                <br />
                on this conversation
              </p>
            </div>
          ) : (
            // Results Display
            <>
              {/* Summary Stats */}
              <div className="bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Model:</span>
                  <span className="text-white font-medium">
                    {selectedModelName || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    Analysis Time:
                  </span>
                  <span className="text-white">
                    {formatDuration(analysisResult.analysisTime)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <CpuChipIcon className="h-4 w-4" />
                    Tokens Used:
                  </span>
                  <span className="text-white">
                    {analysisResult.totalTokensUsed.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Tasks Completed:</span>
                  <span className="text-white">
                    {analysisResult.tasks.filter((t) => !t.error).length} /{' '}
                    {analysisResult.tasks.length}
                  </span>
                </div>
              </div>

              {/* Task Results */}
              <div className="space-y-2">
                {analysisResult.tasks.map((task) => {
                  const isExpanded = expandedTasks.has(task.taskId);
                  const hasError = !!task.error;

                  return (
                    <div
                      key={task.taskId}
                      className={`bg-gray-700/50 rounded-lg overflow-hidden ${
                        hasError ? 'border border-red-500/30' : ''
                      }`}
                    >
                      {/* Task Header */}
                      <button
                        onClick={() => toggleTask(task.taskId)}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {hasError ? (
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          ) : (
                            <SparklesIcon className="h-5 w-5 text-purple-400" />
                          )}
                          <span className="text-white font-medium text-sm">
                            {task.taskName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {task.tokensUsed} tokens
                          </span>
                          {isExpanded ? (
                            <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Task Content (Collapsible) */}
                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2">
                          {hasError ? (
                            <div className="bg-red-500/10 rounded p-2">
                              <p className="text-red-400 text-sm">{task.error}</p>
                            </div>
                          ) : (
                            <div className="bg-gray-800 rounded p-3">
                              <p className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                                {task.result}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center justify-end">
                            <span className="text-xs text-gray-500">
                              {formatTime(task.timestamp)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {analysisResult && !isAnalyzing && (
          <div className="border-t border-gray-700 p-3 bg-gray-800/50">
            <p className="text-xs text-gray-500 text-center">
              Host-only view • Analysis powered by AI
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
