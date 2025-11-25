import { Editor } from '@tiptap/react';
import { MediaItem } from '../types';

export interface ImageHandlers {
  setLink: () => void;
  addImage: () => void;
  handleImageSelect: (url: string, attribution?: any, isVideo?: boolean, videoData?: any) => void;
  setImageAlignment: (align: 'left' | 'center' | 'right') => void;
  setImageSize: (width: string) => void;
}

export function useImageHandlers(
  editor: Editor | null,
  editorMode: string,
  markdownContent: string,
  setMarkdownContent: (content: string) => void,
  setShowLinkModal: (show: boolean) => void,
  setShowImageGallery: (show: boolean) => void,
  onContentChange?: (content: string, type: 'html' | 'markdown') => void
): ImageHandlers {
  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    setShowLinkModal(true);
  };

  const addImage = () => {
    setShowImageGallery(true);
  };

  const handleImageSelect = (url: string, attribution?: any, isVideo?: boolean, videoData?: any) => {
    if (isVideo) {
      alert('Please use the Video button to add videos');
      return;
    }

    if (editorMode === 'markdown') {
      // For markdown, insert image as HTML with wrapper for alignment
      const imageHtml = `<div class="image-wrapper" data-align="center" data-width="auto"><img src="${url}" alt="" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" /></div>`;
      const newContent = markdownContent + '\n\n' + imageHtml + '\n\n';
      setMarkdownContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'markdown');
      }
    } else {
      // Insert image with wrapper div for alignment/sizing
      if (!editor) return;
      const imageHtml = `<div class="image-wrapper" data-align="center" data-width="auto" style="text-align: center; margin: 1rem auto; max-width: 100%;"><img src="${url}" alt="" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" /></div>`;
      editor.chain().focus().insertContent(imageHtml).run();
      
      // If there's unsplash attribution, add it below the image
      if (attribution && (attribution as any).photographer) {
        const unsplashAttribution = attribution as any;
        const attributionHtml = `<p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">Photo by <a href="${unsplashAttribution.photographerUrl}?utm_source=MovePlan&utm_medium=referral" target="_blank" rel="noopener noreferrer" style="color: #6b7280; text-decoration: underline;">${unsplashAttribution.photographer}</a> on <a href="https://unsplash.com?utm_source=MovePlan&utm_medium=referral" target="_blank" rel="noopener noreferrer" style="color: #6b7280; text-decoration: underline;">Unsplash</a></p>`;
        editor.chain().focus().insertContent(attributionHtml).run();
      } else if (attribution && (attribution as any).photographerName) {
        const pexelsAttribution = attribution as any;
        const attributionHtml = `<p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.5rem;">Photo by <a href="${pexelsAttribution.photographerUrl}" target="_blank" rel="noopener noreferrer" style="color: #6b7280; text-decoration: underline;">${pexelsAttribution.photographerName}</a> on <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style="color: #6b7280; text-decoration: underline;">Pexels</a></p>`;
        editor.chain().focus().insertContent(attributionHtml).run();
      }
    }
    
    setShowImageGallery(false);
  };

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    const { state, view } = editor;
    const { selection } = state;
    
    // Find the image wrapper div
    let wrapperPos: number | null = null;
    let wrapperNode: any = null;

    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'div' && node.attrs?.class === 'image-wrapper') {
        wrapperNode = node;
        wrapperPos = $pos.before(d);
        break;
      }
    }

    if (!wrapperNode) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'div' && node.attrs?.class === 'image-wrapper') {
          wrapperNode = node;
          wrapperPos = pos;
          return false;
        }
      });
    }

    if (wrapperNode && wrapperPos !== null) {
      const alignStyles = {
        left: 'text-align: left; margin: 1rem 0;',
        center: 'text-align: center; margin: 1rem auto;',
        right: 'text-align: right; margin: 1rem 0 1rem auto;',
      };

      const transaction = state.tr.setNodeMarkup(wrapperPos, undefined, {
        ...wrapperNode.attrs,
        'data-align': align,
        style: alignStyles[align] + ' max-width: 100%;',
      });
      view.dispatch(transaction);
      console.log('Image alignment updated to:', align);
    } else {
      console.log('No image wrapper selected');
    }
  };

  const setImageSize = (width: string) => {
    if (!editor) return;
    const { state, view } = editor;
    const { selection } = state;
    
    // Find the image wrapper div
    let wrapperPos: number | null = null;
    let wrapperNode: any = null;

    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'div' && node.attrs?.class === 'image-wrapper') {
        wrapperNode = node;
        wrapperPos = $pos.before(d);
        break;
      }
    }

    if (!wrapperNode) {
      state.doc.nodesBetween(selection.from, selection.to, (node: any, pos: number) => {
        if (node.type.name === 'div' && node.attrs?.class === 'image-wrapper') {
          wrapperNode = node;
          wrapperPos = pos;
          return false;
        }
      });
    }

    if (wrapperNode && wrapperPos !== null) {
      const currentAlign = (wrapperNode.attrs['data-align'] || 'center') as 'left' | 'center' | 'right';
      const alignStyles: Record<'left' | 'center' | 'right', string> = {
        left: 'text-align: left; margin: 1rem 0;',
        center: 'text-align: center; margin: 1rem auto;',
        right: 'text-align: right; margin: 1rem 0 1rem auto;',
      };

      const transaction = state.tr.setNodeMarkup(wrapperPos, undefined, {
        ...wrapperNode.attrs,
        'data-width': width,
        style: alignStyles[currentAlign] + ` max-width: 100%; width: ${width};`,
      });
      view.dispatch(transaction);
      console.log('Image size updated to:', width);
    } else {
      console.log('No image wrapper selected');
    }
  };

  return {
    setLink,
    addImage,
    handleImageSelect,
    setImageAlignment,
    setImageSize,
  };
}
