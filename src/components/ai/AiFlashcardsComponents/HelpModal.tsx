
import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-80 flex items-center justify-center bg-gray-200 bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Flashcard Help Guide</h2>
        <div className="space-y-4 text-sm text-gray-700">
          <p>
            Welcome to the AI Flashcards section! This guide will help you understand the features and how to use them effectively.
          </p>
          <div>
            <h3 className="font-semibold">Searching and Filtering</h3>
            <ul className="list-disc list-inside">
              <li>
                <strong>Search:</strong> Use the search bar to find flashcards by name.
              </li>
              <li>
                <strong>Filter by Status:</strong> Click the status button to filter flashcards by their current status (e.g., Learning, Review, Mastered).
              </li>
              <li>
                <strong>Filter by Topic:</strong> Click the topic button to filter flashcards by their assigned topic.
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Managing Flashcards</h3>
            <ul className="list-disc list-inside">
              <li>
                <strong>View a Flashcard:</strong> Click on any flashcard in the list to open it.
              </li>
              <li>
                <strong>Flip a Flashcard:</strong> Double-click on an open flashcard to flip it and see the answer.
              </li>
              <li>
                <strong>Navigate Flashcards:</strong> Use the arrow buttons at the bottom of an open flashcard to navigate to the previous or next one.
              </li>
              <li>
                <strong>Change Status:</strong> You can change the status of a flashcard from the list view by hovering over it and clicking the desired status. You can also change the status of an open flashcard using the button at the bottom.
              </li>
              <li>
                <strong>Edit a Flashcard:</strong> Click the pencil icon on a flashcard to edit its name, topic, and section.
              </li>
              <li>
                <strong>Delete a Flashcard:</strong> Click the trash icon on a flashcard to delete it.
              </li>
            </ul>
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-transparent text-gray-800 hover:bg-gray-100 cursor-pointer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
