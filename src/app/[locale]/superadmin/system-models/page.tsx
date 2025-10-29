/**
 * System Models Management Page (Superadmin)
 * Manages system-wide AI models using shared components and patterns
 */

'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Button from '@/ui/Button';
import { useSystemModelManagement } from '@/components/ai/_shared/hooks/useSystemModelManagement';
import { 
  AILoadingSkeleton, 
  AINotification,
  SystemModelEditModal,
  AIIcons,
} from '@/components/ai/_shared';

// Icon aliases
const PlusIcon = AIIcons.Plus;
const SearchIcon = AIIcons.Search;

export default function SystemModelsPage() {
  const { isAdmin, isSuperadmin, isLoading } = useAuth();
  const router = useRouter();
  
  const {
    // Data
    filteredModels,
    selectedEditModel,
    newModel,
    
    // UI State
    loading,
    saving,
    error,
    successMessage,
    
    // Modal State
    modelEditModalOpen,
    modelEditMode,
    
    // Validation
    fieldErrors,
    touchedFields,
    hasUnsavedChanges,
    
    // Task State
    taskBuilder,
    
    // Filters
    modelSearch,
    filterPlan,
    filterActive,
    filterFeatured,
    sortBy,
    sortOrder,
    
    // Setters
    setError,
    setSuccessMessage,
    setModelSearch,
    setFilterPlan,
    setFilterActive,
    setFilterFeatured,
    setSortBy,
    setSortOrder,
    setTaskBuilder,
    setHasUnsavedChanges,
    
    // Actions
    openAddModelModal,
    selectModelForEdit,
    closeModelEditModal,
    addModel,
    updateModel,
    deleteModel,
    toggleModelActive,
    toggleModelFeatured,
    handleFieldChange,
    handleFieldBlur,
  } = useSystemModelManagement();
  
  // Check access
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAdmin) {
      router.push('/login');
      return;
    }
    
    if (!isSuperadmin) {
      router.push('/admin');
      return;
    }
  }, [isAdmin, isSuperadmin, isLoading, router]);
  
  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <AILoadingSkeleton count={6} />
      </div>
    );
  }
  
  if (!isSuperadmin) {
    return null;
  }
  
  const handleSubmit = () => {
    if (modelEditMode === 'edit') {
      updateModel();
    } else {
      addModel();
    }
  };
  
  const currentModel = modelEditMode === 'edit' ? selectedEditModel : newModel;
  
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              System AI Models
            </h1>
            <p className="text-gray-600">
              Manage system-wide AI models available to organizations
            </p>
          </div>
          <Button
            onClick={openAddModelModal}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add System Model
          </Button>
        </div>
      </div>
      
      {/* Notifications */}
      {error && (
        <AINotification
          type="error"
          message={error}
          onClose={() => setError(null)}
        />
      )}
      
      {successMessage && (
        <AINotification
          type="success"
          message={successMessage}
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                placeholder="Search models..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          
          {/* Plan Filter */}
          <div>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Sort & Featured Filter */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={filterFeatured === 'all'}
                onChange={() => setFilterFeatured('all')}
                className="text-purple-600 focus:ring-purple-500"
              />
              All Models
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={filterFeatured === 'featured'}
                onChange={() => setFilterFeatured('featured')}
                className="text-purple-600 focus:ring-purple-500"
              />
              Featured Only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={filterFeatured === 'regular'}
                onChange={() => setFilterFeatured('regular')}
                className="text-purple-600 focus:ring-purple-500"
              />
              Regular Only
            </label>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="sort_order">Sort Order</option>
              <option value="name">Name</option>
              <option value="created">Created Date</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{filteredModels.length}</div>
          <div className="text-sm text-gray-600">Total Models</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {filteredModels.filter(m => m.is_active).length}
          </div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">
            {filteredModels.filter(m => m.is_featured).length}
          </div>
          <div className="text-sm text-gray-600">Featured</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {filteredModels.filter(m => m.is_free).length}
          </div>
          <div className="text-sm text-gray-600">Free</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">
            {filteredModels.filter(m => m.is_trial).length}
          </div>
          <div className="text-sm text-gray-600">Trial</div>
        </div>
      </div>
      
      {/* Models Grid */}
      {filteredModels.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No models found</h3>
          <p className="text-gray-600 mb-6">
            {modelSearch || filterPlan !== 'all' || filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by adding your first system model'}
          </p>
          {!modelSearch && filterPlan === 'all' && filterActive === 'all' && (
            <Button onClick={openAddModelModal} className="bg-purple-600 hover:bg-purple-700">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Model
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <div
              key={model.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Model Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{model.icon || '🤖'}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {model.name}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {model.is_featured && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded">
                            ⭐ Featured
                          </span>
                        )}
                        {model.is_free && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            🆓 Free
                          </span>
                        )}
                        {model.is_trial && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded">
                            ⏰ Trial
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          model.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {model.is_active ? '✓ Active' : '○ Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {model.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {model.description}
                  </p>
                )}
              </div>
              
              {/* Model Details */}
              <div className="p-6 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Role:</span>
                  <span className="font-medium">{model.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium capitalize">{model.required_plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Tokens:</span>
                  <span className="font-medium">{model.max_tokens}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Token Limit:</span>
                  <span className="font-medium">
                    {model.token_limit_amount
                      ? `${model.token_limit_amount.toLocaleString()}/${model.token_limit_period}`
                      : 'Unlimited'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasks:</span>
                  <span className="font-medium">
                    {model.task && Array.isArray(model.task) ? model.task.length : 0} defined
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Org Types:</span>
                  <span className="font-medium">
                    {model.organization_types?.length > 0
                      ? model.organization_types.length
                      : 'All'}
                  </span>
                </div>
              </div>
              
              {/* Tags */}
              {model.tags && model.tags.length > 0 && (
                <div className="px-6 pb-4">
                  <div className="flex flex-wrap gap-1">
                    {model.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Actions */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                <Button
                  onClick={() => selectModelForEdit(model)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  Edit
                </Button>
                <Button
                  onClick={() => toggleModelActive(model.id, model.is_active)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  {model.is_active ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  onClick={() => toggleModelFeatured(model.id, model.is_featured)}
                  variant="outline"
                  size="sm"
                >
                  ⭐
                </Button>
                <Button
                  onClick={() => deleteModel(model.id)}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Edit Modal */}
      {modelEditModalOpen && currentModel && (
        <SystemModelEditModal
          isOpen={modelEditModalOpen}
          mode={modelEditMode}
          model={currentModel}
          taskBuilder={taskBuilder}
          fieldErrors={fieldErrors}
          touchedFields={touchedFields}
          saving={saving}
          onClose={closeModelEditModal}
          onSubmit={handleSubmit}
          handleFieldChange={handleFieldChange}
          handleFieldBlur={handleFieldBlur}
          setTaskBuilder={setTaskBuilder}
          setHasUnsavedChanges={setHasUnsavedChanges}
        />
      )}
    </div>
  );
}
