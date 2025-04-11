'use client';

import React from 'react';
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
import { mergeAttributes } from '@tiptap/core';
import { Button } from '@/components/ui/button';

// Custom Image extension with alignment and size
const CustomImage = ImageResize.extend({
  name: 'image',
  group: 'block',
  inline: false,
  selectable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: 'left',
        parseHTML: (element) => {
          const parentStyle = element.parentElement?.style.textAlign;
          return parentStyle === 'center' || parentStyle === 'right' ? parentStyle : 'left';
        },
        renderHTML: (attributes) => ({
          'data-align': attributes.align,
        }),
      },
      width: {
        default: null,
        parseHTML: (element) => element.style.width || null,
        renderHTML: (attributes) => ({
          style: attributes.width ? `width: ${attributes.width};` : '',
        }),
      },
      height: {
        default: null,
        parseHTML: (element) => element.style.height || null,
        renderHTML: (attributes) => ({
          style: attributes.height ? `height: ${attributes.height};` : '',
        }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const { align, width, height, ...rest } = HTMLAttributes;
    const imgStyles = [width, height].filter(Boolean).join(' ');
    return [
      'div',
      { class: 'image-wrapper', style: `text-align: ${align};` },
      [
        'img',
        mergeAttributes(
          { class: 'max-w-full h-auto my-2 rounded resize-handle', style: imgStyles },
          rest
        ),
      ],
    ];
  },

  parseHTML() {
    return [
      {
        tag: 'div[class="image-wrapper"]',
        getAttrs: (dom: any) => {
          const img = dom.querySelector('img');
          if (!img) return false;
          const align = dom.style.textAlign || 'left';
          const width = img.style.width || null;
          const height = img.style.height || null;
          return {
            src: img.getAttribute('src'),
            alt: img.getAttribute('alt'),
            title: img.getAttribute('title'),
            width,
            height,
            align,
          };
        },
      },
      {
        tag: 'img',
        getAttrs: (dom: any) => ({
          src: dom.getAttribute('src'),
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
          width: dom.style.width || null,
          height: dom.style.height || null,
          align: 'left',
        }),
      },
    ];
  },
});

const PostEditor: React.FC<{ onSave: (content: string) => void; initialContent?: string }> = ({ onSave, initialContent }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Ensure StarterKit includes bold and italic explicitly
        bold: true,
        italic: true,
        blockquote: false, // Disable to use custom Blockquote
        codeBlock: false, // Disable to use custom CodeBlock
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
      Blockquote, // Custom Blockquote extension
      CodeBlock, // Custom CodeBlock extension
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      Placeholder.configure({
        placeholder: 'Start writing your post here...',
      }),
      Highlight.configure({
        multicolor: false,
        HTMLAttributes: {
          class: 'bg-yellow-200',
        },
      }),
      CharacterCount.configure({
        limit: 20000,
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
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = document.createElement('div');
                component.className = 'mention-suggestions';
                component.style.position = 'absolute';
                component.style.background = 'white';
                component.style.border = '1px solid #ccc';
                component.style.padding = '5px';
                component.innerHTML = props.items
                  .map((item: string) => `<div class="suggestion-item" style="padding: 5px; cursor: pointer;">@${item}</div>`)
                  .join('');

                popup = document.body.appendChild(component);
                const rect = props.clientRect();
                popup.style.left = `${rect.left}px`;
                popup.style.top = `${rect.bottom}px`;

                component.addEventListener('click', (e: any) => {
                  const item = e.target.textContent.slice(1); // Remove '@'
                  props.command({ id: item });
                });
              },
              onUpdate: (props: any) => {
                component.innerHTML = props.items
                  .map((item: string) => `<div class="suggestion-item" style="padding: 5px; cursor: pointer;">@${item}</div>`)
                  .join('');
              },
              onExit: () => {
                if (popup) popup.remove();
              },
            };
          },
        },
      }),
    ],
    content: initialContent || '<p>Start writing your post here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl m-5 focus:outline-none',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              const { schema } = view.state;
              const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
              if (coordinates) {
                const node = schema.nodes.image.create({ src, align: 'left' });
                const transaction = view.state.tr.insert(coordinates.pos, node);
                view.dispatch(transaction);
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
        editor.chain().focus().setParagraph().toggleBlockquote().run(); // Ensure paragraph context
        break;
      case 'codeBlock':
        editor.chain().focus().setParagraph().toggleCodeBlock().run(); // Ensure paragraph context
        break;
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
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
      editor.chain().focus().setImage({ src: url, align: 'left', width: '200px', height: 'auto' }).run();
    }
  };

  const setImageAlignment = (align: 'left' | 'center' | 'right') => {
    if (editor.isActive('image')) {
      editor.chain().focus().setNode('image', { align }).run();
    } else {
      console.log('No image selected');
    }
  };

  const toggleHighlight = () => {
    editor.chain().focus().toggleHighlight().run();
  };

  const handleSave = () => {
    const htmlContent = editor.getHTML();
    console.log('Saved HTML:', htmlContent); // Debug output
    onSave(htmlContent);
  };

  return (
    <div className="post-editor text-gray-600">
      <style jsx>{`
        .image-wrapper {
          position: relative;
          margin: 0.5rem 0; /* Spacing around image */
        }
        .resize-handle {
          cursor: se-resize; /* Ensure resize cursor is visible */
        }
      `}</style>
      <div className="toolbar mb-4 flex gap-0.5 flex-wrap ">
        <Button size={"sm"} onClick={() => applyStyle('h1')} variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'outline'}>
          H1
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('h2')} variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'outline'}>
          H2
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('h3')} variant={editor.isActive('heading', { level: 3 }) ? 'secondary' : 'outline'}>
          H3
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('h4')} variant={editor.isActive('heading', { level: 4 }) ? 'secondary' : 'outline'}>
          H4
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('h5')} variant={editor.isActive('heading', { level: 5 }) ? 'secondary' : 'outline'}>
          H5
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('p')} variant={editor.isActive('paragraph') ? 'secondary' : 'outline'}>
          P
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('ul')} variant={editor.isActive('bulletList') ? 'secondary' : 'outline'}>
          UL
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('ol')} variant={editor.isActive('orderedList') ? 'secondary' : 'outline'}>
          OL
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('blockquote')} variant={editor.isActive('blockquote') ? 'secondary' : 'outline'}>
          Quote
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('codeBlock')} variant={editor.isActive('codeBlock') ? 'secondary' : 'outline'}>
          Code
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('bold')} variant={editor.isActive('bold') ? 'secondary' : 'outline'}>
          B
        </Button>
        <Button size={"sm"} onClick={() => applyStyle('italic')} variant={editor.isActive('italic') ? 'secondary' : 'outline'}>
          I
        </Button>
        <Button size={"sm"} onClick={setLink} variant={editor.isActive('link') ? 'secondary' : 'outline'}>
          Link
        </Button>
        <Button size={"sm"} onClick={addImage} variant="outline">
          Image
        </Button>
        <Button size={"sm"} 
          onClick={() => setImageAlignment('left')}
          variant={editor.isActive('image', { align: 'left' }) ? 'secondary' : 'outline'}
        >
          Left
        </Button>
        <Button size={"sm"} 
          onClick={() => setImageAlignment('center')}
          variant={editor.isActive('image', { align: 'center' }) ? 'secondary' : 'outline'}
        >
          Center
        </Button>
        <Button size={"sm"} 
          onClick={() => setImageAlignment('right')}
          variant={editor.isActive('image', { align: 'right' }) ? 'secondary' : 'outline'}
        >
          Right
        </Button>
        <Button size={"sm"} 
        onClick={toggleHighlight} variant={editor.isActive('highlight') ? 'secondary' : 'outline'}>
          Highlight
        </Button>
        <Button size={"sm"} 
        onClick={handleSave} variant="primary">
          Save
        </Button>
      </div>
      <EditorContent editor={editor} className="border border-gray-200 p-4 rounded-md min-h-[300px] bg-white" />
      <div className="mt-2 text-sm text-gray-500">
        {editor?.storage.characterCount.characters()} / 20000 characters
      </div>
    </div>
  );
};

export default PostEditor;