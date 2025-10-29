'use client';

import React, { useState } from 'react';
import Tooltip from '@/components/Tooltip';
import type { AITaskItem, AITaskModalMode, AIThemeColors } from '../types';

// Generic model interface for the modal
export interface AITaskManagementModel {
  id: string | number;
  name: string;
  tasks?: AITaskItem[] | string;
  task?: AITaskItem[] | string | null; // Admin uses 'task' instead of 'tasks'
  type?: 'default' | 'user' | 'system';
}

interface AITaskManagementModalProps {
  isOpen: boolean;
  selectedModel: AITaskManagementModel | null;
  mode: AITaskModalMode;
  setMode: (mode: AITaskModalMode) => void;
  onClose: () => void;
  onAddTask: (modelId: string | number, taskName: string, taskMessage: string) => void;
  onRemoveTask: (modelId: string | number, taskIndex: number) => void;
  primary: AIThemeColors;
  context: 'admin' | 'account';
}

export function AITaskManagementModal({
  isOpen,
  selectedModel,
  mode,
  setMode,
  onClose,
  onAddTask,
  onRemoveTask,
  primary,
  context
}: AITaskManagementModalProps) {
  if (!isOpen || !selectedModel) return null;

  // Check if user can edit this model
  const canEdit = context === 'admin' || selectedModel.type === 'user';

  // Parse tasks - handle both 'tasks' (account) and 'task' (admin) field names
  const rawTasks = selectedModel.tasks ?? selectedModel.task;
  const tasks: AITaskItem[] = !rawTasks 
    ? [] 
    : typeof rawTasks === 'string' 
      ? JSON.parse(rawTasks) 
      : rawTasks;

  const handleAddTask = (name: string, message: string) => {
    if (canEdit) {
      onAddTask(selectedModel.id, name, message);
    }
  };

  const handleRemoveTask = (index: number) => {
    if (canEdit) {
      onRemoveTask(selectedModel.id, index);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden border-2"
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          borderColor: primary.light,
          boxShadow: `0 25px 50px -12px ${primary.base}40`,
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="relative px-6 sm:px-8 py-5 sm:py-6 border-b"
          style={{ 
            borderColor: primary.lighter,
            background: `linear-gradient(to right, ${primary.lighter}, white)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                style={{ 
                  backgroundColor: primary.lighter,
                  borderColor: primary.light,
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle at center, ${primary.base}20 0%, transparent 70%)`,
                    filter: 'blur(8px)'
                  }}
                />
                <svg className="h-8 w-8 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.base }} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedModel.name}</h2>
                <p className="text-sm sm:text-base font-bold" style={{ color: primary.base }}>
                  {canEdit ? 'Manage Tasks' : 'View Tasks (Read-only)'}
                </p>
              </div>
            </div>
            <Tooltip content="Close">
              <button
                onClick={onClose}
                className="h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:rotate-90 border-2"
                style={{ 
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <svg className="h-5 w-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Tooltip>
          </div>

          {/* Permission notice for account users */}
          {context === 'account' && !canEdit && (
            <div 
              className="mt-4 p-3 rounded-xl border-2 flex items-start gap-3"
              style={{
                backgroundColor: '#fef3c7',
                borderColor: '#fbbf24'
              }}
            >
              <svg className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm text-amber-900">
                <p className="font-bold">Read-only mode</p>
                <p className="text-xs mt-1">You can only edit tasks for your own custom models.</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 sm:p-8" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div>
            {mode === 'add' && canEdit ? (
              <AddTaskForm 
                onAdd={handleAddTask}
                onCancel={() => setMode('view')}
                primary={primary}
              />
            ) : (
              <div className="space-y-4">
                {tasks.length > 0 ? (
                  <>
                    {tasks.map((task, index) => (
                      <div 
                        key={index}
                        className="group p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg"
                        style={{ 
                          backgroundColor: 'white',
                          borderColor: '#e5e7eb'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = primary.light;
                          e.currentTarget.style.backgroundColor = primary.lighter + '20';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#e5e7eb';
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <span 
                              className="h-9 w-9 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-300 flex-shrink-0 border-2"
                              style={{ 
                                backgroundColor: primary.lighter,
                                borderColor: primary.light,
                                color: primary.base
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = primary.light;
                                e.currentTarget.style.borderColor = primary.hover || primary.base;
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = primary.lighter;
                                e.currentTarget.style.borderColor = primary.light;
                                e.currentTarget.style.color = primary.base;
                              }}
                            >
                              {index + 1}
                            </span>
                            <h3 className="font-bold text-base sm:text-lg text-gray-900">{task.name}</h3>
                          </div>
                          {canEdit && (
                            <Tooltip content="Remove Task">
                              <button
                                onClick={() => {
                                  if (window.confirm(`Remove task "${task.name}"?`)) {
                                    handleRemoveTask(index);
                                  }
                                }}
                                className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 hover:rotate-12 shadow-md border-2"
                                style={{ 
                                  backgroundColor: '#fee2e2',
                                  borderColor: '#fca5a5',
                                  color: '#dc2626'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fca5a5';
                                  e.currentTarget.style.color = '#991b1b';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#fee2e2';
                                  e.currentTarget.style.color = '#dc2626';
                                }}
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </Tooltip>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-gray-600 leading-relaxed pl-12">{task.system_message}</p>
                      </div>
                    ))}
                    {canEdit && (
                      <button
                        onClick={() => setMode('add')}
                        className="w-full py-4 rounded-2xl font-bold text-base transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 shadow-sm hover:shadow-md border-2"
                        style={{ 
                          backgroundColor: primary.lighter,
                          color: primary.base,
                          borderColor: primary.light,
                          borderStyle: 'dashed'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = primary.light;
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.borderStyle = 'solid';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = primary.lighter;
                          e.currentTarget.style.color = primary.base;
                          e.currentTarget.style.borderStyle = 'dashed';
                        }}
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Task
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 sm:py-20">
                    <div 
                      className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg border-2"
                      style={{ 
                        backgroundColor: primary.lighter,
                        borderColor: primary.light,
                      }}
                    >
                      <svg className="h-12 w-12 sm:h-14 sm:w-14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.base }} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">No tasks yet</h3>
                    <p className="text-gray-500 text-sm sm:text-base mb-8 max-w-md mx-auto">
                      {canEdit 
                        ? "Add your first task to configure this AI model's capabilities"
                        : "This model doesn't have any tasks configured yet"
                      }
                    </p>
                    {canEdit && (
                      <button
                        onClick={() => setMode('add')}
                        className="px-8 py-3.5 rounded-xl font-bold text-base transition-all duration-300 hover:scale-105 shadow-lg border-2"
                        style={{ 
                          backgroundColor: primary.base,
                          borderColor: primary.hover || primary.base,
                          color: 'white'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = primary.hover || primary.base;
                          e.currentTarget.style.boxShadow = `0 20px 40px -12px ${primary.base}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = primary.base;
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
                        }}
                      >
                        Add First Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Task Form Component
function AddTaskForm({ onAdd, onCancel, primary }: { 
  onAdd: (name: string, message: string) => void; 
  onCancel: () => void;
  primary: AIThemeColors;
}) {
  const [taskName, setTaskName] = useState('');
  const [systemMessage, setSystemMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() && systemMessage.trim()) {
      onAdd(taskName.trim(), systemMessage.trim());
      setTaskName('');
      setSystemMessage('');
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
          Task Name *
        </label>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g., Write Full Article"
          className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 text-base"
          style={{ 
            border: `1.5px solid ${primary.light}40`,
            '--tw-ring-color': primary.base,
            background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
          } as React.CSSProperties}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2.5">
          System Message *
        </label>
        <textarea
          value={systemMessage}
          onChange={(e) => setSystemMessage(e.target.value)}
          placeholder="Describe what this task should do..."
          className="w-full px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 resize-y min-h-[140px] text-base"
          style={{ 
            border: `1.5px solid ${primary.light}40`,
            '--tw-ring-color': primary.base,
            background: 'linear-gradient(to bottom, #ffffff, #f9fafb)'
          } as React.CSSProperties}
          required
        />
      </div>
      <div className="flex gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-sm"
          style={{ 
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            color: '#4b5563'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-xl"
          style={{ 
            background: `linear-gradient(135deg, ${primary.base} 0%, ${primary.hover || primary.base} 100%)`,
            color: 'white'
          }}
        >
          Add Task
        </button>
      </div>
    </form>
  );
}

export default AITaskManagementModal;
