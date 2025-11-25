import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Aside = TiptapNode.create({
  name: 'aside',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'aside' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['aside', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});
