import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Nav = TiptapNode.create({
  name: 'nav',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'nav' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['nav', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});
