import Table from '@tiptap/extension-table';
import { mergeAttributes } from '@tiptap/core';
import { createResizePlugin, createEditingStylePlugin } from '../utils/tableHelpers';

export const CustomTable = Table.extend({
  name: 'table',

  addAttributes() {
    return {
      borderStyle: {
        default: 'solid',
        parseHTML: (element) => element.getAttribute('data-border-style') || 'solid',
        renderHTML: (attributes) => ({ 'data-border-style': attributes.borderStyle }),
      },
      borderColor: {
        default: '#e5e7eb',
        parseHTML: (element) => element.getAttribute('data-border-color') || '#e5e7eb',
        renderHTML: (attributes) => ({ 'data-border-color': attributes.borderColor }),
      },
      borderWidth: {
        default: '1px',
        parseHTML: (element) => element.getAttribute('data-border-width') || '1px',
        renderHTML: (attributes) => ({ 'data-border-width': attributes.borderWidth }),
      },
      backgroundColor: {
        default: 'transparent',
        parseHTML: (element) => element.getAttribute('data-background-color') || 'transparent',
        renderHTML: (attributes) => ({ 'data-background-color': attributes.backgroundColor }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      { class: 'table-wrapper' },
      [
        'table',
        mergeAttributes(
          {
            class: 'tiptap-table editing',
            style: `border-collapse: collapse;`,
            'data-border-style': HTMLAttributes['data-border-style'] || 'solid',
            'data-border-color': HTMLAttributes['data-border-color'] || '#e5e7eb',
            'data-border-width': HTMLAttributes['data-border-width'] || '1px',
            'data-background-color': HTMLAttributes['data-background-color'] || 'transparent',
          },
          HTMLAttributes
        ),
        0,
      ],
    ];
  },

  addProseMirrorPlugins() {
    const plugins = this.parent?.() || [];
    return [...plugins, createResizePlugin(), createEditingStylePlugin()];
  },
});
