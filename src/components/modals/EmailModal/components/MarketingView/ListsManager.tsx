'use client';

import React, { useState } from 'react';
import { useEmailLists } from '../../hooks/useEmailLists';
import { useSubscribers } from '../../hooks/useSubscribers';
import { 
  Plus,
  Search,
  Users,
  Mail,
  Trash2,
  Edit,
  Upload,
  UserPlus
} from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/modals/ShopModal/components';

interface ListsManagerProps {
  primary: { base: string; hover: string };
  searchQuery?: string;
}

export default function ListsManager({ primary, searchQuery = '' }: ListsManagerProps) {
  const { lists, isLoading, createList, deleteList } = useEmailLists();
  const { subscribers, fetchSubscribers } = useSubscribers();
  const [selectedList, setSelectedList] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    const result = await createList({
      name: newListName,
      description: newListDescription || null,
    });

    if (result) {
      setShowCreateModal(false);
      setNewListName('');
      setNewListDescription('');
    }
  };

  const handleDeleteList = async (id: number) => {
    if (confirm('Are you sure you want to delete this list? All subscribers will be removed.')) {
      await deleteList(id);
      if (selectedList === id) {
        setSelectedList(null);
      }
    }
  };

  const handleSelectList = async (listId: number) => {
    setSelectedList(listId);
    await fetchSubscribers(listId);
  };

  const filteredLists = searchQuery
    ? lists.filter((list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lists;

  if (isLoading) {
    return <LoadingState message="Loading subscriber lists..." />;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            Subscriber Lists
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your email subscriber lists
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium min-h-[44px] text-sm justify-center"
          style={{
            background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
            color: 'white'
          }}
        >
          <Plus className="w-4 h-4" />
          New List
        </button>
      </div>

      {/* Lists Grid */}
      {filteredLists.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
          {filteredLists.map((list) => (
            <div
              key={list.id}
              className={`bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border p-4 hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all cursor-pointer ${
                selectedList === list.id
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-white/20'
              }`}
              onClick={() => handleSelectList(list.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedList === list.id ? 'bg-primary/10' : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      selectedList === list.id ? 'text-primary' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {list.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {list.subscriber_count} subscribers
                    </p>
                  </div>
                </div>
              </div>

              {list.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {list.description}
                </p>
              )}

              <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectList(list.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  <UserPlus className="w-3 h-3" />
                  Add Subscribers
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id);
                  }}
                  className="px-3 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No lists found' : 'No subscriber lists yet'}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery
              ? 'Try a different search term'
              : 'Create your first subscriber list to organize your email contacts'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium"
              style={{
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              }}
            >
              <Plus className="w-4 h-4" />
              Create List
            </button>
          )}
        </div>
      )}

      {/* Create List Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New List
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  List Name *
                </label>
                <input
                  type="text"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="e.g., Newsletter Subscribers"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewListName('');
                  setNewListDescription('');
                }}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                disabled={!newListName.trim()}
                className="flex-1 px-4 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                  color: 'white'
                }}
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Selected List Subscribers (if needed) */}
      {selectedList && subscribers.length > 0 && (
        <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Subscribers ({subscribers.length})
          </h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {subscribers.slice(0, 10).map((subscriber) => (
              <div
                key={subscriber.id}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subscriber.first_name || subscriber.last_name
                        ? `${subscriber.first_name || ''} ${subscriber.last_name || ''}`.trim()
                        : subscriber.email}
                    </p>
                    {(subscriber.first_name || subscriber.last_name) && (
                      <p className="text-xs text-gray-500">{subscriber.email}</p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  subscriber.status === 'active'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {subscriber.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
