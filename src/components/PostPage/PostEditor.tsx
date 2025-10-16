'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Node as TiptapNode } from '@tiptap/core';
import Button from '@/ui/Button';
import ImageGalleryModal from '@/components/modals/ImageGalleryModal';
import LinkModal from '@/components/PostPage/LinkModal';
import { Plugin, PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import './PostEditor.css';

// Custom Div extension - allows <div> tags with all attributes
const Div = TiptapNode.create({
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

// Custom Section extension - semantic HTML5
const Section = TiptapNode.create({
  name: 'section',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'section' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['section', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});

// Custom Article extension - semantic HTML5
const Article = TiptapNode.create({
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

// Custom Header extension - semantic HTML5
const Header = TiptapNode.create({
  name: 'header',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'header' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['header', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});

// Custom Footer extension - semantic HTML5
const Footer = TiptapNode.create({
  name: 'footer',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'footer' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['footer', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});

// Custom Main extension - semantic HTML5
const Main = TiptapNode.create({
  name: 'main',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'main' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['main', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});

// Custom Aside extension - semantic HTML5
const Aside = TiptapNode.create({
  name: 'aside',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'aside' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['aside', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});

// Custom Nav extension - semantic HTML5
const Nav = TiptapNode.create({
  name: 'nav',
  group: 'block',
  content: 'block*',
  defining: true,
  
  parseHTML() {
    return [{ tag: 'nav' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['nav', mergeAttributes(HTMLAttributes), 0];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
    };
  },
});

// Custom Span extension - inline container
const Span = TiptapNode.create({
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

// Custom Button extension - interactive element
const ButtonNode = TiptapNode.create({
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

// Custom Form extension - for forms
const Form = TiptapNode.create({
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

// Custom Input extension - form inputs
const Input = TiptapNode.create({
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

// Custom Iframe extension - for embeds
const Iframe = TiptapNode.create({
  name: 'iframe',
  group: 'block',
  atom: true,
  
  parseHTML() {
    return [{ tag: 'iframe' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['iframe', mergeAttributes(HTMLAttributes)];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      src: { default: null },
      width: { default: null },
      height: { default: null },
      frameborder: { default: '0' },
      allowfullscreen: { default: null },
    };
  },
});

// Custom Video extension - for video elements
const Video = TiptapNode.create({
  name: 'video',
  group: 'block',
  atom: true,
  
  parseHTML() {
    return [{ tag: 'video' }];
  },
  
  renderHTML({ HTMLAttributes }: any) {
    return ['video', mergeAttributes(HTMLAttributes)];
  },
  
  addAttributes() {
    return {
      class: { default: null },
      id: { default: null },
      style: { default: null },
      src: { default: null },
      width: { default: null },
      height: { default: null },
      controls: { default: null },
      autoplay: { default: null },
      loop: { default: null },
      muted: { default: null },
      poster: { default: null },
    };
  },
});

// HTML Formatter utility - formats HTML with proper indentation based on depth
const formatHTML = (html: string, indentType: 'spaces' | 'tabs' = 'spaces', indentSize: 2 | 4 = 2, lineEnding: 'lf' | 'crlf' = 'lf'): string => {
  const tab = indentType === 'tabs' ? '\t' : ' '.repeat(indentSize);
  const newLine = lineEnding === 'crlf' ? '\r\n' : '\n';
  let result = '';
  let indent = 0;

  // Inline elements that shouldn't trigger indentation changes
  const inlineElements = ['a', 'span', 'strong', 'em', 'b', 'i', 'u', 'code', 'small', 'mark', 'del', 'ins', 'sub', 'sup', 'abbr', 'cite', 'kbd', 'var', 'samp', 'q', 'time', 'data'];
  
  // Self-closing elements
  const selfClosing = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr'];
  
  // Block elements that should always be on their own line
  const blockElements = ['div', 'p', 'section', 'article', 'header', 'footer', 'main', 'nav', 'aside', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'form', 'fieldset', 'legend', 'blockquote', 'pre', 'address', 'figure', 'figcaption'];

  // Split HTML into tokens (tags and text)
  const tokens = html.match(/<[^>]+>|[^<]+/g) || [];

  tokens.forEach((token, index) => {
    if (token.startsWith('<')) {
      // It's a tag
      const isClosing = token.startsWith('</');
      const isSelfClosing = token.endsWith('/>') || selfClosing.some(tag => 
        new RegExp(`<${tag}[\\s>]`, 'i').test(token)
      );
      const tagMatch = token.match(/<\/?([a-zA-Z0-9]+)/);
      const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';
      const isInline = inlineElements.includes(tagName);
      const isBlock = blockElements.includes(tagName);

      if (isClosing) {
        // Closing tag
        if (isBlock || !isInline) {
          indent = Math.max(0, indent - 1);
          // Add newline before closing tag if it's a block element
          const prevToken = tokens[index - 1];
          const prevIsTag = prevToken && prevToken.startsWith('<');
          if (prevIsTag || isBlock) {
            result += newLine + tab.repeat(indent) + token;
          } else {
            result += token;
          }
        } else {
          result += token;
        }
      } else if (isSelfClosing) {
        // Self-closing tag
        if (isBlock) {
          result += newLine + tab.repeat(indent) + token;
        } else {
          result += token;
        }
      } else {
        // Opening tag
        if (isBlock || !isInline) {
          result += newLine + tab.repeat(indent) + token;
          indent++;
        } else {
          result += token;
        }
      }
    } else {
      // Text content
      const trimmed = token.trim();
      if (trimmed) {
        // Check context to determine if text should be inline or on new line
        const prevToken = tokens[index - 1];
        const nextToken = tokens[index + 1];
        
        const prevIsInlineOpening = prevToken && prevToken.startsWith('<') && !prevToken.startsWith('</') &&
          inlineElements.some(tag => new RegExp(`<${tag}[\\s>]`, 'i').test(prevToken));
        
        const nextIsInlineClosing = nextToken && nextToken.startsWith('</') &&
          inlineElements.some(tag => new RegExp(`</${tag}>`, 'i').test(nextToken));
        
        const prevIsBlockOpening = prevToken && prevToken.startsWith('<') && !prevToken.startsWith('</') &&
          blockElements.some(tag => new RegExp(`<${tag}[\\s>]`, 'i').test(prevToken));
        
        // If text comes after a block opening tag, indent it
        if (prevIsBlockOpening && !prevIsInlineOpening) {
          result += newLine + tab.repeat(indent) + trimmed;
        } else {
          result += trimmed;
        }
      }
    }
  });

  return result.trim();
};

// Define props interface explicitly
interface PostEditorProps {
  onSave: (content: string) => void;
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onCodeViewChange?: (isCodeView: boolean) => void;
  postType?: 'default' | 'minimal' | 'landing';
  initialCodeView?: boolean;
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
function getTableAttributes(node: ProseMirrorNode, pos: number, view: EditorView): Record<string, any> {
  const resolved = view.state.doc.resolve(pos);
  let currentNode: ProseMirrorNode = node;
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

const PostEditor: React.FC<PostEditorProps> = ({ 
  onSave, 
  initialContent, 
  onContentChange, 
  onCodeViewChange, 
  postType = 'default',
  initialCodeView 
}) => {
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
      // Custom HTML5 semantic and container elements
      Div,
      Section,
      Article,
      Header,
      Footer,
      Main,
      Aside,
      Nav,
      // Landing page elements
      Span,
      ButtonNode,
      Form,
      Input,
      Iframe,
      Video,
    ],
    content: initialContent || '<p>Start writing your post here...</p>',
    onUpdate: ({ editor }) => {
      if (onContentChange) {
        onContentChange(editor.getHTML());
      }
    },
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
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [isCodeView, setIsCodeView] = useState(
    initialCodeView !== undefined ? initialCodeView : postType === 'landing'
  );
  const [htmlContent, setHtmlContent] = useState('');
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [currentLinkUrl, setCurrentLinkUrl] = useState('');
  const [htmlEditorBgColor, setHtmlEditorBgColor] = useState<'dark' | 'light'>('dark');
  const [copySuccess, setCopySuccess] = useState(false);
  const [htmlValidationErrors, setHtmlValidationErrors] = useState<string[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  
  // Undo/Redo state for HTML editor
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [htmlHistoryIndex, setHtmlHistoryIndex] = useState(-1);
  
  // Find & Replace state
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  
  // Beautify settings state with localStorage persistence
  const [showBeautifySettings, setShowBeautifySettings] = useState(false);
  const [indentType, setIndentType] = useState<'spaces' | 'tabs'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_indentType');
      return (saved === 'tabs' ? 'tabs' : 'spaces') as 'spaces' | 'tabs';
    }
    return 'spaces';
  });
  const [indentSize, setIndentSize] = useState<2 | 4>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_indentSize');
      return (saved === '4' ? 4 : 2) as 2 | 4;
    }
    return 2;
  });
  const [lineEnding, setLineEnding] = useState<'lf' | 'crlf'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('htmlEditor_lineEnding');
      return (saved === 'crlf' ? 'crlf' : 'lf') as 'lf' | 'crlf';
    }
    return 'lf';
  });
  
  // Save beautify settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('htmlEditor_indentType', indentType);
    }
  }, [indentType]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('htmlEditor_indentSize', indentSize.toString());
    }
  }, [indentSize]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('htmlEditor_lineEnding', lineEnding);
    }
  }, [lineEnding]);
  
  // Syntax highlighting state
  const [syntaxHighlighting, setSyntaxHighlighting] = useState(true);
  
  // Refs for syncing scroll
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightLayerRef = useRef<HTMLDivElement>(null);

  // Find matches in HTML content
  const findMatches = (text: string) => {
    if (!text) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return [];
    }
    
    const content = htmlContent;
    const matches: number[] = [];
    const searchText = caseSensitive ? text : text.toLowerCase();
    const searchContent = caseSensitive ? content : content.toLowerCase();
    
    let index = 0;
    while (index < searchContent.length) {
      const foundIndex = searchContent.indexOf(searchText, index);
      if (foundIndex === -1) break;
      matches.push(foundIndex);
      index = foundIndex + 1;
    }
    
    setTotalMatches(matches.length);
    return matches;
  };

  // Find next match
  const findNext = () => {
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const nextIndex = (currentMatchIndex + 1) % matches.length;
    setCurrentMatchIndex(nextIndex);
    
    // Highlight and scroll to match
    if (textareaRef.current) {
      const start = matches[nextIndex];
      const end = start + findText.length;
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      
      // Calculate the line number and scroll position
      const beforeMatch = htmlContent.substring(0, start);
      const lineNumber = beforeMatch.split('\n').length;
      const lineHeight = 1.8 * 13; // Based on line-height: 1.8 and font-size: 13px
      const scrollPosition = (lineNumber - 3) * lineHeight; // Show match with some context
      
      // Scroll both the textarea's parent container and line numbers
      const container = textareaRef.current.parentElement?.parentElement;
      if (container) {
        container.scrollTop = Math.max(0, scrollPosition);
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }
    }
  };

  // Find previous match
  const findPrevious = () => {
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const prevIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    setCurrentMatchIndex(prevIndex);
    
    // Highlight and scroll to match
    if (textareaRef.current) {
      const start = matches[prevIndex];
      const end = start + findText.length;
      
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(start, end);
      
      // Calculate the line number and scroll position
      const beforeMatch = htmlContent.substring(0, start);
      const lineNumber = beforeMatch.split('\n').length;
      const lineHeight = 1.8 * 13; // Based on line-height: 1.8 and font-size: 13px
      const scrollPosition = (lineNumber - 3) * lineHeight; // Show match with some context
      
      // Scroll both the textarea's parent container and line numbers
      const container = textareaRef.current.parentElement?.parentElement;
      if (container) {
        container.scrollTop = Math.max(0, scrollPosition);
        if (lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = Math.max(0, scrollPosition);
        }
      }
    }
  };

  // Replace current match
  const replaceCurrent = () => {
    const matches = findMatches(findText);
    if (matches.length === 0) return;
    
    const start = matches[currentMatchIndex];
    const end = start + findText.length;
    
    const newContent = 
      htmlContent.substring(0, start) + 
      replaceText + 
      htmlContent.substring(end);
    
    setHtmlContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    // Move to next match
    setTimeout(() => findNext(), 50);
  };

  // Replace all matches
  const replaceAll = () => {
    if (!findText) return;
    
    const searchText = caseSensitive ? findText : findText.toLowerCase();
    const content = caseSensitive ? htmlContent : htmlContent.toLowerCase();
    
    // Count matches first
    const count = (content.match(new RegExp(escapeRegExp(searchText), 'g')) || []).length;
    
    if (count === 0) return;
    
    // Perform replacement
    let newContent = htmlContent;
    if (caseSensitive) {
      newContent = htmlContent.split(findText).join(replaceText);
    } else {
      // Case-insensitive replacement
      const regex = new RegExp(escapeRegExp(findText), 'gi');
      newContent = htmlContent.replace(regex, replaceText);
    }
    
    setHtmlContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }
    
    setTotalMatches(0);
    setCurrentMatchIndex(0);
  };

  // Helper function to escape regex special characters
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Update matches when find text or content changes
  useEffect(() => {
    if (showFindReplace && findText) {
      findMatches(findText);
    }
  }, [findText, htmlContent, caseSensitive, showFindReplace]);

  // Copy to clipboard function
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Undo function
  const undoHtml = () => {
    if (htmlHistoryIndex > 0) {
      const newIndex = htmlHistoryIndex - 1;
      setHtmlHistoryIndex(newIndex);
      setHtmlContent(htmlHistory[newIndex]);
      if (onContentChange) {
        onContentChange(htmlHistory[newIndex]);
      }
    }
  };

  // Redo function
  const redoHtml = () => {
    if (htmlHistoryIndex < htmlHistory.length - 1) {
      const newIndex = htmlHistoryIndex + 1;
      setHtmlHistoryIndex(newIndex);
      setHtmlContent(htmlHistory[newIndex]);
      if (onContentChange) {
        onContentChange(htmlHistory[newIndex]);
      }
    }
  };

  // HTML Validation function
  const validateHtml = () => {
    const errors: string[] = [];
    const tagStack: { tag: string; position: number }[] = [];
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    // Find all tags
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g;
    let match;
    
    while ((match = tagRegex.exec(htmlContent)) !== null) {
      const fullTag = match[0];
      const tagName = match[1].toLowerCase();
      const position = match.index;
      
      // Skip self-closing tags
      if (selfClosingTags.includes(tagName) || fullTag.endsWith('/>')) {
        continue;
      }
      
      // Closing tag
      if (fullTag.startsWith('</')) {
        if (tagStack.length === 0) {
          errors.push(`Closing tag </${tagName}> has no matching opening tag at position ${position}`);
        } else {
          const lastOpen = tagStack[tagStack.length - 1];
          if (lastOpen.tag === tagName) {
            tagStack.pop();
          } else {
            errors.push(`Expected closing tag </${lastOpen.tag}> but found </${tagName}> at position ${position}`);
          }
        }
      } 
      // Opening tag
      else {
        tagStack.push({ tag: tagName, position });
      }
    }
    
    // Check for unclosed tags
    tagStack.forEach(({ tag, position }) => {
      errors.push(`Unclosed tag <${tag}> at position ${position}`);
    });
    
    setHtmlValidationErrors(errors);
    setShowValidationErrors(true);
    
    // Auto-hide after 5 seconds if no errors
    if (errors.length === 0) {
      setTimeout(() => setShowValidationErrors(false), 3000);
    }
  };

  // Syntax highlighting function for HTML
  const highlightHtml = (code: string): string => {
    if (!code) return '';
    
    // Escape HTML for safe rendering
    let result = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Define specific colors for individual tags
    const tagColors = htmlEditorBgColor === 'dark' ? {
      // Structural tags
      html: '#C586C0',
      head: '#C586C0',
      body: '#C586C0',
      header: '#B267C0',
      footer: '#B267C0',
      main: '#D19CD9',
      nav: '#D19CD9',
      aside: '#D19CD9',
      section: '#E0B3E8',
      article: '#E0B3E8',
      
      // Headings - Different shades of red/orange
      h1: '#FF6B6B',      // Bright red
      h2: '#FF8C42',      // Orange-red
      h3: '#FFA500',      // Orange
      h4: '#FFB84D',      // Light orange
      h5: '#FFC266',      // Lighter orange
      h6: '#FFD699',      // Pale orange
      
      // Content containers - Different shades of teal/cyan
      div: '#4EC9B0',     // Teal
      span: '#6DD9C0',    // Light teal
      p: '#87E8D0',       // Lighter teal
      blockquote: '#5DD5BE',
      pre: '#46B89C',
      code: '#3FA68A',
      
      // Text formatting
      strong: '#DCDCAA',
      em: '#E8E8BB',
      b: '#D4D49A',
      i: '#E0E0AA',
      u: '#C8C888',
      s: '#B8B877',
      small: '#F0F0CC',
      mark: '#FFFF99',
      del: '#C0C090',
      ins: '#D8D8A0',
      sub: '#E4E4B0',
      sup: '#E4E4B0',
      
      // Lists
      ul: '#9CDCFE',
      ol: '#80C8FF',
      li: '#B0E0FF',
      dl: '#8CD4FF',
      dt: '#A0DCFF',
      dd: '#B8E4FF',
      
      // Tables
      table: '#CE9178',
      thead: '#D8A588',
      tbody: '#E2B998',
      tfoot: '#ECCDA8',
      tr: '#D49F88',
      th: '#DA9B80',
      td: '#E0AA90',
      caption: '#C88868',
      colgroup: '#C28060',
      col: '#BC7858',
      
      // Form elements
      form: '#4FC1FF',
      input: '#5FCCFF',
      textarea: '#6FD7FF',
      select: '#7FE2FF',
      option: '#8FEDFF',
      button: '#40B6EE',
      label: '#9FF8FF',
      fieldset: '#30ABDD',
      legend: '#20A0CC',
      
      // Media tags - img explicitly included
      img: '#FF77FF',     // Bright magenta - highly visible
      video: '#C586C0',
      audio: '#D19CD9',
      source: '#E0B3E8',
      picture: '#FF99FF',
      figure: '#CC77CC',
      figcaption: '#DD88DD',
      svg: '#EE99EE',
      canvas: '#BB66BB',
      
      // Links
      a: '#4EC9B0',
      link: '#5DD5BE',
      
      // Meta tags
      meta: '#808080',
      title: '#909090',
      style: '#A0A0A0',
      script: '#B0B0B0',
      noscript: '#707070',
      base: '#888888',
      
      // Default
      default: '#569CD6',
      attribute: '#9CDCFE',
      attributeValue: '#CE9178',
      bracket: '#808080',
      comment: '#6A9955',
    } : {
      // Light theme colors
      html: '#AF00DB',
      head: '#AF00DB',
      body: '#AF00DB',
      header: '#9900BB',
      footer: '#9900BB',
      main: '#BB11DD',
      nav: '#BB11DD',
      aside: '#BB11DD',
      section: '#CC22EE',
      article: '#CC22EE',
      
      // Headings - Different shades
      h1: '#CC0000',      // Dark red
      h2: '#DD3300',      // Red-orange
      h3: '#EE6600',      // Orange
      h4: '#FF8800',      // Light orange
      h5: '#FF9933',      // Lighter orange
      h6: '#FFAA55',      // Pale orange
      
      // Content containers
      div: '#267F99',
      span: '#337F99',
      p: '#408999',
      blockquote: '#2A7589',
      pre: '#206979',
      code: '#185569',
      
      // Text formatting
      strong: '#795E26',
      em: '#896E36',
      b: '#695E16',
      i: '#896E36',
      u: '#997E46',
      s: '#887744',
      small: '#AA9966',
      mark: '#BB8800',
      del: '#666633',
      ins: '#777744',
      sub: '#888855',
      sup: '#888855',
      
      // Lists
      ul: '#0070C1',
      ol: '#0060B1',
      li: '#0080D1',
      dl: '#0068BB',
      dt: '#0074C5',
      dd: '#0084D5',
      
      // Tables
      table: '#A31515',
      thead: '#B32525',
      tbody: '#C33535',
      tfoot: '#D34545',
      tr: '#BB2020',
      th: '#AA1010',
      td: '#CC2828',
      caption: '#991010',
      colgroup: '#880000',
      col: '#770000',
      
      // Form elements
      form: '#0000FF',
      input: '#1111FF',
      textarea: '#2222FF',
      select: '#3333FF',
      option: '#4444FF',
      button: '#0000EE',
      label: '#5555FF',
      fieldset: '#0000DD',
      legend: '#0000CC',
      
      // Media tags - img explicitly included
      img: '#FF00FF',     // Bright magenta
      video: '#AF00DB',
      audio: '#BB11DD',
      source: '#CC22EE',
      picture: '#EE44FF',
      figure: '#DD33EE',
      figcaption: '#CC22DD',
      svg: '#FF55FF',
      canvas: '#AA00CC',
      
      // Links
      a: '#267F99',
      link: '#337F99',
      
      // Meta tags
      meta: '#808080',
      title: '#707070',
      style: '#606060',
      script: '#505050',
      noscript: '#909090',
      base: '#757575',
      
      // Default
      default: '#0000FF',
      attribute: '#FF0000',
      attributeValue: '#A31515',
      bracket: '#808080',
      comment: '#008000',
    };
    
    // Helper function to get color for tag
    const getTagColor = (tagName: string): string => {
      const lowerTag = tagName.toLowerCase();
      return tagColors[lowerTag as keyof typeof tagColors] || tagColors.default;
    };
    
    // Apply syntax highlighting
    // Comments
    result = result.replace(
      /(&lt;!--[\s\S]*?--&gt;)/g,
      `<span style="color: ${tagColors.comment};">$1</span>`
    );
    
    // Opening/Closing tags with attributes
    result = result.replace(
      /(&lt;\/?)(\w+)((?:\s+[\w-]+(?:=(?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+))?)*\s*)(\/?&gt;)/g,
      (match, openBracket, tagName, attributes, closeBracket) => {
        const tagColor = getTagColor(tagName);
        let highlighted = openBracket + `<span style="color: ${tagColor}; font-weight: 600;">${tagName}</span>`;
        
        // Highlight attributes
        if (attributes) {
          highlighted += attributes.replace(
            /([\w-]+)(=)?((?:&quot;[^&quot;]*&quot;|&#039;[^&#039;]*&#039;|[^\s&gt;]+)?)/g,
            (_attrMatch: string, attrName: string, equals: string, attrValue: string) => {
              let result = `<span style="color: ${tagColors.attribute};">${attrName}</span>`;
              if (equals) {
                result += equals;
                if (attrValue) {
                  result += `<span style="color: ${tagColors.attributeValue};">${attrValue}</span>`;
                }
              }
              return result;
            }
          );
        }
        
        highlighted += `<span style="color: ${tagColors.bracket};">${closeBracket}</span>`;
        return highlighted;
      }
    );
    
    return result;
  };

  // Toggle HTML comment
  const toggleComment = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = htmlContent.substring(start, end);

    let newContent: string;
    let newCursorPos: number;

    if (selectedText) {
      // Check if selected text is already commented
      const isCommented = selectedText.startsWith('<!--') && selectedText.endsWith('-->');
      
      if (isCommented) {
        // Uncomment: remove <!-- and -->
        const uncommented = selectedText.substring(4, selectedText.length - 3);
        newContent = htmlContent.substring(0, start) + uncommented + htmlContent.substring(end);
        newCursorPos = start + uncommented.length;
      } else {
        // Comment: wrap with <!-- -->
        const commented = `<!-- ${selectedText} -->`;
        newContent = htmlContent.substring(0, start) + commented + htmlContent.substring(end);
        newCursorPos = start + commented.length;
      }
    } else {
      // No selection: insert comment template at cursor
      const comment = '<!-- comment -->';
      newContent = htmlContent.substring(0, start) + comment + htmlContent.substring(end);
      newCursorPos = start + 5; // Position cursor after "<!-- "
    }

    setHtmlContent(newContent);
    if (onContentChange) {
      onContentChange(newContent);
    }

    // Restore cursor position
    setTimeout(() => {
      if (textarea) {
        if (selectedText && !selectedText.startsWith('<!--')) {
          // If we just commented, select the commented text
          textarea.setSelectionRange(start, newCursorPos);
        } else {
          textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
        textarea.focus();
      }
    }, 0);
  };

  // Handle keyboard shortcuts and auto-complete in HTML editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    if (!textarea) return;

    // Toggle comment with Cmd/Ctrl + /
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      toggleComment();
      return;
    }

    const cursorPos = textarea.selectionStart;
    const currentContent = textarea.value;
    const textBeforeCursor = currentContent.substring(0, cursorPos);
    const afterCursor = currentContent.substring(cursorPos);

    // Auto-complete HTML comment when typing "!" after "<"
    if (e.key === '!' && textBeforeCursor.endsWith('<')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Insert the comment template: <!-- -->
      const newContent = textBeforeCursor + '!--  -->' + afterCursor;
      
      setHtmlContent(newContent);
      if (onContentChange) {
        onContentChange(newContent);
      }
      
      // Position cursor in the center (after "<!-- ")
      setTimeout(() => {
        const centerPos = cursorPos + 4; // After "<!-- "
        textarea.value = newContent;
        textarea.selectionStart = centerPos;
        textarea.selectionEnd = centerPos;
        textarea.focus();
      }, 0);
      return;
    }

    // Self-closing tags that don't need a closing tag
    const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
    
    // Auto-complete closing tags when typing ">"
    if (e.key === '>') {
      // Check if we're closing an opening tag (not a closing tag or self-closing tag)
      const lastTagMatch = textBeforeCursor.match(/<(\w+)(?:\s+[^>]*)?$/);
      
      if (lastTagMatch) {
        const tagName = lastTagMatch[1].toLowerCase();
        
        // Don't auto-close if it's a self-closing tag or already self-closed
        if (!selfClosingTags.includes(tagName) && !textBeforeCursor.endsWith('/')) {
          e.preventDefault();
          e.stopPropagation();
          
          // Insert > and closing tag, then position cursor between them
          const newContent = textBeforeCursor + '>' + `</${tagName}>` + afterCursor;
          
          setHtmlContent(newContent);
          if (onContentChange) {
            onContentChange(newContent);
          }
          
          // Position cursor right after the >
          setTimeout(() => {
            const newPos = cursorPos + 1;
            textarea.value = newContent;
            textarea.selectionStart = newPos;
            textarea.selectionEnd = newPos;
            textarea.focus();
          }, 0);
        }
      }
    }
  };

  // Update history when HTML content changes
  useEffect(() => {
    if (isCodeView && htmlContent !== htmlHistory[htmlHistoryIndex]) {
      // Add to history
      const newHistory = htmlHistory.slice(0, htmlHistoryIndex + 1);
      newHistory.push(htmlContent);
      
      // Keep only last 50 entries
      if (newHistory.length > 50) {
        newHistory.shift();
      } else {
        setHtmlHistoryIndex(htmlHistoryIndex + 1);
      }
      
      setHtmlHistory(newHistory);
    }
  }, [htmlContent, isCodeView]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
      
      // Ctrl+F to toggle Find & Replace (in HTML editor only)
      if (isCodeView && (event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        setShowFindReplace(!showFindReplace);
      }
      
      // Escape to close Find & Replace
      if (isCodeView && showFindReplace && event.key === 'Escape') {
        event.preventDefault();
        setShowFindReplace(false);
      }
      
      // Ctrl+Z to undo (in HTML editor only)
      if (isCodeView && (event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undoHtml();
      }
      
      // Ctrl+Shift+Z or Ctrl+Y to redo (in HTML editor only)
      if (isCodeView && ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') || 
          (isCodeView && (event.ctrlKey || event.metaKey) && event.key === 'y')) {
        event.preventDefault();
        redoHtml();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, showFindReplace]);

  // Track text selection (keeping for future use if needed)
  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateSelection = () => {
      const { from, to, empty } = editor.state.selection;
      // Floating toolbar removed - keeping selection tracking for other features
    };

    editor.on('selectionUpdate', updateSelection);
    return () => {
      editor.off('selectionUpdate', updateSelection);
    };
  }, [editor]);

  // Update editor content when initialContent prop changes
  useEffect(() => {
    if (editor && initialContent !== undefined) {
      const currentContent = editor.getHTML();
      const newContent = initialContent || '<p>Start writing your post here...</p>';
      if (currentContent !== newContent) {
        editor.commands.setContent(newContent);
      }
    }
  }, [editor, initialContent]);

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

  const setLink = () => {
    // Check if there's already a link at cursor position
    const previousUrl = editor.getAttributes('link').href;
    setCurrentLinkUrl(previousUrl || '');
    setShowLinkModal(true);
  };

  const handleLinkSave = (url: string) => {
    if (url) {
      editor.chain().focus().toggleLink({ href: url, target: '_blank' }).run();
    }
  };

  const handleUnlink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const addImage = () => {
    setShowImageGallery(true);
  };

  const handleImageSelect = (url: string) => {
    if (url) {
      // Insert image with default settings
      editor.chain().focus().insertContent({
        type: 'image',
        attrs: {
          src: url,
          align: 'left',
          width: '400px',
          height: 'auto',
          alt: '',
        },
      }).run();
      
      console.log('Image inserted:', url);
    }
  };

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    const { state, view } = editor;
    const { selection } = state;
    
    // Try to find the image node
    let imagePos = null;
    let imageNode = null;

    // Check if current node is an image
    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'image') {
        imageNode = node;
        imagePos = $pos.before(d);
        break;
      }
    }

    // If no image found at current position, check selected node
    if (!imageNode) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'image') {
          imageNode = node;
          imagePos = pos;
          return false;
        }
      });
    }

    if (imageNode && imagePos !== null) {
      const transaction = state.tr.setNodeMarkup(imagePos, undefined, {
        ...imageNode.attrs,
        align,
      });
      view.dispatch(transaction);
      console.log('Image alignment updated to:', align);
    } else {
      console.log('No image selected');
    }
  };

  const setImageSize = (width: string) => {
    const { state, view } = editor;
    const { selection } = state;
    
    // Try to find the image node
    let imagePos = null;
    let imageNode = null;

    // Check if current node is an image
    const $pos = selection.$anchor;
    for (let d = $pos.depth; d >= 0; d--) {
      const node = $pos.node(d);
      if (node.type.name === 'image') {
        imageNode = node;
        imagePos = $pos.before(d);
        break;
      }
    }

    // If no image found at current position, check selected node
    if (!imageNode) {
      state.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
        if (node.type.name === 'image') {
          imageNode = node;
          imagePos = pos;
          return false;
        }
      });
    }

    if (imageNode && imagePos !== null) {
      const transaction = state.tr.setNodeMarkup(imagePos, undefined, {
        ...imageNode.attrs,
        width,
        height: 'auto',
      });
      view.dispatch(transaction);
      console.log('Image size updated to:', width);
    } else {
      console.log('No image selected');
    }
  };

  const toggleHighlight = () => {
    editor.chain().focus().toggleHighlight().run();
  };

  const toggleCodeView = () => {
    // Prevent switching to visual editor for landing pages
    if (postType === 'landing' && isCodeView) {
      // Show alert/notification that visual editor is disabled for landing pages
      alert('Visual Editor is disabled for Landing Page type.\n\nReason: Landing pages often contain complex HTML structures that may not be fully preserved in visual mode.\n\nTo enable Visual Editor:\n1. Change post type to "Default" or "Minimal"\n2. Be aware that some custom HTML/CSS may be simplified or removed');
      return;
    }
    
    const newCodeViewState = !isCodeView;
    
    if (isCodeView) {
      // Switching from code to visual
      try {
        // WARNING: TipTap will strip HTML comments and some formatting
        // Use the current htmlContent (which may be user-formatted)
        editor.commands.setContent(htmlContent);
        if (onContentChange) {
          onContentChange(htmlContent);
        }
      } catch (error) {
        console.error('Error parsing HTML:', error);
        // Could show an error message to user here
      }
    } else {
      // Switching from visual to code
      // Get HTML from editor
      const editorHtml = editor.getHTML();
      
      // ALWAYS preserve existing htmlContent when switching back from visual
      // Only update if htmlContent is empty (first time)
      if (!htmlContent || htmlContent.trim() === '') {
        // No existing content, format the HTML from visual editor
        const htmlToSet = formatHTML(editorHtml, indentType, indentSize, lineEnding);
        setHtmlContent(htmlToSet);
      } else {
        // Content exists - keep the original htmlContent to preserve:
        // - HTML comments
        // - Manual formatting
        // - Custom spacing
        // Don't overwrite with visual editor's output
        // (Visual editor strips comments and reformats)
      }
    }
    setIsCodeView(newCodeViewState);
    
    // Notify parent component about code view state change
    if (onCodeViewChange) {
      onCodeViewChange(newCodeViewState);
    }
  };

  const formatHtmlContent = () => {
    const formatted = formatHTML(htmlContent, indentType, indentSize, lineEnding);
    setHtmlContent(formatted);
    if (onContentChange) {
      onContentChange(formatted);
    }
  };

  const minifyHtmlContent = () => {
    // Remove extra whitespace and line breaks
    const minified = htmlContent
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single space
      .trim();
    setHtmlContent(minified);
    if (onContentChange) {
      onContentChange(minified);
    }
  };

  const handleSave = () => {
    let contentToSave;
    
    if (isCodeView) {
      // In HTML mode, save exactly what the user has typed (preserve their formatting)
      contentToSave = htmlContent;
      // Update parent component with the HTML content before saving
      if (onContentChange) {
        onContentChange(htmlContent);
      }
      // DON'T update the visual editor when saving from code view
      // (TipTap strips comments and reformats, which we want to avoid)
    } else {
      // In visual mode, format the HTML from the editor
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
      contentToSave = editor.getHTML();
      
      // Format HTML with proper indentation only when saving from visual mode
      contentToSave = formatHTML(contentToSave, indentType, indentSize, lineEnding);
    }
    
    onSave(contentToSave);
  };

  return (
    <div className="post-editor-container">
      <div className="post-editor text-gray-600">
        {/* Enhanced Toolbar - Single elegant row */}
        <div className="sticky top-0 bg-white z-40 px-4 py-2">
          <div className={isCodeView ? "flex flex-col md:flex-row md:justify-between md:items-center gap-2 mx-auto max-w-5xl" : "flex flex-wrap gap-1 items-center"}>
            {!isCodeView && (
              <>
                {/* Text formatting */}
                <Button
                  size="sm"
                  onClick={() => applyStyle('bold')}
                  variant={editor.isActive('bold') ? 'secondary' : 'outline'}
                  className="font-bold"
                  title="Bold"
                >
                  B
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('italic')}
                  variant={editor.isActive('italic') ? 'secondary' : 'outline'}
                  className="italic"
                  title="Italic"
                >
                  I
                </Button>
                <Button
                  size="sm"
                  onClick={toggleHighlight}
                  variant={editor.isActive('highlight') ? 'secondary' : 'outline'}
                  title="Highlight"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </Button>
                
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                
                {/* Container */}
                <Button
                  size="sm"
                  onClick={() => applyStyle('div')}
                  variant={editor.isActive('div') ? 'secondary' : 'outline'}
                  title="Div Container"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                  </svg>
                </Button>
                
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                
                {/* Headings */}
                <Button
                  size="sm"
                  onClick={() => applyStyle('h1')}
                  variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'outline'}
                  title="Heading 1"
                >
                  H1
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('h2')}
                  variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'outline'}
                  title="Heading 2"
                >
                  H2
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('h3')}
                  variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'outline'}
                  title="Heading 3"
                >
                  H3
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('h4')}
                  variant={editor.isActive('heading', { level: 4 }) ? 'secondary' : 'outline'}
                  title="Heading 4"
                >
                  H4
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('h5')}
                  variant={editor.isActive('heading', { level: 5 }) ? 'secondary' : 'outline'}
                  title="Heading 5"
                >
                  H5
                </Button>
                
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                
                {/* Lists */}
                <Button
                  size="sm"
                  onClick={() => applyStyle('ul')}
                  variant={editor.isActive('bulletList') ? 'secondary' : 'outline'}
                  title="Bullet List"
                >
                  •
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('ol')}
                  variant={editor.isActive('orderedList') ? 'secondary' : 'outline'}
                  title="Numbered List"
                >
                  1.
                </Button>
                
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                
                {/* Special formatting */}
                <Button
                  size="sm"
                  onClick={() => applyStyle('blockquote')}
                  variant={editor.isActive('blockquote') ? 'secondary' : 'outline'}
                  title="Quote"
                >
                  "
                </Button>
                <Button
                  size="sm"
                  onClick={() => applyStyle('codeBlock')}
                  variant={editor.isActive('codeBlock') ? 'secondary' : 'outline'}
                  title="Code Block"
                >
                  &lt;/&gt;
                </Button>
                
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                
                {/* Insert elements */}
                <Button size="sm" onClick={setLink} variant="outline" title="Add/Edit Link">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </Button>
                {editor.isActive('link') && (
                  <Button size="sm" onClick={handleUnlink} variant="outline" title="Remove Link" className="text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      <line x1="4" y1="4" x2="20" y2="20" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                  </Button>
                )}
                <Button size="sm" onClick={addImage} variant="outline" title="Add Image">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowTableSubmenu(!showTableSubmenu)}
                  variant={showTableSubmenu ? 'secondary' : 'outline'}
                  title="Table"
                >
                  ⊞
                </Button>
              </>
            )}
            
            {/* HTML Editor Controls - Shown only in code view */}
            {isCodeView && (
              <>
                {/* Mobile: Two lines */}
                <div className="flex md:hidden flex-col gap-2 w-full">
                  {/* Top line: Title and character count */}
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      HTML Editor
                    </span>
                    <span className="text-xs text-gray-500">
                      {htmlContent.length.toLocaleString()} chars
                    </span>
                  </div>
                  
                  {/* Bottom line: All buttons */}
                  <div className="flex items-center gap-1 w-full">
                    {/* Background Color Toggle */}
                    <Button
                      size="sm"
                      onClick={() => setHtmlEditorBgColor(htmlEditorBgColor === 'dark' ? 'light' : 'dark')}
                      variant="outline"
                      title={htmlEditorBgColor === 'dark' ? 'Switch to Light Background' : 'Switch to Dark Background'}
                    >
                      {htmlEditorBgColor === 'dark' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </Button>
                    
                    {/* Syntax Highlighting Toggle */}
                    <Button
                      size="sm"
                      onClick={() => setSyntaxHighlighting(!syntaxHighlighting)}
                      variant={syntaxHighlighting ? "secondary" : "outline"}
                      title={syntaxHighlighting ? 'Disable Syntax Highlighting' : 'Enable Syntax Highlighting'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Button>
                    
                    {/* Comment Toggle Button */}
                    <Button
                      size="sm"
                      onClick={toggleComment}
                      variant="outline"
                      title="Toggle Comment (Cmd/Ctrl + /)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </Button>
                    
                    {/* Format Button */}
                    <Button
                      size="sm"
                      onClick={formatHtmlContent}
                      variant="outline"
                      title="Format HTML (Add indentation)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                      </svg>
                      Format
                    </Button>
                    
                    {/* Minify Button */}
                    <Button
                      size="sm"
                      onClick={minifyHtmlContent}
                      variant="outline"
                      title="Minify HTML (Remove whitespace)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      Minify
                    </Button>
                    
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    
                    {/* View Toggle */}
                    <Button
                      size="sm"
                      onClick={toggleCodeView}
                      variant="secondary"
                      title={postType === 'landing' ? 'Visual Editor disabled for Landing pages. Change post type to enable.' : 'Switch to Visual Editor'}
                      className="font-mono text-xs"
                      disabled={postType === 'landing'}
                    >
                      Visual
                    </Button>
                  </div>
                </div>
                
                {/* Desktop: Single line with 3 groups using justify-between */}
                <div className="hidden md:flex items-center justify-between w-full">
                  {/* Group 1: Background, Format, Minify */}
                  <div className="flex items-center gap-1">
                    {/* Background Color Toggle */}
                    <Button
                      size="sm"
                      onClick={() => setHtmlEditorBgColor(htmlEditorBgColor === 'dark' ? 'light' : 'dark')}
                      variant="outline"
                      title={htmlEditorBgColor === 'dark' ? 'Switch to Light Background' : 'Switch to Dark Background'}
                    >
                      {htmlEditorBgColor === 'dark' ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      )}
                    </Button>
                    
                    {/* Syntax Highlighting Toggle */}
                    <Button
                      size="sm"
                      onClick={() => setSyntaxHighlighting(!syntaxHighlighting)}
                      variant={syntaxHighlighting ? "secondary" : "outline"}
                      title={syntaxHighlighting ? 'Disable Syntax Highlighting' : 'Enable Syntax Highlighting'}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </Button>
                    
                    {/* Comment Toggle Button */}
                    <Button
                      size="sm"
                      onClick={toggleComment}
                      variant="outline"
                      title="Toggle Comment (Cmd/Ctrl + /)"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    </Button>
                    
                    {/* Beautify Button with Settings */}
                    <div className="relative inline-block">
                      <div className="flex items-center gap-0">
                        <Button
                          size="sm"
                          onClick={formatHtmlContent}
                          variant="outline"
                          title="Beautify HTML with current settings"
                          className="rounded-r-none border-r-0"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                          </svg>
                          Beautify
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setShowBeautifySettings(!showBeautifySettings)}
                          variant={showBeautifySettings ? "secondary" : "outline"}
                          title="Beautify settings"
                          className="rounded-l-none px-1.5"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </Button>
                      </div>
                      
                      {/* Settings Dropdown */}
                      {showBeautifySettings && (
                        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3 min-w-[240px]">
                          <div className="space-y-3 text-sm">
                            <div className="font-semibold text-gray-700 border-b pb-2">Beautify Settings</div>
                            
                            {/* Indent Type */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Indentation Type</label>
                              <div className="flex gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="indentType"
                                    value="spaces"
                                    checked={indentType === 'spaces'}
                                    onChange={(e) => setIndentType(e.target.value as 'spaces' | 'tabs')}
                                    className="text-blue-600"
                                  />
                                  <span className="text-xs">Spaces</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="indentType"
                                    value="tabs"
                                    checked={indentType === 'tabs'}
                                    onChange={(e) => setIndentType(e.target.value as 'spaces' | 'tabs')}
                                    className="text-blue-600"
                                  />
                                  <span className="text-xs">Tabs</span>
                                </label>
                              </div>
                            </div>
                            
                            {/* Indent Size (only for spaces) */}
                            {indentType === 'spaces' && (
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1.5">Indent Size</label>
                                <div className="flex gap-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="indentSize"
                                      value="2"
                                      checked={indentSize === 2}
                                      onChange={(e) => setIndentSize(Number(e.target.value) as 2 | 4)}
                                      className="text-blue-600"
                                    />
                                    <span className="text-xs">2 spaces</span>
                                  </label>
                                  <label className="flex items-center gap-1.5 cursor-pointer">
                                    <input
                                      type="radio"
                                      name="indentSize"
                                      value="4"
                                      checked={indentSize === 4}
                                      onChange={(e) => setIndentSize(Number(e.target.value) as 2 | 4)}
                                      className="text-blue-600"
                                    />
                                    <span className="text-xs">4 spaces</span>
                                  </label>
                                </div>
                              </div>
                            )}
                            
                            {/* Line Ending */}
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1.5">Line Endings</label>
                              <div className="flex gap-2">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="lineEnding"
                                    value="lf"
                                    checked={lineEnding === 'lf'}
                                    onChange={(e) => setLineEnding(e.target.value as 'lf' | 'crlf')}
                                    className="text-blue-600"
                                  />
                                  <span className="text-xs">LF (Unix)</span>
                                </label>
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name="lineEnding"
                                    value="crlf"
                                    checked={lineEnding === 'crlf'}
                                    onChange={(e) => setLineEnding(e.target.value as 'lf' | 'crlf')}
                                    className="text-blue-600"
                                  />
                                  <span className="text-xs">CRLF (Windows)</span>
                                </label>
                              </div>
                            </div>
                            
                            {/* Current Settings Display */}
                            <div className="pt-2 border-t text-xs text-gray-600">
                              <div>Current: {indentType === 'tabs' ? 'Tabs' : `${indentSize} Spaces`}, {lineEnding === 'lf' ? 'LF' : 'CRLF'}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Minify Button */}
                    <Button
                      size="sm"
                      onClick={minifyHtmlContent}
                      variant="outline"
                      title="Minify HTML (Remove whitespace)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                      </svg>
                      Minify
                    </Button>
                    
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    
                    {/* Undo Button */}
                    <Button
                      size="sm"
                      onClick={undoHtml}
                      variant="outline"
                      title="Undo (Ctrl+Z)"
                      disabled={htmlHistoryIndex <= 0}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </Button>
                    
                    {/* Redo Button */}
                    <Button
                      size="sm"
                      onClick={redoHtml}
                      variant="outline"
                      title="Redo (Ctrl+Y)"
                      disabled={htmlHistoryIndex >= htmlHistory.length - 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                      </svg>
                    </Button>
                    
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    
                    {/* Copy to Clipboard Button */}
                    <Button
                      size="sm"
                      onClick={copyToClipboard}
                      variant="outline"
                      title="Copy to Clipboard"
                    >
                      {copySuccess ? (
                        <>
                          <svg className="w-4 h-4 mr-1 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-green-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Copy
                        </>
                      )}
                    </Button>
                    
                    {/* Validate HTML Button */}
                    <Button
                      size="sm"
                      onClick={validateHtml}
                      variant="outline"
                      title="Validate HTML"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Validate
                    </Button>
                    
                    <div className="h-6 w-px bg-gray-300 mx-1"></div>
                    
                    {/* Find & Replace Button */}
                    <Button
                      size="sm"
                      onClick={() => setShowFindReplace(!showFindReplace)}
                      variant={showFindReplace ? "secondary" : "outline"}
                      title="Find & Replace (Ctrl+F)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Find
                    </Button>
                  </div>
                  
                  {/* Group 2: Title and character count */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                      HTML Editor
                    </span>
                    <span className="text-xs text-gray-500">
                      {htmlContent.length.toLocaleString()} chars
                    </span>
                  </div>
                  
                  {/* Group 3: View Toggle */}
                  <Button
                    size="sm"
                    onClick={toggleCodeView}
                    variant="secondary"
                    title={postType === 'landing' ? 'Visual Editor disabled for Landing pages. Change post type to enable.' : 'Switch to Visual Editor'}
                    className="font-mono text-xs"
                    disabled={postType === 'landing'}
                  >
                    Visual
                  </Button>
                </div>
              </>
            )}

            {/* View Toggle for Visual Mode */}
            {!isCodeView && (
              <>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <Button
                  size="sm"
                  onClick={toggleCodeView}
                  variant="outline"
                  title="View HTML Source"
                  className="font-mono text-xs"
                >
                  Code
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Table submenu */}
        {showTableSubmenu && !isCodeView && (
          <div className="border-b border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap gap-1">
              <Button
                size="sm"
                onClick={() => applyStyle('table')}
                variant="primary"
              >
                Insert Table
              </Button>
              {editor.isActive('table') && (
                <>
                  <div className="w-px bg-gray-300 mx-2"></div>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('addRowAfter')}
                    variant="outline"
                  >
                    + Row
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('addColumnAfter')}
                    variant="outline"
                  >
                    + Column
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('deleteRow')}
                    variant="outline"
                  >
                    - Row
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('deleteColumn')}
                    variant="outline"
                  >
                    - Column
                  </Button>
                  <div className="w-px bg-gray-300 mx-2"></div>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('mergeCells')}
                    variant="outline"
                  >
                    Merge
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('splitCell')}
                    variant="outline"
                  >
                    Split
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => applyStyle('deleteTable')}
                    variant="outline"
                  >
                    Delete Table
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Floating Toolbar */}
                {/* Image Gallery Modal */}
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          onSelectImage={handleImageSelect}
        />

        {/* Link Modal */}
        <LinkModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          onSave={handleLinkSave}
          onUnlink={handleUnlink}
          initialUrl={currentLinkUrl}
          hasExistingLink={!!currentLinkUrl}
        />

        {/* Editor Content */}
        <div className="relative">
          {isCodeView ? (
            <div className="flex flex-col items-center bg-white">
              <div className="w-full max-w-5xl px-2 md:p-6">
                {/* Find & Replace Panel */}
                {showFindReplace && (
                  <div className="mb-4 p-3 md:p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        {/* Find Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={findText}
                            onChange={(e) => {
                              setFindText(e.target.value);
                              setCurrentMatchIndex(0);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (e.shiftKey) {
                                  findPrevious();
                                } else {
                                  findNext();
                                }
                              }
                            }}
                            placeholder="Find..."
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-600 whitespace-nowrap">
                            {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : '0 of 0'}
                          </span>
                        </div>
                        
                        {/* Replace Input */}
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={replaceText}
                            onChange={(e) => setReplaceText(e.target.value)}
                            placeholder="Replace with..."
                            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={findPrevious}
                            variant="outline"
                            disabled={totalMatches === 0}
                            title="Previous match (Shift+Enter)"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </Button>
                          <Button
                            size="sm"
                            onClick={findNext}
                            variant="outline"
                            disabled={totalMatches === 0}
                            title="Next match (Enter)"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Button>
                          
                          <div className="h-5 w-px bg-gray-300 mx-1"></div>
                          
                          <Button
                            size="sm"
                            onClick={replaceCurrent}
                            variant="outline"
                            disabled={totalMatches === 0}
                            title="Replace current match"
                          >
                            Replace
                          </Button>
                          <Button
                            size="sm"
                            onClick={replaceAll}
                            variant="outline"
                            disabled={totalMatches === 0}
                            title="Replace all matches"
                          >
                            Replace All
                          </Button>
                          
                          <div className="h-5 w-px bg-gray-300 mx-1"></div>
                          
                          <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={caseSensitive}
                              onChange={(e) => {
                                setCaseSensitive(e.target.checked);
                                setCurrentMatchIndex(0);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span>Case sensitive</span>
                          </label>
                        </div>
                      </div>
                      
                      {/* Close Button */}
                      <button
                        onClick={() => setShowFindReplace(false)}
                        className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                        title="Close (Esc)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Editor with Line Numbers and Scroll Sync */}
                <div 
                  className={`relative rounded-lg ${
                    htmlEditorBgColor === 'dark' 
                      ? 'border border-gray-700' 
                      : 'border-2 border-gray-300'
                  }`}
                  style={{
                    maxHeight: '600px',
                    minHeight: '600px',
                    overflow: 'auto',
                    backgroundColor: htmlEditorBgColor === 'dark' ? '#1e1e1e' : '#ffffff',
                  }}
                  onScroll={(e) => {
                    // Sync line numbers scroll by setting scrollTop directly
                    if (lineNumbersRef.current) {
                      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
                    }
                  }}
                >
                  <div className="flex min-w-max" style={{ position: 'relative' }}>
                    {/* Line Numbers - Hidden scrollbar, synced with parent */}
                    <div 
                      className={`sticky left-0 select-none text-right font-mono text-sm z-10 ${
                        htmlEditorBgColor === 'dark' 
                          ? 'bg-gray-800 text-gray-500 border-r border-gray-700' 
                          : 'bg-gray-100 text-gray-500 border-r-2 border-gray-300'
                      }`}
                      style={{
                        lineHeight: '1.8',
                        fontSize: '13px',
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
                        userSelect: 'none',
                        pointerEvents: 'none',
                        paddingTop: '16px',
                        paddingBottom: '16px',
                        paddingLeft: window.innerWidth < 768 ? '4px' : '12px',
                        paddingRight: window.innerWidth < 768 ? '6px' : '16px',
                        minWidth: window.innerWidth < 768 ? '40px' : '60px',
                        overflow: 'hidden',
                        height: `${Math.max(600, (htmlContent.split('\n').length * 1.8 * 13) + 32)}px`,
                      }}
                      ref={lineNumbersRef}
                    >
                      {htmlContent.split('\n').map((_, index) => (
                        <div key={index}>{index + 1}</div>
                      ))}
                    </div>
                    
                    {/* Syntax Highlighting Layer */}
                    {syntaxHighlighting && (
                      <div
                        ref={highlightLayerRef}
                        className="absolute pointer-events-none font-mono text-sm"
                        style={{
                          left: window.innerWidth < 768 ? '40px' : '60px',
                          top: 0,
                          fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
                          lineHeight: '1.8',
                          fontSize: '13px',
                          padding: '16px',
                          whiteSpace: 'pre',
                          wordWrap: 'normal',
                          width: 'max-content',
                          minWidth: 'calc(100% - ' + (window.innerWidth < 768 ? '40' : '60') + 'px)',
                          height: `${Math.max(600, (htmlContent.split('\n').length * 1.8 * 13) + 32)}px`,
                          overflow: 'visible',
                        }}
                        dangerouslySetInnerHTML={{ __html: highlightHtml(htmlContent) }}
                      />
                    )}
                    
                    {/* Code Editor - Natural height, no internal scrolling */}
                    <textarea
                      ref={textareaRef}
                      value={htmlContent}
                      onChange={(e) => {
                        setHtmlContent(e.target.value);
                        if (onContentChange) {
                          onContentChange(e.target.value);
                        }
                      }}
                      onKeyDown={handleKeyDown}
                      className="flex-1 font-mono text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none border-0 block relative z-10"
                      style={{
                        backgroundColor: syntaxHighlighting ? 'transparent' : (htmlEditorBgColor === 'dark' ? '#1e1e1e' : '#ffffff'),
                        color: syntaxHighlighting ? 'transparent' : (htmlEditorBgColor === 'dark' ? '#d4d4d4' : '#1f2937'),
                        fontFamily: 'Monaco, Menlo, "Ubuntu Mono", "Consolas", monospace',
                        lineHeight: '1.8',
                        tabSize: 2,
                        fontSize: '13px',
                        height: `${Math.max(600, (htmlContent.split('\n').length * 1.8 * 13) + 32)}px`,
                        overflow: 'visible',
                        whiteSpace: 'pre',
                        wordWrap: 'normal',
                        padding: '16px',
                        width: 'max-content',
                        minWidth: '100%',
                        caretColor: htmlEditorBgColor === 'dark' ? '#d4d4d4' : '#1f2937',
                        WebkitTextFillColor: syntaxHighlighting ? 'transparent' : undefined,
                      }}
                      placeholder="Enter HTML content..."
                      spellCheck={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="prose prose-lg max-w-none p-6 min-h-[500px] focus:outline-none"
            />
          )}
          
          {/* HTML Validation Errors Display */}
          {isCodeView && showValidationErrors && (
            <div className="px-2 md:px-6 py-4">
              <div className="max-w-5xl mx-auto">
                {htmlValidationErrors.length === 0 ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-green-700 font-medium">HTML is valid! No errors found.</span>
                    <button 
                      onClick={() => setShowValidationErrors(false)}
                      className="ml-auto text-green-600 hover:text-green-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-red-700">
                          {htmlValidationErrors.length} HTML {htmlValidationErrors.length === 1 ? 'Error' : 'Errors'} Found
                        </span>
                      </div>
                      <button 
                        onClick={() => setShowValidationErrors(false)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <ul className="space-y-1 ml-7">
                      {htmlValidationErrors.map((error, index) => (
                        <li key={index} className="text-xs text-red-600">
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Image Gallery Modal */}
        <ImageGalleryModal
          isOpen={showImageGallery}
          onClose={() => setShowImageGallery(false)}
          onSelectImage={handleImageSelect}
        />
      </div>
    </div>
  );
};

export default PostEditor;