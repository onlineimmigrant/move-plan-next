import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { mergeAttributes } from '@tiptap/core';

export const CustomTableCell = TableCell.extend({
  renderHTML({ HTMLAttributes }) {
    const border = 'solid 1px #e5e7eb';
    return [
      'td',
      mergeAttributes(HTMLAttributes, {
        class: 'tiptap-table-cell',
        style: `padding: 0.5rem; text-align: center; border: ${border};`,
      }),
      0,
    ];
  },
});

export const CustomTableHeader = TableHeader.extend({
  renderHTML({ HTMLAttributes }) {
    const border = 'solid 1px #e5e7eb';
    const backgroundColor = 'transparent';
    return [
      'th',
      mergeAttributes(HTMLAttributes, {
        class: 'tiptap-table-header',
        style: `padding: 0.5rem; text-align: center; font-weight: bold; background-color: ${backgroundColor}; border: ${border};`,
      }),
      0,
    ];
  },
});
