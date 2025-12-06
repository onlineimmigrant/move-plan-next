// context/PostEditModalContext.tsx
'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface Post {
  id?: string;
  slug?: string;
  title?: string;
  description?: string;
  content?: string;
  content_type?: 'html' | 'markdown';
  section?: string;
  subsection?: string;
}

interface PostEditModalState {
  isOpen: boolean;
  isFullScreen: boolean;
  editingPost: Post | null;
  mode: 'create' | 'edit';
  returnUrl?: string;
  lastOpenTime?: number;
}

interface PostEditModalActions {
  openCreateModal: (returnUrl?: string) => void;
  openEditModal: (post: Post, returnUrl?: string) => void;
  closeModal: () => void;
  toggleFullScreen: () => void;
  updatePost: (post: Partial<Post>) => void;
}

const PostEditModalContext = createContext<(PostEditModalState & PostEditModalActions) | null>(null);

const DRAFT_KEY = 'postEditModal_draft';
const LAST_OPEN_KEY = 'postEditModal_lastOpen';

export function PostEditModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PostEditModalState>({
    isOpen: false,
    isFullScreen: false,
    editingPost: null,
    mode: 'create',
  });

  // Handle concurrent editing - priority for last opened
  useEffect(() => {
    if (state.isOpen && state.editingPost?.id) {
      const lastOpenTime = Date.now();
      setState(prev => ({ ...prev, lastOpenTime }));
      localStorage.setItem(LAST_OPEN_KEY, JSON.stringify({
        postId: state.editingPost.id,
        timestamp: lastOpenTime,
        userId: 'current-user' // TODO: Get from auth context
      }));
    }
  }, [state.isOpen, state.editingPost?.id]);

  const openCreateModal = useCallback((returnUrl?: string) => {
    setState({
      isOpen: true,
      isFullScreen: false,
      editingPost: null,
      mode: 'create',
      returnUrl,
      lastOpenTime: Date.now(),
    });
  }, []);

  const openEditModal = useCallback((post: Post, returnUrl?: string) => {
    // Check for concurrent editing
    const lastOpenData = localStorage.getItem(LAST_OPEN_KEY);
    if (lastOpenData && post.id) {
      const { postId, timestamp, userId } = JSON.parse(lastOpenData);
      if (postId === post.id && userId !== 'current-user' && (Date.now() - timestamp) < 5 * 60 * 1000) {
        // Another user edited this post within 5 minutes
        console.warn('Post is being edited by another user, but taking priority as last opened');
      }
    }

    setState({
      isOpen: true,
      isFullScreen: window.innerWidth < 768, // Full screen on mobile
      editingPost: post,
      mode: 'edit',
      returnUrl,
      lastOpenTime: Date.now(),
    });
  }, []);

  const closeModal = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      editingPost: null,
    }));
  }, []);

  const toggleFullScreen = useCallback(() => {
    setState(prev => ({ ...prev, isFullScreen: !prev.isFullScreen }));
  }, []);

  const updatePost = useCallback((updates: Partial<Post>) => {
    setState(prev => ({
      ...prev,
      editingPost: prev.editingPost ? { ...prev.editingPost, ...updates } : null,
    }));
  }, []);

  const value = {
    ...state,
    openCreateModal,
    openEditModal,
    closeModal,
    toggleFullScreen,
    updatePost,
  };

  return (
    <PostEditModalContext.Provider value={value}>
      {children}
    </PostEditModalContext.Provider>
  );
}

export function usePostEditModal() {
  const context = useContext(PostEditModalContext);
  if (!context) {
    // Return safe defaults when provider not loaded yet (during deferred initialization)
    return {
      isOpen: false,
      editingPost: null,
      mode: 'create' as const,
      isFullScreen: false,
      returnUrl: undefined,
      lastOpenTime: 0,
      openCreateModal: () => {},
      openEditModal: () => {},
      closeModal: () => {},
      toggleFullScreen: () => {},
      updatePost: () => {},
    };
  }
  return context;
}