import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Footer = TiptapNode.create({
  name: 'footer',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'footer' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['footer', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});
