/**
 * AI Tab Navigation Component
 * Shared tab navigation for AI model management
 * Used in both admin and account contexts
 */

'use client';

import React from 'react';
import type { TabType, ThemeColors } from '../types/aiManagement';
import { AIIcons } from './AIIcons';

interface AITabNavigationProps {
  activeTab: TabType;
  selectedEditModel: { id: number; name: string } | null;
  primary: ThemeColors;
  onTabChange: (tab: TabType) => void;
  context?: 'admin' | 'account';
  useModal?: boolean; // New prop to enable modal mode
  onAddClick?: () => void; // Callback for Add button in modal mode
}

export default function AITabNavigation({
  activeTab,
  selectedEditModel,
  primary,
  onTabChange,
  context = 'admin',
  useModal = false,
  onAddClick,
}: AITabNavigationProps) {
  const ServerIcon = AIIcons.Server;
  const PlusIcon = AIIcons.Plus;
  const EditIcon = AIIcons.Pencil;
  const SparklesIcon = AIIcons.Sparkles;

  const addLabel = context === 'admin' ? 'Add Model' : 'Add Model';

  const handleAddClick = () => {
    if (useModal && onAddClick) {
      onAddClick();
    } else {
      onTabChange('add');
    }
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-full pb-1">
        <button
          onClick={() => onTabChange('models')}
          className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 shadow-sm hover:shadow-md"
          style={{
            backgroundColor: activeTab === 'models' ? primary.base : 'white',
            color: activeTab === 'models' ? 'white' : primary.base,
            border: `1px solid ${activeTab === 'models' ? primary.base : `${primary.light}40`}`,
          }}
        >
          <ServerIcon />
          <span>Models</span>
        </button>
        <button
          onClick={handleAddClick}
          className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 shadow-sm hover:shadow-md"
          style={{
            backgroundColor: (!useModal && activeTab === 'add') ? primary.base : 'white',
            color: (!useModal && activeTab === 'add') ? 'white' : primary.base,
            border: `1px solid ${(!useModal && activeTab === 'add') ? primary.base : `${primary.light}40`}`,
          }}
        >
          <PlusIcon />
          <span>{addLabel}</span>
        </button>
        {context === 'admin' && !useModal && (
          <button
            onClick={() => onTabChange('system')}
            className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 shadow-sm hover:shadow-md"
            style={{
              backgroundColor: activeTab === 'system' ? primary.base : 'white',
              color: activeTab === 'system' ? 'white' : primary.base,
              border: `1px solid ${activeTab === 'system' ? primary.base : `${primary.light}40`}`,
            }}
          >
            <SparklesIcon />
            <span>System</span>
          </button>
        )}
        {!useModal && selectedEditModel && (
          <button
            onClick={() => onTabChange('edit')}
            className="px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 inline-flex items-center gap-2 shadow-sm hover:shadow-md max-w-[250px]"
            style={{
              backgroundColor: activeTab === 'edit' ? primary.base : 'white',
              color: activeTab === 'edit' ? 'white' : primary.base,
              border: `1px solid ${activeTab === 'edit' ? primary.base : `${primary.light}40`}`,
            }}
          >
            <EditIcon className="flex-shrink-0" />
            <span className="truncate">Edit: {selectedEditModel.name}</span>
          </button>
        )}
      </div>
    </div>
  );
}
