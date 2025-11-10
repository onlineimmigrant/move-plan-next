'use client';
import { useState, useEffect, Fragment } from 'react';
import { createClient } from '@supabase/supabase-js';
import { XMarkIcon, UserPlusIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import Button from '@/ui/Button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ShareFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  fileName: string;
  isFolder?: boolean;
  userId: string | null;
}

interface User {
  id: string;
  email: string;
  full_name?: string;
  organization_id?: string;
}

interface FileShare {
  id: string;
  file_path: string;
  file_name: string;
  is_folder: boolean;
  shared_with_user_id: string;
  permission_type: 'view' | 'edit';
  created_at: string;
  expires_at?: string;
  shared_by?: {
    id: string;
    email: string;
    full_name?: string;
  };
  shared_with?: {
    id: string;
    email: string;
    full_name?: string;
  };
}

export default function ShareFileModal({ 
  isOpen, 
  onClose, 
  filePath, 
  fileName, 
  isFolder = false,
  userId 
}: ShareFileModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingShares, setExistingShares] = useState<FileShare[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [folderFiles, setFolderFiles] = useState<{ file_path: string; file_name: string; share_id?: string }[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // Fetch current user's role and organization
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('role, organization_id')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setCurrentUserRole(data.role);
      }
    };

    fetchUserRole();
  }, [userId]);

  // Fetch available users to share with
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isOpen || !userId) return;

      try {
        // Get current user's profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, organization_id')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;

        let query = supabase
          .from('profiles')
          .select('id, email, full_name, organization_id')
          .neq('id', userId); // Exclude current user

        // Filter based on role
        if (profile.role === 'admin' && profile.organization_id) {
          // Admins see only users in their organization
          query = query.eq('organization_id', profile.organization_id);
        }
        // Superadmins see all users (no filter)

        const { data: usersData, error: usersError } = await query
          .order('email', { ascending: true })
          .limit(100);

        if (usersError) throw usersError;

        setUsers(usersData || []);
      } catch (err: any) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      }
    };

    fetchUsers();
  }, [isOpen, userId]);

  // Fetch existing shares for this file
  useEffect(() => {
    const fetchExistingShares = async () => {
      if (!isOpen || !userId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const response = await fetch(`/api/files/share?view=shared-by-me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch shares');

        const { shares } = await response.json();
        const fileShares = shares.filter((s: FileShare) => s.file_path === filePath);
        setExistingShares(fileShares);
      } catch (err: any) {
        console.error('Error fetching shares:', err);
      }
    };

    fetchExistingShares();
  }, [isOpen, userId, filePath]);

  // Fetch files in folder if this is a folder share
  useEffect(() => {
    const fetchFolderFiles = async () => {
      if (!isOpen || !userId || !isFolder) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Fetch all shares for files in this folder
        const response = await fetch(`/api/files/share?view=shared-by-me`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch folder files');

        const { shares } = await response.json();
        
        // Filter shares that are in this folder
        const folderPath = filePath.endsWith('/') ? filePath : `${filePath}/`;
        const filesInFolder = shares
          .filter((s: FileShare) => 
            !s.is_folder && 
            s.file_path.startsWith(folderPath) &&
            s.file_path !== filePath
          )
          .map((s: FileShare) => ({
            file_path: s.file_path,
            file_name: s.file_name,
            share_id: s.id,
            shared_with_user_id: s.shared_with_user_id
          }));

        setFolderFiles(filesInFolder);
        
        // Initialize selected files with all currently shared files
        const sharedFilePaths = new Set<string>(filesInFolder.map((f: any) => f.file_path as string));
        setSelectedFiles(sharedFilePaths);
      } catch (err: any) {
        console.error('Error fetching folder files:', err);
      }
    };

    fetchFolderFiles();
  }, [isOpen, userId, filePath, isFolder]);

  const handleShare = async () => {
    if (!selectedUser || !userId) {
      setError('Please select a user');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Calculate expiration date if set
      let expiresAt = null;
      if (expiresInDays && expiresInDays > 0) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + expiresInDays);
        expiresAt = expDate.toISOString();
      }

      const response = await fetch('/api/files/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          file_path: filePath,
          file_name: fileName,
          is_folder: isFolder,
          shared_with_user_id: selectedUser.id,
          permission_type: permission,
          expires_at: expiresAt
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to share file');
      }

      const { share: newShare } = await response.json();
      
      // Reset form
      setSelectedUser(null);
      setPermission('view');
      setExpiresInDays(null);
      
      // Refresh existing shares by re-fetching
      const refreshResponse = await fetch(`/api/files/share?view=shared-by-me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (refreshResponse.ok) {
        const { shares } = await refreshResponse.json();
        const fileShares = shares.filter((s: FileShare) => s.file_path === filePath);
        setExistingShares(fileShares);
      }
      
      onClose();
    } catch (err: any) {
      console.error('Error sharing file:', err);
      setError(err.message || 'Failed to share file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/files/share?id=${shareId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) throw new Error('Failed to revoke share');

      setExistingShares(existingShares.filter(s => s.id !== shareId));
    } catch (err: any) {
      console.error('Error revoking share:', err);
      setError('Failed to revoke share');
    }
  };

  const handleToggleFolderFileShare = async (filePath: string, shareId?: string) => {
    if (!selectedUser) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (shareId) {
        // Revoke existing share
        const response = await fetch(`/api/files/share?id=${shareId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) throw new Error('Failed to revoke share');

        // Update folder files to remove share_id
        setFolderFiles(folderFiles.map(f => 
          f.file_path === filePath ? { ...f, share_id: undefined } : f
        ));
        setSelectedFiles(prev => {
          const next = new Set(prev);
          next.delete(filePath);
          return next;
        });
      } else {
        // Create new share
        const fileName = filePath.split('/').pop() || '';
        const response = await fetch('/api/files/share', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            file_path: filePath,
            file_name: fileName,
            is_folder: false,
            shared_with_user_id: selectedUser.id,
            permission_type: permission,
            expires_at: null
          })
        });

        if (!response.ok) throw new Error('Failed to share file');

        const { share } = await response.json();
        
        // Update folder files with new share_id
        setFolderFiles(folderFiles.map(f => 
          f.file_path === filePath ? { ...f, share_id: share.id } : f
        ));
        setSelectedFiles(prev => new Set(prev).add(filePath));
      }
    } catch (err: any) {
      console.error('Error toggling file share:', err);
      setError('Failed to update file share');
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[10000020]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-transparent z-[10000019]" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto z-[10000020]">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                    <ShareIcon className="w-5 h-5 mr-2" />
                    Share {isFolder ? 'Folder' : 'File'}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {fileName}
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* New Share Form */}
                <div className="space-y-4 mb-6">
                  {/* User Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Share with
                    </label>
                    <Listbox value={selectedUser} onChange={setSelectedUser}>
                      <div className="relative z-[10000021]">
                        <ListboxButton className="relative w-full cursor-default rounded-lg bg-white dark:bg-gray-700 py-2 pl-3 pr-10 text-left border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 z-[10000021]">
                          <span className="block truncate text-gray-900 dark:text-white">
                            {selectedUser ? (
                              <>
                                <span className="font-medium">{selectedUser.full_name || selectedUser.email}</span>
                                {selectedUser.full_name && (
                                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({selectedUser.email})</span>
                                )}
                              </>
                            ) : 'Select a user'}
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
                          </span>
                        </ListboxButton>
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <ListboxOptions className="absolute z-[10000022] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            {users.map((user) => (
                              <ListboxOption
                                key={user.id}
                                value={user}
                                className={({ active }) =>
                                  `relative cursor-default select-none py-2 pl-10 pr-4 ${
                                    active ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <>
                                    <div className="flex flex-col">
                                      <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                        {user.full_name || user.email}
                                      </span>
                                      {user.full_name && (
                                        <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                          {user.email}
                                        </span>
                                      )}
                                    </div>
                                    {selected && (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600 dark:text-blue-400">
                                        <CheckIcon className="h-5 w-5" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </ListboxOption>
                            ))}
                          </ListboxOptions>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  {/* Permission Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Permission
                    </label>
                    <select
                      value={permission}
                      onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="view">Can View</option>
                      <option value="edit">Can Edit</option>
                    </select>
                  </div>

                  {/* Expiration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expires in (days, optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Never expires"
                      value={expiresInDays || ''}
                      onChange={(e) => setExpiresInDays(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <Button
                    onClick={handleShare}
                    disabled={!selectedUser || isLoading}
                    variant="primary"
                    className="w-full flex items-center justify-center"
                  >
                    <UserPlusIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Sharing...' : 'Share'}
                  </Button>
                </div>

                {/* Folder Files - Show checkboxes to select which files to share */}
                {isFolder && selectedUser && folderFiles.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Files in folder ({folderFiles.length})
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Select files to share with {selectedUser.full_name || selectedUser.email}
                    </p>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {folderFiles.map((file) => (
                        <label
                          key={file.file_path}
                          className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedFiles.has(file.file_path)}
                            onChange={() => handleToggleFolderFileShare(file.file_path, file.share_id)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {file.file_name}
                            </p>
                            {file.share_id && (
                              <p className="text-xs text-green-600 dark:text-green-400">
                                Currently shared
                              </p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing Shares */}
                {existingShares.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Shared with ({existingShares.length})
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {existingShares.map((share) => (
                        <div key={share.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {share.shared_with?.full_name || share.shared_with?.email || 'Unknown User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {share.permission_type === 'edit' ? 'Can edit' : 'Can view'}
                              {share.expires_at && ` • Expires ${new Date(share.expires_at).toLocaleDateString()}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRevokeShare(share.id)}
                            className="ml-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-xs"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
