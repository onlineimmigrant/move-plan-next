'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowUpIcon } from '@heroicons/react/24/outline';
import { Task, Model, Role } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';
import Tooltip from '../../Tooltip';

interface TaskManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: Model | null;
  userRole: Role;
  accessToken: string | null;
  onTasksUpdated: (tasks: Task[]) => void;
}

export default function TaskManagerModal({
  isOpen,
  onClose,
  model,
  userRole,
  accessToken,
  onTasksUpdated,
}: TaskManagerModalProps) {
  const [tasks, setTasks] = useState<Task[]>(model?.task || []);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskSystemMessage, setNewTaskSystemMessage] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setTasks(model?.task || []);
    setError(null);
    setEditingTask(null);
    setNewTaskName('');
    setNewTaskSystemMessage('');
  }, [model]);

  const addTask = async () => {
    if (!newTaskName.trim() || !newTaskSystemMessage.trim()) {
      setError('Task name and system message are required.');
      return;
    }
    if (!model || !accessToken) {
      setError('Model or access token is missing.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          modelId: model.id,
          modelType: model.type,
          action: 'add',
          task: { name: newTaskName, system_message: newTaskSystemMessage },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add task');
      }

      setTasks(data.tasks);
      onTasksUpdated(data.tasks);
      setNewTaskName('');
      setNewTaskSystemMessage('');
    } catch (err: any) {
      console.error('[TaskManagerModal] Add task error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const updateTask = async (originalName: string) => {
    if (!editingTask || !model || !accessToken) {
      setError('Editing task, model, or access token is missing.');
      return;
    }
    if (!editingTask.name.trim() || !editingTask.system_message.trim()) {
      setError('Task name and system message are required.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          modelId: model.id,
          modelType: model.type,
          action: 'update',
          originalName,
          task: editingTask,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      setTasks(data.tasks);
      onTasksUpdated(data.tasks);
      setEditingTask(null);
    } catch (err: any) {
      console.error('[TaskManagerModal] Update task error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTask = async (taskName: string) => {
    if (!model || !accessToken) {
      setError('Model or access token is missing.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/chat/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          modelId: model.id,
          modelType: model.type,
          action: 'delete',
          taskName,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete task');
      }

      setTasks(data.tasks);
      onTasksUpdated(data.tasks);
    } catch (err: any) {
      console.error('[TaskManagerModal] Delete task error:', err.message);
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !model) return null;

  const canManageTasks = userRole === 'admin' || model.type === 'user';

  if (!canManageTasks) {
    return createPortal(
      <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
        <div className={styles.modalContent} style={{ zIndex: 10000011 }}>
          <div className={styles.modalHeader}>
            <div className="flex justify-between items-center w-full">
              <h2 className={styles.modalTitle}>Manage Tasks for {model.name}</h2>
              <button onClick={onClose} className={styles.modalCloseButton}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={styles.modalBody}>
            <div className="text-red-500">You do not have permission to manage tasks for this model.</div>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
      <div className={styles.modalContent} style={{ zIndex: 10000011 }}>
        <div className={styles.modalHeader}>
          <div className="flex justify-between items-center w-full">
            <div>
              <h2 className={styles.modalTitle}>Tasks</h2>
              <p className={styles.modalSubtitle}>{model.name}</p>
            </div>
            <button onClick={onClose} className={styles.modalCloseButton}>
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className={styles.modalBody}>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>New Task</h3>
          <div className={styles.modalFormContainer}>
            <div className={styles.modalFormFields}>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="Task name"
                className={styles.modalFormInput}
                disabled={isSaving}
              />
              <textarea
                value={newTaskSystemMessage}
                onChange={(e) => setNewTaskSystemMessage(e.target.value)}
                placeholder="System message"
                className={styles.modalFormTextarea}
                rows={3}
                disabled={isSaving}
              />
            </div>
            <div className="flex justify-end items-center mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={addTask}
                disabled={isSaving || !newTaskName.trim() || !newTaskSystemMessage.trim()}
                className={styles.modalFormButton}
              >
                <ArrowUpIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        <div className={styles.modalSection}>
          <h3 className={styles.modalSectionTitle}>Existing Tasks</h3>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks defined.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tasks.map((task) => (
                <div key={task.name} className="relative group flex-shrink-0">
                     <Tooltip content={task.system_message} variant='info-top'>
                  <button
                    onClick={() => setEditingTask(task)}
                    className={`${styles.modalBadge} ${task.name === editingTask?.name ? styles.selected : ''}`}
                    disabled={isSaving}
                  >
                    <span>{task.name}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.name);
                      }}
                      className={styles.modalBadgeDelete}
                    >
                      ×
                    </span>
                  </button>
                 
                    
                
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
          {editingTask && (
            <div className={styles.modalSection}>
              <h3 className={styles.modalSectionTitle}>Edit Task</h3>
              <div className={styles.modalFormContainer}>
                <div className={styles.modalFormFields}>
                  <input
                    type="text"
                    value={editingTask.name}
                    onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                    className={styles.modalFormInput}
                    disabled={isSaving}
                  />
                  <textarea
                    value={editingTask.system_message}
                    onChange={(e) => setEditingTask({ ...editingTask, system_message: e.target.value })}
                    className={styles.modalFormTextarea}
                    rows={3}
                    disabled={isSaving}
                  />
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                  <Button
                    variant="secondary"
                    onClick={() => setEditingTask(null)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <button
                    onClick={() => updateTask(editingTask.name)}
                    disabled={isSaving || !editingTask.name.trim() || !editingTask.system_message.trim()}
                    className={styles.modalFormButton}
                  >
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>,
    document.body
  );
}