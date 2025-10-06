// components/PostPage/AdminButtons.tsx
'use client';

import React from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { usePostEditModal } from '@/context/PostEditModalContext';
import { usePathname } from 'next/navigation';

interface Post {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  section?: string;
  subsection?: string;
}

interface AdminButtonsProps {
  post?: Post;
}

export default function AdminButtons({ post }: AdminButtonsProps) {
  const { openCreateModal, openEditModal } = usePostEditModal();
  const pathname = usePathname();

  const handleEdit = () => {
    if (post) {
      openEditModal(post, pathname);
    }
  };

  const handleCreate = () => {
    openCreateModal(pathname);
  };

  return (
    <div className="absolute top-0 right-0 flex items-center space-x-3 z-50">
      <button 
        onClick={handleEdit}
        className="neomorphic-admin-btn group"
        disabled={!post}
      >
        <PencilIcon className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
        <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors duration-300">
          Edit
        </span>
      </button>
      
      <button 
        onClick={handleCreate}
        className="neomorphic-admin-btn group"
      >
        <PlusIcon className="w-4 h-4 text-gray-600 group-hover:text-green-600 transition-colors duration-300" />
        <span className="ml-2 text-sm font-medium text-gray-700 group-hover:text-green-700 transition-colors duration-300">
          New
        </span>
      </button>
    </div>
  );
}