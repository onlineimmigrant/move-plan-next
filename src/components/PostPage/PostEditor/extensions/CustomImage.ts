import ImageResize from 'tiptap-extension-resize-image';
import { mergeAttributes } from '@tiptap/core';

export const CustomImage = ImageResize.extend({
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
