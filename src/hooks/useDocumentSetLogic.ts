import { useMemo } from 'react';

interface Post {
  type?: string;
  doc_set?: string | null;
  organization_id?: string;
  slug: string;
}

export interface DocumentSetLogic {
  /** Whether this post is part of a document set */
  isDocSet: boolean;
  /** Whether the post has an organization_id */
  hasOrganization: boolean;
  /** Whether to show Master TOC (isDocSet && hasOrganization) */
  showMasterTOC: boolean;
  /** The document set slug to use (post.doc_set || post.slug) */
  docSetSlug: string;
  /** Whether post.type === 'doc_set' specifically */
  isDocSetType: boolean;
}

/**
 * Hook to determine document set logic and configuration
 * Consolidates all doc set conditional logic into a single source of truth
 * 
 * @param post - The post object with type, doc_set, organization_id, and slug
 * @returns DocumentSetLogic object with all computed flags
 */
export function useDocumentSetLogic(post: Post): DocumentSetLogic {
  return useMemo(() => {
    const isDocSet = post.type === 'doc_set' || !!post.doc_set;
    const hasOrganization = !!post.organization_id;
    const showMasterTOC = isDocSet && hasOrganization;
    const docSetSlug = post.doc_set || post.slug;
    const isDocSetType = post.type === 'doc_set';
    
    return {
      isDocSet,
      hasOrganization,
      showMasterTOC,
      docSetSlug,
      isDocSetType,
    };
  }, [post.type, post.doc_set, post.organization_id, post.slug]);
}
