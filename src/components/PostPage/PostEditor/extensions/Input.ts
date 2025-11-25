import { Node as TiptapNode } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';

export const Input = TiptapNode.create({
  name: 'input',
  group: 'inline',
  inline: true,
  atom: true,
  
  parseHTML() {
    return [{ tag: 'input' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['input', mergeAttributes(HTMLAttributes)];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      type: { default: 'text' },
      placeholder: { default: null },
      name: { default: null },
      value: { default: null },
      required: { default: null },
    };
  },
});
