'use client';

import React, { useEffect, useState } from 'react';
import { useHeaderEdit } from './context';
import { BaseModal } from '../_shared/BaseModal';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/Shared/ToastContainer';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import Image from 'next/image';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Bars3Icon, 
  EyeIcon, 
  EyeSlashIcon, 
  TrashIcon,
  PencilIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Disclosure } from '@headlessui/react';

interface SubMenuItem {
  id: string;
  menu_item_id: string;
  name: string;
  url_name: string;
  description?: string;
  order: number;
  is_displayed?: boolean;
  image?: string | null;
}

interface MenuItem {
  id: string;
  display_name: string;
  url_name: string;
  description?: string;
  is_displayed: boolean;
  is_displayed_on_footer: boolean;
  menu_items_are_text: boolean;
  react_icon_id?: string;
  order: number;
  organization_id: string;
  submenu_items?: SubMenuItem[];
}

interface SortableItemProps {
  item: MenuItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, field: 'display_name' | 'description', value: string) => void;
  onSubmenuEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onSubmenuToggle: (menuItemId: string, submenuId: string) => void;
  onSubmenuDelete: (menuItemId: string, submenuId: string) => void;
  onAddSubmenu: (menuItemId: string, name: string) => void;
  onSubmenuReorder: (menuItemId: string, submenuItems: SubMenuItem[]) => void;
}

function SortableItem({ item, onToggle, onDelete, onEdit, onSubmenuEdit, onSubmenuToggle, onSubmenuDelete, onAddSubmenu, onSubmenuReorder }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [nameValue, setNameValue] = useState(item.display_name);
  const [descValue, setDescValue] = useState(item.description || '');
  const [slugValue, setSlugValue] = useState(item.url_name);
  const [isAddingSubmenu, setIsAddingSubmenu] = useState(false);
  const [newSubmenuName, setNewSubmenuName] = useState('');

  // Update local state when item prop changes (after save)
  useEffect(() => {
    setNameValue(item.display_name);
    setDescValue(item.description || '');
    setSlugValue(item.url_name);
  }, [item.display_name, item.description, item.url_name]);

  // Setup sensors for submenu drag and drop
  const submenuSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleSubmenuDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const submenuItems = item.submenu_items || [];
      const oldIndex = submenuItems.findIndex((s) => s.id === active.id);
      const newIndex = submenuItems.findIndex((s) => s.id === over.id);

      const reorderedSubmenus = arrayMove(submenuItems, oldIndex, newIndex).map((submenu, index) => ({
        ...submenu,
        order: index * 10
      }));

      onSubmenuReorder(item.id, reorderedSubmenus);
    }
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const handleNameSave = () => {
    if (nameValue.trim() && nameValue !== item.display_name) {
      onEdit(item.id, 'display_name', nameValue.trim());
    }
    setIsEditingName(false);
  };

  const handleDescSave = () => {
    if (descValue !== (item.description || '')) {
      onEdit(item.id, 'description', descValue);
    }
    setIsEditingDesc(false);
  };

  const handleSlugSave = () => {
    const cleanSlug = slugValue.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (cleanSlug && cleanSlug !== item.url_name) {
      onEdit(item.id, 'url_name' as any, cleanSlug);
      setSlugValue(cleanSlug);
    } else {
      setSlugValue(item.url_name);
    }
    setIsEditingSlug(false);
  };

  const handleSubmenuAdd = () => {
    if (newSubmenuName.trim()) {
      onAddSubmenu(item.id, newSubmenuName.trim());
      setNewSubmenuName('');
      setIsAddingSubmenu(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md overflow-hidden transition-all duration-200',
        isDragging && 'shadow-xl ring-2 ring-sky-500 scale-105'
      )}
    >
      {/* Card Header */}
      <div className="bg-blue-100 border-b border-blue-200 px-3 py-2">
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
              onClick={() => onToggle(item.id)}
              className={cn(
                'p-1.5 rounded transition-colors',
                item.is_displayed
                  ? 'text-green-600 hover:text-green-700 hover:bg-green-100'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
              )}
              aria-label={item.is_displayed ? 'Hide menu item' : 'Show menu item'}
              title={item.is_displayed ? 'Visible - Click to hide' : 'Hidden - Click to show'}
            >
              {item.is_displayed ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
              aria-label="Delete menu item"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-3">
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
                if (e.key === 'Escape') { setNameValue(item.display_name); setIsEditingName(false); }
              }}
              className="w-full px-3 py-2 text-sm font-semibold text-gray-900 border border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              autoFocus
            />
          ) : (
            <div className="flex items-start gap-2 group">
              <h3 className="flex-1 text-sm font-semibold text-gray-900 leading-snug">{item.display_name}</h3>
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
                  if (e.key === 'Escape') { setSlugValue(item.url_name); setIsEditingSlug(false); }
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
              <span className="font-mono truncate">/{item.url_name}</span>
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
                if (e.key === 'Escape') { setDescValue(item.description || ''); setIsEditingDesc(false); }
              }}
              className="w-full px-3 py-2 text-xs text-gray-700 border border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
              rows={2}
              placeholder="Add description..."
              autoFocus
            />
          ) : (
            <div className="flex items-start gap-2 group">
              <p className="flex-1 text-xs text-gray-600 leading-relaxed">
                {item.description || <span className="italic text-gray-400">No description</span>}
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

        {/* Submenu Items */}
        {item.submenu_items && item.submenu_items.length > 0 ? (
          <Disclosure defaultOpen={false}>
            {({ open }) => (
              <div className="pt-2 border-t border-gray-100">
                <Disclosure.Button className="w-full px-3 py-2 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50/50 hover:bg-sky-100 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-sky-200 hover:border-sky-300">
                  {open ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                  <span>{item.submenu_items!.length} Submenu {item.submenu_items!.length !== 1 ? 'Items' : 'Item'}</span>
                </Disclosure.Button>
                <Disclosure.Panel className="mt-2 space-y-2 -mx-3 px-1">
                  <DndContext
                    sensors={submenuSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleSubmenuDragEnd}
                  >
                    <SortableContext
                      items={item.submenu_items!.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {item.submenu_items!.map((submenu: SubMenuItem) => (
                        <SortableSubmenuItem
                          key={submenu.id}
                          submenu={submenu}
                          menuItemId={item.id}
                          onEdit={onSubmenuEdit}
                          onToggle={onSubmenuToggle}
                          onDelete={onSubmenuDelete}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  
                  {/* Add Submenu Item Form - Inside the opened panel */}
                  {isAddingSubmenu ? (
                    <div className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newSubmenuName}
                        onChange={(e) => setNewSubmenuName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSubmenuAdd();
                          if (e.key === 'Escape') { setNewSubmenuName(''); setIsAddingSubmenu(false); }
                        }}
                        placeholder="Enter submenu name..."
                        className="flex-1 px-3 py-2 text-xs border border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                        autoFocus
                      />
                      <button
                        onClick={handleSubmenuAdd}
                        className="px-3 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => { setNewSubmenuName(''); setIsAddingSubmenu(false); }}
                        className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingSubmenu(true)}
                      className="w-full px-3 py-2 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50/50 hover:bg-sky-100 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-sky-200/50 border-dashed hover:border-sky-300"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Add Submenu Item
                    </button>
                  )}
                </Disclosure.Panel>
              </div>
            )}
          </Disclosure>
        ) : (
          <div className="pt-2 border-t border-gray-100">
            {isAddingSubmenu ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubmenuName}
                  onChange={(e) => setNewSubmenuName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmenuAdd();
                    if (e.key === 'Escape') { setNewSubmenuName(''); setIsAddingSubmenu(false); }
                  }}
                  placeholder="Enter submenu name..."
                  className="flex-1 px-3 py-2 text-xs border border-sky-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                  autoFocus
                />
                <button
                  onClick={handleSubmenuAdd}
                  className="px-3 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                >
                  Add
                </button>
                <button
                  onClick={() => { setNewSubmenuName(''); setIsAddingSubmenu(false); }}
                  className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingSubmenu(true)}
                className="w-full px-3 py-2 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50/50 hover:bg-sky-100 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-sky-200/50 border-dashed hover:border-sky-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Submenu Item
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface SubmenuItemRowProps {
  submenu: SubMenuItem;
  menuItemId: string;
  onEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onToggle: (menuItemId: string, submenuId: string) => void;
  onDelete: (menuItemId: string, submenuId: string) => void;
}

function SortableSubmenuItem({ submenu, menuItemId, onEdit, onToggle, onDelete }: SubmenuItemRowProps) {
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

function HeaderEditModal() {
  const {
    isOpen,
    isLoading,
    isSaving,
    organizationId,
    headerStyle,
    menuItems,
    closeModal,
    fetchHeaderData,
    saveHeaderStyle,
    updateMenuItems,
    updateMenuItem
  } = useHeaderEdit();

  const toast = useToast();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(headerStyle);
  const [localMenuItems, setLocalMenuItems] = useState<MenuItem[]>([]);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [newMenuItemName, setNewMenuItemName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'menu' | 'submenu'; id: string; menuItemId?: string; name: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && organizationId) {
      fetchHeaderData(organizationId);
    }
  }, [isOpen, organizationId, fetchHeaderData]);

  // Sync local state with context
  useEffect(() => {
    setSelectedStyle(headerStyle);
  }, [headerStyle]);

  useEffect(() => {
    setLocalMenuItems(menuItems);
  }, [menuItems]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalMenuItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleToggleVisibility = async (itemId: string) => {
    const item = localMenuItems.find((m) => m.id === itemId);
    if (!item) return;

    try {
      // Update via API
      await updateMenuItem(itemId, { is_displayed: !item.is_displayed });
      
      // Refetch data to ensure UI is in sync
      if (organizationId) {
        await fetchHeaderData(organizationId);
      }
    } catch (error) {
      console.error('Failed to toggle visibility:', error);
      setSaveError('Failed to update menu item visibility');
    }
  };

  const handleEdit = async (itemId: string, field: 'display_name' | 'description', value: string) => {
    try {
      await updateMenuItem(itemId, { [field]: value });
      
      // Update local state
      setLocalMenuItems(items => 
        items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
      );
    } catch (error) {
      console.error('Failed to update menu item:', error);
      setSaveError(`Failed to update ${field}`);
    }
  };

  const handleSubmenuEdit = async (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => {
    try {
      console.log('[HeaderEditModal] Updating submenu field:', field, 'with value:', value);
      // Update submenu via API
      await updateMenuItem(submenuId, { [field]: value });
      
      // Immediately refetch data to show changes
      if (organizationId) {
        await fetchHeaderData(organizationId);
      }
    } catch (error) {
      console.error('Failed to update submenu item:', error);
      setSaveError(`Failed to update submenu ${field}`);
    }
  };

  const handleSubmenuToggle = async (menuItemId: string, submenuId: string) => {
    const menuItem = localMenuItems.find(m => m.id === menuItemId);
    const submenu = menuItem?.submenu_items?.find(s => s.id === submenuId);
    if (!submenu) return;

    try {
      await updateMenuItem(submenuId, { is_displayed: !(submenu.is_displayed !== false) });
      
      // Immediately refetch data to show changes
      if (organizationId) {
        await fetchHeaderData(organizationId);
      }
    } catch (error) {
      console.error('Failed to toggle submenu visibility:', error);
      setSaveError('Failed to update submenu visibility');
    }
  };

  const handleDelete = (itemId: string) => {
    const item = localMenuItems.find(i => i.id === itemId);
    if (item) {
      setDeleteConfirm({ type: 'menu', id: itemId, name: item.display_name });
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm || !organizationId) return;

    try {
      if (deleteConfirm.type === 'menu') {
        const response = await fetch(`/api/menu-items/${deleteConfirm.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete menu item');
        }

        toast.success(`Menu item "${deleteConfirm.name}" deleted successfully`);
      } else if (deleteConfirm.type === 'submenu') {
        const response = await fetch(`/api/submenu-items/${deleteConfirm.id}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete submenu item');
        }

        toast.success(`Submenu item "${deleteConfirm.name}" deleted successfully`);
      }
      
      // Refetch data to ensure UI is in sync
      await fetchHeaderData(organizationId);
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error(`Failed to delete ${deleteConfirm.type} item`);
    }
  };

  const handleSave = async () => {
    if (!organizationId) return;

    setSaveError(null);
    try {
      // Save style if changed
      if (selectedStyle !== headerStyle) {
        await saveHeaderStyle(organizationId, selectedStyle);
      }

      // Save menu items order
      await updateMenuItems(localMenuItems);

      closeModal();
    } catch (error) {
      console.error('Failed to save header settings:', error);
      setSaveError('Failed to save header settings. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset local state
    setSelectedStyle(headerStyle);
    setLocalMenuItems(menuItems);
    setSaveError(null);
    closeModal();
  };

  const handleAddMenuItem = async () => {
    if (!organizationId || !newMenuItemName.trim()) return;

    setSaveError(null);
    try {
      // Calculate next order
      const nextOrder = localMenuItems.length > 0 
        ? Math.max(...localMenuItems.map(item => item.order || 0)) + 10
        : 0;

      // Create new menu item
      const newItem = {
        organization_id: organizationId,
        display_name: newMenuItemName.trim(),
        url_name: newMenuItemName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        order: nextOrder,
        is_displayed: true,
        is_displayed_on_footer: false
      };

      const response = await fetch('/api/menu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newItem)
      });

      if (!response.ok) {
        throw new Error('Failed to create menu item');
      }

      toast.success(`Menu item "${newMenuItemName.trim()}" created successfully`);
      
      // Reset form and refetch data
      setNewMenuItemName('');
      setIsAddingMenuItem(false);
      await fetchHeaderData(organizationId);
    } catch (error) {
      console.error('Failed to add menu item:', error);
      toast.error('Failed to add menu item. Please try again.');
    }
  };

  const handleAddSubmenuItem = async (menuItemId: string, name: string) => {
    if (!organizationId) return;

    setSaveError(null);
    try {
      // Get current submenus for this menu item to calculate next order
      const menuItem = localMenuItems.find(m => m.id === menuItemId);
      const currentSubmenus = menuItem?.submenu_items || [];
      const nextOrder = currentSubmenus.length > 0
        ? Math.max(...currentSubmenus.map(sub => sub.order || 0)) + 10
        : 0;

      // Create new submenu item
      const newSubmenuItem = {
        menu_item_id: menuItemId,
        organization_id: organizationId,
        name: name,
        url_name: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        order: nextOrder,
        is_displayed: true,
        description: ''
      };

      const response = await fetch('/api/submenu-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSubmenuItem)
      });

      if (!response.ok) {
        throw new Error('Failed to create submenu item');
      }

      toast.success(`Submenu item "${name}" created successfully`);

      // Refetch data to update UI
      await fetchHeaderData(organizationId);
    } catch (error) {
      console.error('Failed to add submenu item:', error);
      toast.error('Failed to add submenu item. Please try again.');
    }
  };

  const handleDeleteSubmenuItem = (menuItemId: string, submenuId: string) => {
    const menuItem = localMenuItems.find(m => m.id === menuItemId);
    const submenuItem = menuItem?.submenu_items?.find(s => s.id === submenuId);
    
    if (submenuItem) {
      setDeleteConfirm({ type: 'submenu', id: submenuId, menuItemId, name: submenuItem.name });
    }
  };

  const handleSubmenuReorder = async (menuItemId: string, reorderedSubmenus: SubMenuItem[]) => {
    try {
      // Update local state immediately for smooth UI
      setLocalMenuItems(items =>
        items.map(item =>
          item.id === menuItemId
            ? { ...item, submenu_items: reorderedSubmenus }
            : item
        )
      );

      // Save each submenu item's new order to the database
      const updatePromises = reorderedSubmenus.map(submenu =>
        fetch(`/api/menu-items/${submenu.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ order: submenu.order })
        })
      );

      await Promise.all(updatePromises);
      
      toast.success('Submenu order updated successfully');
    } catch (error) {
      console.error('Failed to reorder submenu items:', error);
      toast.error('Failed to update submenu order');
      
      // Revert to original state on error
      if (organizationId) {
        await fetchHeaderData(organizationId);
      }
    }
  };

  // Modal title with badge
  const modalTitle = (
    <div className="flex items-center gap-2.5">
      <span>Header</span>
      <span className="px-2 py-0.5 text-xs font-medium rounded-md border bg-amber-100 text-amber-700 border-amber-200">
        Edit
      </span>
    </div>
  );

  return (
    <>
      <BaseModal 
      isOpen={isOpen} 
      onClose={handleCancel} 
      title={modalTitle}
      size="xl"
      fullscreen={isFullscreen}
      onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
      showFullscreenButton={true}
      draggable={true}
      resizable={false}
      noPadding={true}
    >
      <div className="flex flex-col h-full">
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
              <p className="text-sm text-gray-500">Loading header settings...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Style Selector */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Header Style
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['default', 'transparent', 'fixed'].map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style)}
                      className={cn(
                        'p-4 border-2 rounded-xl text-center transition-all',
                        selectedStyle === style
                          ? 'border-sky-600 bg-sky-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      )}
                    >
                      <div className="font-semibold text-sm capitalize">
                        {style}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <div className="mb-3">
                  {/* Header row - responsive layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      Menu Items
                      <span className="px-2 py-0.5 text-xs font-medium rounded bg-sky-100 text-sky-700">
                        {localMenuItems.length} {localMenuItems.length === 1 ? 'item' : 'items'}
                        {localMenuItems.reduce((total, item) => total + (item.submenu_items?.length || 0), 0) > 0 && (
                          <span className="ml-1">
                            · {localMenuItems.reduce((total, item) => total + (item.submenu_items?.length || 0), 0)} submenu
                          </span>
                        )}
                      </span>
                      <span className="hidden sm:inline ml-1 text-xs font-normal text-gray-500">(drag to reorder)</span>
                    </label>
                    {!isAddingMenuItem && (
                      <button
                        onClick={() => setIsAddingMenuItem(true)}
                        className="w-full sm:w-auto px-3 py-1.5 text-xs font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Menu Item
                      </button>
                    )}
                  </div>
                </div>

                {/* Add Menu Item Form */}
                {isAddingMenuItem && (
                  <div className="mb-4 p-4 bg-sky-50 border border-sky-200 rounded-lg">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      New Menu Item Name
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMenuItemName}
                        onChange={(e) => setNewMenuItemName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddMenuItem();
                          if (e.key === 'Escape') { setNewMenuItemName(''); setIsAddingMenuItem(false); }
                        }}
                        placeholder="Enter menu item name..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                        autoFocus
                      />
                      <button
                        onClick={handleAddMenuItem}
                        disabled={!newMenuItemName.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        Create
                      </button>
                      <button
                        onClick={() => { setNewMenuItemName(''); setIsAddingMenuItem(false); }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {localMenuItems.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <p className="text-sm font-medium">No menu items found</p>
                    <p className="text-xs mt-1">Add menu items to display them in the header</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={localMenuItems.map((item) => item.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                        {localMenuItems.map((item) => (
                          <SortableItem
                            key={item.id}
                            item={item}
                            onToggle={handleToggleVisibility}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                            onSubmenuEdit={handleSubmenuEdit}
                            onSubmenuToggle={handleSubmenuToggle}
                            onSubmenuDelete={handleDeleteSubmenuItem}
                            onAddSubmenu={handleAddSubmenuItem}
                            onSubmenuReorder={handleSubmenuReorder}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>
          )}

          {/* Information Card - Above Footer */}
          <div className="mt-6 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-white px-4 py-3">
            <p className="text-sm text-sky-900 font-medium mb-1">
              💡 Customize your website header
            </p>
            <p className="text-xs text-sky-800">
              Choose a header style and manage menu items visibility and order. Drag items to reorder them.
            </p>
          </div>

          {/* Error Display */}
          {saveError && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          )}
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 rounded-lg hover:from-sky-600 hover:to-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </BaseModal>

    {/* Delete Confirmation Modal */}
    {deleteConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white shadow-lg rounded-lg p-6 w-96 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Confirm Deletion</h2>
          <p className="text-sm mb-4 text-gray-600">
            Are you sure you want to delete the {deleteConfirm.type === 'menu' ? 'menu' : 'submenu'} item <strong>"{deleteConfirm.name}"</strong>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <button 
              onClick={() => setDeleteConfirm(null)} 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete} 
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}

export default HeaderEditModal;
