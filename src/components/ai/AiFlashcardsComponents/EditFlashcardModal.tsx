
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Flashcard {
  id: number;
  name: string;
  messages: { role: string; content: string }[];
  created_at: string;
  updated_at: string;
  topic: string;
  section: string;
  user_id?: string;
  organization_id?: string;
  status?: string;
}

interface EditFlashcardModalProps {
  editingCard: Flashcard | null;
  closeEditModal: () => void;
  updateFlashcard: (flashcardId: number, updatedData: { name: string; topic: string; section: string }) => void;
  onError: (error: string) => void;
}

export default function EditFlashcardModal({
  editingCard,
  closeEditModal,
  updateFlashcard,
  onError,
}: EditFlashcardModalProps) {
  const [editForm, setEditForm] = useState({ name: '', topic: '', section: '' });

  useEffect(() => {
    if (editingCard) {
      setEditForm({
        name: editingCard.name || '',
        topic: editingCard.topic || '',
        section: editingCard.section || '',
      });
    }
  }, [editingCard]);

  const handleEditSubmit = () => {
    if (editingCard) {
      if (!editForm.name.trim()) {
        onError('Flashcard name cannot be empty.');
        return;
      }
      updateFlashcard(editingCard.id, editForm);
      closeEditModal();
    }
  };

  if (!editingCard) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-gray-200 bg-opacity-50"
      onClick={closeEditModal}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Flashcard</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Enter flashcard name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <input
              type="text"
              value={editForm.topic}
              onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Enter topic"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Section</label>
            <input
              type="text"
              value={editForm.section}
              onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Enter section"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <div className="w-full h-32 md:max-w-[48rem] md:max-h-[48rem] px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-600 overflow-y-auto space-y-2 resize">
              {(editingCard.messages || []).map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <span
                    className={`inline-block p-4 rounded max-w-[80%] ${
                      msg.role === 'user' ? 'bg-sky-100 text-gray-800' : 'bg-gray-100 text-gray-800'
                    }`}
                    dangerouslySetInnerHTML={{
                      __html: msg.content.replace(/\n/g, '<br>'),
                    }}
                  />
                </div>
              ))}
              {(!editingCard.messages || editingCard.messages.length === 0) && (
                <p className="text-gray-500">No content available</p>
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={closeEditModal}
            className="px-4 py-2 rounded-full bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleEditSubmit}
            className="px-4 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 cursor-pointer"
          >
            Save
          </button>
        </div>
        <button
          onClick={closeEditModal}
          className="absolute top-4 right-4 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
