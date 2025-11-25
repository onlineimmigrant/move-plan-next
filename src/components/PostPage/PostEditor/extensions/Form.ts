import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Form = TiptapNode.create({
  name: 'form',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'form' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['form', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      action: { default: null },
      method: { default: null },
    };
  },
});
