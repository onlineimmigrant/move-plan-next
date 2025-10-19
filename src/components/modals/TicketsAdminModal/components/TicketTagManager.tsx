/**
 * TicketTagManager Component
 * Interface for managing tags on a ticket
 */

import React, { useState } from 'react';
import { Tag, Plus, X, Edit2, Trash2 } from 'lucide-react';
import type { TicketTag } from '../types';

interface TicketTagManagerProps {
  ticketId: string;
  assignedTags: TicketTag[];
  availableTags: TicketTag[];
  onAssignTag: (ticketId: string, tagId: string) => Promise<void>;
  onRemoveTag: (ticketId: string, tagId: string) => Promise<void>;
  onCreateTag?: () => void;
  onEditTag?: (tagId: string) => void;
  onDeleteTag?: (tagId: string) => Promise<void>;
  disabled?: boolean;
  showManagement?: boolean;
}

export function TicketTagManager({
  ticketId,
  assignedTags,
  availableTags,
  onAssignTag,
  onRemoveTag,
  onCreateTag,
  onEditTag,
  onDeleteTag,
  disabled = false,
  showManagement = false,
}: TicketTagManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  /**
   * Get unassigned tags
   */
  const unassignedTags = availableTags.filter(
    tag => !assignedTags.some(t => t.id === tag.id)
  );

  /**
   * Handle tag assignment
   */
  const handleAssignTag = async (tagId: string) => {
    if (disabled) return;
    
    try {
      await onAssignTag(ticketId, tagId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to assign tag:', error);
    }
  };

  /**
   * Handle tag removal
   */
  const handleRemoveTag = async (tagId: string) => {
    if (disabled) return;
    
    setIsRemoving(tagId);
    try {
      await onRemoveTag(ticketId, tagId);
    } finally {
      setIsRemoving(null);
    }
  };

  /**
   * Handle tag deletion
   */
  const handleDeleteTag = async (tagId: string) => {
    if (disabled || !onDeleteTag) return;
    
    setIsDeleting(tagId);
    try {
      await onDeleteTag(tagId);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-2">
      {/* Assigned Tags */}
      <div className="flex flex-wrap gap-2">
        {assignedTags.length > 0 ? (
          assignedTags.map(tag => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all hover:shadow-sm"
              style={{
                backgroundColor: `${tag.color}15`,
                borderColor: `${tag.color}40`,
                color: tag.color,
              }}
            >
              {tag.icon && <span>{tag.icon}</span>}
              <span>{tag.name}</span>
              {!disabled && (
                <button
                  onClick={() => handleRemoveTag(tag.id)}
                  disabled={isRemoving === tag.id}
                  className="hover:opacity-70 transition-opacity disabled:opacity-50"
                  title="Remove tag"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        ) : (
          <span className="text-xs text-slate-400 italic">No tags assigned</span>
        )}
      </div>

      {/* Add Tag Dropdown */}
      {!disabled && unassignedTags.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Plus className="h-3 w-3" />
            <span>Add Tag</span>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-slate-200 z-20 max-h-64 overflow-y-auto">
                <div className="p-1">
                  {unassignedTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => handleAssignTag(tag.id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-slate-50 transition-colors text-left"
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.icon && <span>{tag.icon}</span>}
                      <span className="flex-1 truncate">{tag.name}</span>
                      
                      {/* Tag management actions */}
                      {showManagement && (
                        <div className="flex items-center gap-1">
                          {onEditTag && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditTag(tag.id);
                                setIsOpen(false);
                              }}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                              title="Edit tag"
                            >
                              <Edit2 className="h-3 w-3 text-slate-600" />
                            </button>
                          )}
                          {onDeleteTag && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTag(tag.id);
                              }}
                              disabled={isDeleting === tag.id}
                              className="p-1 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                              title="Delete tag"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </button>
                          )}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Create New Tag Button */}
                {onCreateTag && (
                  <>
                    <div className="border-t border-slate-200 my-1" />
                    <div className="p-1">
                      <button
                        onClick={() => {
                          onCreateTag();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Create New Tag</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Create Tag Button (when no tags available) */}
      {!disabled && unassignedTags.length === 0 && availableTags.length === 0 && onCreateTag && (
        <button
          onClick={onCreateTag}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-300 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
        >
          <Tag className="h-3 w-3" />
          <span>Create First Tag</span>
        </button>
      )}
    </div>
  );
}
