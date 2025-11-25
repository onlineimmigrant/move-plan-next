import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Div = TiptapNode.create({
  name: 'div',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'div' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['div', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      'data-type': { default: null },
    };
  },
});
