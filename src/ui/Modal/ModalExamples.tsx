// Example usage of the new Modal components
'use client';

import React, { useState } from 'react';
import { 
  Modal, 
  ModalContent, 
  ModalBackdrop, 
  ModalHeader, 
  ModalBody, 
  ModalFooter 
} from '@/ui/Modal';
import Button from '@/ui/Button';

/**
 * Example 1: Basic Static Modal
 */
export function BasicModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Basic Modal</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalBackdrop onClick={() => setIsOpen(false)} />
        <ModalContent size="md">
          <ModalHeader 
            title="Welcome" 
            subtitle="This is a basic modal"
            onClose={() => setIsOpen(false)}
          />
          <ModalBody>
            <p className="text-gray-700">
              This is a simple, centered modal with a backdrop. 
              Click outside or press ESC to close.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Got it
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/**
 * Example 2: Draggable & Resizable Modal
 */
export function DraggableModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Draggable Modal</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalBackdrop onClick={() => setIsOpen(false)} />
        <ModalContent 
          size="lg"
          draggable={!isFullscreen}
          resizable={!isFullscreen}
          fullscreen={isFullscreen}
        >
          {/* Drag handle wrapper */}
          <div className="modal-drag-handle cursor-move">
            <ModalHeader 
              title="Draggable Modal" 
              subtitle="Drag me around or resize"
              onClose={() => setIsOpen(false)}
              onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
              isFullscreen={isFullscreen}
              showFullscreenButton
            />
          </div>
          <ModalBody>
            <div className="space-y-4">
              <p className="text-gray-700">
                This modal can be dragged by clicking the header and moved around.
                You can also resize it by dragging the edges!
              </p>
              <p className="text-sm text-gray-500">
                Click the fullscreen button to toggle fullscreen mode.
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Close
            </Button>
            <Button variant="primary">
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/**
 * Example 3: Large Form Modal
 */
export function FormModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create New Item</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalBackdrop onClick={() => setIsOpen(false)} />
        <ModalContent size="lg">
          <ModalHeader 
            title="Create New Item" 
            subtitle="Fill in the details below"
            onClose={() => setIsOpen(false)}
          />
          <ModalBody>
            <form id="item-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Select a category</option>
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="item-form">
              Create Item
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/**
 * Example 4: Fullscreen Modal
 */
export function FullscreenModalExample() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Fullscreen Modal</Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <ModalBackdrop onClick={() => setIsOpen(false)} />
        <ModalContent fullscreen>
          <ModalHeader 
            title="Fullscreen Editor" 
            subtitle="Maximum workspace"
            onClose={() => setIsOpen(false)}
          />
          <ModalBody noPadding>
            <div className="h-full bg-gray-50 p-8">
              <p className="text-gray-700">
                This modal takes up the entire screen. Perfect for editors, 
                complex forms, or any content that needs maximum space.
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
