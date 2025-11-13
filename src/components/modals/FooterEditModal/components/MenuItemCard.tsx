/**
 * MenuItemCard - Sortable menu item card with submenu support
 * Shared between FooterEditModal and HeaderEditModal
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/hooks/useThemeColors';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import {
  Bars3Icon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { MenuItem, SubMenuItem } from '../types';
import { SortableSubmenuItem } from './SubmenuList';
import { DragEndEvent } from '@dnd-kit/core';

// Sortable Submenu Row Component
function SortableSubmenuRow({
  submenu,
  menuItemId,
  primary,
  onInlineEditOpen,
  onToggle,
  onDelete
}: {
  submenu: SubMenuItem;
  menuItemId: string;
  primary: any;
  onInlineEditOpen: (menuItemId: string, field: 'display_name' | 'url_name' | 'submenu_name' | 'submenu_url', currentValue: string, submenuId?: string) => void;
  onToggle: (menuItemId: string, submenuId: string) => void;
  onDelete: (menuItemId: string, submenuId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: submenu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
    >
      {/* Hamburger/Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <Bars3Icon 
          className="w-4 h-4 flex-shrink-0"
          style={{ color: primary.base }}
        />
      </div>
      
      {/* Submenu Name - Editable on double-click */}
      <span 
        className="flex-1 text-left font-medium cursor-pointer hover:text-opacity-80"
        onDoubleClick={(e) => {
          e.stopPropagation();
          onInlineEditOpen(menuItemId, 'submenu_name' as any, submenu.name, submenu.id);
        }}
        title="Double-click to edit"
      >
        {submenu.name}
      </span>
      
      {/* URL Icon */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onInlineEditOpen(menuItemId, 'submenu_url' as any, submenu.url_name, submenu.id);
        }}
        className="p-0.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
        style={{
          color: primary.base
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = `${primary.base}15`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '';
        }}
        title={`URL: /${submenu.url_name}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>

      {/* Toggle Visibility */}
      <button
        onClick={() => onToggle(menuItemId, submenu.id)}
        className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
      >
        {submenu.is_displayed ? (
          <EyeIcon className="w-3.5 h-3.5 text-gray-400" />
        ) : (
          <EyeSlashIcon className="w-3.5 h-3.5 text-gray-400" />
        )}
      </button>

      {/* Delete */}
      <button
        onClick={() => onDelete(menuItemId, submenu.id)}
        className="p-0.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
      >
        <TrashIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, field: 'display_name' | 'description' | 'url_name', value: string) => void;
  onSubmenuEdit: (menuItemId: string, submenuId: string, field: 'name' | 'description' | 'url_name' | 'image', value: string) => void;
  onSubmenuToggle: (menuItemId: string, submenuId: string) => void;
  onSubmenuDelete: (menuItemId: string, submenuId: string) => void;
  onAddSubmenu: (menuItemId: string, name: string, urlName: string) => void;
  onSubmenuReorder: (menuItemId: string, submenuItems: SubMenuItem[]) => void;
  onInlineEditOpen: (menuItemId: string, field: 'display_name' | 'url_name' | 'submenu_name' | 'submenu_url', currentValue: string, submenuId?: string) => void;
  onAddSubmenuOpen: (menuItemId: string) => void;
}

export function MenuItemCard({
  item,
  onToggle,
  onDelete,
  onEdit,
  onSubmenuEdit,
  onSubmenuToggle,
  onSubmenuDelete,
  onAddSubmenu,
  onSubmenuReorder,
  onInlineEditOpen,
  onAddSubmenuOpen
}: MenuItemCardProps) {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  // Setup sensors for submenu drag and drop
  const submenuSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handles drag end event for submenu items
   * Reorders submenu items and updates their order values
   */
  const handleSubmenuDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const submenuItems = item.submenu_items || [];
      const oldIndex = submenuItems.findIndex((s) => s.id === active.id);
      const newIndex = submenuItems.findIndex((s) => s.id === over.id);

      // Reorder and assign new order values (increments of 10)
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

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...(isDragging ? { 
          boxShadow: `0 10px 40px ${primary.base}40`,
          borderColor: primary.base
        } : {})
      }}
      className={cn(
        'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md overflow-hidden transition-all duration-200 flex flex-col',
        isDragging && 'scale-105 ring-2',
        item.is_displayed === false && 'opacity-60'
      )}
    >
      {/* Card Header */}
      <div 
        className="border-b px-3 py-2"
        style={isDragging ? {
          backgroundColor: `${primary.base}15`,
          borderColor: `${primary.base}30`
        } : {
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderColor: 'rgba(0, 0, 0, 0.1)'
        }}
      >
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
                  ? 'text-white'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
              style={item.is_displayed ? { backgroundColor: primary.base } : {}}
              onMouseEnter={(e) => {
                if (item.is_displayed) {
                  e.currentTarget.style.backgroundColor = primary.hover;
                }
              }}
              onMouseLeave={(e) => {
                if (item.is_displayed) {
                  e.currentTarget.style.backgroundColor = primary.base;
                }
              }}
              aria-label={item.is_displayed ? 'Hide menu item' : 'Show menu item'}
              title={item.is_displayed ? 'Visible - Click to hide' : 'Hidden - Click to show'}
            >
              {item.is_displayed ? <EyeIcon className="w-4 h-4" /> : <EyeSlashIcon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => onDelete(item.id)}
              className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
              aria-label="Delete menu item"
              title="Delete"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3 space-y-2 flex-1">
        {/* Title and URL Icon in One Row */}
        <div className="flex items-center gap-2 group">
          <h3 
            className="flex-1 text-sm font-semibold text-gray-900 dark:text-white leading-snug cursor-pointer hover:text-opacity-80"
            onDoubleClick={(e) => {
              onInlineEditOpen(item.id, 'display_name', item.display_name);
              e.stopPropagation();
            }}
            title="Double-click to edit"
          >
            {item.display_name}
          </h3>
          
          {/* URL Icon */}
          <button
            onClick={(e) => {
              onInlineEditOpen(item.id, 'url_name', item.url_name);
              e.stopPropagation();
            }}
            className="p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = primary.base;
              e.currentTarget.style.backgroundColor = `${primary.base}15`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '';
              e.currentTarget.style.backgroundColor = '';
            }}
            title={`URL: /${item.url_name}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>

        {/* Submenu Items */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-700/50 space-y-1">
          {/* Display Submenu Items with drag handle, name and URL icon */}
          {item.submenu_items && item.submenu_items.length > 0 && (
            <DndContext
              sensors={submenuSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleSubmenuDragEnd}
            >
              <SortableContext
                items={item.submenu_items.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {item.submenu_items.map((submenu: SubMenuItem) => (
                    <SortableSubmenuRow
                      key={submenu.id}
                      submenu={submenu}
                      menuItemId={item.id}
                      primary={primary}
                      onInlineEditOpen={onInlineEditOpen}
                      onToggle={onSubmenuToggle}
                      onDelete={onSubmenuDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

        </div>
      </div>

      {/* Fixed Bottom Panel - Add Submenu Button */}
      <div 
        className="border-t px-3 py-2 mt-auto"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderColor: 'rgba(0, 0, 0, 0.1)'
        }}
      >
        <button
          onClick={() => onAddSubmenuOpen(item.id)}
          className="w-full px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
          style={{ backgroundColor: primary.base }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = primary.hover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = primary.base;
          }}
          title="Add submenu item"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Submenu Item
        </button>
      </div>
    </div>
  );
}
