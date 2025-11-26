import type { UnsplashAttribution } from '@/components/modals/ImageGalleryModal/UnsplashImageSearch';

export type EditorMode = 'visual' | 'html' | 'markdown';

export interface PostEditorProps {
  onSave: (content: string, contentType?: 'html' | 'markdown') => void;
  initialContent?: string;
  initialContentType?: 'html' | 'markdown';
  onContentChange?: (content: string, contentType: 'html' | 'markdown') => void;
  onCodeViewChange?: (isCodeView: boolean) => void;
  onEditorChange?: () => void;
  postType?: 'default' | 'minimal' | 'landing' | 'doc_set';
  initialCodeView?: boolean;
  mediaConfig?: {
    main_photo?: string;
    unsplash_attribution?: UnsplashAttribution;
  };
  onMediaConfigChange?: (mediaConfig: { main_photo?: string; unsplash_attribution?: UnsplashAttribution }) => void;
  // For AI enhancement
  postTitle?: string;
  postDescription?: string;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
}

/**
 * Gets display name for editor mode
 */
export const getEditorModeLabel = (mode: EditorMode): string => {
  switch (mode) {
    case 'markdown': return 'Markdown';
    case 'html': return 'HTML';
    case 'visual': return 'Visual';
  }
};
