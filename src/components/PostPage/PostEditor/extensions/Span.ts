import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Span = TiptapNode.create({
  name: 'span',
  group: 'inline',
  inline: true,
  content: 'inline*',
  
  parseHTML() {
    return [{ tag: 'span' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});
