'use client';
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
      className="mx-2 fixed inset-0 z-80 flex items-center justify-center  bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-gray-100 rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray mb-4">Flashcard Help Guide</h2>
        <div className="max-h-[70vh] overflow-y-auto space-y-4 text-gray text-sm">
          <section>
            <h3 className="font-bold">Overview</h3>
            <p>
              Use flashcards to filter, study, and manage your learning. Filter by search, status, or topic; study by flipping cards; manage user-created cards by editing or deleting; track progress with statuses: Learning, Review, Mastered, Suspended, Lapsed. On desktops, search and filters are in one row; on mobile, filters are below search.
            </p>
          </section>

          <section>
            <h3 className="font-bold">Accessing Flashcards</h3>
            <ul className="list-disc pl-5">
              <li>Click "Flashcards" to expand/collapse the panel.</li>
              <li>
                Each card shows: status (e.g., Learning, in gray), title, topic, and edit/delete buttons (for user-created cards). Borders indicate status: Learning (sky-blue), Review (yellow), Mastered (teal), Suspended (gray), Lapsed (red).
              </li>
              <li>Click <strong>Load More</strong> for more cards; use <strong>Previous</strong> to go back.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold">Filtering Flashcards</h3>
            <ul className="list-disc pl-5">
              <li><strong>Search</strong>: Type in the search bar to filter by title. Clear to reset.</li>
              <li>
                <strong>Status</strong>: Click the status badge (with pencil icon) to select All, Learning, Review, Mastered, Suspended, or Lapsed. Updates filter instantly.
              </li>
              <li>
                <strong>Topic</strong>: Click the topic badge to select All Topics or a specific topic. Only one dropdown opens at a time.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold">Studying Flashcards</h3>
            <ul className="list-disc pl-5">
              <li>Click a card to open it. The front shows topic, section, title, and <strong>Change Status</strong>.</li>
              <li>Double-click or click the flip button (arrow, top-left) to view content (chat-like format).</li>
              <li>
                Click <strong>Change Status</strong> to cycle: Learning → Review → Mastered; Mastered/Suspended/Lapsed → Learning.
              </li>
              <li>Use <strong>Previous</strong>/<strong>Next</strong> (bottom) to navigate cards.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold">Managing Flashcards</h3>
            <ul className="list-disc pl-5">
              <li>
                <strong>Edit</strong>: For user-created cards, click the pencil icon (gray, turns blue on hover) to edit name, topic, or section. Save (sky-blue) or Cancel (gray).
              </li>
              <li><strong>Delete</strong>: Click the trash icon (gray, turns red on hover) and confirm.</li>
              <li><strong>Change Status</strong>: Hover over a card to change status directly.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold">Troubleshooting</h3>
            <ul className="list-disc pl-5">
              <li><strong>No Flashcards</strong>: Check internet or console logs (F12).</li>
              <li><strong>Filters</strong>: Clear search or reset to All/All Topics.</li>
              <li><strong>Dropdowns</strong>: Ensure only one is open; check for overlaps.</li>
              <li><strong>Edit/Delete</strong>: Only user-created cards are editable.</li>
              <li>Contact support with screenshots or logs.</li>
            </ul>
          </section>
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-transparent text-gray hover:bg-gray cursor-pointer"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}