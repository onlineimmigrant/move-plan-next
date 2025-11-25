import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Article = TiptapNode.create({
  name: 'article',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'article' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['article', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});
