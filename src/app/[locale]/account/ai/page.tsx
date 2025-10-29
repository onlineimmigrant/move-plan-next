'use client';
import { useState, useEffect } from 'react';
import InfoCards from '@/components/ai/InfoCards';
import DialogModals from '@/components/ai/DialogModals';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/ui/Button';
import { PREDEFINED_ROLES, MODAL_ANIMATION_STYLES } from '@/components/ai/_shared/types/aiManagement';
import { useModelManagement } from '@/components/ai/_shared/hooks/useModelManagement';
import { useComboboxFilters } from '@/components/ai/_shared/hooks/useComboboxFilters';
import AIFilterBar from '@/components/ai/_shared/components/AIFilterBar';
// Import shared components - NOW ACTIVE, used directly
import { 
  AIModelCard,
  AILoadingSkeleton, 
  AINotification, 
  AIConfirmationDialog,
  AISearchInput,
  AITaskManagementModal,
  AIRoleEditModal,
  AIIcons
} from '@/components/ai/_shared';
import { AIModelEditModal } from '@/components/ai/_shared/components/AIModelEditModal';
import AITabNavigation from '@/components/ai/_shared/components/AITabNavigation';

// Create local aliases for icons used in this page
const InfoIcon = AIIcons.Info;
const CloseIcon = AIIcons.X;

// Import constants from types
const predefinedRoles = PREDEFINED_ROLES;
const modalStyles = MODAL_ANIMATION_STYLES;

export default function AccountAIManagement() {
  const themeColors = useThemeColors();
  const primary = themeColors.cssVars.primary;
  
  // Dialog modal state (for InfoCards and DialogModals components)
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    confirmVariant?: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  // Use custom hooks for model management with account context
  const {
    // Data
    filteredDefaultModels,
    selectedEditModel,
    editModel,
    newModel,
    
    // UI State
    loading,
    error,
    successMessage,
    activeTab,
    
    // Search & Filters
    modelSearch,
    filterRole,
    filterActive,
    sortBy,
    sortOrder,
    
    // Filter counts
    totalCount,
    userCount,
    adminCount,
    systemCount,
    activeCount,
    inactiveCount,
    
    // Validation
    fieldErrors,
    touchedFields,
    hasUnsavedChanges,
    
    // Task State
    taskInputMode,
    taskBuilder,
    taskModalOpen,
    selectedModelForTasks,
    taskModalMode,
    
    // Role State
    roleModalOpen,
    selectedModelForRole,
    editRoleData,
    
    // Model Edit Modal State
    modelEditModalOpen,
    modelEditMode,
    
    // Setters
    setNewModel,
    setEditModel,
    setError,
    setSuccessMessage,
    setModelSearch,
    setFilterRole,
    setFilterActive,
    setSortBy,
    setSortOrder,
    setTaskInputMode,
    setTaskBuilder,
    setHasUnsavedChanges,
    setEditRoleData,
    setSelectedEditModel,
    setActiveTab,
    setTaskModalMode,
    
    // Actions
    addDefaultModel,
    updateModel,
    deleteModel,
    toggleModelActive,
    selectModelForEdit,
    handleTabSwitch,
    handleFieldChange,
    handleFieldBlur,
    
    // Model Edit Modal Actions
    openAddModelModal,
    closeModelEditModal,
    
    // Task Actions
    openTaskModal,
    closeTaskModal,
    addTaskToModel,
    removeTaskFromModel,
    
    // Role Actions
    openRoleModal,
    closeRoleModal,
    saveRoleChanges,
  } = useModelManagement({ context: 'account' });
  
  // Use combobox filters hook
  const {
    modelQuery,
    setModelQuery,
    endpointQuery,
    setEndpointQuery,
    roleQuery,
    setRoleQuery,
    filteredModels,
    filteredEndpoints,
    filteredRoles,
  } = useComboboxFilters();

  // Modal callback adapters for shared components
  const handleAddTask = (modelId: string | number, taskName: string, taskMessage: string) => {
    // Admin's addTaskToModel uses selectedModelForTasks from state, not modelId parameter
    addTaskToModel(taskName, taskMessage);
  };

  const handleRemoveTask = (modelId: string | number, taskIndex: number) => {
    // Admin's removeTaskFromModel takes number modelId
    removeTaskFromModel(modelId as number, taskIndex);
  };

  // Role data adapter for shared modal
  const handleSetRoleData = (data: React.SetStateAction<any>) => {
    if (typeof data === 'function') {
      setEditRoleData((prev: any) => {
        const newData = data(prev);
        // Ensure isCustomRole is set based on role value
        return {
          ...newData,
          isCustomRole: newData.role === 'custom'
        };
      });
    } else {
      setEditRoleData({
        ...data,
        isCustomRole: data.role === 'custom'
      });
    }
  };

  // Confirmation dialog handlers
  const handleDeleteWithConfirmation = (modelId: number, modelName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Model',
      message: `Are you sure you want to delete "${modelName}"? This action cannot be undone.`,
      onConfirm: () => {
        deleteModel(modelId);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
      confirmText: 'Delete',
      confirmVariant: 'danger',
    });
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unsaved Changes',
        message: 'You have unsaved changes. Are you sure you want to cancel? All changes will be lost.',
        onConfirm: () => {
          setSelectedEditModel(null);
          setEditModel(null);
          setActiveTab('models');
          setConfirmDialog({ ...confirmDialog, isOpen: false });
        },
        confirmText: 'Discard Changes',
        confirmVariant: 'danger',
      });
    } else {
      setSelectedEditModel(null);
      setEditModel(null);
      setActiveTab('models');
    }
  };

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, setSuccessMessage]);

  // Keyboard escape handler for modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openDialog) {
        setOpenDialog(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [openDialog]);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-6">
      <style>{modalStyles}</style>
      <div className="p-2 sm:p-4 rounded-lg min-h-screen relative">
        {/* Info icon - fixed positioned in top right */}
        <button
          onClick={() => setOpenDialog('info')}
          className="fixed top-4 right-4 sm:top-8 sm:right-8 z-40 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg"
          aria-label="View AI Management Information"
        >
          <InfoIcon className="h-6 w-6 sm:h-7 sm:w-7" style={{ color: primary.base }} />
        </button>
        
        <div className="max-w-7xl mx-auto">
          <div className="mt-4 sm:mt-8 mb-6 sm:mb-8 flex flex-col items-center">
            <h1 
              className="text-lg sm:text-xl font-medium text-gray-900 tracking-[-0.02em] antialiased relative transition-colors group cursor-default"
            >
              AI Models
              <span 
                className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full transition-all duration-150" 
                style={{ backgroundColor: primary.base }}
              />
          </h1>
        </div>
        
        {/* Error Message */}
        {error && (
          <AINotification
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {/* Success Message */}
        {successMessage && (
          <AINotification
            type="success"
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}

        {/* Tab Navigation */}
          <AITabNavigation
            activeTab={activeTab}
            selectedEditModel={null}
            primary={primary}
            onTabChange={handleTabSwitch}
            context="account"
            useModal={true}
            onAddClick={openAddModelModal}
          />

          {/* Models List */}
          <div>
            {/* Filters */}
            <AIFilterBar
              context="account"
              filterRole={filterRole}
              filterActive={filterActive}
              sortBy={sortBy}
              sortOrder={sortOrder}
              primary={primary}
              totalCount={totalCount}
              userCount={userCount}
              adminCount={adminCount}
              systemCount={systemCount}
              activeCount={activeCount}
              inactiveCount={inactiveCount}
              setFilterRole={setFilterRole}
              setFilterActive={setFilterActive}
              setSortBy={setSortBy}
              setSortOrder={setSortOrder}
            />

            {/* Search Input */}
            <AISearchInput
              value={modelSearch}
              onChange={setModelSearch}
              placeholder="Search models, roles, or tasks..."
              resultCount={filteredDefaultModels.length}
              primary={primary as any}
            />

            {loading ? (
              <AILoadingSkeleton count={3} context="admin" />
            ) : (
              <ul className="space-y-2 sm:space-y-3">
                  {filteredDefaultModels.length === 0 ? (
                    <li className="py-12 text-center bg-white rounded-2xl border border-gray-100">
                      <div className="mx-auto h-12 w-12 text-gray-400 mb-3 flex items-center justify-center">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01" />
                        </svg>
                      </div>
                      <p className="text-gray-500 text-base mb-3">
                        {modelSearch || filterRole !== 'all' || filterActive !== 'all' 
                          ? 'No models match your filters'
                          : 'No models available yet'}
                      </p>
                      {(modelSearch || filterRole !== 'all' || filterActive !== 'all') ? (
                        <Button
                          onClick={() => {
                            setModelSearch('')
                            setFilterRole('all')
                            setFilterActive('all')
                          }}
                          variant="outline"
                          size="default"
                        >
                          Clear all filters
                        </Button>
                      ) : (
                        <Button
                          onClick={openAddModelModal}
                          variant="primary"
                          size="default"
                        >
                          Add your first model
                        </Button>
                      )}
                    </li>
                  ) : (
                    filteredDefaultModels.map((model) => (
                      <AIModelCard
                        key={model.id}
                        model={model as any}
                        type={model.type || 'default'}
                        context="account"
                        primary={primary as any}
                        onEdit={(aiModel) => selectModelForEdit(model)}
                        onDelete={() => handleDeleteWithConfirmation(model.id, model.name)}
                        onToggleActive={() => toggleModelActive(model.id, !model.is_active)}
                        onOpenRoleModal={() => openRoleModal(model, predefinedRoles)}
                        onOpenTaskModal={(aiModel, mode) => openTaskModal(model, mode)}
                      />
                    ))
                  )}
                </ul>
              )}
          </div>
        </div>
      </div>

      {/* InfoCards Modal */}
      {openDialog === 'info' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Transparent background overlay - click to close */}
            <div 
              className="fixed inset-0"
              onClick={() => setOpenDialog(null)}
            />
            
            {/* Transparent modal panel with cards */}
            <div 
              className="relative inline-block align-middle px-4 pt-5 pb-4 text-left transform transition-all sm:my-8 sm:w-full sm:max-w-5xl sm:p-6"
            >
              {/* Close button with visible background */}
              <div className="absolute top-0 right-0 pt-4 pr-4 z-10">
                <button
                  onClick={() => setOpenDialog(null)}
                  className="bg-white rounded-full p-2 text-gray-400 hover:text-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--tw-ring-color': primary.base } as React.CSSProperties}
                >
                  <span className="sr-only">Close</span>
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
              
              {/* Cards centered */}
              <div className="flex justify-center">
                <InfoCards setOpenDialog={setOpenDialog} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DialogModals */}
      <DialogModals openDialog={openDialog} setOpenDialog={setOpenDialog} />

      {/* Model Edit Modal */}
      <AIModelEditModal
        isOpen={modelEditModalOpen}
        mode={modelEditMode}
        model={modelEditMode === 'edit' ? (editModel || newModel) : newModel}
        taskBuilder={taskBuilder}
        fieldErrors={fieldErrors}
        touchedFields={touchedFields}
        loading={loading}
        primary={primary}
        context="account"
        modelQuery={modelQuery}
        endpointQuery={endpointQuery}
        filteredModels={filteredModels}
        filteredEndpoints={filteredEndpoints}
        predefinedRoles={predefinedRoles}
        onClose={closeModelEditModal}
        onSubmit={modelEditMode === 'edit' ? updateModel : addDefaultModel}
        onModelChange={setNewModel}
        handleFieldChange={handleFieldChange}
        handleFieldBlur={handleFieldBlur}
        setModelQuery={setModelQuery}
        setEndpointQuery={setEndpointQuery}
        setTaskBuilder={setTaskBuilder}
        setHasUnsavedChanges={setHasUnsavedChanges}
      />

      {/* Task Management Modal */}
      <AITaskManagementModal
        isOpen={taskModalOpen && !!selectedModelForTasks}
        selectedModel={selectedModelForTasks!}
        mode={taskModalMode}
        setMode={setTaskModalMode}
        onClose={closeTaskModal}
        onAddTask={handleAddTask}
        onRemoveTask={handleRemoveTask}
        primary={primary}
        context="account"
      />

      {/* Role Edit Modal */}
      <AIRoleEditModal
        isOpen={roleModalOpen && !!selectedModelForRole}
        selectedModel={selectedModelForRole!}
        roleData={editRoleData}
        setRoleData={handleSetRoleData}
        filteredRoles={filteredRoles}
        roleQuery={roleQuery}
        setRoleQuery={setRoleQuery}
        onClose={closeRoleModal}
        onSave={saveRoleChanges}
        loading={loading}
        primary={primary}
        context="account"
      />

      {/* Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <AIConfirmationDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmText={confirmDialog.confirmText || 'Confirm'}
          cancelText="Cancel"
          variant={confirmDialog.confirmVariant === 'danger' ? 'danger' : 'info'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        />
      )}

    </div>
  );
}
