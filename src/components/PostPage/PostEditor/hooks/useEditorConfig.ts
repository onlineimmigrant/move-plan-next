'use client';

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import CodeBlock from '@tiptap/extension-code-block';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import CharacterCount from '@tiptap/extension-character-count';
import Mention from '@tiptap/extension-mention';
import TableRow from '@tiptap/extension-table-row';
import { MediaCarousel } from '../ui/MediaCarouselNodeSimple';

import {
  Div,
  Section,
  Article,
  Header,
  Footer,
  Main,
  Aside,
  Nav,
  Span,
  ButtonNode,
  Form,
  Input,
  Iframe,
  Video,
  CustomImage,
  CustomTable,
  CustomTableCell,
  CustomTableHeader,
} from '../extensions';

interface UseEditorConfigProps {
  initialContent?: string;
  onContentChange?: (content: string, contentType: 'html' | 'markdown') => void;
}

export const useEditorConfig = ({
  initialContent,
  onContentChange,
}: UseEditorConfigProps) => {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        blockquote: false,
        codeBlock: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'editor-link',
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
      // Media Carousel
      MediaCarousel,
    ],
    content: initialContent || '<p>Start writing your post here...</p>',
    onUpdate: ({ editor }) => {
      // Notify parent immediately with current editor HTML
      if (onContentChange) {
        onContentChange(editor.getHTML(), 'html');
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

  return editor;
};
