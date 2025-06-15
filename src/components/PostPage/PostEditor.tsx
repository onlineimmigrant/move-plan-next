'use client';

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import ImageResize from 'tiptap-extension-resize-image';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Mention from '@tiptap/extension-mention';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { mergeAttributes } from '@tiptap/core';
import { Button } from '@/components/ui/button';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node } from 'prosemirror-model';
import './PostEditor.css';

// Define props interface explicitly
interface PostEditorProps {
  onSave: (content: string) => void;
  initialContent?: string;
}

// Custom Image extension
const CustomImage = ImageResize.extend({
  name: 'image',
  group: 'block',
  inline: false,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      align: {
        default: 'left',
        parseHTML: (element) => element.getAttribute('data-align') || 'left',
        renderHTML: (attributes) => ({ 'data-align': attributes.align }),
      },
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width') || element.style.width || null,
        renderHTML: (attributes) => ({ width: attributes.width || null }),
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height') || element.style.height || null,
        renderHTML: (attributes) => ({ height: attributes.height || null }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, height, ...rest } = HTMLAttributes;
    const imgStyles = [width ? `width: ${width}` : '', height ? `height: ${height}` : '']
      .filter(Boolean)
      .join('; ');
    return [
      'img',
      mergeAttributes(
        {
          class: `image-align-${align} max-w-full h-auto my-2 rounded`,
          style: imgStyles,
          'data-align': align,
        },
        rest
      ),
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'img',
        getAttrs: (dom) => {
          if (!(dom instanceof HTMLImageElement)) return false;
          return {
            src: dom.getAttribute('src'),
            alt: dom.getAttribute('alt'),
            title: dom.getAttribute('title'),
            width: dom.getAttribute('width') || dom.style.width || null,
            height: dom.getAttribute('height') || dom.style.height || null,
            align: dom.getAttribute('data-align') || 'left',
          };
        },
      },
      {
        tag: 'div[class="image-wrapper"]',
        getAttrs: (dom) => {
          const img = dom.querySelector('img');
          if (!img) return false;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width: img.getAttribute('width') || img.style.width || null,
            height: img.getAttribute('height') || dom.style.height || null,
            align: img.getAttribute('data-align') || dom.style.textAlign || 'left',
          };
        },
      },
    ];
  },
});

// Custom Table extension with border attributes and background color
const CustomTable = Table.extend({
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

// Helper function to get table attributes (for plugins)
function getTableAttributes(node: Node, pos: number, view: EditorView): Record<string, any> {
  const resolved = view.state.doc.resolve(pos);
  let currentNode = node;
  let currentPos = pos;

  for (let depth = resolved.depth; depth >= 0; depth--) {
    const parent = resolved.node(depth);
    if (parent.type.name === 'table') {
      return parent.attrs;
    }
    currentPos = resolved.before(depth);
    currentNode = resolved.node(depth);
  }

  return {
    borderStyle: 'solid',
    borderWidth: '1px',
    borderColor: '#e5e7eb',
    backgroundColor: 'transparent',
  };
}

// Custom TableCell with centered text
const CustomTableCell = TableCell.extend({
  renderHTML({ HTMLAttributes }) {
    // Use default attributes; dynamic styles applied by createEditingStylePlugin and handleSave
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

// Custom TableHeader with transparent background and centered text
const CustomTableHeader = TableHeader.extend({
  renderHTML({ HTMLAttributes }) {
    // Use default attributes; dynamic styles applied by createEditingStylePlugin and handleSave
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

// Plugin to apply inline border styles during editing
function createEditingStylePlugin() {
  return new Plugin({
    key: new PluginKey('tableEditingStyle'),
    view(editorView: EditorView) {
      return {
        update: () => {
          const tables = editorView.dom.querySelectorAll('.tiptap-table') as NodeListOf<HTMLElement>;
          tables.forEach((table) => {
            table.classList.add('editing');
            const attrs = table.dataset;
            const borderStyle = attrs.borderStyle || 'solid';
            const borderWidth = attrs.borderWidth || '1px';
            const borderColor = attrs.borderColor || '#e5e7eb';
            const border = borderStyle === 'none' ? 'none' : `${borderStyle} ${borderWidth} ${borderColor}`;
            const backgroundColor = attrs.backgroundColor || 'transparent';
            const cells = table.querySelectorAll('.tiptap-table-cell');
            const headers = table.querySelectorAll('.tiptap-table-header');
            cells.forEach((cell) => {
              (cell as HTMLElement).style.border = border;
            });
            headers.forEach((header) => {
              (header as HTMLElement).style.border = border;
              (header as HTMLElement).style.backgroundColor = backgroundColor;
            });
          });
        },
      };
    },
  });
}

// Resize plugin for draggable borders
function createResizePlugin() {
  return new Plugin({
    key: new PluginKey('tableResize'),
    view(editorView: EditorView) {
      return {
        update: () => {
          const tables = editorView.dom.querySelectorAll('.tiptap-table') as NodeListOf<HTMLElement>;
          tables.forEach((table) => {
            table.classList.add('editing');
            addResizeHandles(table, editorView);
          });
        },
        destroy: () => {
          document.querySelectorAll('.resize-handle').forEach((handle) => handle.remove());
        },
      };
    },
  });
}

function addResizeHandles(table: HTMLElement, editorView: EditorView) {
  table.querySelectorAll('.resize-handle').forEach((handle) => handle.remove());

  const rows = table.querySelectorAll('tr') as NodeListOf<HTMLElement>;
  const headerRow = table.querySelector('tr');
  if (headerRow) {
    const cells = headerRow.querySelectorAll('th, td') as NodeListOf<HTMLElement>;
    cells.forEach((cell, index) => {
      const handle = document.createElement('div');
      handle.className = 'resize-handle column-resize';
      handle.style.cssText = `
        position: absolute;
        top: 0;
        right: -4px;
        width: 8px;
        height: 100%;
        cursor: col-resize;
        background: transparent;
        z-index: 10;
      `;
      cell.style.position = 'relative';
      cell.appendChild(handle);

      handle.addEventListener('mousedown', (e: MouseEvent) => {
        e.preventDefault();
        startColumnResize(e, table, index, editorView);
      });
      handle.addEventListener('touchstart', (e: TouchEvent) => {
        e.preventDefault();
        startColumnResize(e, table, index, editorView);
      });
    });
  }

  rows.forEach((row, index) => {
    const handle = document.createElement('div');
    handle.className = 'resize-handle row-resize';
    handle.style.cssText = `
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 100%;
      height: 8px;
      cursor: row-resize;
      background: transparent;
      z-index: 10;
    `;
    row.style.position = 'relative';
    row.appendChild(handle);

    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault();
      startRowResize(e, table, index, editorView);
    });
    handle.addEventListener('touchstart', (e: TouchEvent) => {
      e.preventDefault();
      startRowResize(e, table, index, editorView);
    });
  });
}

function startColumnResize(e: MouseEvent | TouchEvent, table: HTMLElement, colIndex: number, editorView: EditorView) {
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const startX = clientX;
  const cells = Array.from(table.querySelectorAll(`tr > *:nth-child(${colIndex + 1})`)) as HTMLElement[];
  const startWidth = cells[0].getBoundingClientRect().width;

  const onMove = (moveEvent: MouseEvent | TouchEvent) => {
    moveEvent.preventDefault();
    const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
    const delta = currentX - startX;
    const newWidth = Math.max(50, startWidth + delta);
    cells.forEach((cell) => {
      cell.style.width = `${newWidth}px`;
      cell.style.minWidth = `${newWidth}px`;
    });
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
    editorView.focus();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}

function startRowResize(e: MouseEvent | TouchEvent, table: HTMLElement, rowIndex: number, editorView: EditorView) {
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
  const startY = clientY;
  const row = table.querySelectorAll('tr')[rowIndex] as HTMLElement;
  const startHeight = row.getBoundingClientRect().height;

  const onMove = (moveEvent: MouseEvent | TouchEvent) => {
    moveEvent.preventDefault();
    const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
    const delta = currentY - startY;
    const newHeight = Math.max(20, startHeight + delta);
    row.style.height = `${newHeight}px`;
    row.style.minHeight = `${newHeight}px`;
  };

  const onEnd = () => {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onEnd);
    document.removeEventListener('touchend', onEnd);
    editorView.focus();
  };

  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('mouseup', onEnd);
  document.addEventListener('touchend', onEnd);
}

const PostEditor: React.FC<PostEditorProps> = ({ onSave, initialContent }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-sky-700 underline',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      CustomImage,
      OrderedList,
      Blockquote,
      CodeBlock,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your post here...',
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: { class: 'bg-yellow-200' },
      }),
      CharacterCount.configure({
        limit: 50000,
      }),
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: {
          items: ({ query }) => {
            const suggestions = ['alice', 'bob', 'charlie', 'david', 'emma'];
            return suggestions
              .filter((item) => item.toLowerCase().startsWith(query.toLowerCase()))
              .slice(0, 5);
          },
          render: () => {
            const state: { component: HTMLDivElement | null; popup: HTMLDivElement | null } = {
              component: null,
              popup: null,
            };

            return {
              onStart: (props) => {
                state.component = document.createElement('div');
                state.component.className = 'mention-suggestions';
                state.component.style.position = 'absolute';
                state.component.style.background = 'white';
                state.component.style.border = '1px solid #ccc';
                state.component.style.padding = '5px';
                state.component.innerHTML = props.items
                  .map(
                    (item) =>
                      `<div class="suggestion-item" style="padding: 5px; cursor: pointer;">@${item}</div>`
                  )
                  .join('');

                state.popup = document.body.appendChild(state.component);
                const rect = props.clientRect?.();
                if (rect && state.popup) {
                  state.popup.style.left = `${rect.left}px`;
                  state.popup.style.top = `${rect.bottom}px`;
                }

                state.component.addEventListener('click', (e) => {
                  const target = e.target as HTMLElement;
                  const item = target.textContent?.slice(1);
                  if (item) {
                    props.command({ id: item });
                  }
                });
              },
              onUpdate: (props) => {
                if (state.component) {
                  state.component.innerHTML = props.items
                    .map(
                      (item) =>
                        `<div class="suggestion-item" style="padding: 5px; cursor: pointer;">@${item}</div>`
                    )
                    .join('');
                }
              },
              onExit: () => {
                if (state.popup) {
                  state.popup.remove();
                  state.popup = null;
                  state.component = null;
                }
              },
            };
          },
        },
      }),
      CustomTable.configure({
        resizable: true,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
    ],
    content: initialContent || '<p>Start writing your post here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-xl m-5 focus:outline-none',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                view.dispatch(
                  view.state.tr.insert(
                    coordinates.pos,
                    view.state.schema.nodes.image.create({
                      src,
                      align: 'left',
                      width: '200px',
                      height: 'auto',
                    })
                  )
                );
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const [showTableSubmenu, setShowTableSubmenu] = useState(false);

  // Touch scrolling handler for edit mode
  useEffect(() => {
    if (!editor) return;

    const handleTouchStart = (e: TouchEvent) => {
      const wrapper = (e.target as HTMLElement).closest('.table-wrapper') as HTMLElement;
      if (!wrapper) return;

      const startX = e.touches[0].clientX;
      const scrollStart = wrapper.scrollLeft;

      const handleTouchMove = (moveEvent: TouchEvent) => {
        moveEvent.preventDefault();
        moveEvent.stopPropagation();
        const currentX = moveEvent.touches[0].clientX;
        const deltaX = startX - currentX;
        wrapper.scrollLeft = scrollStart + deltaX;
      };

      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };

      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    };

    const editorDom = editor.view.dom;
    editorDom.addEventListener('touchstart', handleTouchStart, { passive: false });

    return () => {
      editorDom.removeEventListener('touchstart', handleTouchStart);
    };
  }, [editor]);

  if (!editor) return null;

  const applyStyle = (tag: string) => {
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
        editor.chain().focus().setParagraph().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().setParagraph().toggleCodeBlock().run();
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

  const setLink = () => {
    const url = window.prompt('Enter the URL');
    if (url) {
      editor.chain().focus().toggleLink({ href: url, target: '_blank' }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('Enter the image URL');
    if (url) {
      editor.chain().focus().setNode('image', { src: url, align: 'left', width: '200px', height: 'auto' }).run();
    }
  };

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    const { state } = editor;
    const { selection } = state;
    const pos = selection.$anchor.pos;
    const node = state.doc.nodeAt(pos);

    if (node && node.type.name === 'image') {
      const transaction = state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        align,
      });
      editor.view.dispatch(transaction);
    } else {
      console.log('No image selected');
    }
  };

  const toggleHighlight = () => {
    editor.chain().focus().toggleHighlight().run();
  };

  const handleSave = () => {
    const tables = editor.view.dom.querySelectorAll('.tiptap-table') as NodeListOf<HTMLElement>;
    tables.forEach((table) => {
      table.classList.remove('editing');
      const attrs = table.dataset;
      const borderStyle = attrs.borderStyle || 'solid';
      const borderWidth = attrs.borderWidth || '1px';
      const borderColor = attrs.borderColor || '#e5e7eb';
      const border = borderStyle === 'none' ? 'none' : `${borderStyle} ${borderWidth} ${borderColor}`;
      const cells = table.querySelectorAll('.tiptap-table-cell, .tiptap-table-header');
      cells.forEach((cell) => {
        (cell as HTMLElement).style.border = border;
      });
      const headers = table.querySelectorAll('.tiptap-table-header');
      headers.forEach((header) => {
        (header as HTMLElement).style.backgroundColor = attrs.backgroundColor || 'transparent';
      });
    });
    const htmlContent = editor.getHTML();
    console.log('Saved HTML:', htmlContent);
    onSave(htmlContent);
  };

  return (
    <div className="post-editor-container">
      <div className="post-editor text-gray-600">
        <div className="toolbar mb-4 flex gap-0.5 flex-wrap">
          <Button
            size="sm"
            onClick={() => applyStyle('h1')}
            variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'outline'}
          >
            H1
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('h2')}
            variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'outline'}
          >
            H2
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('h3')}
            variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'outline'}
          >
            H3
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('h4')}
            variant={editor.isActive('heading', { level: 4 }) ? 'secondary' : 'outline'}
          >
            H4
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('h5')}
            variant={editor.isActive('heading', { level: 5 }) ? 'secondary' : 'outline'}
          >
            H5
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('p')}
            variant={editor.isActive('paragraph') ? 'secondary' : 'outline'}
          >
            P
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('ul')}
            variant={editor.isActive('bulletList') ? 'secondary' : 'outline'}
          >
            UL
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('ol')}
            variant={editor.isActive('orderedList') ? 'secondary' : 'outline'}
          >
            OL
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('blockquote')}
            variant={editor.isActive('blockquote') ? 'secondary' : 'outline'}
          >
            Quote
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('codeBlock')}
            variant={editor.isActive('codeBlock') ? 'secondary' : 'outline'}
          >
            Code
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('bold')}
            variant={editor.isActive('bold') ? 'secondary' : 'outline'}
          >
            B
          </Button>
          <Button
            size="sm"
            onClick={() => applyStyle('italic')}
            variant={editor.isActive('italic') ? 'secondary' : 'outline'}
          >
            I
          </Button>
          <Button
            size="sm"
            onClick={setLink}
            variant={editor.isActive('link') ? 'secondary' : 'outline'}
          >
            Link
          </Button>
          <Button size="sm" onClick={addImage} variant="outline">
            Image
          </Button>
          <Button
            size="sm"
            onClick={() => setImageAlignment('left')}
            variant={editor.isActive('image', { align: 'left' }) ? 'secondary' : 'outline'}
          >
            Left
          </Button>
          <Button
            size="sm"
            onClick={() => setImageAlignment('center')}
            variant={editor.isActive('image', { align: 'center' }) ? 'secondary' : 'outline'}
          >
            Center
          </Button>
          <Button
            size="sm"
            onClick={() => setImageAlignment('right')}
            variant={editor.isActive('image', { align: 'right' }) ? 'secondary' : 'outline'}
          >
            Right
          </Button>
          <Button
            size="sm"
            onClick={() => setShowTableSubmenu(!showTableSubmenu)}
            variant={showTableSubmenu ? 'secondary' : 'outline'}
          >
            Table Menu
          </Button>
          <Button
            size="sm"
            onClick={toggleHighlight}
            variant={editor.isActive('highlight') ? 'secondary' : 'outline'}
          >
            Highlight
          </Button>
          <Button size="sm" onClick={handleSave} variant="primary">
            Save
          </Button>
        </div>
        {showTableSubmenu && (
          <div className="table-submenu">
            <Button
              size="sm"
              onClick={() => applyStyle('table')}
              variant={editor.isActive('table') ? 'secondary' : 'outline'}
            >
              Table
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('addRowAfter')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Add Row
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('addColumnAfter')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Add Column
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('deleteRow')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Delete Row
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('deleteColumn')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Delete Column
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('mergeCells')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Merge Cells
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('splitCell')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Split Cell
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('deleteTable')}
              variant={editor.isActive('table') ? 'outline' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Delete Table
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('borderNone')}
              variant={editor.isActive('table', { borderStyle: 'none' }) ? 'secondary' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              No Border
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('borderSolid')}
              variant={
                editor.isActive('table', { borderStyle: 'solid', borderWidth: '1px' })
                  ? 'secondary'
                  : 'outline'
              }
              disabled={!editor.isActive('table')}
            >
              Solid Border
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('borderDashed')}
              variant={editor.isActive('table', { borderStyle: 'dashed' }) ? 'secondary' : 'outline'}
              disabled={!editor.isActive('table')}
            >
              Dashed Border
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('borderBold')}
              variant={
                editor.isActive('table', { borderStyle: 'special', borderWidth: '3px' })
                  ? 'secondary'
                  : 'outline'
              }
              disabled={!editor.isActive('table')}
            >
              Bold Border
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('borderColor')}
              variant="outline"
              disabled={!editor.isActive('table')}
            >
              Border Color
            </Button>
            <Button
              size="sm"
              onClick={() => applyStyle('headerBackground')}
              variant="outline"
              disabled={!editor.isActive('table')}
            >
              Header Bg
            </Button>
          </div>
        )}
        <EditorContent
          editor={editor}
          className="border border-gray-200 p-4 rounded-md min-h-[300px] bg-white"
        />
        <div className="mt-2 text-sm text-gray-500">
          {editor?.storage.characterCount.characters()} / 50000 characters
        </div>
      </div>
    </div>
  );
};

export default PostEditor;