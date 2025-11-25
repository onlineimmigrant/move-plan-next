'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { isAdminClient } from '@/lib/auth';
import { getOrganizationId } from '@/lib/supabase';
import { debug } from '@/utils/debug';

interface Post {
  id: string;
  slug: string;
  content?: string;
}

/**
 * Custom hook for managing admin functionality
 * Handles admin status, inline editing, and content updates
 * 
 * @param post - Current post data
 * @param slug - Post slug for API updates
 * @param baseUrl - Base URL for API calls
 * @returns Admin state and handlers
 */
export function usePostPageAdmin(post: Post | null, slug: string, baseUrl: string) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  // Check admin status client-side
  useEffect(() => {
    const checkAdminStatus = async () => {
      const adminStatus = await isAdminClient();
      console.log('Admin status:', adminStatus);
      setIsAdmin(adminStatus);
    };
    checkAdminStatus();
  }, []);

  // Memoized content update handler
  const handleContentUpdate = useCallback(async (contentRef: HTMLDivElement | null) => {
    if (!contentRef || !post || !isAdmin) return;

    const updatedContent = contentRef.innerHTML;
    if (updatedContent === post.content) {
      debug.log('usePostPageAdmin', 'Skipped PATCH (content unchanged)');
      return;
    }

    try {
      const organizationId = await getOrganizationId(baseUrl);
      if (!organizationId) {
        throw new Error('Organization not found');
      }

      const response = await fetch(`/api/posts/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: updatedContent, organization_id: organizationId }),
      });

      if (response.ok) {
        debug.log('usePostPageAdmin', 'Content updated successfully');
      } else {
        debug.error('usePostPageAdmin', 'Failed to update content:', await response.json());
      }
    } catch (error) {
      debug.error('usePostPageAdmin', 'Error updating content:', error);
    }
  }, [baseUrl, slug, post, isAdmin]);

  // Memoized editable handler
  const makeEditable = useCallback((e: React.MouseEvent, contentRef: HTMLDivElement | null) => {
    if (!isAdmin) return;
    const target = e.target as HTMLElement;
    debug.log('usePostPageAdmin', 'Double-clicked:', target.tagName, 'ID:', target.id);
    
    if (['H1', 'H2', 'H3', 'H4', 'H5', 'P', 'UL', 'LI'].includes(target.tagName)) {
      target.contentEditable = 'true';
      target.focus();
      
      const handleBlur = () => {
        debug.log('usePostPageAdmin', 'Blur on:', target.tagName, 'ID:', target.id, 'Content:', target.innerHTML);
        target.contentEditable = 'false';
        handleContentUpdate(contentRef);
      };

      const handleKeyDown = (ev: KeyboardEvent) => {
        if (ev.key === 'Enter' && !ev.shiftKey) {
          debug.log('usePostPageAdmin', 'Enter pressed on:', target.tagName, 'ID:', target.id);
          ev.preventDefault();
          target.blur();
        }
      };

      target.addEventListener('blur', handleBlur, { once: true });
      target.addEventListener('keydown', handleKeyDown);
    }
  }, [isAdmin, handleContentUpdate]);

  return {
    isAdmin,
    isHeaderHovered,
    setIsHeaderHovered,
    handleContentUpdate,
    makeEditable,
  };
}
