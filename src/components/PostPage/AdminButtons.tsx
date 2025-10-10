// components/PostPage/AdminButtons.tsx
'use client';

import React from 'react';
import { PlusIcon, PencilIcon } from '@heroicons/react/24/outline';
import { usePostEditModal } from '@/components/modals/PostEditModal/context';
import { usePathname } from 'next/navigation';
import Button from '@/ui/Button';

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
      <Button 
        onClick={handleEdit}
        variant="edit_plus"
        disabled={!post}
      >
        <PencilIcon className="w-4 h-4 mr-2 transition-colors duration-300" />
        Edit
      </Button>
      
      <Button 
        onClick={handleCreate}
        variant="new_plus"
      >
        <PlusIcon className="w-4 h-4 mr-2 transition-colors duration-300" />
        New
      </Button>
    </div>
  );
}