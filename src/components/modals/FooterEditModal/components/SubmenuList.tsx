/**
 * SubmenuList - Sortable list of submenu items with inline editing
 * Shared between FooterEditModal and HeaderEditModal
 */

import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import {
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { SubMenuItem } from '../types';

interface SubmenuItemRowProps {
  submenu: SubMenuItem;
  menuItemId: string;
  onEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onToggle: (menuItemId: string, submenuId: string) => void;
  onDelete: (menuItemId: string, submenuId: string) => void;
}

export function SortableSubmenuItem({ submenu, menuItemId, onEdit, onToggle, onDelete }: SubmenuItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: submenu.id });

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [nameValue, setNameValue] = useState(submenu.name);
  const [descValue, setDescValue] = useState(submenu.description || '');
  const [slugValue, setSlugValue] = useState(submenu.url_name);
  const [isImageGalleryOpen, setIsImageGalleryOpen] = useState(false);

  // Update local state when submenu prop changes (after save)
  useEffect(() => {
    setNameValue(submenu.name);
    setDescValue(submenu.description || '');
    setSlugValue(submenu.url_name);
  }, [submenu.name, submenu.description, submenu.url_name]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleNameSave = () => {
    if (nameValue.trim() && nameValue !== submenu.name) {
      onEdit(menuItemId, submenu.id, 'name', nameValue.trim());
    }
    setIsEditingName(false);
  };

  const handleDescSave = () => {
    if (descValue !== (submenu.description || '')) {
      onEdit(menuItemId, submenu.id, 'description', descValue);
    }
    setIsEditingDesc(false);
  };

  const handleSlugSave = () => {
    const cleanSlug = slugValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (cleanSlug && cleanSlug !== submenu.url_name) {
      onEdit(menuItemId, submenu.id, 'url_name', cleanSlug);
      setSlugValue(cleanSlug);
    } else {
      setSlugValue(submenu.url_name);
    }
    setIsEditingSlug(false);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm overflow-hidden transition-all duration-200",
        isDragging && 'shadow-xl ring-2 ring-purple-500 scale-105'
      )}
    >
      {/* Card Header */}
      <div className="bg-purple-50/30 border-b border-purple-100 px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded"
            aria-label="Drag to reorder"
          >
            <Bars3Icon className="w-4 h-4" />
          </button>

          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggle(menuItemId, submenu.id)}
              className={cn(
                'p-1.5 rounded transition-colors',
                submenu.is_displayed !== false
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
              )}
              aria-label={submenu.is_displayed !== false ? 'Hide submenu' : 'Show submenu'}
              title={submenu.is_displayed !== false ? 'Visible - Click to hide' : 'Hidden - Click to show'}
            >
              {submenu.is_displayed !== false ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onDelete(menuItemId, submenu.id)}
              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
              aria-label="Delete submenu"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-3">
        {/* Image Section */}
        <div 
          className="relative w-full h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 hover:border-sky-400 transition-colors cursor-pointer group overflow-hidden"
          onClick={() => setIsImageGalleryOpen(true)}
        >
          {submenu.image ? (
            <>
              <Image
                src={submenu.image}
                alt={submenu.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-contain rounded-lg p-2"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                <PencilIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-sky-600 transition-colors">
              <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <span className="text-xs font-medium">Click to add image</span>
            </div>
          )}
        </div>

        {/* Title Section */}
        <div>
          {isEditingName ? (
            <input
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleNameSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSave();
                if (e.key === 'Escape') { setNameValue(submenu.name); setIsEditingName(false); }
              }}
              className="w-full px-3 py-2 text-xs font-medium text-gray-900 border border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              autoFocus
            />
          ) : (
            <div className="flex items-start gap-2 group">
              <h4 className="flex-1 text-xs font-medium text-gray-900 leading-snug">{submenu.name}</h4>
              <button
                onClick={() => setIsEditingName(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all"
                aria-label="Edit name"
              >
                <PencilIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* URL/Slug */}
        <div>
          {isEditingSlug ? (
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-xs text-gray-500">/</span>
              <input
                type="text"
                value={slugValue}
                onChange={(e) => setSlugValue(e.target.value)}
                onBlur={handleSlugSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSlugSave();
                  if (e.key === 'Escape') { setSlugValue(submenu.url_name); setIsEditingSlug(false); }
                }}
                className="flex-1 px-2 py-1 text-xs font-mono text-gray-700 border border-sky-500 rounded focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-gray-500 group cursor-pointer" onClick={() => setIsEditingSlug(true)}>
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="font-mono truncate">/{submenu.url_name}</span>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all flex-shrink-0"
                aria-label="Edit slug"
              >
                <PencilIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          {isEditingDesc ? (
            <textarea
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={handleDescSave}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setDescValue(submenu.description || ''); setIsEditingDesc(false); }
              }}
              className="w-full px-3 py-2 text-xs text-gray-700 border border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
              rows={2}
              placeholder="Add description..."
              autoFocus
            />
          ) : (
            <div className="flex items-start gap-2 group">
              <p className="flex-1 text-xs text-gray-600 leading-relaxed">
                {submenu.description || <span className="italic text-gray-400">No description</span>}
              </p>
              <button
                onClick={() => setIsEditingDesc(true)}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-all flex-shrink-0"
                aria-label="Edit description"
              >
                <PencilIcon className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        isOpen={isImageGalleryOpen}
        onClose={() => setIsImageGalleryOpen(false)}
        onSelectImage={(imageUrl) => {
          onEdit(menuItemId, submenu.id, 'image', imageUrl);
          setIsImageGalleryOpen(false);
        }}
      />
    </div>
  );
}
