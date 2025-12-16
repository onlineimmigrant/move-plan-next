'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PhotoIcon, PlusIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabaseClient';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal/ImageGalleryModal';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/components/Shared/ToastContainer';

interface Avatar {
  id: string;
  title: string;
  full_name?: string;
  image?: string;
  organization_id: string;
  created_at?: string;
  updated_at?: string;
}

interface AvatarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAvatarUpdated: () => void;
  startInCreateMode?: boolean;
  organizationId?: string; // Optional: can be passed directly to override settings
}

export default function AvatarManagementModal({ isOpen, onClose, onAvatarUpdated, startInCreateMode = false, organizationId: propOrganizationId }: AvatarManagementModalProps) {
  const { settings } = useSettings();
  const toast = useToast();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Use prop organization_id if provided, otherwise use settings
  const organizationId = propOrganizationId || settings?.organization_id;

  // Debug: Log settings on every render
  console.log('AvatarManagementModal render:', { 
    isOpen, 
    propOrganizationId,
    settingsOrganizationId: settings?.organization_id,
    finalOrganizationId: organizationId,
    settings, 
    hasSettings: !!settings,
    avatarsCount: avatars.length,
    isLoading
  });
  
  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formImage, setFormImage] = useState('');

  useEffect(() => {
    if (isOpen) {
      console.log('AvatarManagementModal opened', { 
        hasOrganizationId: !!organizationId, 
        organizationId: organizationId,
        startInCreateMode 
      });
      
      if (organizationId) {
        fetchAvatars();
      } else {
        console.warn('Cannot fetch avatars: organizationId is undefined');
      }
    }
  }, [isOpen, organizationId]);

  // Separate effect for create mode to avoid dependency issues
  useEffect(() => {
    if (isOpen && startInCreateMode && organizationId) {
      console.log('Auto-opening create mode');
      handleCreateAvatar();
    }
  }, [isOpen, startInCreateMode, organizationId]);

  const fetchAvatars = async () => {
    if (!organizationId) {
      console.log('Cannot fetch avatars: organization_id not available');
      return;
    }
    
    console.log('Starting to fetch avatars for organization:', organizationId);
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('ticket_avatars')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error, count: data?.length });

      if (error) {
        // Table might not exist yet - this is okay
        console.log('Note: ticket_avatars table error (might not exist yet):', error.message);
        setAvatars([]);
        setIsLoading(false);
        return;
      }
      
      console.log('Successfully fetched avatars:', data?.length || 0, 'avatars');
      setAvatars(data || []);
    } catch (error) {
      console.error('Error fetching avatars:', error);
      setAvatars([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectImage = (url: string) => {
    setFormImage(url);
    setShowImageGallery(false);
  };

  const handleCreateAvatar = () => {
    setIsCreating(true);
    setEditingAvatar(null);
    setFormTitle('');
    setFormFullName('');
    setFormImage('');
  };

  const handleEditAvatar = (avatar: Avatar) => {
    setEditingAvatar(avatar);
    setIsCreating(false);
    setFormTitle(avatar.title);
    setFormFullName(avatar.full_name || '');
    setFormImage(avatar.image || '');
  };

  const handleCancelEdit = () => {
    setEditingAvatar(null);
    setIsCreating(false);
    setFormTitle('');
    setFormFullName('');
    setFormImage('');
  };

  const handleSaveAvatar = async () => {
    if (!formTitle.trim()) {
      toast.warning('Please enter a title');
      return;
    }

    try {
      if (editingAvatar) {
        // Update existing avatar
        const { error } = await supabase
          .from('ticket_avatars')
          .update({
            title: formTitle.trim(),
            full_name: formFullName.trim() || null,
            image: formImage || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAvatar.id)
          .eq('organization_id', organizationId);

        if (error) throw error;
        toast.success('Avatar updated successfully');
      } else {
        // Create new avatar
        const { error } = await supabase
          .from('ticket_avatars')
          .insert({
            title: formTitle.trim(),
            full_name: formFullName.trim() || null,
            image: formImage || null,
            organization_id: organizationId
          });

        if (error) throw error;
        toast.success('Avatar created successfully');
      }

      handleCancelEdit();
      fetchAvatars();
      onAvatarUpdated();
    } catch (error) {
      console.error('Error saving avatar:', error);
      toast.error('Failed to save avatar');
    }
  };

  const handleDeleteAvatar = async (avatar: Avatar) => {
    if (!confirm(`Are you sure you want to delete "${avatar.title}"?`)) {
      return;
    }

    try {
      const { error} = await supabase
        .from('ticket_avatars')
        .delete()
        .eq('id', avatar.id)
        .eq('organization_id', organizationId);

      if (error) throw error;
      toast.success('Avatar deleted successfully');
      fetchAvatars();
      onAvatarUpdated();
    } catch (error) {
      console.error('Error deleting avatar:', error);
      toast.error('Failed to delete avatar');
    }
  };

  if (!isOpen) {
    console.log('AvatarManagementModal: NOT OPEN, returning null');
    return null;
  }

  if (!organizationId) {
    console.log('AvatarManagementModal: organizationId not available, showing loading state');
    return (
      <div 
        className="fixed inset-0 z-[10004] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        data-modal="avatar-management-loading"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
          <p className="text-sm text-gray-400 mt-2">Prop org ID: {propOrganizationId || 'not provided'}</p>
          <p className="text-sm text-gray-400">Settings org ID: {settings?.organization_id || 'undefined'}</p>
        </div>
      </div>
    );
  }

  console.log('AvatarManagementModal: RENDERING UI with org_id:', organizationId);

  return (
    <>
      <div 
        className="fixed inset-0 z-[10004] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        data-modal="avatar-management"
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <PhotoIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">Manage Avatars</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Create/Edit Form */}
            {(isCreating || editingAvatar) && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingAvatar ? 'Edit Avatar' : 'Create New Avatar'}
                </h3>
                
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g., Support Agent"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="e.g., John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  {/* Image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Avatar Image (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      {formImage && (
                        <img
                          src={formImage}
                          alt="Avatar preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                        />
                      )}
                      <button
                        onClick={() => setShowImageGallery(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <PhotoIcon className="h-5 w-5" />
                        {formImage ? 'Change Image' : 'Select Image'}
                      </button>
                      {formImage && (
                        <button
                          onClick={() => setFormImage('')}
                          className="px-4 py-2 text-gray-600 hover:text-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Maximum file size: 2MB. Recommended: Square images, at least 200x200px
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveAvatar}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      {editingAvatar ? 'Update Avatar' : 'Create Avatar'}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            {!isCreating && !editingAvatar && (
              <button
                onClick={handleCreateAvatar}
                className="w-full mb-6 py-3 border-2 border-dashed border-purple-300 rounded-xl text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                Create New Avatar
              </button>
            )}

            {/* Avatar List */}
            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                  Loading avatars...
                </div>
              ) : avatars.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PhotoIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">No avatars yet</p>
                  <p className="text-sm mt-1">Create your first avatar to get started</p>
                </div>
              ) : (
                avatars.map((avatar) => (
                  <div
                    key={avatar.id}
                    className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-sm transition-all"
                  >
                    {/* Avatar Preview */}
                    <div className="flex-shrink-0">
                      {avatar.image ? (
                        <img
                          src={avatar.image}
                          alt={avatar.title}
                          className="w-14 h-14 rounded-full object-cover border-2 border-purple-200"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                          {avatar.title.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Avatar Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900">{avatar.title}</h4>
                      {avatar.full_name && (
                        <p className="text-sm text-gray-600">{avatar.full_name}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditAvatar(avatar)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Edit avatar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAvatar(avatar)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete avatar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      {showImageGallery && (
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          onSelectImage={handleSelectImage}
        />
      )}
    </>
  );
}
