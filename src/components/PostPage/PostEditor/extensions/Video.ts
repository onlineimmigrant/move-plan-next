import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Video = TiptapNode.create({
  name: 'video',
  group: 'block',
  atom: true,
  
  parseHTML() {
    return [{ tag: 'video' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['video', mergeAttributes(HTMLAttributes)];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      src: { default: null },
      width: { default: null },
      height: { default: null },
      controls: { default: null },
      autoplay: { default: null },
      loop: { default: null },
      muted: { default: null },
      poster: { default: null },
    };
  },
});
