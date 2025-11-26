// types.ts - Type definitions for PostEditModal

export type PostType = 'default' | 'minimal' | 'landing' | 'doc_set';
export type ContentType = 'html' | 'markdown';

export interface PostFormData {
  title: string;
  description: string;
  content?: string;
  contentType: ContentType;
  subsection: string;
  slug: string;
  authorName: string;
  mainPhoto: string;
  mediaConfig: {
    main_photo?: string;
    unsplash_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
      download_location: string;
    };
    pexels_attribution?: {
      photographer: string;
      photographer_url: string;
      photo_url: string;
    };
  };
  metaDescription: string;
  order: string;
  helpCenterOrder: string;
  displayThisPost: boolean;
  isDisplayedFirstPage: boolean;
  isCompanyAuthor: boolean;
  displayAsBlogPost: boolean;
  isHelpCenter: boolean;
  postType: PostType;
  isNumbered: boolean;
  createdOn: string;
  docSet: string;
  docSetOrder: string;
  docSetTitle: string;
  section: string;
  organizationId?: string;
  translations?: Record<string, { title?: string; description?: string; content?: string }>;
}

export interface TOCItem {
  tag_name: string;
  tag_text: string;
  tag_id: string;
}

export interface DocumentSet {
  slug: string;
  title: string;
}

export interface InlineEditState {
  field: 'title' | 'description' | null;
  value: string;
  position: { x: number; y: number };
}

export type MegaMenuId = 'settings' | 'translations' | null;
