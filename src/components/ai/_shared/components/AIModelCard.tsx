/**
 * AI Model Card Component
 * Flexible card component for displaying AI models in admin and account contexts
 * Matches the original ModelCard styling with enhanced features
 */

'use client';

import React from 'react';
import { AIIcons } from './AIIcons';
import type { AIModelCardProps } from '../types';

// ============================================================================
// Component
// ============================================================================

export const AIModelCard: React.FC<AIModelCardProps> = ({
  model,
  type,
  context,
  selectedModel,
  primary,
  onEdit,
  onDelete,
  onToggleActive,
  onSelect,
  onOpenRoleModal,
  onOpenTaskModal,
  t
}) => {
  // Check if this model is selected (for account context)
  const isSelected = selectedModel?.id === model.id && selectedModel?.type === type;

  // Default primary colors if not provided
  const primaryColors = primary || {
    base: '#3b82f6',
    light: '#93c5fd',
    lighter: '#dbeafe',
    dark: '#2563eb',
    darker: '#1e40af'
  };

  // Handle actions
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit(model);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(model.id, model.name);
  };

  const handleToggleActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleActive) onToggleActive(model.id, !model.is_active);
  };

  const handleSelect = () => {
    if (onSelect && context === 'account') onSelect(model.id, type);
  };

  const handleOpenRole = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenRoleModal) onOpenRoleModal(model);
  };

  const handleOpenTask = (e: React.MouseEvent, mode: 'view' | 'add') => {
    e.stopPropagation();
    if (onOpenTaskModal) onOpenTaskModal(model, mode);
  };

  // Determine if this model should have primary border (stronger visual presence)
  const usePrimaryBorder = context === 'admin' 
    ? model.type === 'system' // Admin: only system models get primary border
    : (model.type === 'system' || model.type === 'default'); // Account: both system and default models get primary border

  return (
    <li
      className="relative bg-white rounded-2xl group overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ 
        border: `2px solid ${usePrimaryBorder ? primaryColors.base : primaryColors.lighter}`,
        boxShadow: usePrimaryBorder
          ? `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.base}`
          : `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.lighter}`,
        cursor: context === 'account' ? 'pointer' : 'default'
      }}
      onMouseEnter={(e) => {
        if (usePrimaryBorder) {
          e.currentTarget.style.borderColor = primaryColors.base;
          e.currentTarget.style.boxShadow = `0 12px 32px -8px ${primaryColors.base}35, 0 0 0 1px ${primaryColors.base}`;
        } else {
          e.currentTarget.style.borderColor = primaryColors.light;
          e.currentTarget.style.boxShadow = `0 12px 32px -8px ${primaryColors.base}25, 0 0 0 1px ${primaryColors.light}`;
        }
      }}
      onMouseLeave={(e) => {
        if (usePrimaryBorder) {
          e.currentTarget.style.borderColor = primaryColors.base;
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.base}`;
        } else {
          e.currentTarget.style.borderColor = primaryColors.lighter;
          e.currentTarget.style.boxShadow = `0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px ${primaryColors.lighter}`;
        }
      }}
      onClick={context === 'account' ? handleSelect : undefined}
    >
      {/* Main Content Row */}
      <div className="flex items-center justify-between py-3 sm:py-4 px-4 sm:px-5">
        {/* Left: Icon + Name */}
        <div className="flex items-center gap-3 sm:gap-4 flex-grow min-w-0">
          {/* Model Icon */}
          <div 
            className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex-shrink-0 flex items-center justify-center transition-all duration-300 group-hover:scale-[1.08] shadow-lg"
            style={{ 
              backgroundColor: primaryColors.lighter,
              border: `2px solid ${primaryColors.light}`,
            }}
          >
            {model.icon ? (
              <img
                className="h-7 w-7 sm:h-10 sm:w-10 object-contain relative z-10"
                src={model.icon}
                alt={`${model.name} icon`}
                onError={(e) => {
                  const parent = e.currentTarget.parentElement;
                  if (parent) {
                    parent.innerHTML = `<svg class="h-7 w-7 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: ${primaryColors.base}"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;
                  }
                }}
              />
            ) : (
              <AIIcons.Sparkles className="h-7 w-7 sm:h-10 sm:w-10 relative z-10" style={{ color: primaryColors.base }} />
            )}
            {/* Animated background glow */}
            <div 
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ 
                background: `radial-gradient(circle at center, ${primaryColors.base} 0%, transparent 70%)`,
                filter: 'blur(12px)',
              }}
            />
          </div>
          
          {/* Model Name and Badges */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className={`font-bold text-base sm:text-lg truncate tracking-tight ${
                context === 'admin' && model.user_role_to_access === 'admin' ? 'text-sky-600' : 'text-gray-900'
              }`}>
                {model.name}
              </h3>
              
              {/* Context-aware badge display */}
              {context === 'admin' ? (
                /* Admin context: Show System badge for system models, Admin badge for admin-role models */
                model.type === 'system' ? (
                  <span 
                    className="px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-sm border"
                    style={{ 
                      backgroundColor: '#f3e8ff',
                      color: '#6b21a8',
                      borderColor: '#c084fc'
                    }}
                  >
                    System
                  </span>
                ) : model.user_role_to_access === 'admin' && (
                  <span 
                    className="px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-sm border"
                    style={{ 
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderColor: '#93c5fd'
                    }}
                  >
                    Admin
                  </span>
                )
              ) : (
                /* Account context: Show "Default" badge for both system and default models */
                (model.type === 'system' || model.type === 'default') && (
                  <span 
                    className="px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-sm border"
                    style={{ 
                      backgroundColor: '#dbeafe',
                      color: '#1e40af',
                      borderColor: '#93c5fd'
                    }}
                  >
                    Default
                  </span>
                )
              )}
              
              {/* Role Badge */}
              {model.role && (
                <button
                  onClick={(context === 'account' && (model.type === 'system' || model.type === 'default')) ? undefined : handleOpenRole}
                  className={`group/rolebadge relative px-3 py-1.5 text-[10px] sm:text-xs font-bold rounded-xl shadow-md border-2 transition-all duration-300 ${
                    (context === 'account' && (model.type === 'system' || model.type === 'default')) 
                      ? 'cursor-not-allowed opacity-75' 
                      : 'hover:scale-105 cursor-pointer'
                  }`}
                  style={{ 
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderColor: '#fbbf24'
                  }}
                  onMouseEnter={(e) => {
                    if (!(context === 'account' && (model.type === 'system' || model.type === 'default'))) {
                      e.currentTarget.style.backgroundColor = '#fde68a';
                      e.currentTarget.style.borderColor = '#f59e0b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(context === 'account' && (model.type === 'system' || model.type === 'default'))) {
                      e.currentTarget.style.backgroundColor = '#fef3c7';
                      e.currentTarget.style.borderColor = '#fbbf24';
                    }
                  }}
                  title={(context === 'account' && (model.type === 'system' || model.type === 'default')) 
                    ? 'Default model role (read-only)' 
                    : 'Click to edit role'}
                  disabled={context === 'account' && (model.type === 'system' || model.type === 'default')}
                >
                  <span className="flex items-center gap-1">
                    <AIIcons.User className="h-3 w-3" />
                    {model.role}
                  </span>
                </button>
              )}
            </div>
            
            {/* Active Status */}
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              {model.is_active ? (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  Inactive
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {context === 'admin' ? (
            <>
              {/* Edit Button - Hide for system models */}
              {onEdit && model.type !== 'system' && (
                <button
                  onClick={handleEdit}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 shadow-md border-2"
                  style={{ 
                    backgroundColor: primaryColors.lighter,
                    borderColor: primaryColors.light,
                    color: primaryColors.base
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColors.light;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColors.lighter;
                    e.currentTarget.style.color = primaryColors.base;
                  }}
                  aria-label="Edit model"
                  title="Edit Model"
                >
                  <AIIcons.Pencil className="h-5 w-5" />
                </button>
              )}
              
              {/* Delete Button - Hide for system models */}
              {onDelete && model.type !== 'system' && (
                <button
                  onClick={handleDelete}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-105 shadow-md border-2"
                  style={{ 
                    backgroundColor: '#fee2e2',
                    borderColor: '#fca5a5',
                    color: '#dc2626'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fca5a5';
                    e.currentTarget.style.color = '#991b1b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  aria-label="Delete model"
                  title="Delete Model"
                >
                  <AIIcons.Trash className="h-5 w-5" />
                </button>
              )}
              
              {/* Toggle Active Button */}
              {onToggleActive && (
                <button
                  onClick={handleToggleActive}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md border-2"
                  style={
                    model.is_active 
                      ? { 
                          backgroundColor: '#dcfce7',
                          borderColor: '#86efac',
                          color: '#16a34a'
                        } 
                      : { 
                          backgroundColor: '#f3f4f6',
                          borderColor: '#d1d5db',
                          color: '#6b7280'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (model.is_active) {
                      e.currentTarget.style.backgroundColor = '#bbf7d0';
                      e.currentTarget.style.color = '#15803d';
                    } else {
                      e.currentTarget.style.backgroundColor = '#e5e7eb';
                      e.currentTarget.style.color = '#374151';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (model.is_active) {
                      e.currentTarget.style.backgroundColor = '#dcfce7';
                      e.currentTarget.style.color = '#16a34a';
                    } else {
                      e.currentTarget.style.backgroundColor = '#f3f4f6';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                  aria-label={model.is_active ? 'Deactivate model' : 'Activate model'}
                  title={model.is_active ? 'Deactivate' : 'Activate'}
                >
                  {model.is_active ? (
                    <AIIcons.Check className="h-5 w-5" />
                  ) : (
                    <AIIcons.X className="h-5 w-5" />
                  )}
                </button>
              )}
            </>
          ) : (
            <>
              {/* Account Context: Select/Edit Buttons */}
              {isSelected && (
                <div className="px-3 py-1.5 rounded-xl shadow-sm border flex items-center gap-1.5 text-xs sm:text-sm font-bold"
                  style={{
                    backgroundColor: primaryColors.lighter,
                    borderColor: primaryColors.light,
                    color: primaryColors.base
                  }}
                >
                  <AIIcons.Check className="h-4 w-4" />
                  Selected
                </div>
              )}
              {onEdit && type === 'user' && (
                <button
                  onClick={handleEdit}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md border-2"
                  style={{ 
                    backgroundColor: primaryColors.lighter,
                    borderColor: primaryColors.light,
                    color: primaryColors.base
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColors.light;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = primaryColors.lighter;
                    e.currentTarget.style.color = primaryColors.base;
                  }}
                  aria-label="Edit model"
                  title="Edit Model"
                >
                  <AIIcons.Pencil className="h-5 w-5" />
                </button>
              )}
              {onDelete && type === 'user' && (
                <button
                  onClick={handleDelete}
                  className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-md border-2"
                  style={{ 
                    backgroundColor: '#fee2e2',
                    borderColor: '#fca5a5',
                    color: '#dc2626'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#fca5a5';
                    e.currentTarget.style.color = '#991b1b';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fee2e2';
                    e.currentTarget.style.color = '#dc2626';
                  }}
                  aria-label="Delete model"
                  title="Delete Model"
                >
                  <AIIcons.Trash className="h-5 w-5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tasks Row */}
      <div 
        className="px-4 sm:px-5 pb-3 sm:pb-4 pt-3 border-t bg-gray-50/50"
        style={{ 
          borderColor: primaryColors.lighter,
        }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs sm:text-sm font-bold" style={{ color: primaryColors.base }}>
            Tasks
          </span>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {model.task && Array.isArray(model.task) && model.task.length > 0 ? (
              <>
                {model.task.map((task: any, index: number) => {
                  const taskName = typeof task === 'string' ? task : task.name;
                  return (
                    <button
                      key={index}
                      onClick={(e) => handleOpenTask(e, 'view')}
                      className="inline-flex items-center flex-shrink-0 whitespace-nowrap px-3 py-1.5 bg-slate-100 text-slate-600 text-xs sm:text-sm font-medium rounded-full hover:bg-slate-200 transition-colors duration-200"
                    >
                      {taskName}
                    </button>
                  );
                })}
                {/* Add Task Button - Hide for system models, show for admin or account with user models */}
                {onOpenTaskModal && model.type !== 'system' && (context === 'admin' || (context === 'account' && type === 'user')) && (
                  <button
                    onClick={(e) => handleOpenTask(e, 'add')}
                    className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-slate-200 bg-slate-100"
                    aria-label="Add task"
                    title="Add Task"
                  >
                    <AIIcons.Plus className="h-4 w-4 text-slate-600" />
                  </button>
                )}
              </>
            ) : onOpenTaskModal && model.type !== 'system' && (context === 'admin' || (context === 'account' && type === 'user')) ? (
              <button
                onClick={(e) => handleOpenTask(e, 'add')}
                className="px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-sm hover:shadow-md border-2"
                style={{ 
                  backgroundColor: primaryColors.lighter,
                  color: primaryColors.base,
                  borderColor: primaryColors.light,
                  borderStyle: 'dashed'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColors.light;
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderStyle = 'solid';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColors.lighter;
                  e.currentTarget.style.color = primaryColors.base;
                  e.currentTarget.style.borderStyle = 'dashed';
                }}
              >
                <AIIcons.Plus className="h-4 w-4" />
                Add task
              </button>
            ) : (
              <span className="text-xs sm:text-sm text-gray-400 italic">
                No tasks
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
};
