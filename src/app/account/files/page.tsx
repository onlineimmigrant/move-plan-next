'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrashIcon, DocumentArrowDownIcon, PencilIcon } from '@heroicons/react/24/outline';
import { jsPDF } from 'jspdf';
import { useRouter } from 'next/navigation';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import Button from '@/ui/Button';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface File {
  filename: string;
  format: 'txt' | 'pdf';
  content: string; // Base64 for PDF, plain text for TXT
  created_at: string;
}

type SortKey = 'filename' | 'format' | 'created_at';
type SortOrder = 'asc' | 'desc';

export default function FilesPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [newFilename, setNewFilename] = useState<string>('');
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const router = useRouter();

  // Fetch user and files
  useEffect(() => {
    const fetchUserAndFiles = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError('Please log in to manage files.');
          router.push('/login');
          return;
        }
        setUserId(user.id);

        const { data, error: settingsError } = await supabase
          .from('ai_user_settings')
          .select('files')
          .eq('user_id', user.id)
          .single();

        if (settingsError) {
          throw new Error('Failed to fetch files: ' + settingsError.message);
        }

        const fetchedFiles = Array.isArray(data?.files) ? data.files : [];
        // Sort by created_at descending by default
        const sortedFiles = fetchedFiles.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFiles(sortedFiles);
        setError(null);
      } catch (err: any) {
        console.error('[FilesPage] Fetch error:', err);
        setError(err.message || 'Failed to load files');
      }
    };

    fetchUserAndFiles();
  }, [router]);

  // Sort files
  const sortFiles = (key: SortKey, order: SortOrder) => {
    const sorted = [...files].sort((a, b) => {
      if (key === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (key === 'filename') {
        return order === 'asc'
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename);
      } else {
        return order === 'asc'
          ? a.format.localeCompare(b.format)
          : b.format.localeCompare(a.format);
      }
    });
    setFiles(sorted);
    setSortKey(key);
    setSortOrder(order);
  };

  // Download file
const downloadFile = (file: File) => {
  try {
    if (file.format === 'txt') {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (file.format === 'pdf') {
      // Convert base64 to binary data
      const binary = atob(file.content);
      const len = binary.length;
      const buffer = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        buffer[i] = binary.charCodeAt(i);
      }
      // Create a Blob for the PDF
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (err: any) {
    console.error('[FilesPage] Download error:', err);
    setError('Failed to download file');
  }
};

  // Delete file
  const deleteFile = async (filename: string) => {
    if (!userId) {
      setError('Please log in to delete files.');
      return;
    }

    try {
      const updatedFiles = files.filter((f) => f.filename !== filename);
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to delete file: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setError(null);
    } catch (err: any) {
      console.error('[FilesPage] Delete error:', err);
      setError(err.message || 'Failed to delete file');
    }
  };

  // Update filename
  const updateFilename = async () => {
    if (!userId || !editingFile) {
      setError('Please log in to update files.');
      return;
    }

    try {
      const updatedFiles = files.map((f) =>
        f.filename === editingFile.filename
          ? { ...f, filename: `${newFilename}.${f.format}` }
          : f
      );
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to update filename: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setEditingFile(null);
      setNewFilename('');
      setError(null);
    } catch (err: any) {
      console.error('[FilesPage] Update error:', err);
      setError(err.message || 'Failed to update filename');
    }
  };

  // View file content
  const viewFileContent = (file: File) => {
    setViewingFile(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-xai-dark to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-5xl w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Manage Files</h1>
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl text-gray-700">
            {files.length} {files.length === 1 ? 'File' : 'Files'}
          </h2>
          <Listbox
            value={{ key: sortKey, order: sortOrder }}
            onChange={(value) => sortFiles(value.key, value.order)}
          >
            <ListboxButton className="flex items-center text-sm text-xai-accent hover:text-xai-accent/80">
              Sort by: {sortKey} ({sortOrder.toUpperCase()})
              <ChevronDownIcon className="h-5 w-5 ml-2" />
            </ListboxButton>
            <Transition
              enter="transition ease-out duration-100"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <ListboxOptions className="absolute z-10 mt-1 w-48 rounded-lg bg-white shadow-lg ring-1 ring-gray-200">
                {[
                  { key: 'filename', order: 'asc', label: 'Filename (A-Z)' },
                  { key: 'filename', order: 'desc', label: 'Filename (Z-A)' },
                  { key: 'format', order: 'asc', label: 'Format (TXT-PDF)' },
                  { key: 'format', order: 'desc', label: 'Format (PDF-TXT)' },
                  { key: 'created_at', order: 'asc', label: 'Date (Oldest)' },
                  { key: 'created_at', order: 'desc', label: 'Date (Newest)' },
                ].map((option) => (
                  <ListboxOption
                    key={`${option.key}-${option.order}`}
                    value={option}
                    className={({ active }) =>
                      `cursor-pointer py-2 px-4 text-sm ${
                        active ? 'bg-xai-accent/10 text-xai-accent' : 'text-gray-900'
                      }`
                    }
                  >
                    {option.label}
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </Listbox>
        </div>
        {files.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No files found.</p>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.filename}
                className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-xai-accent/10 transition-all duration-200"
              >
                <div className="flex-1">
                  <Button
                  variant='link'
                    onClick={() => viewFileContent(file)}
                    
                  >
                    {file.filename}
                  </Button>
                  <p className="text-sm text-gray-500">
                    {file.format.toUpperCase()} • {new Date(file.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                  variant='badge_primary_circle'
                    onClick={() => {
                      setEditingFile(file);
                      setNewFilename(file.filename.replace(`.${file.format}`, ''));
                    }}
                    className="text-xai-accent hover:text-xai-accent/80"
                    title="Edit Filename"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Button>
                  <Button
                  variant='badge_primary_circle'
                    onClick={() => downloadFile(file)}
                    className="text-xai-accent hover:text-xai-accent/80"
                    title="Download"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5" />
                  </Button>
                  <Button
                  variant='badge_primary_circle'
                    onClick={() => deleteFile(file.filename)}
                    className="text-red-500 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {editingFile && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full sm:max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Filename</h3>
              <input
                type="text"
                value={newFilename}
                onChange={(e) => setNewFilename(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-xai-accent focus:border-xai-accent"
                placeholder="Enter new filename"
              />
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                variant='outline'
                  onClick={() => {
                    setEditingFile(null);
                    setNewFilename('');
                  }}
                 
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateFilename}
                  
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
        {viewingFile && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg sm:max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-4">File Content: {viewingFile.filename}</h3>
              {viewingFile.format === 'txt' ? (
                <pre className="text-gray-800 text-sm whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {viewingFile.content}
                </pre>
              ) : (
                <iframe
                  src={`data:application/pdf;base64,${viewingFile.content}`}
                  className="w-full h-[50vh] sm:h-[60vh] border border-gray-200 rounded-lg"
                  title={viewingFile.filename}
                />
              )}
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => setViewingFile(null)}
                 
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}