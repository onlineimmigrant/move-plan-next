'use client';

import React, { useState } from 'react';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { 
  Plus,
  Search,
  Filter,
  FileText,
  Mail,
  Megaphone,
  Bell,
  Edit,
  Copy,
  Trash2,
  Eye
} from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/modals/ShopModal/components';

interface TemplatesListProps {
  onEdit: (id: number) => void;
  onPreview: (id: number) => void;
  primary: { base: string; hover: string };
  searchQuery?: string;
}

export default function TemplatesList({ onEdit, onPreview, primary, searchQuery = '' }: TemplatesListProps) {
  const { 
    templates, 
    isLoading, 
    deleteTemplate, 
    duplicateTemplate 
  } = useEmailTemplates();
  const [typeFilter, setTypeFilter] = useState('all');

  const getTypeIcon = (category: string | null | undefined) => {
    switch (category) {
      case 'transactional':
        return Mail;
      case 'marketing':
        return Megaphone;
      case 'system':
        return Bell;
      default:
        return FileText;
    }
  };

  const getTypeColor = (category: string | null | undefined) => {
    const colors = {
      transactional: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      marketing: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
      system: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
  };

  const filteredTemplates = templates.filter((template) => {
    if (typeFilter !== 'all' && template.category !== typeFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name?.toLowerCase().includes(query) ||
        template.subject?.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleDuplicate = async (id: number) => {
    await duplicateTemplate(id);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(id);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading templates..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Email Templates
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Manage your email templates
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          >
            <option value="all">All Types</option>
            <option value="transactional">Transactional</option>
            <option value="marketing">Marketing</option>
            <option value="system">System</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => {
            const TypeIcon = getTypeIcon(template.category);
            return (
              <div
                key={template.id}
                className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getTypeColor(template.category || 'notification')}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {template.name || 'Untitled Template'}
                      </h4>
                      <p className="text-xs text-gray-500 capitalize">
                        {template.category || template.type || 'general'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-2">
                  {template.subject || 'No subject'}
                </p>

                {template.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.description}
                  </p>
                )}

                {!template.description && template.html_code && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {template.html_code.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => onEdit(template.id)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors font-medium"
                    style={{
                      background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                      color: 'white'
                    }}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => onPreview(template.id)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template.id)}
                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-12 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery || typeFilter !== 'all' ? 'No templates found' : 'No templates yet'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Create your first email template to get started'}
          </p>
          {!searchQuery && typeFilter === 'all' && (
            <button 
              onClick={() => onEdit(0)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              }}
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          )}
        </div>
      )}
    </div>
  );
}
