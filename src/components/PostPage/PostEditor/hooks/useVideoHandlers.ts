import { Editor } from '@tiptap/react';

export interface VideoHandlers {
  addVideo: () => void;
  handleVideoSelect: (url: string, attribution?: any, isVideo?: boolean, videoData?: any) => void;
  setVideoAlignment: (align: 'left' | 'center' | 'right') => void;
  setVideoSize: (width: string) => void;
}

export function useVideoHandlers(
  editor: Editor | null,
  editorMode: string,
  markdownContent: string,
  setMarkdownContent: (content: string) => void,
  setShowVideoGallery: (show: boolean) => void,
  onContentChange?: (content: string, type: 'html' | 'markdown') => void
): VideoHandlers {
  const addVideo = () => {
    setShowVideoGallery(true);
  };

  const handleVideoSelect = (url: string, attribution?: any, isVideo?: boolean, videoData?: any) => {
    console.log('🎬 handleVideoSelect called with:', { url, isVideo, videoData });
    
    if (!isVideo || !videoData) {
      alert('Please select a video from the gallery');
      return;
    }

    if (editorMode === 'markdown') {
      // For markdown, insert video as HTML with wrapper for alignment
      let videoHtml = '';
      
      if (videoData.video_player === 'youtube') {
        videoHtml = `<div class="video-wrapper" data-align="center" data-width="560px"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoData.video_url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
      } else if (videoData.video_player === 'vimeo') {
        videoHtml = `<div class="video-wrapper" data-align="center" data-width="560px"><iframe src="https://player.vimeo.com/video/${videoData.video_url}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>`;
      } else if (videoData.video_player === 'r2' || videoData.video_player === 'pexels') {
        videoHtml = `<div class="video-wrapper" data-align="center" data-width="560px"><video src="${videoData.video_url}" controls${videoData.thumbnail_url ? ` poster="${videoData.thumbnail_url}"` : ''} style="max-width: 100%; height: auto;"></video></div>`;
      }
      
      const newContent = markdownContent + '\n\n' + videoHtml + '\n\n';
      setMarkdownContent(newContent);
      if (onContentChange) {
        onContentChange(newContent, 'markdown');
      }
    } else {
      // Insert video in visual editor with wrapper div for alignment/sizing
      let videoHtml = '';
      
      if (videoData.video_player === 'youtube') {
        videoHtml = `<div class="video-wrapper" data-align="center" data-width="560px" style="text-align: center; margin: 1rem auto; max-width: 100%;"><iframe width="560" height="315" src="https://www.youtube.com/embed/${videoData.video_url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="max-width: 100%;"></iframe></div>`;
      } else if (videoData.video_player === 'vimeo') {
        videoHtml = `<div class="video-wrapper" data-align="center" data-width="560px" style="text-align: center; margin: 1rem auto; max-width: 100%;"><iframe src="https://player.vimeo.com/video/${videoData.video_url}" width="560" height="315" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen style="max-width: 100%;"></iframe></div>`;
      } else if (videoData.video_player === 'r2' || videoData.video_player === 'pexels') {
        videoHtml = `<div class="video-wrapper" data-align="center" data-width="560px" style="text-align: center; margin: 1rem auto; max-width: 100%;"><video src="${videoData.video_url}" controls${videoData.thumbnail_url ? ` poster="${videoData.thumbnail_url}"` : ''} style="max-width: 100%; height: auto; display: block; margin: 0 auto;"></video></div>`;
      }
      
      if (!editor) return;
      editor.chain().focus().insertContent(videoHtml).run();
    }
    
    setShowVideoGallery(false);
  };

  const setVideoAlignment = (align: 'left' | 'center' | 'right') => {
    if (!editor) return;
    const { state, view } = editor;
    const { selection } = state;
    
    // Find the video wrapper div
    let wrapperPos: number | null = null;
    let wrapperNode: any = null;

    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'div' && node.attrs?.class === 'video-wrapper') {
        wrapperNode = node;
        wrapperPos = $pos.before(d);
        break;
      }
    }

    if (!wrapperNode) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'div' && node.attrs?.class === 'video-wrapper') {
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
      console.log('Video alignment updated to:', align);
    } else {
      console.log('No video wrapper selected');
    }
  };

  const setVideoSize = (width: string) => {
    if (!editor) return;
    const { state, view } = editor;
    const { selection } = state;
    
    // Find the video wrapper div
    let wrapperPos: number | null = null;
    let wrapperNode: any = null;

    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'div' && node.attrs?.class === 'video-wrapper') {
        wrapperNode = node;
        wrapperPos = $pos.before(d);
        break;
      }
    }

    if (!wrapperNode) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'div' && node.attrs?.class === 'video-wrapper') {
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
      console.log('Video size updated to:', width);
    } else {
      console.log('No video wrapper selected');
    }
  };

  return {
    addVideo,
    handleVideoSelect,
    setVideoAlignment,
    setVideoSize,
  };
}
