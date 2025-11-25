import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const ButtonNode = TiptapNode.create({
  name: 'button',
  group: 'inline',
  inline: true,
  content: 'inline*',
  
  parseHTML() {
    return [{ tag: 'button' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['button', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      type: { default: 'button' },
      disabled: { default: null },
      'data-action': { default: null },
    };
  },
});
