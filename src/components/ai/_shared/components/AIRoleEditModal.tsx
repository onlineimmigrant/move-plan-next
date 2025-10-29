'use client';

import React from 'react';
import Tooltip from '@/components/Tooltip';
import type { AIRoleFormData, AIPredefinedRole, AIThemeColors } from '../types';

// Generic model interface for the modal
export interface AIRoleEditModel {
  id: string | number;
  name: string;
  role?: string | null;
  system_message?: string;
  type?: 'default' | 'user' | 'system';
}

interface AIRoleEditModalProps {
  isOpen: boolean;
  selectedModel: AIRoleEditModel | null;
  roleData: AIRoleFormData;
  setRoleData: React.Dispatch<React.SetStateAction<AIRoleFormData>>;
  filteredRoles: AIPredefinedRole[];
  roleQuery: string;
  setRoleQuery: (query: string) => void;
  onClose: () => void;
  onSave: () => void;
  loading: boolean;
  primary: AIThemeColors;
  context: 'admin' | 'account';
  onTasksUpdate?: (tasks: Array<{ name: string; system_message: string }> | null) => void; // New prop for tasks
}

export function AIRoleEditModal({
  isOpen,
  selectedModel,
  roleData,
  setRoleData,
  filteredRoles,
  roleQuery,
  setRoleQuery,
  onClose,
  onSave,
  loading,
  primary,
  context,
  onTasksUpdate
}: AIRoleEditModalProps) {
  if (!isOpen || !selectedModel) return null;

  // Check if user can edit this model
  // System models are read-only, default models are read-only for account users
  const canEdit = context === 'admin' 
    ? selectedModel.type !== 'system' // Admin can edit all except system models
    : selectedModel.type === 'user'; // Account users can only edit their own models

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden border-2"
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          borderColor: primary.light,
          boxShadow: `0 25px 50px -12px ${primary.base}40`,
          animation: 'slideUp 0.3s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div 
          className="relative px-6 sm:px-8 py-5 sm:py-6 border-b"
          style={{ 
            borderColor: primary.lighter,
            background: `linear-gradient(to right, ${primary.lighter}, white)`
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
                style={{ 
                  backgroundColor: primary.lighter,
                  borderColor: primary.light,
                }}
              >
                <svg className="h-8 w-8 sm:h-10 sm:w-10 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: primary.dark || primary.base }} strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedModel.name}</h2>
                <p className="text-sm sm:text-base font-bold" style={{ color: primary.dark || primary.base }}>
                  {canEdit ? 'Edit Role & System Message' : 'View Role & System Message (Read-only)'}
                </p>
              </div>
            </div>
            <Tooltip content="Close">
              <button
                onClick={onClose}
                className="h-11 w-11 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-105 hover:rotate-90 border-2"
                style={{ 
                  backgroundColor: '#f3f4f6',
                  borderColor: '#d1d5db',
                  color: '#6b7280'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#f3f4f6';
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                <svg className="h-5 w-5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </Tooltip>
          </div>

          {/* Permission notice */}
          {!canEdit && (
            <div 
              className="mt-4 p-3 rounded-xl border-2 flex items-start gap-3"
              style={{
                backgroundColor: selectedModel.type === 'system' ? '#f3e8ff' : '#fef3c7',
                borderColor: selectedModel.type === 'system' ? '#c084fc' : '#fbbf24'
              }}
            >
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: selectedModel.type === 'system' ? '#6b21a8' : '#d97706' }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-sm"
                style={{ color: selectedModel.type === 'system' ? '#6b21a8' : '#92400e' }}
              >
                <p className="font-bold">Read-only mode</p>
                <p className="text-xs mt-1">
                  {selectedModel.type === 'system' 
                    ? 'System models are managed by the superadmin and cannot be edited.'
                    : 'You can only edit roles for your own custom models.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="overflow-y-auto p-6 sm:p-8" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-3">
                Select Role
              </label>
              
              {/* Role Search Input */}
              {canEdit && (
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={roleQuery}
                    onChange={(e) => setRoleQuery(e.target.value)}
                    placeholder="Search roles..."
                    className="w-full px-4 py-2.5 pl-10 rounded-xl border-2 focus:outline-none transition-all text-sm"
                    style={{
                      borderColor: primary.light,
                      backgroundColor: primary.lighter,
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primary.base;
                      e.currentTarget.style.backgroundColor = primary.lighter;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = primary.light;
                      e.currentTarget.style.backgroundColor = primary.lighter;
                    }}
                    disabled={!canEdit}
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: primary.base }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  {roleQuery && canEdit && (
                    <button
                      onClick={() => setRoleQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors"
                      style={{ color: primary.base }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = primary.hover || primary.base;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = primary.base;
                      }}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredRoles.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => {
                      if (canEdit) {
                        setRoleData({ 
                          ...roleData, 
                          role: role.value,
                          systemMessage: role.systemMessage // Auto-populate system message
                        });
                        // Auto-populate tasks if available
                        if (onTasksUpdate && role.tasks) {
                          onTasksUpdate(role.tasks);
                        }
                      }
                    }}
                    className="text-left p-4 rounded-xl border-2 transition-all duration-300"
                    style={{
                      backgroundColor: roleData.role === role.value ? primary.lighter : 'white',
                      borderColor: roleData.role === role.value ? primary.light : '#e5e7eb',
                      boxShadow: roleData.role === role.value ? `0 4px 12px ${primary.base}30` : '0 1px 3px rgba(0,0,0,0.05)',
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      opacity: canEdit ? 1 : 0.6
                    }}
                    disabled={!canEdit}
                    onMouseEnter={(e) => {
                      if (canEdit) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <div className="font-bold text-sm" style={{ color: roleData.role === role.value ? (primary.dark || primary.base) : '#374151' }}>
                      {role.label}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {role.description}
                    </div>
                  </button>
                ))}
                {filteredRoles.length === 0 && roleQuery && canEdit && (
                  <div className="col-span-2 text-center py-8 text-gray-500 text-sm">
                    No roles found matching "{roleQuery}"
                  </div>
                )}
                <button
                  onClick={() => canEdit && setRoleData({ ...roleData, role: 'custom' })}
                  className="text-left p-4 rounded-xl border-2 transition-all duration-300"
                  style={{
                    backgroundColor: roleData.role === 'custom' ? primary.lighter : 'white',
                    borderColor: roleData.role === 'custom' ? primary.light : '#e5e7eb',
                    borderStyle: roleData.role === 'custom' ? 'solid' : 'dashed',
                    boxShadow: roleData.role === 'custom' ? `0 4px 12px ${primary.base}30` : '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: canEdit ? 'pointer' : 'not-allowed',
                    opacity: canEdit ? 1 : 0.6
                  }}
                  disabled={!canEdit}
                  onMouseEnter={(e) => {
                    if (canEdit) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} style={{ color: roleData.role === 'custom' ? (primary.dark || primary.base) : '#6b7280' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="font-bold text-sm" style={{ color: roleData.role === 'custom' ? (primary.dark || primary.base) : '#374151' }}>
                      Custom Role
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Define your own role
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Role Input */}
            {roleData.role === 'custom' && (
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Custom Role Name *
                </label>
                <input
                  type="text"
                  value={roleData.customRole}
                  onChange={(e) => setRoleData({ ...roleData, customRole: e.target.value })}
                  placeholder="e.g., Content Moderator, SEO Expert"
                  className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all"
                  style={{
                    borderColor: primary.light,
                    backgroundColor: primary.lighter,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = primary.base;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = primary.light;
                  }}
                  disabled={!canEdit}
                />
              </div>
            )}

            {/* System Message */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                System Message *
              </label>
              <textarea
                value={roleData.systemMessage}
                onChange={(e) => setRoleData({ ...roleData, systemMessage: e.target.value })}
                placeholder="Define the AI's behavior and personality..."
                rows={8}
                className="w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all resize-y min-h-[160px]"
                style={{
                  borderColor: primary.light,
                  backgroundColor: 'white',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = primary.base;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = primary.light;
                }}
                disabled={!canEdit}
              />
              <p className="text-xs text-gray-500 mt-2">
                This message defines how the AI agent will behave and respond to users
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div 
          className="px-6 sm:px-8 py-4 sm:py-5 border-t flex gap-3"
          style={{ 
            borderColor: primary.lighter,
            backgroundColor: primary.lighter + '40'
          }}
        >
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] border-2"
            style={{ 
              backgroundColor: 'white',
              borderColor: '#d1d5db',
              color: '#6b7280'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            {canEdit ? 'Cancel' : 'Close'}
          </button>
          {canEdit && (
            <button
              onClick={onSave}
              disabled={loading || (roleData.role === 'custom' && !roleData.customRole.trim())}
              className="flex-1 px-6 py-3 rounded-xl font-bold text-base transition-all duration-300 hover:scale-[1.02] shadow-lg border-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: primary.base,
                borderColor: primary.hover || primary.base,
                color: 'white'
              }}
              onMouseEnter={(e) => {
                if (!loading && !(roleData.role === 'custom' && !roleData.customRole.trim())) {
                  e.currentTarget.style.backgroundColor = primary.hover || primary.base;
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = primary.base;
                e.currentTarget.style.color = 'white';
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIRoleEditModal;
