import { Editor } from '@tiptap/react';

/**
 * Apply various styling and formatting actions to the editor
 * @param editor - The TipTap editor instance
 * @param tag - The style/tag to apply
 */
export const applyStyle = (editor: Editor, tag: string) => {
  switch (tag) {
    case 'h1':
      editor.chain().focus().toggleHeading({ level: 1 }).run();
      break;
    case 'h2':
      editor.chain().focus().toggleHeading({ level: 2 }).run();
      break;
    case 'h3':
      editor.chain().focus().toggleHeading({ level: 3 }).run();
      break;
    case 'h4':
      editor.chain().focus().toggleHeading({ level: 4 }).run();
      break;
    case 'h5':
      editor.chain().focus().toggleHeading({ level: 5 }).run();
      break;
    case 'p':
      editor.chain().focus().setParagraph().run();
      break;
    case 'ul':
      editor.chain().focus().toggleBulletList().run();
      break;
    case 'ol':
      editor.chain().focus().toggleOrderedList().run();
      break;
    case 'blockquote':
      editor.chain().focus().toggleBlockquote().run();
      break;
    case 'codeBlock':
      editor.chain().focus().toggleCodeBlock().run();
      break;
    case 'div':
      // Toggle div: wrap content in div or unwrap if already in div
      const divSelection = editor.state.selection;
      const { $from } = divSelection;
      let isInsideDiv = false;
      let divPos = -1;
      let divNode = null;
      
      // Check if cursor/selection is inside a div
      for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'div') {
          isInsideDiv = true;
          divPos = $from.before(d);
          divNode = node;
          break;
        }
      }
      
      if (isInsideDiv && divNode) {
        // Unwrap: remove the div and lift its content up
        const divContent: any[] = [];
        divNode.forEach((child) => {
          divContent.push(child.toJSON());
        });
        
        // Replace the div with its content
        editor.chain()
          .focus()
          .deleteRange({ from: divPos, to: divPos + divNode.nodeSize })
          .insertContentAt(divPos, divContent)
          .run();
      } else {
        // Wrap: create a new div
        const { from, to } = divSelection;
        const { doc } = editor.state;
        
        if (from === to) {
          // No selection - insert empty div with paragraph inside
          editor.chain().focus().insertContent({
            type: 'div',
            content: [{ type: 'paragraph', content: [] }]
          }).run();
        } else {
          // Has selection - get the selected content and wrap it
          const selectedContent = doc.slice(from, to).content;
          const nodes: any[] = [];
          let hasBlockContent = false;
          
          // Convert selected content to JSON nodes and check if they're block nodes
          selectedContent.forEach((node) => {
            const jsonNode = node.toJSON();
            nodes.push(jsonNode);
            // Check if this is a block-level node
            if (node.isBlock) {
              hasBlockContent = true;
            }
          });
          
          // If selection contains only inline content (text), wrap it in a paragraph
          let contentToInsert;
          if (!hasBlockContent || nodes.length === 0) {
            // Inline content or empty - wrap in paragraph
            contentToInsert = {
              type: 'div',
              content: [{
                type: 'paragraph',
                content: nodes.length > 0 ? nodes : []
              }]
            };
          } else {
            // Block content - use as-is
            contentToInsert = {
              type: 'div',
              content: nodes
            };
          }
          
          // Delete selected content and insert div with that content
          editor.chain()
            .focus()
            .deleteRange({ from, to })
            .insertContentAt(from, contentToInsert)
            .run();
        }
      }
      break;
    case 'bold':
      editor.chain().focus().toggleBold().run();
      break;
    case 'italic':
      editor.chain().focus().toggleItalic().run();
      break;
    case 'table':
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
      break;
    case 'addRowAfter':
      editor.chain().focus().addRowAfter().run();
      break;
    case 'addColumnAfter':
      editor.chain().focus().addColumnAfter().run();
      break;
    case 'deleteRow':
      editor.chain().focus().deleteRow().run();
      break;
    case 'deleteColumn':
      editor.chain().focus().deleteColumn().run();
      break;
    case 'mergeCells':
      editor.chain().focus().mergeCells().run();
      break;
    case 'splitCell':
      editor.chain().focus().splitCell().run();
      break;
    case 'deleteTable':
      editor.chain().focus().deleteTable().run();
      break;
    case 'borderNone':
      editor.chain().focus().updateAttributes('table', { borderStyle: 'none' }).run();
      break;
    case 'borderSolid':
      editor.chain().focus().updateAttributes('table', { borderStyle: 'solid', borderWidth: '1px' }).run();
      break;
    case 'borderDashed':
      editor.chain().focus().updateAttributes('table', { borderStyle: 'dashed', borderWidth: '1px' }).run();
      break;
    case 'borderBold':
      editor.chain().focus().updateAttributes('table', { borderStyle: 'special', borderWidth: '3px' }).run();
      break;
    case 'borderColor':
      const borderColor = window.prompt('Enter border color (hex or Tailwind class)', '#e5e7eb');
      if (borderColor) {
        const { state, dispatch } = editor.view;
        const { tr } = state;
        let tableFound = false;
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            tableFound = true;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              borderColor,
              borderStyle: node.attrs.borderStyle === 'none' ? 'solid' : node.attrs.borderStyle,
            });
            const tableNode = editor.view.dom.querySelector(`.tiptap-table[data-border-color="${node.attrs.borderColor}"]`) as HTMLElement | null;
            if (tableNode) {
              const cells = tableNode.querySelectorAll('.tiptap-table-cell, .tiptap-table-header');
              cells.forEach((cell) => {
                (cell as HTMLElement).style.borderColor = borderColor;
              });
            }
          }
        });
        if (tableFound) {
          dispatch(tr);
          console.log('Applied borderColor:', borderColor);
        } else {
          console.warn('No table found to apply borderColor');
        }
      }
      break;
    case 'headerBackground':
      const backgroundColor = window.prompt('Enter header background color (hex or Tailwind class)', 'transparent');
      if (backgroundColor) {
        const { state, dispatch } = editor.view;
        const { tr } = state;
        let tableFound = false;
        state.doc.descendants((node, pos) => {
          if (node.type.name === 'table') {
            tableFound = true;
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              backgroundColor,
            });
            const tableNode = editor.view.dom.querySelector(`.tiptap-table[data-background-color="${node.attrs.backgroundColor}"]`) as HTMLElement | null;
            if (tableNode) {
              const headers = tableNode.querySelectorAll('.tiptap-table-header');
              headers.forEach((header) => {
                (header as HTMLElement).style.backgroundColor = backgroundColor;
              });
            }
          }
        });
        if (tableFound) {
          dispatch(tr);
          console.log('Applied backgroundColor:', backgroundColor);
        } else {
          console.warn('No table found to apply backgroundColor');
        }
      }
      break;
    default:
      break;
  }
};

/**
 * Toggle highlight on the current selection
 * @param editor - The TipTap editor instance
 */
export const toggleHighlight = (editor: Editor) => {
  editor.chain().focus().toggleHighlight().run();
};
