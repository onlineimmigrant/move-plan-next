// MediaCarouselNode.tsx - Custom TipTap node for embedded media carousel
import { Node as TiptapNode, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React from 'react';
import { MediaCarouselRenderer } from './MediaCarouselRenderer';

export interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  videoPlayer?: 'youtube' | 'vimeo' | 'pexels' | 'r2';
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mediaCarousel: {
      setMediaCarousel: (options: { mediaItems: MediaItem[]; align?: 'left' | 'center' | 'right'; width?: string }) => ReturnType;
      updateMediaCarouselAlignment: (align: 'left' | 'center' | 'right') => ReturnType;
      updateMediaCarouselWidth: (width: string) => ReturnType;
    };
  }
}

const MediaCarouselEditorView: React.FC<NodeViewProps> = ({ node }) => {
  const { mediaItems, align, width } = node.attrs;

  console.log('🎬 MediaCarouselEditorView rendering:', { mediaItems, align, width });

  if (!mediaItems || mediaItems.length === 0) {
    console.log('⚠️ MediaCarouselEditorView: No media items');
    return (
      <NodeViewWrapper 
        contentEditable={false}
        style={{
          display: 'block',
          padding: '2rem',
          textAlign: 'center',
          background: '#f3f4f6',
          borderRadius: '8px',
          color: '#6b7280',
          margin: '1rem 0',
          border: '3px solid red',
          minHeight: '100px'
        }}
      >
        <div>📸 Empty Carousel</div>
      </NodeViewWrapper>
    );
  }

  console.log('✅ MediaCarouselEditorView: Rendering MediaCarouselRenderer');

  return (
    <NodeViewWrapper 
      as="div"
      data-node-view-wrapper=""
      className="media-carousel-node-view"
    >
      <div style={{ 
        display: 'block !important' as any,
        margin: '2rem 0',
        border: '5px solid blue !important' as any,
        padding: '20px',
        backgroundColor: '#ff0000 !important' as any,
        minHeight: '200px !important' as any,
        width: '100% !important' as any,
        position: 'relative' as any,
        zIndex: 9999 as any
      }}>
        <div style={{ 
          background: 'yellow', 
          color: 'black', 
          padding: '20px', 
          fontSize: '24px',
          fontWeight: 'bold',
          display: 'block'
        }}>
          🚨 NODE VIEW WRAPPER TEST 🚨
        </div>
        <MediaCarouselRenderer
          mediaItems={mediaItems}
          align={align}
          width={width}
        />
      </div>
    </NodeViewWrapper>
  );
};

export const MediaCarousel = TiptapNode.create({
  name: 'mediaCarousel',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      mediaItems: {
        default: [],
        parseHTML: (element) => {
          const data = element.getAttribute('data-media-items');
          return data ? JSON.parse(data) : [];
        },
        renderHTML: (attributes) => {
          if (!attributes.mediaItems || attributes.mediaItems.length === 0) {
            return {};
          }
          return {
            'data-media-items': JSON.stringify(attributes.mediaItems),
          };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element) => element.getAttribute('data-align') || 'center',
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.align,
          };
        },
      },
      width: {
        default: '600px',
        parseHTML: (element) => element.getAttribute('data-width') || '600px',
        renderHTML: (attributes) => {
          return {
            'data-width': attributes.width,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="media-carousel"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const { mediaItems, align, width } = node.attrs;
    
    const attrs = mergeAttributes(
      {
        'data-type': 'media-carousel',
        'data-media-items': JSON.stringify(mediaItems || []),
        'data-align': align,
        'data-width': width,
      },
      HTMLAttributes
    );
    
    return ['div', attrs];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MediaCarouselEditorView);
  },

  addCommands() {
    return {
      setMediaCarousel:
        (options: { mediaItems: MediaItem[]; align?: 'left' | 'center' | 'right'; width?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              mediaItems: options.mediaItems,
              align: options.align || 'center',
              width: options.width || '600px',
            },
          });
        },
      updateMediaCarouselAlignment:
        (align: 'left' | 'center' | 'right') =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { align });
        },
      updateMediaCarouselWidth:
        (width: string) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, { width });
        },
    };
  },
});
