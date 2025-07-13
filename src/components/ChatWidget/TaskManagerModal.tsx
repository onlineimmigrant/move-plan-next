'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Task, Model, Role } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';
import Tooltip from '../Tooltip';

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
    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Manage Tasks for {model.name}</h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="text-red-500 mb-4">You do not have permission to manage tasks for this model.</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-lg font-semibold">Tasks</h2>
          <span>{model.name}</span>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2">New Task</h3>
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Task name"
            className="w-full p-2 mb-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
            disabled={isSaving}
          />
          <textarea
            value={newTaskSystemMessage}
            onChange={(e) => setNewTaskSystemMessage(e.target.value)}
            placeholder="System message"
            className="w-full p-2 mb-2 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
            rows={4}
            disabled={isSaving}
          />
          <Button
            onClick={addTask}
            className="my-4"
            disabled={isSaving}
          >
            Add
          </Button>
        </div>
        <div>
          <h3 className="text-md font-medium mb-2">Existing</h3>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks defined.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tasks.map((task) => (
                <div key={task.name} className="relative group">
                     <Tooltip content={task.system_message} variant='info-top'>
                  <button
                    onClick={() => setEditingTask(task)}
                    className="bg-sky-100 text-sky-800 text-sm font-medium px-3 py-1 rounded-full flex items-center gap-2 hover:bg-sky-200 disabled:bg-sky-50"
                    disabled={isSaving}
                  >
                    <span>{task.name}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.name);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </span>
                  </button>
                 
                    
                
                  </Tooltip>
                </div>
              ))}
            </div>
          )}
          {editingTask && (
            <div className="mt-4">
              <h3 className="text-md font-medium mb-2">Edit Task</h3>
              <input
                type="text"
                value={editingTask.name}
                onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                className="w-full p-1 mb-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                disabled={isSaving}
              />
              <textarea
                value={editingTask.system_message}
                onChange={(e) => setEditingTask({ ...editingTask, system_message: e.target.value })}
                className="w-full p-1 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                rows={3}
                disabled={isSaving}
              />
              <div className="flex space-x-2 mt-1">
                <Button
                  onClick={() => updateTask(editingTask.name)}
                  disabled={isSaving}
                >
                  Save
                </Button>
                <button
                  onClick={() => setEditingTask(null)}
                  className={`${styles.modalButton} bg-gray-300 text-gray-600 hover:bg-gray-400 disabled:bg-gray-200`}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}