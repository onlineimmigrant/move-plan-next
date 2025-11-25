import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Iframe = TiptapNode.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  
  parseHTML() {
    return [{ tag: 'iframe' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['iframe', mergeAttributes(HTMLAttributes)];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      src: { default: null },
      width: { default: null },
      height: { default: null },
      frameborder: { default: '0' },
      allowfullscreen: { default: null },
    };
  },
});
